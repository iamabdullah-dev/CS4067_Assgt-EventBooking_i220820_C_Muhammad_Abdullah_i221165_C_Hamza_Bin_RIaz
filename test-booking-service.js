const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const API_URL = 'http://localhost:3003/api'; // Booking service URL
const EVENT_SERVICE_URL = 'http://localhost:3002/api'; // Event service URL
const USER_SERVICE_URL = 'http://localhost:3001/api'; // User service URL

// Test data
const testUser = {
  name: 'Test User',
  email: `test${Date.now()}@example.com`,
  password: 'password123',
  phone: '1234567890'
};

let userId = '';
let authToken = '';
let eventId = '';
let bookingId = '';

// Test user registration and login to get auth token
async function setupTestUser() {
  try {
    console.log('Setting up test user...');
    // Register user
    const registerResponse = await axios.post(`${USER_SERVICE_URL}/auth/register`, testUser);
    userId = registerResponse.data.user.id;
    authToken = registerResponse.data.token;
    console.log(`Test user created with ID: ${userId}`);
    return { userId, authToken };
  } catch (error) {
    console.error('Setup test user failed:', error.response ? error.response.data : error.message);
    // Try login if registration fails (user might already exist)
    try {
      const loginResponse = await axios.post(`${USER_SERVICE_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      userId = loginResponse.data.user.id;
      authToken = loginResponse.data.token;
      console.log(`Logged in with existing user ID: ${userId}`);
      return { userId, authToken };
    } catch (loginError) {
      console.error('Login failed:', loginError.response ? loginError.response.data : loginError.message);
      return { userId: null, authToken: null };
    }
  }
}

// Find or create a test event
async function setupTestEvent() {
  try {
    console.log('Setting up test event...');
    // Get list of events
    const eventsResponse = await axios.get(`${EVENT_SERVICE_URL}/events`);
    const events = eventsResponse.data;
    
    if (events && events.length > 0) {
      // Use the first available event
      eventId = events[0]._id || events[0].id;
      console.log(`Using existing event with ID: ${eventId}`);
      return eventId;
    } else {
      // Create a new event if none exist
      const newEvent = {
        title: 'Test Event',
        description: 'Event for testing booking service',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
        location: 'Test Location',
        price: 25.00,
        totalTickets: 100, // Changed from capacity to totalTickets
        organizer: userId, // Changed from organizerId to organizer
        category: 'conference', // Using a valid category from the list
        image: 'https://example.com/image.jpg' // Added image field
      };
      
      const createEventResponse = await axios.post(
        `${EVENT_SERVICE_URL}/events`, 
        newEvent,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      // Handle both MongoDB _id and SQL id formats
      eventId = createEventResponse.data._id || createEventResponse.data.id;
      console.log(`Created new test event with ID: ${eventId}`);
      return eventId;
    }
  } catch (error) {
    console.error('Setup test event failed:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Test creating a booking
async function testCreateBooking() {
  try {
    console.log('Testing booking creation...');
    const bookingData = {
      userId,
      eventId,
      tickets: 2,
      paymentMethod: 'credit_card'
    };
    
    const response = await axios.post(
      `${API_URL}/bookings`, 
      bookingData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('Booking created successfully:', response.data);
    bookingId = response.data.id;
    return response.data;
  } catch (error) {
    console.error('Booking creation failed:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Test getting a booking by ID
async function testGetBooking() {
  try {
    console.log(`Testing get booking with ID: ${bookingId}...`);
    const response = await axios.get(
      `${API_URL}/bookings/${bookingId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('Get booking successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get booking failed:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Test getting all bookings for a user
async function testGetUserBookings() {
  try {
    console.log(`Testing get all bookings for user: ${userId}...`);
    const response = await axios.get(
      `${API_URL}/bookings/user/${userId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('Get user bookings successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get user bookings failed:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Test cancelling a booking
async function testCancelBooking() {
  try {
    console.log(`Testing cancel booking with ID: ${bookingId}...`);
    const response = await axios.post(
      `${API_URL}/bookings/${bookingId}/cancel`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('Cancel booking successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Cancel booking failed:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Run all tests
async function runTests() {
  try {
    // Setup test user and get auth token
    const { userId: user, authToken: token } = await setupTestUser();
    if (!user || !token) {
      console.error('Failed to setup test user. Aborting tests.');
      return;
    }
    
    // Setup test event
    const event = await setupTestEvent();
    if (!event) {
      console.error('Failed to setup test event. Aborting tests.');
      return;
    }
    
    // Create a booking
    const booking = await testCreateBooking();
    if (!booking) {
      console.error('Failed to create booking. Aborting remaining tests.');
      return;
    }
    
    // Get the booking by ID
    const retrievedBooking = await testGetBooking();
    console.log(`Get booking test: ${retrievedBooking ? 'PASSED' : 'FAILED'}`);
    
    // Get all bookings for the user
    const userBookings = await testGetUserBookings();
    console.log(`Get user bookings test: ${userBookings ? 'PASSED' : 'FAILED'}`);
    
    // Cancel the booking
    const cancelledBooking = await testCancelBooking();
    console.log(`Cancel booking test: ${cancelledBooking ? 'PASSED' : 'FAILED'}`);
    
    console.log('All booking service tests completed!');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests(); 