const responseHandler = require('../utils/responseHandler');
const { InterestConfiguration } = require('../models'); // Pastikan path ini benar
const { Op } = require('sequelize');

// --- FUNGSI UNTUK MEMBUAT KONFIGURASI BUNGA BARU ---
exports.createInterestConfiguration = async (req, res) => {
  try {
    const { config_name, rate, calculation_method, effective_date, notes } = req.body;

    // --- Validasi Input Wajib ---
    if (!config_name || rate === undefined || !calculation_method || !effective_date) {
      return responseHandler(res, 400, 'error', 'Nama konfigurasi, rate, metode perhitungan, dan tanggal efektif wajib diisi.', null, {
        fields: ['config_name', 'rate', 'calculation_method', 'effective_date'],
        message: 'Missing required fields',
      });
    }

    // --- Validasi Rate ---
    if (typeof rate !== 'number' || rate < 0) {
        return responseHandler(res, 400, 'error', 'Rate harus berupa angka non-negatif.', null, {
            fields: ['rate'],
            message: 'Invalid rate value',
        });
    }

    // --- Cek apakah config_name sudah ada ---
    const existingConfig = await InterestConfiguration.findOne({ where: { config_name } });
    if (existingConfig) {
      return responseHandler(res, 409, 'error', 'Nama konfigurasi bunga sudah terdaftar.', null, {
        fields: ['config_name'],
        message: 'Duplicate interest configuration name',
      });
    }

    const newInterestConfig = await InterestConfiguration.create({
      config_name,
      rate,
      calculation_method, // e.g., 'Daily', 'Monthly', 'Annual', 'Flat'
      effective_date,
      notes,
    });

    return responseHandler(res, 201, 'success', 'Konfigurasi bunga berhasil ditambahkan.', newInterestConfig);
  } catch (error) {
    console.error('Error creating interest configuration:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menambahkan konfigurasi bunga.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN SEMUA KONFIGURASI BUNGA ---
exports.getAllInterestConfigurations = async (req, res) => {
  try {
    const interestConfigs = await InterestConfiguration.findAll({
        order: [['effective_date', 'DESC']] // Urutkan berdasarkan tanggal efektif terbaru
    });

    if (!interestConfigs || interestConfigs.length === 0) {
      return responseHandler(res, 404, 'fail', 'Tidak ada data konfigurasi bunga ditemukan.');
    }

    return responseHandler(res, 200, 'success', 'Data konfigurasi bunga berhasil ditemukan.', interestConfigs);
  } catch (error) {
    console.error('Error fetching all interest configurations:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data konfigurasi bunga.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN KONFIGURASI BUNGA BERDASARKAN ID ---
exports.getInterestConfigurationById = async (req, res) => {
  try {
    const { id } = req.params;

    const interestConfig = await InterestConfiguration.findByPk(id);

    if (!interestConfig) {
      return responseHandler(res, 404, 'fail', `Konfigurasi bunga dengan ID ${id} tidak ditemukan.`);
    }

    return responseHandler(res, 200, 'success', 'Konfigurasi bunga berhasil ditemukan.', interestConfig);
  } catch (error) {
    console.error('Error fetching interest configuration by ID:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data konfigurasi bunga.', null, error.message);
  }
};

// --- FUNGSI UNTUK MEMPERBARUI KONFIGURASI BUNGA ---
exports.updateInterestConfiguration = async (req, res) => {
  try {
    const { id } = req.params;
    const { config_name, rate, calculation_method, effective_date, notes } = req.body;

    const interestConfig = await InterestConfiguration.findByPk(id);
    if (!interestConfig) {
      return responseHandler(res, 404, 'fail', `Konfigurasi bunga dengan ID ${id} tidak ditemukan.`);
    }

    // Validasi rate jika ada perubahan
    if (rate !== undefined && (typeof rate !== 'number' || rate < 0)) {
        return responseHandler(res, 400, 'error', 'Rate harus berupa angka non-negatif.', null, {
            fields: ['rate'],
            message: 'Invalid rate value',
        });
    }

    // Validasi config_name jika ada perubahan
    if (config_name && config_name !== interestConfig.config_name) {
      const existingConfig = await InterestConfiguration.findOne({ where: { config_name } });
      if (existingConfig && existingConfig.interest_config_id !== id) {
        return responseHandler(res, 409, 'error', 'Nama konfigurasi bunga sudah terdaftar untuk konfigurasi lain.', null, {
          fields: ['config_name'],
          message: 'Duplicate interest configuration name',
        });
      }
    }

    const [updatedRows] = await InterestConfiguration.update(
      {
        config_name: config_name || interestConfig.config_name,
        rate: rate !== undefined ? rate : interestConfig.rate,
        calculation_method: calculation_method || interestConfig.calculation_method,
        effective_date: effective_date || interestConfig.effective_date,
        notes: notes !== undefined ? notes : interestConfig.notes, // Izinkan notes menjadi null
      },
      {
        where: { interest_config_id: id },
      }
    );

    if (updatedRows === 0) {
      return responseHandler(res, 200, 'fail', 'Tidak ada perubahan pada data konfigurasi bunga.', null, null);
    }

    const updatedInterestConfig = await InterestConfiguration.findByPk(id);
    return responseHandler(res, 200, 'success', 'Konfigurasi bunga berhasil diperbarui.', updatedInterestConfig);
  } catch (error) {
    console.error('Error updating interest configuration:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat memperbarui konfigurasi bunga.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENGHAPUS KONFIGURASI BUNGA ---
exports.deleteInterestConfiguration = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRows = await InterestConfiguration.destroy({
      where: { interest_config_id: id },
    });

    if (deletedRows === 0) {
      return responseHandler(res, 404, 'fail', `Konfigurasi bunga dengan ID ${id} tidak ditemukan.`);
    }

    return responseHandler(res, 200, 'success', 'Konfigurasi bunga berhasil dihapus.');
  } catch (error) {
    console.error('Error deleting interest configuration:', error);
    // Tambahkan penanganan spesifik jika ada Foreign Key constraint error (jika konfigurasi bunga dipakai di tabel lain)
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return responseHandler(res, 409, 'error', 'Konfigurasi bunga tidak dapat dihapus karena masih terkait dengan data lain.', null, error.message);
    }
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menghapus konfigurasi bunga.', null, error.message);
  }
};