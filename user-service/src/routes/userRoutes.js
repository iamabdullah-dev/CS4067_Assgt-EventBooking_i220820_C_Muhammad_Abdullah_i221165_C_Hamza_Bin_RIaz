const express = require('express');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    
    await user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get events (communicating with Event Service)
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const eventServiceUrl = process.env.EVENT_SERVICE_URL || 'http://localhost:3002';
    const response = await axios.get(`${eventServiceUrl}/api/events`);
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Error communicating with Event Service' });
  }
});

// Create a booking (communicating with Booking Service)
router.post('/bookings', authenticateToken, async (req, res) => {
  try {
    const { event_id, tickets } = req.body;
    const bookingServiceUrl = process.env.BOOKING_SERVICE_URL || 'http://localhost:3003';
    
    const response = await axios.post(`${bookingServiceUrl}/api/bookings`, {
      user_id: req.user.id,
      event_id,
      tickets,
    });
    
    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error creating booking:', error);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(500).json({ message: 'Error communicating with Booking Service' });
  }
});

module.exports = router; 