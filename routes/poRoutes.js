const express = require('express');
const router = express.Router();
const poController = require('../controllers/poController');

// Route untuk membuat PO baru
router.post('/', poController.createPO);

// Route untuk mendapatkan semua PO
router.get('/', poController.getAllPO);

// Route untuk mendapatkan PO berdasarkan ID
router.get('/:id', poController.getPOById);

module.exports = router;