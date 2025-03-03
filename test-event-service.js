const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const API_URL = 'http://localhost:3002/api'; // Event service URL
const USER_SERVICE_URL = 'http://localhost:3001/api'; // User service URL

// Test data
const testUser = {
  name: 'Test User',
  email: `test${Date.now()}@example.com`,
  password: 'password123',
  phone: '1234567890'
};

const testEvent = {
  title: 'Test Event',
  description: 'Event for testing event service',
  date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
  location: 'Test Location',
  price: 25.00,
  totalTickets: 100,
  category: 'conference',
  image: 'https://example.com/image.jpg'
};

let userId = '';
let authToken = '';
let eventId = '';

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

// Test creating an event
async function testCreateEvent() {
  try {
    console.log('Testing event creation...');
    const eventData = {
      ...testEvent,
      organizer: userId
    };
    
    const response = await axios.post(
      `${API_URL}/events`, 
      eventData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('Event created successfully:', response.data);
    eventId = response.data._id || response.data.id;
    return response.data;
  } catch (error) {
    console.error('Event creation failed:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Test getting an event by ID
async function testGetEvent() {
  try {
    console.log(`Testing get event with ID: ${eventId}...`);
    const response = await axios.get(`${API_URL}/events/${eventId}`);
    
    console.log('Get event successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get event failed:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Test getting all events
async function testGetAllEvents() {
  try {
    console.log('Testing get all events...');
    const response = await axios.get(`${API_URL}/events`);
    
    console.log(`Retrieved ${response.data.length} events`);
    return response.data;
  } catch (error) {
    console.error('Get all events failed:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Test checking event availability
async function testCheckEventAvailability() {
  try {
    console.log(`Testing event availability for ID: ${eventId}...`);
    const response = await axios.get(`${API_URL}/events/${eventId}/availability?tickets=2`);
    
    console.log('Event availability check successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Event availability check failed:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Test updating an event
async function testUpdateEvent() {
  try {
    console.log(`Testing update event with ID: ${eventId}...`);
    const updateData = {
      title: `Updated Test Event ${Date.now()}`,
      description: 'Updated description'
    };
    
    const response = await axios.put(
      `${API_URL}/events/${eventId}`,
      updateData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('Update event successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Update event failed:', error.response ? error.response.data : error.message);
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
    
    // Create an event
    const event = await testCreateEvent();
    if (!event) {
      console.error('Failed to create event. Aborting remaining tests.');
      return;
    }
    
    // Get the event by ID
    const retrievedEvent = await testGetEvent();
    console.log(`Get event test: ${retrievedEvent ? 'PASSED' : 'FAILED'}`);
    
    // Get all events
    const allEvents = await testGetAllEvents();
    console.log(`Get all events test: ${allEvents ? 'PASSED' : 'FAILED'}`);
    
    // Check event availability
    const availability = await testCheckEventAvailability();
    console.log(`Check event availability test: ${availability ? 'PASSED' : 'FAILED'}`);
    
    // Update the event
    const updatedEvent = await testUpdateEvent();
    console.log(`Update event test: ${updatedEvent ? 'PASSED' : 'FAILED'}`);
    
    console.log('All event service tests completed!');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests(); 