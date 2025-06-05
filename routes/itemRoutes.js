// routes/itemRoutes.js

const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

// Route untuk membuat item baru
router.post('/', itemController.createItem);

// Route untuk mendapatkan semua item
router.get('/', itemController.getAllItems);

// Route untuk mendapatkan item berdasarkan ID
router.get('/:id', itemController.getItemById);

// Route untuk memperbarui item berdasarkan ID
router.put('/:id', itemController.updateItem);

// Route untuk menghapus item berdasarkan ID
router.delete('/:id', itemController.deleteItem);

module.exports = router;