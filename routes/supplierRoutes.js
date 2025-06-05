const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');

// Route untuk membuat pemasok baru
router.post('/', supplierController.createSupplier);

// Route untuk mendapatkan semua pemasok
router.get('/', supplierController.getAllSuppliers);

// Route untuk mendapatkan pemasok berdasarkan ID
router.get('/:id', supplierController.getSupplierById);

// Route untuk memperbarui pemasok berdasarkan ID
router.put('/:id', supplierController.updateSupplier);

// Route untuk menghapus pemasok berdasarkan ID
router.delete('/:id', supplierController.deleteSupplier);

module.exports = router;