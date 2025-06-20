const express = require('express');
const router = express.Router();
const paymentRoutes = require('./paymentRoutes');
const userRoutes = require('./userRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');
const licenseRoutes = require('./licenseRoutes');
const authRoutes = require('./authRoutes');
router.use('/auth', authRoutes);
router.use('/licenses', licenseRoutes); // Corrected line
router.use('/subscriptions', subscriptionRoutes); // Added subscription routes
router.use('/users', userRoutes); // Added user routes for user-specific subscriptions
router.use('/payments', paymentRoutes); // Added payment routes

// Test route
router.get('/ping', (req, res) => {
  res.status(200).json({ message: 'pong' });
});

module.exports = router;
