const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');

// Route untuk mendapatkan semua log audit (dengan filter, pagination)
router.get('/', auditLogController.getAllAuditLogs);

// Route untuk mendapatkan log audit berdasarkan ID
router.get('/:id', auditLogController.getAuditLogById);

// Route untuk menghapus log audit (hati-hati, mungkin butuh autentikasi admin tingkat tinggi)
router.delete('/:id', auditLogController.deleteAuditLog);

module.exports = router;