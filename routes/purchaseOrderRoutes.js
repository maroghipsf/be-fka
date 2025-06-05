const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');
const authMiddleware = require('../middleware/authMiddleware'); // Import middleware

// Route untuk membuat Purchase Order baru beserta entri-nya
router.post('/', purchaseOrderController.createPurchaseOrder);

// Route untuk mendapatkan semua Purchase Order (dengan filter, pagination)
router.get('/', purchaseOrderController.getAllPurchaseOrders);

// Route untuk mendapatkan Purchase Order berdasarkan ID
router.get('/:id', purchaseOrderController.getPurchaseOrderById);

// Route untuk memperbarui Purchase Order (header dan entri)
router.put('/:id', purchaseOrderController.updatePurchaseOrder);

// Route untuk menghapus Purchase Order (header dan entri)
router.delete('/:id', purchaseOrderController.deletePurchaseOrder);

// --- Route Baru: Untuk mencatat pembayaran Purchase Order ---
router.post('/:id/pay', authMiddleware.authenticateToken, purchaseOrderController.payPurchaseOrder);

module.exports = router;