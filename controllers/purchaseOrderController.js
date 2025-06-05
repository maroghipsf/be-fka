const responseHandler = require('../utils/responseHandler');
const { PurchaseOrder, PurchaseOrderEntry, Supplier, User, Item, sequelize, Account, Transaction, TransactionEntry } = require('../models');
const { Op } = require('sequelize');

// --- FUNGSI UNTUK MEMBUAT PURCHASE ORDER BARU BESERTA ENTRI ITEMNYA ---
exports.createPurchaseOrder = async (req, res) => {
  const transaction = await sequelize.transaction(); // Mulai transaksi
  try {
    const {
      po_number,
      order_date,
      supplier_id,
      expected_delivery_date,
      status, // 'Pending', 'Approved', 'Rejected', 'Completed'
      total_amount, // Ini akan dihitung ulang nanti
      notes,
      created_by,
      entries // Array of { item_id, quantity, unit_price }
    } = req.body;

    // --- Validasi Input Wajib ---
    if (!po_number || !order_date || !supplier_id || !created_by || !entries || entries.length === 0) {
      await transaction.rollback();
      return responseHandler(res, 400, 'error', 'Nomor PO, tanggal, pemasok, pembuat, dan detail item wajib diisi.', null, {
        fields: ['po_number', 'order_date', 'supplier_id', 'created_by', 'entries'],
        message: 'Missing required fields',
      });
    }

    // --- Validasi Keberadaan Supplier ---
    const supplier = await Supplier.findByPk(supplier_id, { transaction });
    if (!supplier) {
      await transaction.rollback();
      return responseHandler(res, 404, 'fail', `Pemasok dengan ID ${supplier_id} tidak ditemukan.`, null, {
        fields: ['supplier_id'],
        message: 'Supplier not found',
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

    // --- Cek Duplikasi Nomor PO ---
    const existingPO = await PurchaseOrder.findOne({ where: { po_number }, transaction });
    if (existingPO) {
      await transaction.rollback();
      return responseHandler(res, 409, 'error', 'Nomor PO sudah terdaftar.', null, {
        fields: ['po_number'],
        message: 'Duplicate PO Number',
      });
    }

    let calculatedTotalAmount = 0;
    const poEntriesData = [];

    // --- Validasi dan Hitung Total Entri ---
    for (const entry of entries) {
      if (!entry.item_id || entry.quantity === undefined || entry.unit_price === undefined) {
        await transaction.rollback();
        return responseHandler(res, 400, 'error', 'Setiap detail item wajib memiliki ID item, kuantitas, dan harga satuan.', null, {
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
      calculatedTotalAmount += subtotal;
      poEntriesData.push({
        item_id: entry.item_id,
        quantity: entry.quantity,
        unit_price: entry.unit_price,
        subtotal: subtotal,
      });
    }

    // --- Buat Purchase Order Header ---
    const newPO = await PurchaseOrder.create({
      po_number,
      order_date,
      supplier_id,
      expected_delivery_date,
      status: status || 'Pending', // Default status jika tidak disediakan
      total_amount: calculatedTotalAmount, // Gunakan total yang dihitung
      notes,
      created_by,
    }, { transaction });

    // --- Tambahkan purchase_order_id ke setiap entri ---
    const entriesToCreate = poEntriesData.map(entry => ({
      ...entry,
      purchase_order_id: newPO.purchase_order_id,
    }));

    // --- Buat Purchase Order Entries ---
    await PurchaseOrderEntry.bulkCreate(entriesToCreate, { transaction });

    await transaction.commit(); // Commit transaksi

    // Ambil PO lengkap dengan entri dan relasi untuk respons
    const createdPOWithDetails = await PurchaseOrder.findByPk(newPO.purchase_order_id, {
      include: [
        { model: Supplier, as: 'supplier', attributes: ['supplier_id', 'supplier_name'] },
        { model: User, as: 'creator', attributes: ['user_id', 'username'] },
        {
          model: PurchaseOrderEntry,
          as: 'entries',
          include: [{ model: Item, as: 'item', attributes: ['item_id', 'item_name', 'unit_of_measure'] }],
        },
      ],
    });

    return responseHandler(res, 201, 'success', 'Purchase Order berhasil ditambahkan.', createdPOWithDetails);
  } catch (error) {
    await transaction.rollback(); // Rollback jika ada error
    console.error('Error creating Purchase Order:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menambahkan Purchase Order.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN SEMUA PURCHASE ORDER ---
exports.getAllPurchaseOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, supplierId, poNumber } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {};
    if (status) whereClause.status = status;
    if (supplierId) whereClause.supplier_id = supplierId;
    if (poNumber) whereClause.po_number = { [Op.like]: `%${poNumber}%` };

    const { count, rows: purchaseOrders } = await PurchaseOrder.findAndCountAll({
      where: whereClause,
      include: [
        { model: Supplier, as: 'supplier', attributes: ['supplier_id', 'supplier_name'] },
        { model: User, as: 'creator', attributes: ['user_id', 'username'] },
        {
          model: PurchaseOrderEntry,
          as: 'entries',
          include: [{ model: Item, as: 'item', attributes: ['item_id', 'item_name', 'unit_of_measure'] }],
        },
      ],
      order: [['order_date', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    if (!purchaseOrders || purchaseOrders.length === 0) {
      return responseHandler(res, 404, 'fail', 'Tidak ada data Purchase Order ditemukan.');
    }

    const meta = {
      totalItems: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit),
    };

    return responseHandler(res, 200, 'success', 'Data Purchase Order berhasil ditemukan.', purchaseOrders, null, meta);
  } catch (error) {
    console.error('Error fetching all Purchase Orders:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data Purchase Order.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN PURCHASE ORDER BERDASARKAN ID ---
exports.getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const purchaseOrder = await PurchaseOrder.findByPk(id, {
      include: [
        { model: Supplier, as: 'supplier', attributes: ['supplier_id', 'supplier_name'] },
        { model: User, as: 'creator', attributes: ['user_id', 'username'] },
        {
          model: PurchaseOrderEntry,
          as: 'entries',
          include: [{ model: Item, as: 'item', attributes: ['item_id', 'item_name', 'unit_of_measure'] }],
        },
      ],
    });

    if (!purchaseOrder) {
      return responseHandler(res, 404, 'fail', `Purchase Order dengan ID ${id} tidak ditemukan.`);
    }

    return responseHandler(res, 200, 'success', 'Purchase Order berhasil ditemukan.', purchaseOrder);
  } catch (error) {
    console.error('Error fetching Purchase Order by ID:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data Purchase Order.', null, error.message);
  }
};

// --- FUNGSI UNTUK MEMPERBARUI PURCHASE ORDER HEADER DAN ENTRI ---
exports.updatePurchaseOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      po_number,
      order_date,
      supplier_id,
      expected_delivery_date,
      status,
      notes,
      entries // Array of { po_entry_id (opsional), item_id, quantity, unit_price }
    } = req.body;

    const purchaseOrder = await PurchaseOrder.findByPk(id, { transaction });
    if (!purchaseOrder) {
      await transaction.rollback();
      return responseHandler(res, 404, 'fail', `Purchase Order dengan ID ${id} tidak ditemukan.`);
    }

    // --- Validasi Supplier jika diubah ---
    if (supplier_id && supplier_id !== purchaseOrder.supplier_id) {
      const supplier = await Supplier.findByPk(supplier_id, { transaction });
      if (!supplier) {
        await transaction.rollback();
        return responseHandler(res, 404, 'fail', `Pemasok dengan ID ${supplier_id} tidak ditemukan.`, null, {
          fields: ['supplier_id'],
          message: 'Supplier not found',
        });
      }
    }

    // --- Cek Duplikasi Nomor PO jika diubah ---
    if (po_number && po_number !== purchaseOrder.po_number) {
      const existingPO = await PurchaseOrder.findOne({ where: { po_number }, transaction });
      if (existingPO && existingPO.purchase_order_id !== id) {
        await transaction.rollback();
        return responseHandler(res, 409, 'error', 'Nomor PO sudah terdaftar.', null, {
          fields: ['po_number'],
          message: 'Duplicate PO Number',
        });
      }
    }

    let calculatedTotalAmount = 0;
    const existingEntries = await PurchaseOrderEntry.findAll({ where: { purchase_order_id: id }, transaction });
    const existingEntryIds = new Set(existingEntries.map(e => e.po_entry_id));
    const entriesToUpdateOrCreate = [];
    const entriesToDelete = new Set(existingEntryIds);

    if (entries && entries.length > 0) {
      for (const entry of entries) {
        if (!entry.item_id || entry.quantity === undefined || entry.unit_price === undefined) {
          await transaction.rollback();
          return responseHandler(res, 400, 'error', 'Setiap detail item wajib memiliki ID item, kuantitas, dan harga satuan.', null, {
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
        calculatedTotalAmount += subtotal;

        if (entry.po_entry_id && existingEntryIds.has(entry.po_entry_id)) {
          // Ini adalah entri yang sudah ada, tandai untuk diupdate
          entriesToUpdateOrCreate.push({
            po_entry_id: entry.po_entry_id,
            purchase_order_id: id,
            item_id: entry.item_id,
            quantity: entry.quantity,
            unit_price: entry.unit_price,
            subtotal: subtotal,
          });
          entriesToDelete.delete(entry.po_entry_id); // Jangan hapus entri ini
        } else {
          // Ini adalah entri baru
          entriesToUpdateOrCreate.push({
            purchase_order_id: id,
            item_id: entry.item_id,
            quantity: entry.quantity,
            unit_price: entry.unit_price,
            subtotal: subtotal,
          });
        }
      }
    } else {
      // Jika array entries kosong atau tidak ada, total amount menjadi 0
      calculatedTotalAmount = 0;
    }


    // --- Hapus entri yang tidak ada lagi di payload ---
    if (entriesToDelete.size > 0) {
      await PurchaseOrderEntry.destroy({
        where: { po_entry_id: Array.from(entriesToDelete) },
        transaction,
      });
    }

    // --- Update atau buat entri yang tersisa ---
    for (const entryData of entriesToUpdateOrCreate) {
      if (entryData.po_entry_id) {
        // Update existing entry
        await PurchaseOrderEntry.update(entryData, {
          where: { po_entry_id: entryData.po_entry_id },
          transaction,
        });
      } else {
        // Create new entry
        await PurchaseOrderEntry.create(entryData, { transaction });
      }
    }


    // --- Update Purchase Order Header ---
    await PurchaseOrder.update(
      {
        po_number: po_number || purchaseOrder.po_number,
        order_date: order_date || purchaseOrder.order_date,
        supplier_id: supplier_id || purchaseOrder.supplier_id,
        expected_delivery_date: expected_delivery_date || purchaseOrder.expected_delivery_date,
        status: status || purchaseOrder.status,
        total_amount: calculatedTotalAmount, // Perbarui total amount berdasarkan entri baru
        notes: notes !== undefined ? notes : purchaseOrder.notes, // Izinkan notes menjadi null
      },
      {
        where: { purchase_order_id: id },
        transaction,
      }
    );

    await transaction.commit();

    // Ambil PO lengkap setelah update untuk respons
    const updatedPOWithDetails = await PurchaseOrder.findByPk(id, {
      include: [
        { model: Supplier, as: 'supplier', attributes: ['supplier_id', 'supplier_name'] },
        { model: User, as: 'creator', attributes: ['user_id', 'username'] },
        {
          model: PurchaseOrderEntry,
          as: 'entries',
          include: [{ model: Item, as: 'item', attributes: ['item_id', 'item_name', 'unit_of_measure'] }],
        },
      ],
    });

    return responseHandler(res, 200, 'success', 'Purchase Order berhasil diperbarui.', updatedPOWithDetails);
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating Purchase Order:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat memperbarui Purchase Order.', null, error.message);
  }
};


// --- FUNGSI UNTUK MENGHAPUS PURCHASE ORDER BESERTA ENTRI ITEMNYA ---
exports.deletePurchaseOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const purchaseOrder = await PurchaseOrder.findByPk(id, { transaction });
    if (!purchaseOrder) {
      await transaction.rollback();
      return responseHandler(res, 404, 'fail', `Purchase Order dengan ID ${id} tidak ditemukan.`);
    }

    // Pertama, hapus semua entri terkait PO ini
    await PurchaseOrderEntry.destroy({
      where: { purchase_order_id: id },
      transaction,
    });

    // Kemudian, hapus header PO
    const deletedRows = await PurchaseOrder.destroy({
      where: { purchase_order_id: id },
      transaction,
    });

    await transaction.commit();

    if (deletedRows === 0) {
      // Ini jarang terjadi jika sudah lolos findByPk, tapi untuk jaga-jaga
      return responseHandler(res, 404, 'fail', `Purchase Order dengan ID ${id} tidak ditemukan.`);
    }

    return responseHandler(res, 200, 'success', 'Purchase Order dan entri terkait berhasil dihapus.');
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting Purchase Order:', error);
    // Tambahkan penanganan spesifik jika ada Foreign Key constraint error (jika PO punya FK ke tabel lain yang tidak dihapus)
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return responseHandler(res, 409, 'error', 'Purchase Order tidak dapat dihapus karena masih terkait dengan data lain (misal: Penerimaan Barang, Pembayaran).', null, error.message);
    }
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menghapus Purchase Order.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENCATAT PEMBAYARAN UNTUK PURCHASE ORDER ---
exports.payPurchaseOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      amount,
      payment_date,
      account_id,
      description = `Pembayaran untuk PO #${id}`,
      notes
    } = req.body;

    if (amount === undefined || amount <= 0 || !payment_date || !account_id) {
      await t.rollback();
      return responseHandler(res, 400, 'error', 'Jumlah pembayaran, tanggal pembayaran, dan ID akun wajib diisi dan jumlah harus positif.', null, {
        fields: ['amount', 'payment_date', 'account_id'],
        message: 'Missing or invalid required fields',
      });
    }

    const purchaseOrder = await PurchaseOrder.findByPk(id, { transaction: t });
    if (!purchaseOrder) {
      await t.rollback();
      return responseHandler(res, 404, 'fail', `Purchase Order dengan ID ${id} tidak ditemukan.`);
    }

    const account = await Account.findByPk(account_id, { transaction: t });
    if (!account) {
      await t.rollback();
      return responseHandler(res, 404, 'fail', `Akun dengan ID ${account_id} tidak ditemukan.`);
    }

    const currentPaidAmount = parseFloat(purchaseOrder.paid_amount || 0);
    const poTotalAmount = parseFloat(purchaseOrder.total_amount || 0);
    const newPaidAmount = currentPaidAmount + parseFloat(amount);

    if (newPaidAmount > poTotalAmount) {
      await t.rollback();
      return responseHandler(res, 400, 'error', `Jumlah pembayaran (${amount}) melebihi sisa yang harus dibayar untuk PO ini. Sisa: ${poTotalAmount - currentPaidAmount}.`);
    }

    let newPaymentStatus = 'Unpaid';
    if (newPaidAmount > 0 && newPaidAmount < poTotalAmount) {
      newPaymentStatus = 'Partially Paid';
    } else if (newPaidAmount >= poTotalAmount) {
      newPaymentStatus = 'Paid';
    }

    await purchaseOrder.update(
      {
        paid_amount: newPaidAmount,
        payment_status: newPaymentStatus,
      },
      { transaction: t }
    );

    // --- Buat Transaksi Keuangan ---
    const newTransaction = await Transaction.create({
      transaction_date: payment_date,
      transaction_type: 'PO Payment',
      description: description,
      total_amount: amount,
      notes: notes,
      created_by: req.user.id, // Ambil user_id dari token JWT
      related_po_id: purchaseOrder.purchase_order_id,
    }, { transaction: t });

    // --- Buat Entri Transaksi (Kredit akun pembayaran) ---
    await TransactionEntry.create({
      transaction_id: newTransaction.transaction_id,
      account_id: account.account_id,
      amount: amount,
      entry_type: 'Credit', // Uang keluar dari akun ini
      description: `Pembayaran PO #${purchaseOrder.po_number} dari ${account.account_name}`,
    }, { transaction: t });

    // --- Perbarui Saldo Akun ---
    let newAccountBalance = parseFloat(account.current_balance) - parseFloat(amount);
    await account.update({ current_balance: newAccountBalance }, { transaction: t });

    await t.commit();

    // Ambil PO yang diperbarui dan detail transaksi pembayaran untuk respons
    const updatedPO = await PurchaseOrder.findByPk(id, {
        include: [
            { model: Supplier, as: 'supplier' },
            { model: User, as: 'creator', attributes: ['user_id', 'username'] },
            {
                model: PurchaseOrderEntry,
                as: 'entries',
                include: [{ model: Item, as: 'item' }],
            },
        ],
    });

    const paymentDetails = await Transaction.findByPk(newTransaction.transaction_id, {
        include: [
            { model: User, as: 'creator', attributes: ['user_id', 'username'] },
            { model: TransactionEntry, as: 'entries', include: [{ model: Account, as: 'account' }] },
        ]
    });

    return responseHandler(res, 200, 'success', 'Pembayaran Purchase Order berhasil dicatat.', {
      purchaseOrder: updatedPO,
      paymentTransaction: paymentDetails,
    });
  } catch (error) {
    await t.rollback();
    console.error('Error recording PO payment:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mencatat pembayaran Purchase Order.', null, error.message);
  }
};