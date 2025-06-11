const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Route untuk mendaftar/membuat pengguna baru
router.post('/register', userController.createUser); // Bisa juga router.post('/', userController.createUser)

// Route untuk login pengguna
router.post('/login', userController.loginUser);

// Route untuk mendapatkan semua pengguna (mungkin hanya untuk admin)
router.get('/', userController.getAllUsers);

// Route untuk mendapatkan pengguna berdasarkan ID
router.get('/:id', userController.getUserById);

// Route untuk memperbarui pengguna berdasarkan ID
router.put('/:id', userController.updateUser);

// Route untuk menghapus pengguna berdasarkan ID (mungkin hanya untuk admin)
router.delete('/:id', userController.deleteUser);

module.exports = router;