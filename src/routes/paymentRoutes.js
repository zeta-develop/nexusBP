const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware'); // For routes that need user auth

// POST /api/payments/initiate - User initiates a payment (needs auth)
router.post('/initiate', authMiddleware, paymentController.initiatePayment);

// POST /api/payments/webhook - Payment provider sends notifications (typically no user JWT auth, but signature verification)
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
