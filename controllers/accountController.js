// controllers/accountController.js

const responseHandler = require('../utils/responseHandler');
const { Account } = require('../models'); // Hanya perlu model Account, karena tidak ada relasi langsung ke User/AccountType di skema asli Anda

// --- FUNGSI UNTUK MEMBUAT AKUN BARU ---
exports.createAccount = async (req, res) => {
  try {
    // Sesuaikan dengan kolom yang ada di migrasi create-account.js:
    // account_name, account_type (ENUM), currency, current_balance (default 0.00), is_active (default true)
    const { account_name, account_type, currency } = req.body;

    // --- Validasi Input Sederhana ---
    if (!account_name || !account_type || !currency) {
      return responseHandler(res, 400, 'error', 'Nama akun, tipe akun, dan mata uang wajib diisi.', null, {
        fields: ['account_name', 'account_type', 'currency'],
        message: 'Missing required fields',
      });
    }

    // Validasi nilai ENUM untuk account_type
    const validAccountTypes = ['Modal', 'Operasional'];
    if (!validAccountTypes.includes(account_type)) {
      return responseHandler(res, 400, 'fail', 'Tipe akun tidak valid. Harus "Modal" atau "Operasional".', null, {
        fields: ['account_type'],
        message: 'Invalid account type',
      });
    }

    // Cek apakah account_name sudah ada (asumsi account_name itu unique, jika tidak maka validasi ini tidak diperlukan)
    // Di migrasi Anda, account_name TIDAK unique, jadi bagian ini bisa dihapus jika tidak ada batasan unique
    // Jika account_name memang harus unique, Anda perlu tambahkan unique: true di migrasi.
    const existingAccount = await Account.findOne({ where: { account_name } });
    if (existingAccount) {
      return responseHandler(res, 409, 'error', 'Nama akun sudah terdaftar.', null, {
        fields: ['account_name'],
        message: 'Duplicate account name',
      });
    }

    const newAccount = await Account.create({
      account_name,
      account_type,
      currency,
      current_balance: 0.00, // Akan mengikuti default value dari migrasi
      is_active: true,      // Akan mengikuti default value dari migrasi
      // created_at dan last_updated_at akan otomatis diisi oleh Sequelize
    });

    return responseHandler(res, 201, 'success', 'Akun berhasil ditambahkan.', newAccount);
  } catch (error) {
    console.error('Error creating account:', error);
    // Penanganan error khusus untuk UniqueConstraintError (jika account_name dijadikan unique di migrasi)
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0]?.path || 'unknown';
      return responseHandler(res, 409, 'error', `Duplikasi data pada kolom ${field}.`, null, {
        fields: [field],
        message: 'Unique constraint violation',
      });
    }
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menambahkan akun.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN SEMUA AKUN ---
exports.getAllAccounts = async (req, res) => {
  try {
    // Menambahkan filter dari query parameter jika diperlukan
    const { accountType, isActive } = req.query; // Filter berdasarkan account_type atau is_active
    const whereClause = {};

    if (accountType) {
      const validAccountTypes = ['Modal', 'Operasional'];
      if (!validAccountTypes.includes(accountType)) {
        return responseHandler(res, 400, 'fail', 'Tipe akun tidak valid.', null, {
          fields: ['accountType'],
          message: 'Invalid account type filter',
        });
      }
      whereClause.account_type = accountType;
    }

    if (isActive !== undefined) {
      whereClause.is_active = (isActive === 'true'); // Konversi string 'true'/'false' ke boolean
    }

    const accounts = await Account.findAll({
      where: whereClause, // Terapkan filter
      order: [['account_name', 'ASC']], // Mengurutkan berdasarkan nama akun
      // Tidak ada `include` karena relasi ke User atau AccountType tidak ada di skema asli Accounts
    });

    if (!accounts || accounts.length === 0) {
      return responseHandler(res, 404, 'fail', 'Tidak ada data akun ditemukan.');
    }

    return responseHandler(res, 200, 'success', 'Data akun berhasil ditemukan.', accounts);
  } catch (error) {
    console.error('Error fetching all accounts:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data akun.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN AKUN BERDASARKAN ID ---
exports.getAccountById = async (req, res) => {
  try {
    const { id } = req.params; // ID akun dari URL parameter

    const account = await Account.findByPk(id, {
      // Tidak ada `include` karena relasi ke User atau AccountType tidak ada di skema asli Accounts
    });

    if (!account) {
      return responseHandler(res, 404, 'fail', `Akun dengan ID ${id} tidak ditemukan.`);
    }

    return responseHandler(res, 200, 'success', 'Akun berhasil ditemukan.', account);
  } catch (error) {
    console.error('Error fetching account by ID:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data akun.', null, error.message);
  }
};

// --- FUNGSI UNTUK MEMPERBARUI AKUN ---
exports.updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    // Kolom yang bisa diupdate sesuai migrasi asli: account_name, account_type, currency, is_active
    const { account_name, account_type, currency, is_active } = req.body;
    // Catatan: current_balance TIDAK BOLEH diupdate langsung dari sini.

    // Cari akun berdasarkan ID
    const account = await Account.findByPk(id);
    if (!account) {
      return responseHandler(res, 404, 'fail', `Akun dengan ID ${id} tidak ditemukan.`);
    }

    // Validasi account_name jika ada perubahan dan jika unique di migrasi (saat ini tidak)
    // Jika account_name memang harus unique, Anda perlu tambahkan unique: true di migrasi.
    if (account_name && account_name !== account.account_name) {
      const existingAccount = await Account.findOne({ where: { account_name } });
      if (existingAccount && existingAccount.account_id !== id) {
        return responseHandler(res, 409, 'error', 'Nama akun sudah terdaftar untuk akun lain.', null, {
          fields: ['account_name'],
          message: 'Duplicate account name',
        });
      }
    }

    // Validasi account_type jika ada perubahan
    if (account_type && account_type !== account.account_type) {
      const validAccountTypes = ['Modal', 'Operasional'];
      if (!validAccountTypes.includes(account_type)) {
        return responseHandler(res, 400, 'fail', 'Tipe akun tidak valid. Harus "Modal" atau "Operasional".', null, {
          fields: ['account_type'],
          message: 'Invalid account type',
        });
      }
    }

    // Data yang akan diupdate, hanya jika nilainya ada di body request
    const updateData = {};
    if (account_name !== undefined) updateData.account_name = account_name;
    if (account_type !== undefined) updateData.account_type = account_type;
    if (currency !== undefined) updateData.currency = currency;
    if (is_active !== undefined) updateData.is_active = is_active;


    const [updatedRows] = await Account.update(updateData, {
      where: { account_id: id },
    });

    if (updatedRows === 0) {
      return responseHandler(res, 200, 'fail', 'Tidak ada perubahan pada data akun.', null, null);
    }

    // Ambil data akun terbaru setelah update untuk dikembalikan
    const updatedAccount = await Account.findByPk(id);
    return responseHandler(res, 200, 'success', 'Akun berhasil diperbarui.', updatedAccount);
  } catch (error) {
    console.error('Error updating account:', error);
    // Penanganan error khusus untuk UniqueConstraintError (jika account_name dijadikan unique di migrasi)
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0]?.path || 'unknown';
      return responseHandler(res, 409, 'error', `Duplikasi data pada kolom ${field}.`, null, {
        fields: [field],
        message: 'Unique constraint violation',
      });
    }
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat memperbarui akun.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENGHAPUS AKUN ---
exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah akun ada sebelum mencoba menghapus
    const account = await Account.findByPk(id);
    if (!account) {
      return responseHandler(res, 404, 'fail', `Akun dengan ID ${id} tidak ditemukan.`);
    }

    // Mencoba menghapus akun
    const deletedRows = await Account.destroy({
      where: { account_id: id },
    });

    if (deletedRows === 0) {
        // Ini seharusnya tidak terjadi jika account ditemukan di atas
        return responseHandler(res, 404, 'fail', `Akun dengan ID ${id} tidak dapat dihapus (mungkin sudah dihapus oleh proses lain).`);
    }

    return responseHandler(res, 200, 'success', 'Akun berhasil dihapus.');
  } catch (error) {
    console.error('Error deleting account:', error);
    // Penanganan spesifik jika ada Foreign Key constraint error (karena onDelete: 'RESTRICT' dari TransactionEntries)
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return responseHandler(res, 409, 'error', 'Akun tidak dapat dihapus karena masih terkait dengan entri transaksi atau data lain. Harap nonaktifkan akun sebagai gantinya.', null, error.message);
    }
    // Penanganan error server umum
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menghapus akun.', null, error.message);
  }
};