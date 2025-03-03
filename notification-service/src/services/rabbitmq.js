const amqp = require('amqplib');
const { processBookingConfirmation, processBookingCancellation } = require('./notificationProcessor');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
let channel = null;

// Connect to RabbitMQ and create a channel
async function connectToRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    
    // Ensure queues exist
    await channel.assertQueue('booking_confirmed', { durable: true });
    await channel.assertQueue('booking_cancelled', { durable: true });
    
    console.log('Connected to RabbitMQ');
    
    // Set up consumers
    await consumeBookingConfirmations();
    await consumeBookingCancellations();
    
    // Handle connection close
    connection.on('close', () => {
      console.log('RabbitMQ connection closed, attempting to reconnect...');
      setTimeout(connectToRabbitMQ, 5000);
    });
    
    return channel;
  } catch (error) {
    console.error('RabbitMQ connection error:', error);
    console.log('Retrying in 5 seconds...');
    setTimeout(connectToRabbitMQ, 5000);
  }
}

// Consume booking confirmation messages
async function consumeBookingConfirmations() {
  try {
    if (!channel) {
      channel = await connectToRabbitMQ();
    }
    
    channel.consume('booking_confirmed', async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          console.log('Received booking confirmation:', content);
          
          // Process the booking confirmation
          await processBookingConfirmation(content);
          
          // Acknowledge the message
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing booking confirmation:', error);
          // Reject the message and requeue
          channel.nack(msg, false, true);
        }
      }
    });
    
    console.log('Consuming booking confirmations');
  } catch (error) {
    console.error('Error setting up booking confirmation consumer:', error);
    throw error;
  }
}

// Consume booking cancellation messages
async function consumeBookingCancellations() {
  try {
    if (!channel) {
      channel = await connectToRabbitMQ();
    }
    
    channel.consume('booking_cancelled', async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          console.log('Received booking cancellation:', content);
          
          // Process the booking cancellation
          await processBookingCancellation(content);
          
          // Acknowledge the message
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing booking cancellation:', error);
          // Reject the message and requeue
          channel.nack(msg, false, true);
        }
      }
    });
    
    console.log('Consuming booking cancellations');
  } catch (error) {
    console.error('Error setting up booking cancellation consumer:', error);
    throw error;
  }
}

module.exports = {
  connectToRabbitMQ,
}; 