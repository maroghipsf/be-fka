const express = require('express');
const router = express.Router();
const workOrderController = require('../controllers/workOrderController');

// Route untuk membuat Work Order baru beserta entri dan biaya-nya
router.post('/', workOrderController.createWorkOrder);

// Route untuk mendapatkan semua Work Order (dengan filter, pagination)
router.get('/', workOrderController.getAllWorkOrders);

// Route untuk mendapatkan Work Order berdasarkan ID
router.get('/:id', workOrderController.getWorkOrderById);

// Route untuk memperbarui Work Order (header, entri, dan biaya)
router.put('/:id', workOrderController.updateWorkOrder);

// Route untuk menghapus Work Order (header, entri, dan biaya)
router.delete('/:id', workOrderController.deleteWorkOrder);

module.exports = router;