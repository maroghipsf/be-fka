const express = require('express');
const router = express.Router();
const interestConfigurationController = require('../controllers/interestConfigurationController');
const authMiddleware = require('../middleware/authMiddleware'); // Import middleware

// --- SEMUA ROUTE INI AKAN DILINDUNGI OLEH AUTHENTIKASI ---
// Konfigurasi bunga biasanya hanya diakses oleh admin atau peran tertentu
router.post('/', authMiddleware.authenticateToken, interestConfigurationController.createInterestConfiguration);
router.get('/', authMiddleware.authenticateToken, interestConfigurationController.getAllInterestConfigurations);
router.get('/:id', authMiddleware.authenticateToken, interestConfigurationController.getInterestConfigurationById);
router.put('/:id', authMiddleware.authenticateToken, interestConfigurationController.updateInterestConfiguration);
router.delete('/:id', authMiddleware.authenticateToken, interestConfigurationController.deleteInterestConfiguration);

module.exports = router;