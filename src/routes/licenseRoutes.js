const express = require('express');
const router = express.Router();
const licenseController = require('../controllers/licenseController');
const authMiddleware = require('../middleware/authMiddleware');

// --- Public Routes ---
// License validation route - NO authMiddleware here
router.post('/validate', licenseController.validateLicense);

// --- Protected Routes ---
// Apply auth middleware for all subsequent routes in this router instance
// or apply individually. For simplicity of change, let's apply to each.

// CRUD operations - Apply authMiddleware individually
router.post('/', authMiddleware, licenseController.createLicense);
router.get('/', authMiddleware, licenseController.getLicenses);
router.get('/:id', authMiddleware, licenseController.getLicenseById);
router.put('/:id', authMiddleware, licenseController.updateLicense);
router.delete('/:id', authMiddleware, licenseController.deleteLicense);

module.exports = router;
