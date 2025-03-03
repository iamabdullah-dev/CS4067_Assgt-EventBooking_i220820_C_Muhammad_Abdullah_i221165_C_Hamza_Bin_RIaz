const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

// Test user data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  phone: '1234567890'
};

let authToken = '';

// Test registration
async function testRegistration() {
  try {
    console.log('Testing user registration...');
    const response = await axios.post(`${API_URL}/auth/register`, testUser);
    console.log('Registration successful:', response.data);
    return response.data.token;
  } catch (error) {
    console.error('Registration failed:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Test login
async function testLogin() {
  try {
    console.log('Testing user login...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('Login successful:', response.data);
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Test get user profile
async function testGetProfile(token) {
  try {
    console.log('Testing get user profile...');
    const response = await axios.get(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Get profile successful:', response.data);
  } catch (error) {
    console.error('Get profile failed:', error.response ? error.response.data : error.message);
  }
}

// Test update user profile
async function testUpdateProfile(token) {
  try {
    console.log('Testing update user profile...');
    const response = await axios.put(`${API_URL}/users/me`, 
      { name: 'Updated Name' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Update profile successful:', response.data);
  } catch (error) {
    console.error('Update profile failed:', error.response ? error.response.data : error.message);
  }
}

// Test if user can login after registration
async function testRegistrationThenLogin() {
  try {
    console.log('Testing registration followed by login...');
    
    // First, ensure we have a fresh user by modifying the email
    const uniqueUser = {
      ...testUser,
      email: `test${Date.now()}@example.com`
    };
    
    // Register the user
    console.log(`Registering new user with email: ${uniqueUser.email}`);
    const registerResponse = await axios.post(`${API_URL}/auth/register`, uniqueUser);
    console.log('Registration successful:', registerResponse.data);
    
    // Now try to login with the same credentials
    console.log('Attempting to login with newly created user...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: uniqueUser.email,
      password: uniqueUser.password
    });
    
    if (loginResponse.data && loginResponse.data.token) {
      console.log('Login after registration successful!');
      return true;
    } else {
      console.log('Login after registration failed: No token received');
      return false;
    }
  } catch (error) {
    console.error('Registration-then-login test failed:', error.response ? error.response.data : error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  try {
    // Test if registration followed by login works
    const registrationLoginSuccess = await testRegistrationThenLogin();
    console.log(`Registration followed by login test: ${registrationLoginSuccess ? 'PASSED' : 'FAILED'}`);
    
    // First try to login (in case user already exists)
    let token = await testLogin();
    
    // If login fails, try to register
    if (!token) {
      token = await testRegistration();
    }
    
    // If we have a token, test other endpoints
    if (token) {
      await testGetProfile(token);
      await testUpdateProfile(token);
    }
    
    console.log('All tests completed!');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests(); 