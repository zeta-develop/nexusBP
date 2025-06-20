const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // listUsers is here
const subscriptionController = require('../controllers/subscriptionController'); // For existing route
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all user routes
router.use(authMiddleware);

// GET /api/users - List all users (Admin only)
// This should be defined BEFORE routes with parameters like /:userId if they could conflict.
// In this case, GET / and GET /:userId/subscriptions are distinct.
router.get('/', authController.listUsers);

// GET /api/users/:userId/subscriptions
router.get('/:userId/subscriptions', subscriptionController.getSubscriptions);

module.exports = router;
