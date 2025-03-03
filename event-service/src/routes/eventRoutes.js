const express = require('express');
const { body, validationResult } = require('express-validator');
const Event = require('../models/event');

const router = express.Router();

// Get all events
router.get('/', async (req, res) => {
  try {
    const { category, featured, search } = req.query;
    
    // Build filter object
    const filter = {};
    if (category) filter.category = category;
    if (featured === 'true') filter.featured = true;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }
    
    const events = await Event.find(filter).sort({ date: 1 });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check event availability
router.get('/:id/availability', async (req, res) => {
  try {
    const { tickets } = req.query;
    const requestedTickets = parseInt(tickets) || 1;
    
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const isAvailable = event.checkAvailability(requestedTickets);
    
    res.json({
      eventId: event._id,
      availableTickets: event.availableTickets,
      requestedTickets,
      isAvailable,
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new event (admin only)
router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('location').notEmpty().withMessage('Location is required'),
    body('category').isIn(['conference', 'workshop', 'concert', 'sports', 'other']).withMessage('Valid category is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('totalTickets').isInt({ min: 1 }).withMessage('Total tickets must be at least 1'),
    body('organizer').notEmpty().withMessage('Organizer is required'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const {
        title,
        description,
        date,
        location,
        category,
        price,
        totalTickets,
        image,
        organizer,
        featured,
      } = req.body;
      
      const event = new Event({
        title,
        description,
        date,
        location,
        category,
        price,
        totalTickets,
        availableTickets: totalTickets, // Initially all tickets are available
        image,
        organizer,
        featured,
      });
      
      await event.save();
      
      res.status(201).json(event);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update event (admin only)
router.put('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const {
      title,
      description,
      date,
      location,
      category,
      price,
      totalTickets,
      availableTickets,
      image,
      organizer,
      featured,
    } = req.body;
    
    // Update fields if provided
    if (title) event.title = title;
    if (description) event.description = description;
    if (date) event.date = date;
    if (location) event.location = location;
    if (category) event.category = category;
    if (price !== undefined) event.price = price;
    if (totalTickets) event.totalTickets = totalTickets;
    if (availableTickets !== undefined) event.availableTickets = availableTickets;
    if (image) event.image = image;
    if (organizer) event.organizer = organizer;
    if (featured !== undefined) event.featured = featured;
    
    await event.save();
    
    res.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reserve tickets for an event
router.post('/:id/reserve', async (req, res) => {
  try {
    const { tickets } = req.body;
    const requestedTickets = parseInt(tickets);
    
    if (!requestedTickets || requestedTickets < 1) {
      return res.status(400).json({ message: 'Invalid number of tickets' });
    }
    
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    if (!event.checkAvailability(requestedTickets)) {
      return res.status(400).json({ message: 'Not enough tickets available' });
    }
    
    await event.reserveTickets(requestedTickets);
    
    res.json({
      message: 'Tickets reserved successfully',
      eventId: event._id,
      reservedTickets: requestedTickets,
      remainingTickets: event.availableTickets,
    });
  } catch (error) {
    console.error('Error reserving tickets:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 