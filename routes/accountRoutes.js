// routes/accountRoutes.js

const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');

// Route untuk membuat akun baru
router.post('/', accountController.createAccount);

// Route untuk mendapatkan semua akun
router.get('/', accountController.getAllAccounts);

// Route untuk mendapatkan akun berdasarkan ID
router.get('/:id', accountController.getAccountById);

// Route untuk memperbarui akun berdasarkan ID
router.put('/:id', accountController.updateAccount);

// Route untuk menghapus akun berdasarkan ID
router.delete('/:id', accountController.deleteAccount);

module.exports = router;