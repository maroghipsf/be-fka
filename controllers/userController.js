const responseHandler = require('../utils/responseHandler');
const { User, Role } = require('../models'); // Pastikan path ini benar
const bcrypt = require('bcryptjs'); // Untuk hashing password
const { Op } = require('sequelize'); // Untuk operator Sequelize, jika diperlukan
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

const generateToken = (user_id, role_name) => {
    return jwt.sign({ id: user_id, role: role_name }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
};

// --- FUNGSI UNTUK MENDAFTARKAN PENGGUNA BARU (atau Create User oleh Admin) ---
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, role_id } = req.body;

    // --- Validasi Input Wajib ---
    if (!username || !email || !password || !role_id) {
      return responseHandler(res, 400, 'error', 'Username, email, password, dan role wajib diisi.', null, {
        fields: ['username', 'email', 'password', 'role_id'],
        message: 'Missing required fields',
      });
    }

    // --- Validasi Format Email Sederhana ---
    if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
        return responseHandler(res, 400, 'error', 'Format email tidak valid.', null, {
            fields: ['email'],
            message: 'Invalid email format',
        });
    }

    // --- Cek apakah username atau email sudah terdaftar ---
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    });

    if (existingUser) {
      const field = existingUser.username === username ? 'username' : 'email';
      return responseHandler(res, 409, 'error', `${field} sudah terdaftar.`, null, {
        fields: [field],
        message: `Duplicate ${field}`,
      });
    }

    // --- Cek keberadaan Role ---
    const role = await Role.findByPk(role_id);
    if (!role) {
      return responseHandler(res, 404, 'fail', `Role dengan ID ${role_id} tidak ditemukan.`, null, {
        fields: ['role_id'],
        message: 'Role not found',
      });
    }

    // --- Hashing Password ---
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username,
      email,
      password_hash: hashedPassword, // Simpan password yang sudah di-hash ke kolom password_hash
      role_id,
    });

    // Jangan kirim password yang di-hash di response
    const userResponse = { ...newUser.toJSON() };
    delete userResponse.password;
    // Generate token for the newly created user (optional, usually only for login)
    // const token = generateToken(newUser.user_id, role.role_name); // Uncomment if auto-login after register is desired
    return responseHandler(res, 201, 'success', 'Pengguna berhasil ditambahkan.', userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menambahkan pengguna.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN SEMUA PENGGUNA ---
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }, // Jangan ambil kolom password
      include: [
        {
          model: Role,
          as: 'role', // Sesuai dengan alias di model User
          attributes: ['role_id', 'role_name'], // Ambil data role yang relevan
        },
      ],
    });

    if (!users || users.length === 0) {
      return responseHandler(res, 404, 'fail', 'Tidak ada data pengguna ditemukan.');
    }

    return responseHandler(res, 200, 'success', 'Data pengguna berhasil ditemukan.', users);
  } catch (error) {
    console.error('Error fetching all users:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data pengguna.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN PENGGUNA BERDASARKAN ID ---
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params; // ID pengguna dari URL parameter

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }, // Jangan ambil kolom password
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['role_id', 'role_name'],
        },
      ],
    });

    if (!user) {
      return responseHandler(res, 404, 'fail', `Pengguna dengan ID ${id} tidak ditemukan.`);
    }

    return responseHandler(res, 200, 'success', 'Pengguna berhasil ditemukan.', user);
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil data pengguna.', null, error.message);
  }
};

// --- FUNGSI UNTUK MEMPERBARUI PENGGUNA ---
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, role_id } = req.body;

    // Cari pengguna berdasarkan ID
    const user = await User.findByPk(id);
    if (!user) {
      return responseHandler(res, 404, 'fail', `Pengguna dengan ID ${id} tidak ditemukan.`);
    }

    // Validasi email jika ada perubahan
    if (email && email !== user.email) {
      if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
        return responseHandler(res, 400, 'error', 'Format email tidak valid.', null, {
            fields: ['email'],
            message: 'Invalid email format',
        });
      }
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail && existingEmail.user_id !== id) {
        return responseHandler(res, 409, 'error', 'Email sudah terdaftar untuk pengguna lain.', null, {
          fields: ['email'],
          message: 'Duplicate email',
        });
      }
    }

    // Validasi username jika ada perubahan
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ where: { username } });
      if (existingUsername && existingUsername.user_id !== id) {
        return responseHandler(res, 409, 'error', 'Username sudah terdaftar untuk pengguna lain.', null, {
          fields: ['username'],
          message: 'Duplicate username',
        });
      }
    }

    // Cek keberadaan Role jika role_id diubah
    if (role_id && role_id !== user.role_id) {
        const role = await Role.findByPk(role_id);
        if (!role) {
            return responseHandler(res, 404, 'fail', `Role dengan ID ${role_id} tidak ditemukan.`, null, {
                fields: ['role_id'],
                message: 'Role not found',
            });
        }
    }

    let hashedPassword;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // Update data pengguna
    const [updatedRows] = await User.update(
      {
        username: username || user.username,
        email: email || user.email,
        password: hashedPassword || user.password, // Update password jika ada, jika tidak, gunakan yang lama
        role_id: role_id || user.role_id,
      },
      {
        where: { user_id: id },
      }
    );

    if (updatedRows === 0) {
      return responseHandler(res, 200, 'fail', 'Tidak ada perubahan pada data pengguna.', null, null);
    }

    // Ambil data pengguna terbaru setelah update (tanpa password)
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['role_id', 'role_name'],
        },
      ],
    });
    return responseHandler(res, 200, 'success', 'Pengguna berhasil diperbarui.', updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat memperbarui pengguna.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENGHAPUS PENGGUNA ---
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRows = await User.destroy({
      where: { user_id: id },
    });

    if (deletedRows === 0) {
      return responseHandler(res, 404, 'fail', `Pengguna dengan ID ${id} tidak ditemukan.`);
    }

    return responseHandler(res, 200, 'success', 'Pengguna berhasil dihapus.');
  } catch (error) {
    console.error('Error deleting user:', error);
    // Tambahkan penanganan spesifik jika ada Foreign Key constraint error
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return responseHandler(res, 409, 'error', 'Pengguna tidak dapat dihapus karena masih terkait dengan data atau transaksi lain.', null, error.message);
    }
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menghapus pengguna.', null, error.message);
  }
};

// --- FUNGSI UNTUK LOGIN PENGGUNA (Basis, perlu JWT untuk otentikasi penuh) ---
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return responseHandler(res, 400, 'error', 'Email dan password wajib diisi.');
        }
        const user = await User.findOne({
            where: { email },
            include: [
                {
                    model: Role,
                    as: 'role',
                    attributes: ['role_id', 'role_name'],
                },
            ],
        });
        if (!user) {
            return responseHandler(res, 401, 'fail', 'Email atau password salah.');
        }
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return responseHandler(res, 401, 'fail', 'Email atau password salah.');
        }
        // --- Generate JWT Token ---
        const token = generateToken(user.user_id, user.role.role_name);
        // Jangan kirim password di response
        const userResponse = { ...user.toJSON() };
        delete userResponse.password_hash;
        return responseHandler(res, 200, 'success', 'Login berhasil.', { user: userResponse, token });
    } catch (error) {
        console.error('Error during user login:', error);
        return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat login.', null, error.message);
    }
};