const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Transfer Dana (Pokok + Opsional Bunga)
router.post('/transfer', transactionController.transferFunds);

// Get All Transfers
router.get('/', transactionController.getAllTransfers);

// Get Transfer Detail by ID
router.get('/:id', transactionController.getTransferDetail);

module.exports = router;
