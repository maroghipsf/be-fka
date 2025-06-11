const responseHandler = require('../utils/responseHandler');
const { Account, Transaction, TransactionEntry, User, InterestConfiguration, AccountInterestPeriod, sequelize } = require('../models');
const { Op } = require('sequelize');

// Transfer Dana (Pokok + Opsional Bunga)
exports.transferFunds = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      source_account_id,
      destination_account_id,
      amount,
      description,
      created_by,
      apply_interest, // boolean
      interest_config_id, // opsional
      interest_start_date, // opsional
      interest_end_date // opsional
    } = req.body;
    // --- Validasi input wajib ---
    if (!source_account_id || !destination_account_id || !amount || !created_by) {
      await t.rollback();
      return responseHandler(res, 400, 'error', 'Akun sumber, akun tujuan, jumlah, dan user wajib diisi.', null, {
        fields: ['source_account_id', 'destination_account_id', 'amount', 'created_by'],
        message: 'Missing required fields',
      });
    }
    if (source_account_id === destination_account_id) {
      await t.rollback();
      return responseHandler(res, 400, 'error', 'Akun sumber dan tujuan tidak boleh sama.', null, {
        fields: ['source_account_id', 'destination_account_id'],
        message: 'Source and destination accounts must be different',
      });
    }
    if (amount <= 0) {
      await t.rollback();
      return responseHandler(res, 400, 'error', 'Jumlah transfer harus lebih dari nol.', null, {
        fields: ['amount'],
        message: 'Amount must be positive',
      });
    }
    // --- Validasi akun dan user ---
    const [source, destination, user] = await Promise.all([
      Account.findByPk(source_account_id, { transaction: t }),
      Account.findByPk(destination_account_id, { transaction: t }),
      User.findByPk(created_by, { transaction: t })
    ]);
    if (!source || !destination) {
      await t.rollback();
      return responseHandler(res, 404, 'fail', 'Akun sumber atau tujuan tidak ditemukan.');
    }
    if (!user) {
      await t.rollback();
      return responseHandler(res, 404, 'fail', 'User tidak ditemukan.');
    }
    if (parseFloat(source.current_balance) < parseFloat(amount)) {
      await t.rollback();
      return responseHandler(res, 400, 'error', 'Saldo akun sumber tidak mencukupi.', null, {
        fields: ['amount'],
        message: 'Insufficient balance',
      });
    }

    // --- Buat transaksi pokok transfer ---
    const transferTransaction = await Transaction.create({
      transaction_date: new Date(),
      transaction_type: 'Transfer',
      description: description || `Transfer dari ${source.account_name} ke ${destination.account_name}`,
      created_by,
      total_amount: amount // Tambahkan total_amount jika diperlukan oleh model/migrasi
    }, { transaction: t });

    // --- Buat entri debit/kredit ---
    await TransactionEntry.bulkCreate([
      {
        transaction_id: transferTransaction.transaction_id,
        account_id: source_account_id,
        amount: amount,
        entry_type: 'Credit',
        description: 'Transfer keluar',
        related_entity_type: 'Transfer',
        related_entity_id: destination_account_id
      },
      {
        transaction_id: transferTransaction.transaction_id,
        account_id: destination_account_id,
        amount: amount,
        entry_type: 'Debit',
        description: 'Transfer masuk',
        related_entity_type: 'Transfer',
        related_entity_id: source_account_id
      }
    ], { transaction: t });

    // --- Update saldo akun ---
    await source.update({ current_balance: parseFloat(source.current_balance) - parseFloat(amount) }, { transaction: t });
    await destination.update({ current_balance: parseFloat(destination.current_balance) + parseFloat(amount) }, { transaction: t });

    let interestPeriod = null;
    let interestTransaction = null;
    if (apply_interest && source.account_type === 'Modal' && destination.account_type === 'Operasional') {
      // --- Validasi bunga ---
      if (!interest_config_id || !interest_start_date || !interest_end_date) {
        await t.rollback();
        return responseHandler(res, 400, 'error', 'Semua field bunga wajib diisi jika bunga diterapkan.', null, {
          fields: ['interest_config_id', 'interest_start_date', 'interest_end_date'],
          message: 'Interest fields required',
        });
      }
      const interestConfig = await InterestConfiguration.findOne({ where: { interest_config_id, is_active: 1 }, transaction: t });
      if (!interestConfig) {
        await t.rollback();
        return responseHandler(res, 404, 'fail', 'Konfigurasi bunga tidak ditemukan atau tidak aktif.');
      }
      // --- Buat AccountInterestPeriod ---
      interestPeriod = await AccountInterestPeriod.create({
        account_id: source_account_id,
        interest_config_id,
        start_date: interest_start_date,
        end_date: interest_end_date,
        initial_transfer_transaction_id: transferTransaction.transaction_id,
        principal_amount: amount,
        status: 'Active' // Set status default agar tidak null
      }, { transaction: t });
      // --- Hitung bunga total (flat, untuk contoh, bisa disesuaikan dengan calculation_type) ---
      const days = (new Date(interest_end_date) - new Date(interest_start_date)) / (1000 * 60 * 60 * 24) + 1;
      let interestAmount = 0;
      if (interestConfig.calculation_type === 'Annual') {
        // Hitung bunga tahunan
        interestAmount = (((parseFloat(interestConfig.rate_percentage) / 12) * parseFloat(amount)) * 2);
      }else if (interestConfig.calculation_type === 'Monthly') {
        // Hitung jumlah bulan penuh
        const start = new Date(interest_start_date);
        const end = new Date(interest_end_date);
        let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
        interestAmount = parseFloat(amount) * parseFloat(interestConfig.rate_percentage) * months;
      } else {
        // Default: harian
        interestAmount = parseFloat(amount) * parseFloat(interestConfig.rate_percentage) * days;
      }
      // --- Buat transaksi biaya bunga ---
      interestTransaction = await Transaction.create({
        transaction_date: new Date(),
        transaction_type: 'Interest Expense',
        description: `Biaya bunga transfer dari ${source.account_name} ke ${destination.account_name}`,
        created_by,
        total_amount: interestAmount // Tambahkan total_amount jika diperlukan oleh model/migrasi
      }, { transaction: t });
      await TransactionEntry.create({
        transaction_id: interestTransaction.transaction_id,
        account_id: source_account_id,
        amount: interestAmount,
        entry_type: 'Credit',
        description: 'Biaya bunga transfer',
        related_entity_type: 'Interest Expense',
        related_entity_id: interestPeriod.account_interest_id
      }, { transaction: t });
      // --- Update saldo akun sumber (potong bunga) ---
      await source.update({ current_balance: parseFloat(source.current_balance) - interestAmount }, { transaction: t });
    }

    await t.commit();
    return responseHandler(res, 201, 'success', 'Transfer dana berhasil.', {
      transferTransaction,
      interestPeriod,
      interestTransaction
    });
  } catch (error) {
    await t.rollback();
    console.error('Error during transferFunds:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat transfer dana.', null, error.message);
  }
};

