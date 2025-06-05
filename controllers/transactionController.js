const responseHandler = require('../utils/responseHandler');
const { Transaction, TransactionEntry, Account, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// --- FUNGSI UNTUK MEMBUAT TRANSAKSI BARU BESERTA ENTRI-NYA ---
exports.createTransaction = async (req, res) => {
  const t = await sequelize.transaction(); // Mulai transaksi
  try {
    const {
      transaction_date,
      transaction_type, // e.g., 'Payment', 'Receipt', 'Transfer', 'Journal'
      description,
      notes,
      created_by,
      entries // Array of { account_id, amount, entry_type, description (for entry) }
    } = req.body;

    // --- Validasi Input Wajib ---
    if (!transaction_date || !transaction_type || !created_by || !entries || entries.length === 0) {
      await t.rollback();
      return responseHandler(res, 400, 'error', 'Tanggal, jenis transaksi, pembuat, dan detail entri wajib diisi.', null, {
        fields: ['transaction_date', 'transaction_type', 'created_by', 'entries'],
        message: 'Missing required fields',
      });
    }

    // --- Validasi Keberadaan User (created_by) ---
    const user = await User.findByPk(created_by, { transaction: t });
    if (!user) {
      await t.rollback();
      return responseHandler(res, 404, 'fail', `Pengguna dengan ID ${created_by} tidak ditemukan.`, null, {
        fields: ['created_by'],
        message: 'User not found',
      });
    }

    let totalAmount = 0; // Total amount for the main transaction header
    const transactionEntriesData = [];

    // --- Validasi dan Proses Entri Transaksi ---
    for (const entry of entries) {
      if (!entry.account_id || entry.amount === undefined || !entry.entry_type) {
        await t.rollback();
        return responseHandler(res, 400, 'error', 'Setiap entri transaksi wajib memiliki ID akun, jumlah, dan jenis entri (debit/kredit).', null, {
          fields: ['entries'],
          message: 'Invalid entry detail',
        });
      }
      if (entry.amount <= 0) {
        await t.rollback();
        return responseHandler(res, 400, 'error', 'Jumlah entri harus lebih dari nol.', null, {
          fields: ['entries'],
          message: 'Entry amount must be positive',
        });
      }
      if (!['debit', 'credit'].includes(entry.entry_type.toLowerCase())) {
        await t.rollback();
        return responseHandler(res, 400, 'error', 'Jenis entri harus "debit" atau "credit".', null, {
          fields: ['entries.entry_type'],
          message: 'Invalid entry type',
        });
      }

      const account = await Account.findByPk(entry.account_id, { transaction: t });
      if (!account) {
        await t.rollback();
        return responseHandler(res, 404, 'fail', `Akun dengan ID ${entry.account_id} tidak ditemukan untuk entri.`, null, {
          fields: ['entries.account_id'],
          message: 'Account not found for entry',
        });
      }

      transactionEntriesData.push({
        account_id: entry.account_id,
        amount: entry.amount,
        entry_type: entry.entry_type,
        description: entry.description,
      });

      // Untuk total_amount di header, kita bisa pakai total debit/kredit yang sama
      // Atau bisa juga total dari salah satu sisi jika ini transaksi sederhana (misal: payment)
      // Untuk fleksibilitas, saya akan menggunakan total jumlah dari semua entri.
      totalAmount += entry.amount;
    }

    // --- Buat Transaksi Header ---
    const newTransaction = await Transaction.create({
      transaction_date,
      transaction_type,
      description,
      total_amount: totalAmount, // Total dari semua entri
      notes,
      created_by,
    }, { transaction: t });

    // --- Buat Transaction Entries ---
    const entriesToCreate = transactionEntriesData.map(entry => ({
      ...entry,
      transaction_id: newTransaction.transaction_id,
    }));
    await TransactionEntry.bulkCreate(entriesToCreate, { transaction: t });

    // --- Update Saldo Akun ---
    for (const entry of entriesToCreate) {
        const account = await Account.findByPk(entry.account_id, { transaction: t });
        if (account) {
            let newBalance = parseFloat(account.balance);
            if (entry.entry_type.toLowerCase() === 'debit') {
                newBalance += parseFloat(entry.amount);
            } else { // 'credit'
                newBalance -= parseFloat(entry.amount);
            }
            await Account.update({ balance: newBalance }, { where: { account_id: account.account_id }, transaction: t });
        }
    }

    await t.commit(); // Commit transaksi

    // Ambil transaksi lengkap dengan entri dan relasi untuk respons
    const createdTransactionWithDetails = await Transaction.findByPk(newTransaction.transaction_id, {
      include: [
        { model: User, as: 'creator', attributes: ['user_id', 'username'] },
        {
          model: TransactionEntry,
          as: 'entries',
          include: [{ model: Account, as: 'account', attributes: ['account_id', 'account_name', 'account_number'] }],
        },
      ],
    });

    return responseHandler(res, 201, 'success', 'Transaksi berhasil ditambahkan.', createdTransactionWithDetails);
  } catch (error) {
    await t.rollback(); // Rollback jika ada error
    console.error('Error creating transaction:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menambahkan transaksi.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN SEMUA TRANSAKSI ---
exports.getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, accountId, startDate, endDate, userId } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {};
    if (type) whereClause.transaction_type = type;
    if (userId) whereClause.created_by = userId;
    if (startDate || endDate) {
      whereClause.transaction_date = {};
      if (startDate) whereClause.transaction_date[Op.gte] = new Date(startDate);
      if (endDate) whereClause.transaction_date[Op.lte] = new Date(endDate);
    }

    // Filter by account_id in entries (requires a separate join condition or subquery)
    const includeConditions = [
      { model: User, as: 'creator', attributes: ['user_id', 'username'] },
      {
        model: TransactionEntry,
        as: 'entries',
        include: [{ model: Account, as: 'account', attributes: ['account_id', 'account_name', 'account_number'] }],
      },
    ];

    if (accountId) {
      // Find transactions that have an entry for the specific accountId
      const transactionsWithAccount = await TransactionEntry.findAll({
        where: { account_id: accountId },
        attributes: ['transaction_id'],
        group: ['transaction_id'],
        raw: true,
        transaction: null // Ensure this subquery doesn't affect the main transaction
      });
      const transactionIds = transactionsWithAccount.map(t => t.transaction_id);
      whereClause.transaction_id = { [Op.in]: transactionIds };
    }

    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where: whereClause,
      include: includeConditions,
      order: [['transaction_date', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    if (!transactions || transactions.length === 0) {
      return responseHandler(res, 404, 'fail', 'Tidak ada data transaksi ditemukan.');
    }

    const meta = {
      totalItems: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit),
    };

    return responseHandler(res, 200, 'success', 'Data transaksi berhasil ditemukan.', transactions, null, meta);
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data transaksi.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN TRANSAKSI BERDASARKAN ID ---
exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['user_id', 'username'] },
        {
          model: TransactionEntry,
          as: 'entries',
          include: [{ model: Account, as: 'account', attributes: ['account_id', 'account_name', 'account_number'] }],
        },
      ],
    });

    if (!transaction) {
      return responseHandler(res, 404, 'fail', `Transaksi dengan ID ${id} tidak ditemukan.`);
    }

    return responseHandler(res, 200, 'success', 'Transaksi berhasil ditemukan.', transaction);
  } catch (error) {
    console.error('Error fetching transaction by ID:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data transaksi.', null, error.message);
  }
};

