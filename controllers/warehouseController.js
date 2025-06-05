const responseHandler = require('../utils/responseHandler');
const { Warehouse } = require('../models'); // Pastikan path ini benar sesuai struktur proyek Anda

// --- FUNGSI UNTUK MEMBUAT GUDANG BARU ---
exports.createWarehouse = async (req, res) => {
  try {
    const { warehouse_name, location, bulog_code } = req.body;

    // --- Validasi Input Sederhana ---
    if (!warehouse_name || !location) {
      return responseHandler(res, 400, 'error', 'Nama gudang dan Lokasi wajib diisi.', null, {
        fields: ['warehouse_name', 'location'],
        message: 'Missing required fields',
      });
    }

    // Cek apakah bulog_code sudah ada jika diberikan
    if (bulog_code) {
      const existingWarehouse = await Warehouse.findOne({ where: { bulog_code } });
      if (existingWarehouse) {
        return responseHandler(res, 409, 'error', 'Kode Bulog sudah terdaftar.', null, {
          fields: ['bulog_code'],
          message: 'Duplicate Bulog Code',
        });
      }
    }

    const newWarehouse = await Warehouse.create({
      warehouse_name,
      location,
      bulog_code,
    });

    return responseHandler(res, 201, 'success', 'Gudang berhasil ditambahkan.', newWarehouse);
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menambahkan gudang.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN SEMUA GUDANG ---
exports.getAllWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.findAll();

    if (!warehouses || warehouses.length === 0) {
      return responseHandler(res, 404, 'fail', 'Tidak ada data gudang ditemukan.');
    }

    return responseHandler(res, 200, 'success', 'Data gudang berhasil ditemukan.', warehouses);
  } catch (error) {
    console.error('Error fetching all warehouses:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data gudang.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN GUDANG BERDASARKAN ID ---
exports.getWarehouseById = async (req, res) => {
  try {
    const { id } = req.params; // ID gudang dari URL parameter

    const warehouse = await Warehouse.findByPk(id);

    if (!warehouse) {
      return responseHandler(res, 404, 'fail', `Gudang dengan ID ${id} tidak ditemukan.`);
    }

    return responseHandler(res, 200, 'success', 'Gudang berhasil ditemukan.', warehouse);
  } catch (error) {
    console.error('Error fetching warehouse by ID:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data gudang.', null, error.message);
  }
};

// --- FUNGSI UNTUK MEMPERBARUI GUDANG ---
exports.updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const { warehouse_name, location, bulog_code } = req.body;

    // Cari gudang berdasarkan ID
    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      return responseHandler(res, 404, 'fail', `Gudang dengan ID ${id} tidak ditemukan.`);
    }

    // Validasi input jika ada perubahan bulog_code
    if (bulog_code && bulog_code !== warehouse.bulog_code) {
      const existingWarehouse = await Warehouse.findOne({ where: { bulog_code } });
      if (existingWarehouse && existingWarehouse.warehouse_id !== id) {
        return responseHandler(res, 409, 'error', 'Kode Bulog sudah terdaftar untuk gudang lain.', null, {
          fields: ['bulog_code'],
          message: 'Duplicate Bulog Code',
        });
      }
    }

    // Update data gudang
    const [updatedRows] = await Warehouse.update(
      {
        warehouse_name: warehouse_name || warehouse.warehouse_name,
        location: location || warehouse.location,
        bulog_code: bulog_code, // Izinkan bulog_code menjadi null/undefined jika tidak diisi
      },
      {
        where: { warehouse_id: id },
      }
    );

    if (updatedRows === 0) {
      // Ini jarang terjadi jika sudah lolos findByPk, tapi untuk jaga-jaga
      return responseHandler(res, 200, 'fail', 'Tidak ada perubahan pada data gudang.', null, null);
    }

    // Ambil data gudang terbaru setelah update
    const updatedWarehouse = await Warehouse.findByPk(id);
    return responseHandler(res, 200, 'success', 'Gudang berhasil diperbarui.', updatedWarehouse);
  } catch (error) {
    console.error('Error updating warehouse:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat memperbarui gudang.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENGHAPUS GUDANG ---
exports.deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRows = await Warehouse.destroy({
      where: { warehouse_id: id },
    });

    if (deletedRows === 0) {
      return responseHandler(res, 404, 'fail', `Gudang dengan ID ${id} tidak ditemukan.`);
    }

    return responseHandler(res, 200, 'success', 'Gudang berhasil dihapus.');
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    // Tambahkan penanganan spesifik jika ada Foreign Key constraint error
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return responseHandler(res, 409, 'error', 'Gudang tidak dapat dihapus karena masih terkait dengan data lain (misal: PO, WO).', null, error.message);
    }
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menghapus gudang.', null, error.message);
  }
};