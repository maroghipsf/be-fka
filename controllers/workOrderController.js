const responseHandler = require('../utils/responseHandler');
const { WorkOrder, WOEntry, WOExpense, User, Item, Account, sequelize } = require('../models');
const { Op } = require('sequelize');

// --- FUNGSI UNTUK MEMBUAT WORK ORDER BARU BESERTA ENTRI DAN BIAYANYA ---
exports.createWorkOrder = async (req, res) => {
  const transaction = await sequelize.transaction(); // Mulai transaksi
  try {
    const {
      wo_number,
      order_date,
      description,
      status, // 'Pending', 'In Progress', 'Completed', 'Cancelled'
      start_date,
      end_date,
      total_cost, // Ini akan dihitung ulang nanti
      notes,
      created_by,
      entries, // Array of { item_id, quantity, unit_price }
      expenses // Array of { expense_name, amount, account_id, description }
    } = req.body;

    // --- Validasi Input Wajib ---
    if (!wo_number || !order_date || !description || !created_by) {
      await transaction.rollback();
      return responseHandler(res, 400, 'error', 'Nomor WO, tanggal, deskripsi, dan pembuat wajib diisi.', null, {
        fields: ['wo_number', 'order_date', 'description', 'created_by'],
        message: 'Missing required fields',
      });
    }

    // --- Validasi Keberadaan User (created_by) ---
    const user = await User.findByPk(created_by, { transaction });
    if (!user) {
      await transaction.rollback();
      return responseHandler(res, 404, 'fail', `Pengguna dengan ID ${created_by} tidak ditemukan.`, null, {
        fields: ['created_by'],
        message: 'User not found',
      });
    }

    // --- Cek Duplikasi Nomor WO ---
    const existingWO = await WorkOrder.findOne({ where: { wo_number }, transaction });
    if (existingWO) {
      await transaction.rollback();
      return responseHandler(res, 409, 'error', 'Nomor WO sudah terdaftar.', null, {
        fields: ['wo_number'],
        message: 'Duplicate WO Number',
      });
    }

    let calculatedTotalCost = 0;
    const woEntriesData = [];
    const woExpensesData = [];

    // --- Validasi dan Hitung Total dari Entri WO ---
    if (entries && entries.length > 0) {
      for (const entry of entries) {
        if (!entry.item_id || entry.quantity === undefined || entry.unit_price === undefined) {
          await transaction.rollback();
          return responseHandler(res, 400, 'error', 'Setiap detail entri WO wajib memiliki ID item, kuantitas, dan harga satuan.', null, {
            fields: ['entries'],
            message: 'Invalid entry detail',
          });
        }
        if (entry.quantity <= 0 || entry.unit_price <= 0) {
          await transaction.rollback();
          return responseHandler(res, 400, 'error', 'Kuantitas dan harga satuan harus lebih dari nol.', null, {
            fields: ['entries'],
            message: 'Quantity and unit price must be positive',
          });
        }

        const item = await Item.findByPk(entry.item_id, { transaction });
        if (!item) {
          await transaction.rollback();
          return responseHandler(res, 404, 'fail', `Item dengan ID ${entry.item_id} tidak ditemukan.`, null, {
            fields: ['entries.item_id'],
            message: 'Item not found in entry',
          });
        }

        const subtotal = entry.quantity * entry.unit_price;
        calculatedTotalCost += subtotal;
        woEntriesData.push({
          item_id: entry.item_id,
          quantity: entry.quantity,
          unit_price: entry.unit_price,
          subtotal: subtotal,
        });
      }
    }

    // --- Validasi dan Hitung Total dari Biaya WO ---
    if (expenses && expenses.length > 0) {
      for (const expense of expenses) {
        if (!expense.expense_name || expense.amount === undefined || !expense.account_id) {
          await transaction.rollback();
          return responseHandler(res, 400, 'error', 'Setiap detail biaya WO wajib memiliki nama biaya, jumlah, dan ID akun.', null, {
            fields: ['expenses'],
            message: 'Invalid expense detail',
          });
        }
        if (expense.amount <= 0) {
          await transaction.rollback();
          return responseHandler(res, 400, 'error', 'Jumlah biaya harus lebih dari nol.', null, {
            fields: ['expenses'],
            message: 'Expense amount must be positive',
          });
        }

        const account = await Account.findByPk(expense.account_id, { transaction });
        if (!account) {
          await transaction.rollback();
          return responseHandler(res, 404, 'fail', `Akun dengan ID ${expense.account_id} tidak ditemukan untuk biaya.`, null, {
            fields: ['expenses.account_id'],
            message: 'Account not found for expense',
          });
        }

        calculatedTotalCost += expense.amount;
        woExpensesData.push({
          expense_name: expense.expense_name,
          amount: expense.amount,
          account_id: expense.account_id,
          description: expense.description,
        });
      }
    }

    // --- Buat Work Order Header ---
    const newWO = await WorkOrder.create({
      wo_number,
      order_date,
      description,
      status: status || 'Pending', // Default status
      start_date,
      end_date,
      total_cost: calculatedTotalCost, // Gunakan total yang dihitung
      notes,
      created_by,
    }, { transaction });

    // --- Buat WO Entries ---
    if (woEntriesData.length > 0) {
      const entriesToCreate = woEntriesData.map(entry => ({
        ...entry,
        work_order_id: newWO.work_order_id,
      }));
      await WOEntry.bulkCreate(entriesToCreate, { transaction });
    }

    // --- Buat WO Expenses ---
    if (woExpensesData.length > 0) {
      const expensesToCreate = woExpensesData.map(expense => ({
        ...expense,
        work_order_id: newWO.work_order_id,
      }));
      await WOExpense.bulkCreate(expensesToCreate, { transaction });
    }

    await transaction.commit(); // Commit transaksi

    // Ambil WO lengkap dengan entri dan biaya untuk respons
    const createdWOWithDetails = await WorkOrder.findByPk(newWO.work_order_id, {
      include: [
        { model: User, as: 'creator', attributes: ['user_id', 'username'] },
        {
          model: WOEntry,
          as: 'entries',
          include: [{ model: Item, as: 'item', attributes: ['item_id', 'item_name', 'unit_of_measure'] }],
        },
        {
          model: WOExpense,
          as: 'expenses',
          include: [{ model: Account, as: 'account', attributes: ['account_id', 'account_name', 'account_number'] }],
        },
      ],
    });

    return responseHandler(res, 201, 'success', 'Work Order berhasil ditambahkan.', createdWOWithDetails);
  } catch (error) {
    await transaction.rollback(); // Rollback jika ada error
    console.error('Error creating Work Order:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menambahkan Work Order.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN SEMUA WORK ORDER ---
exports.getAllWorkOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, woNumber, userId } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {};
    if (status) whereClause.status = status;
    if (woNumber) whereClause.wo_number = { [Op.like]: `%${woNumber}%` };
    if (userId) whereClause.created_by = userId;

    const { count, rows: workOrders } = await WorkOrder.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'creator', attributes: ['user_id', 'username'] },
        {
          model: WOEntry,
          as: 'entries',
          include: [{ model: Item, as: 'item', attributes: ['item_id', 'item_name', 'unit_of_measure'] }],
        },
        {
          model: WOExpense,
          as: 'expenses',
          include: [{ model: Account, as: 'account', attributes: ['account_id', 'account_name', 'account_number'] }],
        },
      ],
      order: [['order_date', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    if (!workOrders || workOrders.length === 0) {
      return responseHandler(res, 404, 'fail', 'Tidak ada data Work Order ditemukan.');
    }

    const meta = {
      totalItems: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit),
    };

    return responseHandler(res, 200, 'success', 'Data Work Order berhasil ditemukan.', workOrders, null, meta);
  } catch (error) {
    console.error('Error fetching all Work Orders:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data Work Order.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN WORK ORDER BERDASARKAN ID ---
exports.getWorkOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const workOrder = await WorkOrder.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['user_id', 'username'] },
        {
          model: WOEntry,
          as: 'entries',
          include: [{ model: Item, as: 'item', attributes: ['item_id', 'item_name', 'unit_of_measure'] }],
        },
        {
          model: WOExpense,
          as: 'expenses',
          include: [{ model: Account, as: 'account', attributes: ['account_id', 'account_name', 'account_number'] }],
        },
      ],
    });

    if (!workOrder) {
      return responseHandler(res, 404, 'fail', `Work Order dengan ID ${id} tidak ditemukan.`);
    }

    return responseHandler(res, 200, 'success', 'Work Order berhasil ditemukan.', workOrder);
  } catch (error) {
    console.error('Error fetching Work Order by ID:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data Work Order.', null, error.message);
  }
};