// --- FUNGSI UNTUK MEMPERBARUI TRANSAKSI (SANGAT KOMPLEKS, PERLU KEHATI-HATIAN) ---
// Catatan: Memperbarui transaksi keuangan seringkali sangat kompleks karena melibatkan perubahan saldo akun.
// Idealnya, transaksi yang sudah dicatat tidak diupdate, melainkan dibuat transaksi koreksi/reversal.
// Namun, jika memang diperlukan, logika di bawah ini adalah pendekatan dasar.
exports.updateTransaction = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      transaction_date,
      transaction_type,
      description,
      notes,
      entries // Array of { transaction_entry_id (opsional), account_id, amount, entry_type, description }
    } = req.body;

    const transaction = await Transaction.findByPk(id, { include: [{ model: TransactionEntry, as: 'entries' }], transaction: t });
    if (!transaction) {
      await t.rollback();
      return responseHandler(res, 404, 'fail', `Transaksi dengan ID ${id} tidak ditemukan.`);
    }

    // --- Reversal Saldo Akun Lama ---
    for (const oldEntry of transaction.entries) {
      const account = await Account.findByPk(oldEntry.account_id, { transaction: t });
      if (account) {
        let newBalance = parseFloat(account.balance);
        if (oldEntry.entry_type.toLowerCase() === 'debit') {
          newBalance -= parseFloat(oldEntry.amount); // Balikkan debit
        } else { // 'credit'
          newBalance += parseFloat(oldEntry.amount); // Balikkan kredit
        }
        await Account.update({ balance: newBalance }, { where: { account_id: account.account_id }, transaction: t });
      }
    }

    // --- Hapus semua entri lama ---
    await TransactionEntry.destroy({ where: { transaction_id: id }, transaction: t });

    let calculatedTotalAmount = 0;
    const newTransactionEntriesData = [];

    // --- Validasi dan Proses Entri Transaksi Baru ---
    if (entries && entries.length > 0) {
      for (const entry of entries) {
        if (!entry.account_id || entry.amount === undefined || !entry.entry_type) {
          await t.rollback();
          return responseHandler(res, 400, 'error', 'Setiap entri transaksi wajib memiliki ID akun, jumlah, dan jenis entri (debit/kredit).', null, {
            fields: ['entries'],
            message: 'Invalid entry detail',
          });
        }
        if (entry.amount <= 0) {
          await t.rollback();
          return responseHandler(res, 400, 'error', 'Jumlah entri harus lebih dari nol.', null, {
            fields: ['entries'],
            message: 'Entry amount must be positive',
          });
        }
        if (!['debit', 'credit'].includes(entry.entry_type.toLowerCase())) {
          await t.rollback();
          return responseHandler(res, 400, 'error', 'Jenis entri harus "debit" atau "credit".', null, {
            fields: ['entries.entry_type'],
            message: 'Invalid entry type',
          });
        }

        const account = await Account.findByPk(entry.account_id, { transaction: t });
        if (!account) {
          await t.rollback();
          return responseHandler(res, 404, 'fail', `Akun dengan ID ${entry.account_id} tidak ditemukan untuk entri.`, null, {
            fields: ['entries.account_id'],
            message: 'Account not found for entry',
          });
        }

        calculatedTotalAmount += entry.amount;
        newTransactionEntriesData.push({
          account_id: entry.account_id,
          amount: entry.amount,
          entry_type: entry.entry_type,
          description: entry.description,
        });
      }
    } else {
        // Jika tidak ada entri baru, total amount menjadi 0
        calculatedTotalAmount = 0;
    }


    // --- Buat Entri Transaksi Baru ---
    if (newTransactionEntriesData.length > 0) {
        const entriesToCreate = newTransactionEntriesData.map(entry => ({
            ...entry,
            transaction_id: id,
        }));
        await TransactionEntry.bulkCreate(entriesToCreate, { transaction: t });

        // --- Perbarui Saldo Akun dengan Entri Baru ---
        for (const entry of entriesToCreate) {
            const account = await Account.findByPk(entry.account_id, { transaction: t });
            if (account) {
                let currentBalance = parseFloat(account.balance);
                if (entry.entry_type.toLowerCase() === 'debit') {
                    currentBalance += parseFloat(entry.amount);
                } else { // 'credit'
                    currentBalance -= parseFloat(entry.amount);
                }
                await Account.update({ balance: currentBalance }, { where: { account_id: account.account_id }, transaction: t });
            }
        }
    }

    // --- Update Transaksi Header ---
    await Transaction.update(
      {
        transaction_date: transaction_date || transaction.transaction_date,
        transaction_type: transaction_type || transaction.transaction_type,
        description: description || transaction.description,
        total_amount: calculatedTotalAmount, // Perbarui total amount berdasarkan entri baru
        notes: notes !== undefined ? notes : transaction.notes,
      },
      {
        where: { transaction_id: id },
        transaction: t,
      }
    );

    await t.commit();

    // Ambil transaksi lengkap setelah update untuk respons
    const updatedTransactionWithDetails = await Transaction.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['user_id', 'username'] },
        {
          model: TransactionEntry,
          as: 'entries',
          include: [{ model: Account, as: 'account', attributes: ['account_id', 'account_name', 'account_number'] }],
        },
      ],
    });

    return responseHandler(res, 200, 'success', 'Transaksi berhasil diperbarui.', updatedTransactionWithDetails);
  } catch (error) {
    await t.rollback();
    console.error('Error updating transaction:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat memperbarui transaksi.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENGHAPUS TRANSAKSI ---
exports.deleteTransaction = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const transaction = await Transaction.findByPk(id, { include: [{ model: TransactionEntry, as: 'entries' }], transaction: t });
    if (!transaction) {
      await t.rollback();
      return responseHandler(res, 404, 'fail', `Transaksi dengan ID ${id} tidak ditemukan.`);
    }

    // --- Balikkan Saldo Akun sebelum menghapus entri ---
    for (const entry of transaction.entries) {
      const account = await Account.findByPk(entry.account_id, { transaction: t });
      if (account) {
        let newBalance = parseFloat(account.balance);
        if (entry.entry_type.toLowerCase() === 'debit') {
          newBalance -= parseFloat(entry.amount); // Balikkan debit
        } else { // 'credit'
          newBalance += parseFloat(entry.amount); // Balikkan kredit
        }
        await Account.update({ balance: newBalance }, { where: { account_id: account.account_id }, transaction: t });
      }
    }

    // Pertama, hapus semua entri terkait transaksi ini
    await TransactionEntry.destroy({
      where: { transaction_id: id },
      transaction: t,
    });

    // Kemudian, hapus header transaksi
    const deletedRows = await Transaction.destroy({
      where: { transaction_id: id },
      transaction: t,
    });

    await t.commit();

    if (deletedRows === 0) {
      return responseHandler(res, 404, 'fail', `Transaksi dengan ID ${id} tidak ditemukan.`);
    }

    return responseHandler(res, 200, 'success', 'Transaksi dan entri terkait berhasil dihapus.');
  } catch (error) {
    await t.rollback();
    console.error('Error deleting transaction:', error);
    // Tambahkan penanganan spesifik jika ada Foreign Key constraint error
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return responseHandler(res, 409, 'error', 'Transaksi tidak dapat dihapus karena masih terkait dengan data lain.', null, error.message);
    }
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menghapus transaksi.', null, error.message);
  }
};