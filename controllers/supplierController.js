const responseHandler = require('../utils/responseHandler');
const { Supplier } = require('../models'); // Pastikan path ini benar

// --- FUNGSI UNTUK MEMBUAT PEMASOK BARU ---
exports.createSupplier = async (req, res) => {
  try {
    const { supplier_name, address, phone, email, npwp } = req.body;

    // --- Validasi Input Sederhana ---
    if (!supplier_name || !address) {
      return responseHandler(res, 400, 'error', 'Nama pemasok dan Alamat wajib diisi.', null, {
        fields: ['supplier_name', 'address'],
        message: 'Missing required fields',
      });
    }

    // Cek apakah email sudah ada jika diberikan
    if (email) {
      const existingEmail = await Supplier.findOne({ where: { email } });
      if (existingEmail) {
        return responseHandler(res, 409, 'error', 'Email sudah terdaftar untuk pemasok lain.', null, {
          fields: ['email'],
          message: 'Duplicate email',
        });
      }
    }

    // Cek apakah NPWP sudah ada jika diberikan
    if (npwp) {
      const existingNpwp = await Supplier.findOne({ where: { npwp } });
      if (existingNpwp) {
        return responseHandler(res, 409, 'error', 'NPWP sudah terdaftar untuk pemasok lain.', null, {
          fields: ['npwp'],
          message: 'Duplicate NPWP',
        });
      }
    }

    const newSupplier = await Supplier.create({
      supplier_name,
      address,
      phone,
      email,
      npwp,
    });

    return responseHandler(res, 201, 'success', 'Pemasok berhasil ditambahkan.', newSupplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menambahkan pemasok.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN SEMUA PEMASOK ---
exports.getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.findAll();

    if (!suppliers || suppliers.length === 0) {
      return responseHandler(res, 404, 'fail', 'Tidak ada data pemasok ditemukan.');
    }

    return responseHandler(res, 200, 'success', 'Data pemasok berhasil ditemukan.', suppliers);
  } catch (error) {
    console.error('Error fetching all suppliers:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data pemasok.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN PEMASOK BERDASARKAN ID ---
exports.getSupplierById = async (req, res) => {
  try {
    const { id } = req.params; // ID pemasok dari URL parameter

    const supplier = await Supplier.findByPk(id);

    if (!supplier) {
      return responseHandler(res, 404, 'fail', `Pemasok dengan ID ${id} tidak ditemukan.`);
    }

    return responseHandler(res, 200, 'success', 'Pemasok berhasil ditemukan.', supplier);
  } catch (error) {
    console.error('Error fetching supplier by ID:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data pemasok.', null, error.message);
  }
};

// --- FUNGSI UNTUK MEMPERBARUI PEMASOK ---
exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { supplier_name, address, phone, email, npwp } = req.body;

    // Cari pemasok berdasarkan ID
    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      return responseHandler(res, 404, 'fail', `Pemasok dengan ID ${id} tidak ditemukan.`);
    }

    // Validasi email jika ada perubahan
    if (email && email !== supplier.email) {
      const existingEmail = await Supplier.findOne({ where: { email } });
      if (existingEmail && existingEmail.supplier_id !== id) {
        return responseHandler(res, 409, 'error', 'Email sudah terdaftar untuk pemasok lain.', null, {
          fields: ['email'],
          message: 'Duplicate email',
        });
      }
    }

    // Validasi NPWP jika ada perubahan
    if (npwp && npwp !== supplier.npwp) {
      const existingNpwp = await Supplier.findOne({ where: { npwp } });
      if (existingNpwp && existingNpwp.supplier_id !== id) {
        return responseHandler(res, 409, 'error', 'NPWP sudah terdaftar untuk pemasok lain.', null, {
          fields: ['npwp'],
          message: 'Duplicate NPWP',
        });
      }
    }

    // Update data pemasok
    const [updatedRows] = await Supplier.update(
      {
        supplier_name: supplier_name || supplier.supplier_name,
        address: address || supplier.address,
        phone: phone || supplier.phone,
        email: email, // Izinkan email menjadi null/undefined jika tidak diisi
        npwp: npwp,   // Izinkan npwp menjadi null/undefined jika tidak diisi
      },
      {
        where: { supplier_id: id },
      }
    );

    if (updatedRows === 0) {
      // Ini jarang terjadi jika sudah lolos findByPk, tapi untuk jaga-jaga
      return responseHandler(res, 200, 'fail', 'Tidak ada perubahan pada data pemasok.', null, null);
    }

    // Ambil data pemasok terbaru setelah update
    const updatedSupplier = await Supplier.findByPk(id);
    return responseHandler(res, 200, 'success', 'Pemasok berhasil diperbarui.', updatedSupplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat memperbarui pemasok.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENGHAPUS PEMASOK ---
exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRows = await Supplier.destroy({
      where: { supplier_id: id },
    });

    if (deletedRows === 0) {
      return responseHandler(res, 404, 'fail', `Pemasok dengan ID ${id} tidak ditemukan.`);
    }

    return responseHandler(res, 200, 'success', 'Pemasok berhasil dihapus.');
  } catch (error) {
    console.error('Error deleting supplier:', error);
    // Tambahkan penanganan spesifik jika ada Foreign Key constraint error
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return responseHandler(res, 409, 'error', 'Pemasok tidak dapat dihapus karena masih terkait dengan data lain.', null, error.message);
    }
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menghapus pemasok.', null, error.message);
  }
};