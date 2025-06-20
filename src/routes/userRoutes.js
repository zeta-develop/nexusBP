const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController'); // Assuming we want to use the same controller
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware
router.use(authMiddleware);

// GET /api/users/:userId/subscriptions
router.get('/:userId/subscriptions', subscriptionController.getSubscriptions);

module.exports = router;
