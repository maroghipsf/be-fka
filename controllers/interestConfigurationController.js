const responseHandler = require('../utils/responseHandler');
const { InterestConfiguration } = require('../models'); // Pastikan path ini benar
const { Op } = require('sequelize');

// --- CREATE ---
exports.createInterestConfiguration = async (req, res) => {
  try {
    const { config_name, rate_percentage, calculation_type, description, is_active } = req.body;

    if (!config_name || rate_percentage === undefined || !calculation_type) {
      return responseHandler(res, 400, 'error', 'Nama konfigurasi, persentase bunga, dan tipe perhitungan wajib diisi.', null, {
        fields: ['config_name', 'rate_percentage', 'calculation_type'],
        message: 'Missing required fields',
      });
    }
    if (rate_percentage < 0) {
      return responseHandler(res, 400, 'error', 'Persentase bunga harus berupa angka non-negatif.', null, {
        fields: ['rate_percentage'],
        message: 'Invalid rate value',
      });
    }
    // Validasi calculation_type
    const allowedTypes = ['Annual', 'Monthly', 'Daily']; // Pastikan sesuai ENUM di DB
    if (!allowedTypes.includes(calculation_type)) {
      return responseHandler(res, 400, 'error', `Tipe perhitungan hanya boleh salah satu dari: ${allowedTypes.join(', ')}`, null, {
        fields: ['calculation_type'],
        message: 'Invalid calculation_type value',
      });
    }
    const existing = await InterestConfiguration.findOne({ where: { config_name } });
    if (existing) {
      return responseHandler(res, 409, 'error', 'Nama konfigurasi bunga sudah terdaftar.', null, {
        fields: ['config_name'],
        message: 'Duplicate config name',
      });
    }
    const newConfig = await InterestConfiguration.create({
      config_name,
      rate_percentage,
      calculation_type,
      description,
      is_active: is_active !== undefined ? is_active : true,
    });
    return responseHandler(res, 201, 'success', 'Konfigurasi bunga berhasil ditambahkan.', newConfig);
  } catch (error) {
    console.error('Error creating interest configuration:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menambahkan konfigurasi bunga.', null, error.message);
  }
};

// --- READ ALL ---
exports.getAllInterestConfigurations = async (req, res) => {
  try {
    const configs = await InterestConfiguration.findAll({ order: [['created_at', 'DESC']] });
    if (!configs || configs.length === 0) {
      return responseHandler(res, 404, 'fail', 'Tidak ada data konfigurasi bunga ditemukan.');
    }
    return responseHandler(res, 200, 'success', 'Data konfigurasi bunga berhasil ditemukan.', configs);
  } catch (error) {
    console.error('Error fetching all interest configurations:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data konfigurasi bunga.', null, error.message);
  }
};

// --- READ BY ID ---
exports.getInterestConfigurationById = async (req, res) => {
  try {
    const { id } = req.params;
    const config = await InterestConfiguration.findByPk(id);
    if (!config) {
      return responseHandler(res, 404, 'fail', `Konfigurasi bunga dengan ID ${id} tidak ditemukan.`);
    }
    return responseHandler(res, 200, 'success', 'Konfigurasi bunga berhasil ditemukan.', config);
  } catch (error) {
    console.error('Error fetching interest configuration by ID:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data konfigurasi bunga.', null, error.message);
  }
};

// --- UPDATE ---
exports.updateInterestConfiguration = async (req, res) => {
  try {
    const { id } = req.params;
    const { config_name, rate_percentage, calculation_type, description, is_active } = req.body;
    const config = await InterestConfiguration.findByPk(id);
    if (!config) {
      return responseHandler(res, 404, 'fail', `Konfigurasi bunga dengan ID ${id} tidak ditemukan.`);
    }
    if (rate_percentage !== undefined && (typeof rate_percentage !== 'number' || rate_percentage < 0)) {
      return responseHandler(res, 400, 'error', 'Persentase bunga harus berupa angka non-negatif.', null, {
        fields: ['rate_percentage'],
        message: 'Invalid rate value',
      });
    }
    // Validasi calculation_type
    const allowedTypes = ['Month', 'Day']; // Pastikan sesuai ENUM di DB
    if (calculation_type && !allowedTypes.includes(calculation_type)) {
      return responseHandler(res, 400, 'error', `Tipe perhitungan hanya boleh salah satu dari: ${allowedTypes.join(', ')}`, null, {
        fields: ['calculation_type'],
        message: 'Invalid calculation_type value',
      });
    }
    if (config_name && config_name !== config.config_name) {
      const existing = await InterestConfiguration.findOne({ where: { config_name } });
      if (existing && existing.interest_config_id !== id) {
        return responseHandler(res, 409, 'error', 'Nama konfigurasi bunga sudah terdaftar.', null, {
          fields: ['config_name'],
          message: 'Duplicate config name',
        });
      }
    }
    await InterestConfiguration.update({
      config_name: config_name || config.config_name,
      rate_percentage: rate_percentage !== undefined ? rate_percentage : config.rate_percentage,
      calculation_type: calculation_type || config.calculation_type,
      description: description !== undefined ? description : config.description,
      is_active: is_active !== undefined ? is_active : config.is_active,
    }, { where: { interest_config_id: id } });
    const updated = await InterestConfiguration.findByPk(id);
    return responseHandler(res, 200, 'success', 'Konfigurasi bunga berhasil diperbarui.', updated);
  } catch (error) {
    console.error('Error updating interest configuration:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat memperbarui konfigurasi bunga.', null, error.message);
  }
};

// --- DELETE ---
exports.deleteInterestConfiguration = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRows = await InterestConfiguration.destroy({ where: { interest_config_id: id } });
    if (deletedRows === 0) {
      return responseHandler(res, 404, 'fail', `Konfigurasi bunga dengan ID ${id} tidak ditemukan.`);
    }
    return responseHandler(res, 200, 'success', 'Konfigurasi bunga berhasil dihapus.');
  } catch (error) {
    console.error('Error deleting interest configuration:', error);
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return responseHandler(res, 409, 'error', 'Konfigurasi bunga tidak dapat dihapus karena masih terkait dengan data lain.', null, error.message);
    }
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menghapus konfigurasi bunga.', null, error.message);
  }
};