const amqp = require('amqplib');

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

// Publish a message to a queue
async function publishToQueue(queueName, message) {
  try {
    if (!channel) {
      channel = await connectToRabbitMQ();
    }
    
    return channel.sendToQueue(
      queueName,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  } catch (error) {
    console.error(`Error publishing to queue ${queueName}:`, error);
    throw error;
  }
}

// Initialize connection
connectToRabbitMQ();

module.exports = {
  publishToQueue,
}; 