const responseHandler = require('../utils/responseHandler');
const { PO } = require('../models'); // Pastikan path ini benar

// --- FUNGSI UNTUK MEMBUAT PO BARU ---
exports.createPO= async (req, res) => {
  try {
    const { project, sdip_no, party_ton, po_date, description} = req.body;

    // --- Validasi Input Sederhana ---
    if (!project || !sdip_no || !party_ton || !po_date) {
      return responseHandler(res, 400, 'error', 'Project, SDIP number, pembuat, dan tanggal PO wajib diisi', null, {
        fields: req.body,
        message: 'Missing required fields',
      });
    }

    // Cek apakah sdip_no sudah ada jika diberikan
    if (sdip_no) {
      const existingPO = await PO.findOne({ where: { sdip_no } });
      if (existingPO) {
        return responseHandler(res, 409, 'error', 'Kode SDIP sudah terdaftar.', null, {
          fields: ['sdip_no'],
          message: 'Duplicate SDIP Number',
        });
      }
    }

    const newPO = await PO.create({
      project,
      sdip_no,
      party_ton,
      po_date,
      description
    });

    return responseHandler(res, 201, 'success', 'PO berhasil ditambahkan.', newPO);
  } catch (error) {
    console.error('Error creating PO:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menambahkan PO.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN SEMUA PO ---
exports.getAllPO = async (req, res) => {
  try {
    const pos = await PO.findAll();

    if (!pos || pos.length === 0) {
      return responseHandler(res, 404, 'fail', 'Tidak ada data PO ditemukan.');
    }

    return responseHandler(res, 200, 'success', 'Data PO berhasil ditemukan.', pos);
  } catch (error) {
    console.error('Error fetching all PO:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data PO.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN PO BERDASARKAN ID ---
exports.getPOById = async (req, res) => {
  try {
    const { id } = req.params; // ID PO dari URL parameter

    const row = await PO.findByPk(id);

    if (!row) {
      return responseHandler(res, 404, 'fail', `PO dengan ID ${id} tidak ditemukan.`);
    }
    return responseHandler(res, 200, 'success', 'PO berhasil ditemukan.', row);
  } catch (error) {
    console.error('Error fetching item by ID:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data PO.', null, error.message);
  }
};