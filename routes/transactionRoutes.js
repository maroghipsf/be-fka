const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Route untuk membuat Transaksi baru beserta entri-nya
router.post('/', transactionController.createTransaction);

// Route untuk mendapatkan semua Transaksi (dengan filter, pagination)
router.get('/', transactionController.getAllTransactions);

// Route untuk mendapatkan Transaksi berdasarkan ID
router.get('/:id', transactionController.getTransactionById);

// Route untuk memperbarui Transaksi (header dan entri)
router.put('/:id', transactionController.updateTransaction);

// Route untuk menghapus Transaksi (header dan entri)
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;