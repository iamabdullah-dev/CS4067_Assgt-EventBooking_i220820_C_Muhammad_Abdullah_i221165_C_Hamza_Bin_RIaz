const express = require('express');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const { Booking, Payment } = require('../models');
const { publishToQueue } = require('../services/rabbitmq');

const router = express.Router();
const EVENT_SERVICE_URL = process.env.EVENT_SERVICE_URL || 'http://localhost:3002';

// Get all bookings for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const bookings = await Booking.findAll({
      where: { userId },
      include: [{ model: Payment, as: 'payment' }],
      order: [['createdAt', 'DESC']],
    });
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get booking by ID
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Payment, as: 'payment' }],
    });
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new booking
router.post(
  '/',
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('eventId').notEmpty().withMessage('Event ID is required'),
    body('tickets').isInt({ min: 1 }).withMessage('At least 1 ticket is required'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { userId, eventId, tickets, paymentMethod } = req.body;
      
      // Check event availability
      try {
        const availabilityResponse = await axios.get(
          `${EVENT_SERVICE_URL}/api/events/${eventId}/availability?tickets=${tickets}`
        );
        
        const { isAvailable } = availabilityResponse.data;
        
        if (!isAvailable) {
          return res.status(400).json({ message: 'Not enough tickets available' });
        }
      } catch (error) {
        console.error('Error checking event availability:', error);
        return res.status(500).json({ message: 'Error communicating with Event Service' });
      }
      
      // Get event details to calculate total amount
      const eventResponse = await axios.get(`${EVENT_SERVICE_URL}/api/events/${eventId}`);
      const event = eventResponse.data;
      
      const totalAmount = event.price * tickets;
      
      // Create booking
      const booking = await Booking.create({
        userId,
        eventId,
        tickets,
        totalAmount,
        status: 'pending',
      });
      
      // Process payment
      if (paymentMethod) {
        try {
          // Mock payment processing
          const payment = await Payment.create({
            bookingId: booking.id,
            amount: totalAmount,
            paymentMethod,
            status: 'pending',
            transactionId: `TXN${Date.now()}`,
          });
          
          // Mock payment gateway call
          const paymentResult = await processPayment(payment);
          
          if (paymentResult.success) {
            // Update payment status
            await payment.update({ status: 'completed' });
            
            // Update booking status
            await booking.update({ status: 'confirmed' });
            
            // Reserve tickets in the event service
            await axios.post(`${EVENT_SERVICE_URL}/api/events/${eventId}/reserve`, {
              tickets,
            });
            
            // Publish notification event to RabbitMQ
            try {
              await publishToQueue('booking_confirmed', {
                booking_id: booking.id,
                user_id: userId,
                event_id: eventId,
                event_name: event.title,
                tickets,
                total_amount: totalAmount,
                status: 'CONFIRMED',
              });
              
              console.log('Booking confirmation message published to queue');
            } catch (mqError) {
              console.error('Error publishing to RabbitMQ:', mqError);
              // Continue execution even if notification fails
            }
          } else {
            // Payment failed
            await payment.update({ status: 'failed' });
            await booking.update({ status: 'cancelled' });
          }
        } catch (paymentError) {
          console.error('Payment processing error:', paymentError);
          await booking.update({ status: 'cancelled' });
          return res.status(500).json({ message: 'Payment processing failed' });
        }
      }
      
      // Fetch the updated booking with payment info
      const updatedBooking = await Booking.findByPk(booking.id, {
        include: [{ model: Payment, as: 'payment' }],
      });
      
      res.status(201).json(updatedBooking);
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Cancel a booking
router.post('/:id/cancel', async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Payment, as: 'payment' }],
    });
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }
    
    // Update booking status
    await booking.update({ status: 'cancelled' });
    
    // If payment was completed, process refund (mock)
    if (booking.payment && booking.payment.status === 'completed') {
      // Mock refund process
      console.log(`Processing refund for booking ${booking.id}`);
    }
    
    // Publish notification event to RabbitMQ
    try {
      await publishToQueue('booking_cancelled', {
        booking_id: booking.id,
        user_id: booking.userId,
        event_id: booking.eventId,
        status: 'CANCELLED',
      });
      
      console.log('Booking cancellation message published to queue');
    } catch (mqError) {
      console.error('Error publishing to RabbitMQ:', mqError);
      // Continue execution even if notification fails
    }
    
    res.json({
      message: 'Booking cancelled successfully',
      booking,
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mock payment processing function
async function processPayment(payment) {
  return new Promise((resolve) => {
    // Simulate payment processing delay
    setTimeout(() => {
      // 90% success rate for demo purposes
      const success = Math.random() < 0.9;
      
      resolve({
        success,
        transactionId: payment.transactionId,
        message: success ? 'Payment processed successfully' : 'Payment failed',
      });
    }, 1000);
  });
}

module.exports = router; 