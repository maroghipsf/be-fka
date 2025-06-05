const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');

// Route untuk membuat role baru
router.post('/', roleController.createRole);

// Route untuk mendapatkan semua role
router.get('/', roleController.getAllRoles);

// Route untuk mendapatkan role berdasarkan ID
router.get('/:id', roleController.getRoleById);

// Route untuk memperbarui role berdasarkan ID
router.put('/:id', roleController.updateRole);

// Route untuk menghapus role berdasarkan ID
router.delete('/:id', roleController.deleteRole);

module.exports = router;