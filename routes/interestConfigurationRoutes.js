const express = require('express');
const router = express.Router();
const interestConfigurationController = require('../controllers/interestConfigurationController');
const authMiddleware = require('../middleware/authMiddleware'); // Import middleware

// --- SEMUA ROUTE INI AKAN DILINDUNGI OLEH AUTHENTIKASI ---
// Konfigurasi bunga biasanya hanya diakses oleh admin atau peran tertentu
router.post('/', interestConfigurationController.createInterestConfiguration);
router.get('/', interestConfigurationController.getAllInterestConfigurations);
router.get('/:id', interestConfigurationController.getInterestConfigurationById);
router.put('/:id', interestConfigurationController.updateInterestConfiguration);
router.delete('/:id', interestConfigurationController.deleteInterestConfiguration);

module.exports = router;