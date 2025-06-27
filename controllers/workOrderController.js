const responseHandler = require('../utils/responseHandler');
const { WO, PO, Warehouse, sequelize } = require('../models');
const { Op } = require('sequelize');

// --- FUNGSI UNTUK MEMBUAT WORK ORDER BARU BESERTA ENTRI DAN BIAYANYA ---
exports.createWorkOrder = async (req, res) => {
  const transaction = await sequelize.transaction(); // Mulai transaksi
  try {
    const {
      po_id,
      sender_warehouse_id,
      receiver_warehouse_id,
      scheduled_pickup_time,
      net_weight_kg
    } = req.body;

    // --- Validasi Input Wajib ---
    if (!po_id || !sender_warehouse_id || !receiver_warehouse_id || !scheduled_pickup_time || net_weight_kg === undefined) {
      await transaction.rollback();
      return responseHandler(res, 400, 'error', 'Nomor WO, tanggal, deskripsi, dan pembuat wajib diisi.', null, {
        fields: ['wo_number', 'order_date', 'description', 'created_by'],
        message: 'Missing required fields',
      });
    }
    
    // --- Validasi sender_warehouse and receiver_warehouse ---
    if (sender_warehouse_id == receiver_warehouse_id) {
      await transaction.rollback();
      return responseHandler(res, 400, 'error', 'Sender dan receiver warehouse harus berbeda.', null, {
        fields: ['sender_warehouse_id', 'receiver_warehouse_id'],
        message: 'Sender and receiver warehouse cannot be the same'});
    }

    // --- Cek party ton, jumlah net_weight_kg melebihi party_ton ---
    const po = await PO.findByPk(po_id, { transaction });
    if (!po) {
      await transaction.rollback();
      return responseHandler(res, 404, 'fail', `Purchase Order dengan ID ${po_id} tidak ditemukan.`, null, {
        fields: ['po_id'],
        message: 'PO not found',
      });
    }
    const partyTonLimit = po.party_ton;
    const totalNetWeight =  await WO.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('net_weight_kg')), 'totalNetWeightForPO']
      ],
      where: {
        po_id: po_id, // Filter berdasarkan po_id yang diberikan
        net_weight_kg: {
          [Op.ne]: null // Opsional: Hanya menjumlahkan net_weight_kg yang tidak null
        }
      }
    });
    const partySum = totalNetWeight ? parseFloat(totalNetWeight.dataValues.totalNetWeightForPO) : 0;
    const totalParty = partySum + parseFloat(net_weight_kg);
    if (partyTonLimit < totalParty) {
      return responseHandler(res, 409, 'error', ' Net weight melebihi party ton.', null, {
        fields: ['party_ton', 'net_weight_kg'],
      });
    }

    // --- Buat Work Order Header ---
    const newWO = await WO.create({
      po_id,
      sender_warehouse_id,
      receiver_warehouse_id,
      scheduled_pickup_time,
      net_weight_kg
    }, { transaction });
    const newWOId = newWO.wo_id;
    if (!newWOId) {
      await transaction.rollback();
      return responseHandler(res, 500, 'error', 'Gagal membuat Work Order baru.', null, {
        fields: ['wo_id'],
        message: 'Failed to create Work Order',
      });
    }

    // Jika WO berhasil dibuat, commit transaksi
    // update PO status to 'Released'
    await PO.update({ status_po: 'Released' }, {
      where: { po_id },
      transaction
    });
    await transaction.commit(); // Commit transaksi jika semua berhasil

    return responseHandler(res, 201, 'success', 'Work Order berhasil dibuat.', { wo_id: newWOId });
  } catch (error) {
    await transaction.rollback(); // Rollback jika ada error
    console.error('Error creating Work Order:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menambahkan Work Order.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN SEMUA WORK ORDER ---
exports.getAllWorkOrdersByIdPO = async (req, res) => {
  try {
    const { idPO } = req.params;

    const wos = await WO.findAll({
      where: { po_id: idPO },
      include: [
        { model: PO, as: 'purchaseOrder', attributes: ['po_id', 'status_po', 'project', 'sdip_no', 'party_ton', 'po_date', 'description'] },
        { model: Warehouse , as: 'sender_warehouse', attributes: ['warehouse_id', 'warehouse_name'] },
        { model: Warehouse , as: 'receiver_warehouse', attributes: ['warehouse_id', 'warehouse_name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // If no WO found, return an empty array with 200 OK status
    if (!wos || wos.length === 0) {
      return responseHandler(res, 200, 'success', 'Tidak ada Working Order ditemukan untuk PO ini.', []);
    }

    return responseHandler(res, 200, 'success', 'Data Working Order berhasil ditemukan.', wos);
  } catch (error) {
    console.error('Error fetching all Work Orders:', error);
    // Log the actual error for more detailed debugging on your server console
    console.error('Sequelize error details:', error.name, error.message, error.original);

    // Provide a generic message to the client, but log details for yourself
    let clientErrorMessage = 'Terjadi kesalahan server saat mengambil data Working Order.';
    if (error.name === 'SequelizeValidationError') {
        clientErrorMessage = 'Validasi data gagal: ' + error.message;
    } else if (error.name === 'SequelizeDatabaseError' && error.original) {
        clientErrorMessage = 'Kesalahan database: ' + error.original.message;
    } else if (error.message.includes('alias')) {
        clientErrorMessage = 'Kesalahan konfigurasi alias model di server. Mohon hubungi administrator.';
    }

    return responseHandler(res, 500, 'error', clientErrorMessage, null, error.message);
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