const express = require('express');
const { body, validationResult } = require('express-validator');
const { Payment } = require('../models');

const router = express.Router();

// Mock payment gateway endpoint
router.post(
  '/',
  [
    body('user_id').notEmpty().withMessage('User ID is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('payment_method').notEmpty().withMessage('Payment method is required'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { user_id, amount, payment_method, booking_id } = req.body;
      
      // Simulate payment processing
      const success = Math.random() < 0.9; // 90% success rate for demo
      const transactionId = `TXN${Date.now()}`;
      
      // Create a payment record if booking_id is provided
      if (booking_id) {
        await Payment.create({
          bookingId: booking_id,
          amount,
          paymentMethod: payment_method,
          status: success ? 'completed' : 'failed',
          transactionId,
        });
      }
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (success) {
        res.json({
          success: true,
          transaction_id: transactionId,
          user_id,
          amount,
          payment_method,
          status: 'completed',
          message: 'Payment processed successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          transaction_id: transactionId,
          user_id,
          amount,
          payment_method,
          status: 'failed',
          message: 'Payment processing failed',
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get payment by ID
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 