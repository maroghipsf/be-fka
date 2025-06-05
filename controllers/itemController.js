// controllers/itemController.js

const responseHandler = require('../utils/responseHandler');
const { Item } = require('../models'); // Pastikan path ini benar

// --- FUNGSI UNTUK MEMBUAT ITEM BARU ---
exports.createItem = async (req, res) => {
  try {
    const { item_code, item_name, unit_of_measure, description } = req.body;

    // --- Validasi Input Sederhana ---
    if (!item_name || !unit_of_measure) {
      return responseHandler(res, 400, 'error', 'Nama item dan Satuan Pengukuran wajib diisi.', null, {
        fields: ['item_name', 'unit_of_measure'],
        message: 'Missing required fields',
      });
    }

    // Cek apakah item_code sudah ada jika diberikan
    if (item_code) {
      const existingItem = await Item.findOne({ where: { item_code } });
      if (existingItem) {
        return responseHandler(res, 409, 'error', 'Kode Item sudah terdaftar.', null, {
          fields: ['item_code'],
          message: 'Duplicate Item Code',
        });
      }
    }

    const newItem = await Item.create({
      item_code,
      item_name,
      unit_of_measure,
      description,
    });

    return responseHandler(res, 201, 'success', 'Item berhasil ditambahkan.', newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menambahkan item.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN SEMUA ITEM ---
exports.getAllItems = async (req, res) => {
  try {
    const items = await Item.findAll();

    if (!items || items.length === 0) {
      return responseHandler(res, 404, 'fail', 'Tidak ada data item ditemukan.');
    }

    return responseHandler(res, 200, 'success', 'Data item berhasil ditemukan.', items);
  } catch (error) {
    console.error('Error fetching all items:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data item.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN ITEM BERDASARKAN ID ---
exports.getItemById = async (req, res) => {
  try {
    const { id } = req.params; // ID item dari URL parameter

    const item = await Item.findByPk(id);

    if (!item) {
      return responseHandler(res, 404, 'fail', `Item dengan ID ${id} tidak ditemukan.`);
    }

    return responseHandler(res, 200, 'success', 'Item berhasil ditemukan.', item);
  } catch (error) {
    console.error('Error fetching item by ID:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data item.', null, error.message);
  }
};

// --- FUNGSI UNTUK MEMPERBARUI ITEM ---
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { item_code, item_name, unit_of_measure, description } = req.body;

    // Cari item berdasarkan ID
    const item = await Item.findByPk(id);
    if (!item) {
      return responseHandler(res, 404, 'fail', `Item dengan ID ${id} tidak ditemukan.`);
    }

    // Validasi item_code jika ada perubahan
    if (item_code && item_code !== item.item_code) {
      const existingItem = await Item.findOne({ where: { item_code } });
      if (existingItem && existingItem.item_id !== id) {
        return responseHandler(res, 409, 'error', 'Kode Item sudah terdaftar untuk item lain.', null, {
          fields: ['item_code'],
          message: 'Duplicate Item Code',
        });
      }
    }

    // Update data item
    const [updatedRows] = await Item.update(
      {
        item_code: item_code || item.item_code,
        item_name: item_name || item.item_name,
        unit_of_measure: unit_of_measure || item.unit_of_measure,
        description: description, // Izinkan description menjadi null/undefined jika tidak diisi
      },
      {
        where: { item_id: id },
      }
    );

    if (updatedRows === 0) {
      return responseHandler(res, 200, 'fail', 'Tidak ada perubahan pada data item.', null, null);
    }

    // Ambil data item terbaru setelah update
    const updatedItem = await Item.findByPk(id);
    return responseHandler(res, 200, 'success', 'Item berhasil diperbarui.', updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat memperbarui item.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENGHAPUS ITEM ---
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRows = await Item.destroy({
      where: { item_id: id },
    });

    if (deletedRows === 0) {
      return responseHandler(res, 404, 'fail', `Item dengan ID ${id} tidak ditemukan.`);
    }

    return responseHandler(res, 200, 'success', 'Item berhasil dihapus.');
  } catch (error) {
    console.error('Error deleting item:', error);
    // Tambahkan penanganan spesifik jika ada Foreign Key constraint error
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return responseHandler(res, 409, 'error', 'Item tidak dapat dihapus karena masih terkait dengan data lain.', null, error.message);
    }
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menghapus item.', null, error.message);
  }
};