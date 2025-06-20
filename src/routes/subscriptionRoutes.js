const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all subscription routes
router.use(authMiddleware);

router.post('/', subscriptionController.createSubscription);
// Route for a user to get their own subscriptions
router.get('/mine', subscriptionController.getSubscriptions);
// Route for an admin to get all subscriptions (if no other general GET / is defined)
// Or, could be GET / if logic in controller differentiates admin from user
router.get('/', subscriptionController.getSubscriptions); // Admins get all, users get their own (handled in controller)


// This route should be specific for fetching by user ID, typically by an admin
// It's better to have distinct routes for clarity, or very clear logic in controller.
// router.get('/user/:userId', subscriptionController.getSubscriptionsByUserId); // Example of a more specific route

router.put('/:subscriptionId', subscriptionController.updateSubscription);

module.exports = router;
