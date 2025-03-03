const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const API_URL = 'http://localhost:3003/api'; // Booking service URL
const EVENT_SERVICE_URL = 'http://localhost:3002/api'; // Event service URL
const USER_SERVICE_URL = 'http://localhost:3001/api'; // User service URL

// Configuration
const CONFIG = {
  concurrentUsers: 5,     // Number of concurrent users
  requestsPerUser: 3,     // Number of bookings each user will attempt
  delayBetweenRequests: 500, // Milliseconds between requests for each user
  verbose: true           // Whether to log detailed information
};

// Test data
const testUsers = [];
let eventId = '';

// Statistics
const stats = {
  startTime: null,
  endTime: null,
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimeTotal: 0,
  responseTimeMin: Number.MAX_SAFE_INTEGER,
  responseTimeMax: 0,
  errors: {}
};

// Create a test user
async function createTestUser(index) {
  try {
    const email = `loadtest${Date.now()}_${index}@example.com`;
    const userData = {
      name: `Load Test User ${index}`,
      email: email,
      password: 'password123',
      phone: `123456789${index}`
    };
    
    const response = await axios.post(`${USER_SERVICE_URL}/auth/register`, userData);
    
    return {
      id: response.data.user.id,
      email: email,
      token: response.data.token
    };
  } catch (error) {
    console.error(`Failed to create test user ${index}:`, error.response ? error.response.data : error.message);
    return null;
  }
}

// Find or create a test event
async function setupTestEvent(authToken) {
  try {
    // Get list of events
    const eventsResponse = await axios.get(`${EVENT_SERVICE_URL}/events`);
    const events = eventsResponse.data;
    
    if (events && events.length > 0) {
      // Use the first available event
      return events[0]._id || events[0].id;
    } else {
      // Create a new event if none exist
      const newEvent = {
        title: `Load Test Event ${Date.now()}`,
        description: 'Event for load testing booking service',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
        location: 'Test Location',
        price: 25.00,
        totalTickets: 1000, // Large number for load testing
        organizer: testUsers[0].id,
        category: 'conference',
        image: 'https://example.com/image.jpg'
      };
      
      const createEventResponse = await axios.post(
        `${EVENT_SERVICE_URL}/events`, 
        newEvent,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      // Handle both MongoDB _id and SQL id formats
      return createEventResponse.data._id || createEventResponse.data.id;
    }
  } catch (error) {
    console.error('Setup test event failed:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Create a booking
async function createBooking(user, eventId, ticketCount) {
  const startTime = Date.now();
  stats.totalRequests++;
  
  try {
    const bookingData = {
      userId: user.id,
      eventId: eventId,
      tickets: ticketCount,
      paymentMethod: 'credit_card'
    };
    
    const response = await axios.post(
      `${API_URL}/bookings`, 
      bookingData,
      { headers: { Authorization: `Bearer ${user.token}` } }
    );
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    stats.successfulRequests++;
    stats.responseTimeTotal += responseTime;
    stats.responseTimeMin = Math.min(stats.responseTimeMin, responseTime);
    stats.responseTimeMax = Math.max(stats.responseTimeMax, responseTime);
    
    if (CONFIG.verbose) {
      console.log(`User ${user.email} created booking: ${response.data.id || response.data._id} (${responseTime}ms)`);
    }
    
    return response.data;
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    stats.failedRequests++;
    
    const errorMessage = error.response ? error.response.data.message || JSON.stringify(error.response.data) : error.message;
    if (!stats.errors[errorMessage]) {
      stats.errors[errorMessage] = 1;
    } else {
      stats.errors[errorMessage]++;
    }
    
    if (CONFIG.verbose) {
      console.error(`User ${user.email} booking failed: ${errorMessage} (${responseTime}ms)`);
    }
    
    return null;
  }
}

// Simulate user activity
async function simulateUser(userIndex) {
  const user = testUsers[userIndex];
  if (!user) return;
  
  for (let i = 0; i < CONFIG.requestsPerUser; i++) {
    // Random number of tickets between 1 and 5
    const ticketCount = Math.floor(Math.random() * 5) + 1;
    
    await createBooking(user, eventId, ticketCount);
    
    // Add delay between requests
    if (i < CONFIG.requestsPerUser - 1) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));
    }
  }
}

// Print test results
function printResults() {
  const duration = (stats.endTime - stats.startTime) / 1000; // in seconds
  const requestsPerSecond = stats.totalRequests / duration;
  const avgResponseTime = stats.responseTimeTotal / (stats.successfulRequests || 1);
  
  console.log('\n========== Load Test Results ==========');
  console.log(`Duration: ${duration.toFixed(2)} seconds`);
  console.log(`Concurrent Users: ${CONFIG.concurrentUsers}`);
  console.log(`Requests Per User: ${CONFIG.requestsPerUser}`);
  console.log(`Total Requests: ${stats.totalRequests}`);
  console.log(`Successful Requests: ${stats.successfulRequests} (${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(2)}%)`);
  console.log(`Failed Requests: ${stats.failedRequests} (${((stats.failedRequests / stats.totalRequests) * 100).toFixed(2)}%)`);
  console.log(`Requests Per Second: ${requestsPerSecond.toFixed(2)}`);
  console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`Min Response Time: ${stats.responseTimeMin}ms`);
  console.log(`Max Response Time: ${stats.responseTimeMax}ms`);
  
  if (Object.keys(stats.errors).length > 0) {
    console.log('\nErrors:');
    for (const [error, count] of Object.entries(stats.errors)) {
      console.log(`  ${error}: ${count} occurrences`);
    }
  }
  
  console.log('\n=======================================');
}

// Run the load test
async function runLoadTest() {
  console.log('Starting booking service load test...');
  console.log(`Configuration: ${CONFIG.concurrentUsers} users, ${CONFIG.requestsPerUser} requests per user`);
  
  stats.startTime = Date.now();
  
  try {
    // Create test users
    console.log('Creating test users...');
    for (let i = 0; i < CONFIG.concurrentUsers; i++) {
      const user = await createTestUser(i);
      if (user) {
        testUsers.push(user);
      }
    }
    
    if (testUsers.length === 0) {
      console.error('Failed to create any test users. Aborting test.');
      return;
    }
    
    // Setup test event
    console.log('Setting up test event...');
    eventId = await setupTestEvent(testUsers[0].token);
    if (!eventId) {
      console.error('Failed to setup test event. Aborting test.');
      return;
    }
    
    console.log(`Using event ID: ${eventId}`);
    console.log('Starting load test...');
    
    // Run concurrent user simulations
    const userPromises = [];
    for (let i = 0; i < testUsers.length; i++) {
      userPromises.push(simulateUser(i));
    }
    
    await Promise.all(userPromises);
    
    stats.endTime = Date.now();
    printResults();
    
  } catch (error) {
    console.error('Error running load test:', error);
    stats.endTime = Date.now();
    printResults();
  }
}

// Run the load test
runLoadTest(); 