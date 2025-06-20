const express = require('express');
const router = express.Router();
const licenseController = require('../controllers/licenseController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all license routes
router.use(authMiddleware);

// CRUD operations
router.post('/', licenseController.createLicense); // Create (Admins)
router.get('/', licenseController.getLicenses); // Read (Admins all, users their own)
router.get('/:id', licenseController.getLicenseById); // Read specific (Admin or owner)
router.put('/:id', licenseController.updateLicense); // Update (Admins)
router.delete('/:id', licenseController.deleteLicense); // Delete (Admins)

// License validation route - can have different auth needs, maybe a specific API key later
// For now, let's keep it under the same user auth for simplicity of this step
router.post('/validate', licenseController.validateLicense);


module.exports = router;