// --- FUNGSI UNTUK MEMPERBARUI WORK ORDER HEADER, ENTRI, DAN BIAYA ---
exports.updateWorkOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      wo_number,
      order_date,
      description,
      status,
      start_date,
      end_date,
      notes,
      entries, // Array of { wo_entry_id (opsional), item_id, quantity, unit_price }
      expenses // Array of { wo_expense_id (opsional), expense_name, amount, account_id, description }
    } = req.body;

    const workOrder = await WorkOrder.findByPk(id, { transaction });
    if (!workOrder) {
      await transaction.rollback();
      return responseHandler(res, 404, 'fail', `Work Order dengan ID ${id} tidak ditemukan.`);
    }

    // --- Cek Duplikasi Nomor WO jika diubah ---
    if (wo_number && wo_number !== workOrder.wo_number) {
      const existingWO = await WorkOrder.findOne({ where: { wo_number }, transaction });
      if (existingWO && existingWO.work_order_id !== id) {
        await transaction.rollback();
        return responseHandler(res, 409, 'error', 'Nomor WO sudah terdaftar.', null, {
          fields: ['wo_number'],
          message: 'Duplicate WO Number',
        });
      }
    }

    let calculatedTotalCost = 0;

    // --- Proses WO Entries ---
    const existingEntries = await WOEntry.findAll({ where: { work_order_id: id }, transaction });
    const existingEntryIds = new Set(existingEntries.map(e => e.wo_entry_id));
    const entriesToUpdateOrCreate = [];
    const entriesToDelete = new Set(existingEntryIds);

    if (entries && entries.length > 0) {
      for (const entry of entries) {
        if (!entry.item_id || entry.quantity === undefined || entry.unit_price === undefined) {
          await transaction.rollback();
          return responseHandler(res, 400, 'error', 'Setiap detail entri WO wajib memiliki ID item, kuantitas, dan harga satuan.', null, {
            fields: ['entries'],
            message: 'Invalid entry detail',
          });
        }
        if (entry.quantity <= 0 || entry.unit_price <= 0) {
          await transaction.rollback();
          return responseHandler(res, 400, 'error', 'Kuantitas dan harga satuan harus lebih dari nol.', null, {
            fields: ['entries'],
            message: 'Quantity and unit price must be positive',
          });
        }

        const item = await Item.findByPk(entry.item_id, { transaction });
        if (!item) {
          await transaction.rollback();
          return responseHandler(res, 404, 'fail', `Item dengan ID ${entry.item_id} tidak ditemukan.`, null, {
            fields: ['entries.item_id'],
            message: 'Item not found in entry',
          });
        }

        const subtotal = entry.quantity * entry.unit_price;
        calculatedTotalCost += subtotal;

        if (entry.wo_entry_id && existingEntryIds.has(entry.wo_entry_id)) {
          entriesToUpdateOrCreate.push({
            wo_entry_id: entry.wo_entry_id,
            work_order_id: id,
            item_id: entry.item_id,
            quantity: entry.quantity,
            unit_price: entry.unit_price,
            subtotal: subtotal,
          });
          entriesToDelete.delete(entry.wo_entry_id);
        } else {
          entriesToUpdateOrCreate.push({
            work_order_id: id,
            item_id: entry.item_id,
            quantity: entry.quantity,
            unit_price: entry.unit_price,
            subtotal: subtotal,
          });
        }
      }
    }

    if (entriesToDelete.size > 0) {
      await WOEntry.destroy({
        where: { wo_entry_id: Array.from(entriesToDelete) },
        transaction,
      });
    }

    for (const entryData of entriesToUpdateOrCreate) {
      if (entryData.wo_entry_id) {
        await WOEntry.update(entryData, {
          where: { wo_entry_id: entryData.wo_entry_id },
          transaction,
        });
      } else {
        await WOEntry.create(entryData, { transaction });
      }
    }

    // --- Proses WO Expenses ---
    const existingExpenses = await WOExpense.findAll({ where: { work_order_id: id }, transaction });
    const existingExpenseIds = new Set(existingExpenses.map(e => e.wo_expense_id));
    const expensesToUpdateOrCreate = [];
    const expensesToDelete = new Set(existingExpenseIds);

    if (expenses && expenses.length > 0) {
      for (const expense of expenses) {
        if (!expense.expense_name || expense.amount === undefined || !expense.account_id) {
          await transaction.rollback();
          return responseHandler(res, 400, 'error', 'Setiap detail biaya WO wajib memiliki nama biaya, jumlah, dan ID akun.', null, {
            fields: ['expenses'],
            message: 'Invalid expense detail',
          });
        }
        if (expense.amount <= 0) {
          await transaction.rollback();
          return responseHandler(res, 400, 'error', 'Jumlah biaya harus lebih dari nol.', null, {
            fields: ['expenses'],
            message: 'Expense amount must be positive',
          });
        }

        const account = await Account.findByPk(expense.account_id, { transaction });
        if (!account) {
          await transaction.rollback();
          return responseHandler(res, 404, 'fail', `Akun dengan ID ${expense.account_id} tidak ditemukan untuk biaya.`, null, {
            fields: ['expenses.account_id'],
            message: 'Account not found for expense',
          });
        }

        calculatedTotalCost += expense.amount;

        if (expense.wo_expense_id && existingExpenseIds.has(expense.wo_expense_id)) {
          expensesToUpdateOrCreate.push({
            wo_expense_id: expense.wo_expense_id,
            work_order_id: id,
            expense_name: expense.expense_name,
            amount: expense.amount,
            account_id: expense.account_id,
            description: expense.description,
          });
          expensesToDelete.delete(expense.wo_expense_id);
        } else {
          expensesToUpdateOrCreate.push({
            work_order_id: id,
            expense_name: expense.expense_name,
            amount: expense.amount,
            account_id: expense.account_id,
            description: expense.description,
          });
        }
      }
    }

    if (expensesToDelete.size > 0) {
      await WOExpense.destroy({
        where: { wo_expense_id: Array.from(expensesToDelete) },
        transaction,
      });
    }

    for (const expenseData of expensesToUpdateOrCreate) {
      if (expenseData.wo_expense_id) {
        await WOExpense.update(expenseData, {
          where: { wo_expense_id: expenseData.wo_expense_id },
          transaction,
        });
      } else {
        await WOExpense.create(expenseData, { transaction });
      }
    }

    // --- Update Work Order Header ---
    await WorkOrder.update(
      {
        wo_number: wo_number || workOrder.wo_number,
        order_date: order_date || workOrder.order_date,
        description: description || workOrder.description,
        status: status || workOrder.status,
        start_date: start_date !== undefined ? start_date : workOrder.start_date,
        end_date: end_date !== undefined ? end_date : workOrder.end_date,
        total_cost: calculatedTotalCost, // Perbarui total cost berdasarkan entri dan biaya baru
        notes: notes !== undefined ? notes : workOrder.notes,
      },
      {
        where: { work_order_id: id },
        transaction,
      }
    );

    await transaction.commit();

    // Ambil WO lengkap setelah update untuk respons
    const updatedWOWithDetails = await WorkOrder.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['user_id', 'username'] },
        {
          model: WOEntry,
          as: 'entries',
          include: [{ model: Item, as: 'item', attributes: ['item_id', 'item_name', 'unit_of_measure'] }],
        },
        {
          model: WOExpense,
          as: 'expenses',
          include: [{ model: Account, as: 'account', attributes: ['account_id', 'account_name', 'account_number'] }],
        },
      ],
    });

    return responseHandler(res, 200, 'success', 'Work Order berhasil diperbarui.', updatedWOWithDetails);
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating Work Order:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat memperbarui Work Order.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENGHAPUS WORK ORDER BESERTA ENTRI DAN BIAYANYA ---
exports.deleteWorkOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const workOrder = await WorkOrder.findByPk(id, { transaction });
    if (!workOrder) {
      await transaction.rollback();
      return responseHandler(res, 404, 'fail', `Work Order dengan ID ${id} tidak ditemukan.`);
    }

    // Pertama, hapus semua entri terkait WO ini
    await WOEntry.destroy({
      where: { work_order_id: id },
      transaction,
    });

    // Kemudian, hapus semua biaya terkait WO ini
    await WOExpense.destroy({
      where: { work_order_id: id },
      transaction,
    });

    // Terakhir, hapus header WO
    const deletedRows = await WorkOrder.destroy({
      where: { work_order_id: id },
      transaction,
    });

    await transaction.commit();

    if (deletedRows === 0) {
      return responseHandler(res, 404, 'fail', `Work Order dengan ID ${id} tidak ditemukan.`);
    }

    return responseHandler(res, 200, 'success', 'Work Order, entri, dan biaya terkait berhasil dihapus.');
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting Work Order:', error);
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return responseHandler(res, 409, 'error', 'Work Order tidak dapat dihapus karena masih terkait dengan data lain (misal: Transaksi Keuangan).', null, error.message);
    }
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menghapus Work Order.', null, error.message);
  }
};