const responseHandler = require('../utils/responseHandler');
const { Role } = require('../models'); // Pastikan path ini benar

// --- FUNGSI UNTUK MEMBUAT ROLE BARU ---
exports.createRole = async (req, res) => {
  try {
    const { role_name, description } = req.body;

    // --- Validasi Input Sederhana ---
    if (!role_name) {
      return responseHandler(res, 400, 'error', 'Nama peran (role) wajib diisi.', null, {
        fields: ['role_name'],
        message: 'Missing required fields',
      });
    }

    // Cek apakah role_name sudah ada
    const existingRole = await Role.findOne({ where: { role_name } });
    if (existingRole) {
      return responseHandler(res, 409, 'error', 'Nama peran sudah terdaftar.', null, {
        fields: ['role_name'],
        message: 'Duplicate role name',
      });
    }

    const newRole = await Role.create({
      role_name,
      description,
    });

    return responseHandler(res, 201, 'success', 'Peran berhasil ditambahkan.', newRole);
  } catch (error) {
    console.error('Error creating role:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menambahkan peran.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN SEMUA ROLE ---
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();

    if (!roles || roles.length === 0) {
      return responseHandler(res, 404, 'fail', 'Tidak ada data peran ditemukan.');
    }

    return responseHandler(res, 200, 'success', 'Data peran berhasil ditemukan.', roles);
  } catch (error) {
    console.error('Error fetching all roles:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data peran.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN ROLE BERDASARKAN ID ---
exports.getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id);

    if (!role) {
      return responseHandler(res, 404, 'fail', `Peran dengan ID ${id} tidak ditemukan.`);
    }

    return responseHandler(res, 200, 'success', 'Peran berhasil ditemukan.', role);
  } catch (error) {
    console.error('Error fetching role by ID:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data peran.', null, error.message);
  }
};

// --- FUNGSI UNTUK MEMPERBARUI ROLE ---
exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_name, description } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      return responseHandler(res, 404, 'fail', `Peran dengan ID ${id} tidak ditemukan.`);
    }

    // Validasi role_name jika ada perubahan
    if (role_name && role_name !== role.role_name) {
      const existingRole = await Role.findOne({ where: { role_name } });
      if (existingRole && existingRole.role_id !== id) {
        return responseHandler(res, 409, 'error', 'Nama peran sudah terdaftar untuk peran lain.', null, {
          fields: ['role_name'],
          message: 'Duplicate role name',
        });
      }
    }

    const [updatedRows] = await Role.update(
      {
        role_name: role_name || role.role_name,
        description: description,
      },
      {
        where: { role_id: id },
      }
    );

    if (updatedRows === 0) {
      return responseHandler(res, 200, 'fail', 'Tidak ada perubahan pada data peran.', null, null);
    }

    const updatedRole = await Role.findByPk(id);
    return responseHandler(res, 200, 'success', 'Peran berhasil diperbarui.', updatedRole);
  } catch (error) {
    console.error('Error updating role:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat memperbarui peran.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENGHAPUS ROLE ---
exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRows = await Role.destroy({
      where: { role_id: id },
    });

    if (deletedRows === 0) {
      return responseHandler(res, 404, 'fail', `Peran dengan ID ${id} tidak ditemukan.`);
    }

    return responseHandler(res, 200, 'success', 'Peran berhasil dihapus.');
  } catch (error) {
    console.error('Error deleting role:', error);
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return responseHandler(res, 409, 'error', 'Peran tidak dapat dihapus karena masih terkait dengan pengguna.', null, error.message);
    }
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menghapus peran.', null, error.message);
  }
};