// --- GET ALL TRANSFER TRANSACTIONS ---
exports.getAllTransfers = async (req, res) => {
  try {
    // Ambil semua transaksi dengan tipe 'Transfer'
    const transfers = await Transaction.findAll({
      where: { transaction_type: 'Transfer' },
      include: [
        {
          model: TransactionEntry,
          as: 'entries',
          include: [
            { model: Account, as: 'account', attributes: ['account_id', 'account_name', 'account_type'] }
          ]
        },
        { model: User, as: 'creator', attributes: ['user_id', 'username'] }
      ],
      order: [['transaction_date', 'DESC']]
    });

    // Format data untuk frontend
    const data = transfers.map(trx => {
      // Ambil entry debit dan kredit
      const debitEntry = trx.entries.find(e => e.entry_type.toLowerCase() === 'debit');
      const creditEntry = trx.entries.find(e => e.entry_type.toLowerCase() === 'credit');
      return {
        transfer_id: trx.transaction_id,
        transfer_date: trx.transaction_date,
        source_account_id: creditEntry ? creditEntry.account_id : null,
        source_account_name: creditEntry && creditEntry.account ? creditEntry.account.account_name : '',
        destination_account_id: debitEntry ? debitEntry.account_id : null,
        destination_account_name: debitEntry && debitEntry.account ? debitEntry.account.account_name : '',
        amount: trx.total_amount,
        description: trx.description,
        status: 'success', // Atur sesuai kebutuhan, misal draft/success
        created_by: trx.created_by,
        created_by_username: trx.creator ? trx.creator.username : ''
      };
    });

    return responseHandler(res, 200, 'success', 'Data transfer berhasil ditemukan.', data);
  } catch (error) {
    console.error('Error fetching transfer list:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data transfer.', null, error.message);
  }
};

