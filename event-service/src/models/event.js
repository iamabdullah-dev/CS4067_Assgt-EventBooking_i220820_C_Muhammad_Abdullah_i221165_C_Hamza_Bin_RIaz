const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['conference', 'workshop', 'concert', 'sports', 'other'],
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  totalTickets: {
    type: Number,
    required: true,
    min: 1,
  },
  availableTickets: {
    type: Number,
    required: true,
    min: 0,
  },
  image: {
    type: String,
    default: 'https://via.placeholder.com/300',
  },
  organizer: {
    type: String,
    required: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Virtual for checking if event is sold out
eventSchema.virtual('isSoldOut').get(function() {
  return this.availableTickets === 0;
});

// Method to check ticket availability
eventSchema.methods.checkAvailability = function(requestedTickets) {
  return this.availableTickets >= requestedTickets;
};

// Method to reserve tickets
eventSchema.methods.reserveTickets = function(ticketsToReserve) {
  if (this.availableTickets < ticketsToReserve) {
    throw new Error('Not enough tickets available');
  }
  
  this.availableTickets -= ticketsToReserve;
  return this.save();
};

const Event = mongoose.model('Event', eventSchema);

module.exports = Event; 