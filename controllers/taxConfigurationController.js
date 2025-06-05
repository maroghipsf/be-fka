const responseHandler = require('../utils/responseHandler');
const { TaxConfiguration } = require('../models'); // Pastikan path ini benar
const { Op } = require('sequelize');

// --- FUNGSI UNTUK MEMBUAT KONFIGURASI PAJAK BARU ---
exports.createTaxConfiguration = async (req, res) => {
  try {
    const { tax_name, rate, tax_type, description, effective_date, is_active } = req.body;

    // --- Validasi Input Wajib ---
    if (!tax_name || rate === undefined || !tax_type || !effective_date) {
      return responseHandler(res, 400, 'error', 'Nama pajak, rate, jenis pajak, dan tanggal efektif wajib diisi.', null, {
        fields: ['tax_name', 'rate', 'tax_type', 'effective_date'],
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

    // --- Cek apakah tax_name sudah ada ---
    const existingConfig = await TaxConfiguration.findOne({ where: { tax_name } });
    if (existingConfig) {
      return responseHandler(res, 409, 'error', 'Nama konfigurasi pajak sudah terdaftar.', null, {
        fields: ['tax_name'],
        message: 'Duplicate tax configuration name',
      });
    }

    const newTaxConfig = await TaxConfiguration.create({
      tax_name,
      rate,
      tax_type, // e.g., 'VAT', 'Income Tax', 'Service Tax'
      description,
      effective_date,
      is_active: is_active !== undefined ? is_active : true, // Default to true
    });

    return responseHandler(res, 201, 'success', 'Konfigurasi pajak berhasil ditambahkan.', newTaxConfig);
  } catch (error) {
    console.error('Error creating tax configuration:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menambahkan konfigurasi pajak.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN SEMUA KONFIGURASI PAJAK ---
exports.getAllTaxConfigurations = async (req, res) => {
  try {
    const { is_active, tax_type } = req.query;
    const whereClause = {};

    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true'; // Konversi string 'true'/'false' ke boolean
    }
    if (tax_type) {
      whereClause.tax_type = tax_type;
    }

    const taxConfigs = await TaxConfiguration.findAll({
        where: whereClause,
        order: [['effective_date', 'DESC']] // Urutkan berdasarkan tanggal efektif terbaru
    });

    if (!taxConfigs || taxConfigs.length === 0) {
      return responseHandler(res, 404, 'fail', 'Tidak ada data konfigurasi pajak ditemukan.');
    }

    return responseHandler(res, 200, 'success', 'Data konfigurasi pajak berhasil ditemukan.', taxConfigs);
  } catch (error) {
    console.error('Error fetching all tax configurations:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data konfigurasi pajak.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN KONFIGURASI PAJAK BERDASARKAN ID ---
exports.getTaxConfigurationById = async (req, res) => {
  try {
    const { id } = req.params;

    const taxConfig = await TaxConfiguration.findByPk(id);

    if (!taxConfig) {
      return responseHandler(res, 404, 'fail', `Konfigurasi pajak dengan ID ${id} tidak ditemukan.`);
    }

    return responseHandler(res, 200, 'success', 'Konfigurasi pajak berhasil ditemukan.', taxConfig);
  } catch (error) {
    console.error('Error fetching tax configuration by ID:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data konfigurasi pajak.', null, error.message);
  }
};

// --- FUNGSI UNTUK MEMPERBARUI KONFIGURASI PAJAK ---
exports.updateTaxConfiguration = async (req, res) => {
  try {
    const { id } = req.params;
    const { tax_name, rate, tax_type, description, effective_date, is_active } = req.body;

    const taxConfig = await TaxConfiguration.findByPk(id);
    if (!taxConfig) {
      return responseHandler(res, 404, 'fail', `Konfigurasi pajak dengan ID ${id} tidak ditemukan.`);
    }

    // Validasi rate jika ada perubahan
    if (rate !== undefined && (typeof rate !== 'number' || rate < 0)) {
        return responseHandler(res, 400, 'error', 'Rate harus berupa angka non-negatif.', null, {
            fields: ['rate'],
            message: 'Invalid rate value',
        });
    }

    // Validasi tax_name jika ada perubahan
    if (tax_name && tax_name !== taxConfig.tax_name) {
      const existingConfig = await TaxConfiguration.findOne({ where: { tax_name } });
      if (existingConfig && existingConfig.tax_config_id !== id) {
        return responseHandler(res, 409, 'error', 'Nama konfigurasi pajak sudah terdaftar untuk konfigurasi lain.', null, {
          fields: ['tax_name'],
          message: 'Duplicate tax configuration name',
        });
      }
    }

    const [updatedRows] = await TaxConfiguration.update(
      {
        tax_name: tax_name || taxConfig.tax_name,
        rate: rate !== undefined ? rate : taxConfig.rate,
        tax_type: tax_type || taxConfig.tax_type,
        description: description !== undefined ? description : taxConfig.description,
        effective_date: effective_date || taxConfig.effective_date,
        is_active: is_active !== undefined ? is_active : taxConfig.is_active,
      },
      {
        where: { tax_config_id: id },
      }
    );

    if (updatedRows === 0) {
      return responseHandler(res, 200, 'fail', 'Tidak ada perubahan pada data konfigurasi pajak.', null, null);
    }

    const updatedTaxConfig = await TaxConfiguration.findByPk(id);
    return responseHandler(res, 200, 'success', 'Konfigurasi pajak berhasil diperbarui.', updatedTaxConfig);
  } catch (error) {
    console.error('Error updating tax configuration:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat memperbarui konfigurasi pajak.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENGHAPUS KONFIGURASI PAJAK ---
exports.deleteTaxConfiguration = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRows = await TaxConfiguration.destroy({
      where: { tax_config_id: id },
    });

    if (deletedRows === 0) {
      return responseHandler(res, 404, 'fail', `Konfigurasi pajak dengan ID ${id} tidak ditemukan.`);
    }

    return responseHandler(res, 200, 'success', 'Konfigurasi pajak berhasil dihapus.');
  } catch (error) {
    console.error('Error deleting tax configuration:', error);
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return responseHandler(res, 409, 'error', 'Konfigurasi pajak tidak dapat dihapus karena masih terkait dengan data lain.', null, error.message);
    }
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menghapus konfigurasi pajak.', null, error.message);
  }
};