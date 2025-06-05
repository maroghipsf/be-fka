const express = require('express');
const router = express.Router();
const taxConfigurationController = require('../controllers/taxConfigurationController');
const authMiddleware = require('../middleware/authMiddleware'); // Import middleware

// --- SEMUA ROUTE INI AKAN DILINDUNGI OLEH AUTHENTIKASI ---
// Konfigurasi pajak biasanya hanya diakses oleh admin atau peran tertentu
router.post('/', authMiddleware.authenticateToken, taxConfigurationController.createTaxConfiguration);
router.get('/', authMiddleware.authenticateToken, taxConfigurationController.getAllTaxConfigurations);
router.get('/:id', authMiddleware.authenticateToken, taxConfigurationController.getTaxConfigurationById);
router.put('/:id', authMiddleware.authenticateToken, taxConfigurationController.updateTaxConfiguration);
router.delete('/:id', authMiddleware.authenticateToken, taxConfigurationController.deleteTaxConfiguration);

module.exports = router;