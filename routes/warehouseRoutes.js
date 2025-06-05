const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');

// Route untuk membuat gudang baru
router.post('/', warehouseController.createWarehouse);

// Route untuk mendapatkan semua gudang
router.get('/', warehouseController.getAllWarehouses);

// Route untuk mendapatkan gudang berdasarkan ID
router.get('/:id', warehouseController.getWarehouseById);

// Route untuk memperbarui gudang berdasarkan ID
router.put('/:id', warehouseController.updateWarehouse);

// Route untuk menghapus gudang berdasarkan ID
router.delete('/:id', warehouseController.deleteWarehouse);

module.exports = router;