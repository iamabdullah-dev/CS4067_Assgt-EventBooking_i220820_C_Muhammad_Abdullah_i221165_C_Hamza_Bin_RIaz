const Notification = require('../models/notification');
const { sendEmail } = require('./emailService');

// Process booking confirmation
async function processBookingConfirmation(data) {
  try {
    const {
      booking_id,
      user_id,
      event_id,
      event_name,
      tickets,
      total_amount,
      status,
    } = data;
    
    // Create notification record
    const notification = new Notification({
      userId: user_id,
      type: 'booking_confirmation',
      title: 'Booking Confirmed',
      message: `Your booking for ${event_name} has been confirmed. Booking reference: ${booking_id}`,
      metadata: {
        bookingId: booking_id,
        eventId: event_id,
        eventName: event_name,
        tickets,
        totalAmount: total_amount,
        status,
      },
    });
    
    await notification.save();
    console.log(`Created notification for booking ${booking_id}`);
    
    // Send email notification
    try {
      const emailResult = await sendEmail({
        to: 'user@example.com', // In a real app, fetch user email from user service
        subject: 'Booking Confirmation',
        text: `Your booking for ${event_name} has been confirmed. You have purchased ${tickets} ticket(s) for a total of $${total_amount}. Your booking reference is ${booking_id}.`,
        html: `
          <h1>Booking Confirmation</h1>
          <p>Your booking for <strong>${event_name}</strong> has been confirmed.</p>
          <p>You have purchased <strong>${tickets} ticket(s)</strong> for a total of <strong>$${total_amount}</strong>.</p>
          <p>Your booking reference is <strong>${booking_id}</strong>.</p>
          <p>Thank you for your purchase!</p>
        `,
      });
      
      // Update notification with email status
      notification.sentViaEmail = true;
      notification.emailStatus = 'sent';
      await notification.save();
      
      console.log(`Sent email notification for booking ${booking_id}`);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      
      // Update notification with email failure
      notification.emailStatus = 'failed';
      await notification.save();
    }
    
    return notification;
  } catch (error) {
    console.error('Error processing booking confirmation:', error);
    throw error;
  }
}

// Process booking cancellation
async function processBookingCancellation(data) {
  try {
    const {
      booking_id,
      user_id,
      event_id,
      status,
    } = data;
    
    // Create notification record
    const notification = new Notification({
      userId: user_id,
      type: 'booking_cancellation',
      title: 'Booking Cancelled',
      message: `Your booking (${booking_id}) has been cancelled.`,
      metadata: {
        bookingId: booking_id,
        eventId: event_id,
        status,
      },
    });
    
    await notification.save();
    console.log(`Created notification for cancelled booking ${booking_id}`);
    
    // Send email notification
    try {
      const emailResult = await sendEmail({
        to: 'user@example.com', // In a real app, fetch user email from user service
        subject: 'Booking Cancellation',
        text: `Your booking (${booking_id}) has been cancelled.`,
        html: `
          <h1>Booking Cancellation</h1>
          <p>Your booking with reference <strong>${booking_id}</strong> has been cancelled.</p>
          <p>If you did not request this cancellation, please contact our support team.</p>
        `,
      });
      
      // Update notification with email status
      notification.sentViaEmail = true;
      notification.emailStatus = 'sent';
      await notification.save();
      
      console.log(`Sent email notification for cancelled booking ${booking_id}`);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      
      // Update notification with email failure
      notification.emailStatus = 'failed';
      await notification.save();
    }
    
    return notification;
  } catch (error) {
    console.error('Error processing booking cancellation:', error);
    throw error;
  }
}

module.exports = {
  processBookingConfirmation,
  processBookingCancellation,
}; 