// --- GET DETAIL TRANSFER BY ID ---
exports.getTransferDetail = async (req, res) => {
  try {
    const { id } = req.params;
    // Ambil transaksi transfer utama
    const trx = await Transaction.findByPk(id, {
      include: [
        {
          model: TransactionEntry,
          as: 'entries',
          include: [
            { model: Account, as: 'account', attributes: ['account_id', 'account_name', 'account_type'] }
          ]
        },
        { model: User, as: 'creator', attributes: ['user_id', 'username'] },
        {
          model: AccountInterestPeriod,
          as: 'interestPeriods',
          include: [
            { model: InterestConfiguration, as: 'interestConfiguration', attributes: ['config_name', 'rate_percentage', 'calculation_type'] }
          ]
        }
      ]
    });
    if (!trx) {
      return responseHandler(res, 404, 'fail', 'Data transfer tidak ditemukan.');
    }
    // Ambil entry debit/kredit
    const debitEntry = trx.entries.find(e => e.entry_type.toLowerCase() === 'debit');
    const creditEntry = trx.entries.find(e => e.entry_type.toLowerCase() === 'credit');
    // Ambil data bunga jika ada
    const interestPeriod = trx.interestPeriods && trx.interestPeriods.length > 0 ? trx.interestPeriods[0] : null;
    let bunga = null;
    if (interestPeriod) {
      let interestAmount = 0;
      if (interestPeriod.interestConfiguration.calculation_type === 'Annual') {
        // Hitung bunga tahunan
        interestAmount = (((parseFloat(interestPeriod.interestConfiguration.rate_percentage) / 12) * parseFloat(interestPeriod.principal_amount)) * 2);
      }else if (interestPeriod.interestConfiguration.calculation_type === 'Monthly') {
        // Hitung jumlah bulan penuh
        const start = new Date(interest_start_date);
        const end = new Date(interest_end_date);
        let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
        interestAmount = parseFloat(interestPeriod.principal_amount) * parseFloat(interestPeriod.interestConfiguration.rate_percentage) * months;
      } else {
        // Default: harian
        interestAmount = parseFloat(interestPeriod.principal_amount) * parseFloat(interestPeriod.interestConfiguration.rate_percentage) * days;
      }
      bunga = {
        interest_config_name: interestPeriod.interestConfiguration ? interestPeriod.interestConfiguration.config_name : '',
        interest_start_date: interestPeriod.start_date,
        interest_end_date: interestPeriod.end_date,
        interest_rate_percentage: interestPeriod.interestConfiguration ? interestPeriod.interestConfiguration.rate_percentage : null,
        interest_calculation_type: interestPeriod.interestConfiguration ? interestPeriod.interestConfiguration.calculation_type : '',
        interest_amount: interestAmount.toFixed(0),
      };
    }
    const detail = {
      transfer_id: trx.transaction_id,
      transfer_date: trx.transaction_date,
      source_account_id: creditEntry ? creditEntry.account_id : null,
      source_account_name: creditEntry && creditEntry.account ? creditEntry.account.account_name : '',
      destination_account_id: debitEntry ? debitEntry.account_id : null,
      destination_account_name: debitEntry && debitEntry.account ? debitEntry.account.account_name : '',
      amount: trx.total_amount,
      description: trx.description,
      status: 'success',
      created_by: trx.created_by,
      created_by_name: trx.creator ? trx.creator.username : '',
      created_at: trx.created_at,
      updated_at: trx.updated_at,
      ...bunga
    };
    return responseHandler(res, 200, 'success', 'Detail transfer berhasil ditemukan.', detail);
  } catch (error) {
    console.error('Error fetching transfer detail:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil detail transfer.', null, error.message);
  }
};
