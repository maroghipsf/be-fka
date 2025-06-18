const express = require('express');
const router = express.Router();
const woController = require('../controllers/workOrderController');

// Route untuk membuat WO baru
router.post('/', woController.createWorkOrder);
router.get('/:idPO', woController.getAllWorkOrdersByIdPO);

module.exports = router;