const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['booking_confirmation', 'booking_cancellation', 'event_reminder', 'system'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  sentViaEmail: {
    type: Boolean,
    default: false,
  },
  emailStatus: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'not_applicable'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 