# Event Booking Platform Test Suite

This repository contains a comprehensive test suite for the Event Booking Platform microservices architecture. The test suite includes functional tests for all services, load tests, and reporting tools.

## Services Tested

The test suite covers the following microservices:

1. **User Service** - Authentication and user management
2. **Event Service** - Event creation and management
3. **Booking Service** - Ticket booking and payment processing
4. **Notification Service** - Notification delivery via RabbitMQ

## Prerequisites

- Node.js (v14 or higher)
- Docker and Docker Compose
- Running instances of all microservices (see docker-compose.yml)

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

## Running Tests

### Individual Service Tests

To run tests for individual services:

```bash
# User Service Tests
npm run test:user

# Booking Service Tests
npm run test:booking

# Event Service Tests
npm run test:event

# Notification Service Tests
npm run test:notification
```

### Running All Tests

To run all tests sequentially:

```bash
npm test
```

### Test Report Generation

To generate an HTML report of all test results:

```bash
npm run test:report
```

The report will be saved in the `test-reports` directory.

### Load Testing

To run a load test on the booking service:

```bash
npm run test:load
```

You can configure the load test parameters in `load-test-booking.js`:

```javascript
const CONFIG = {
  concurrentUsers: 5,     // Number of concurrent users
  requestsPerUser: 3,     // Number of bookings each user will attempt
  delayBetweenRequests: 500, // Milliseconds between requests for each user
  verbose: true           // Whether to log detailed information
};
```

## Test Descriptions

### User Service Tests

- **Registration Test**: Tests user registration functionality
- **Login Test**: Tests user login functionality
- **Registration-then-Login Test**: Tests if a newly registered user can login
- **Get Profile Test**: Tests retrieving user profile information
- **Update Profile Test**: Tests updating user profile information

### Event Service Tests

- **Create Event Test**: Tests event creation functionality
- **Get Event Test**: Tests retrieving a specific event
- **Get All Events Test**: Tests retrieving all events
- **Check Event Availability Test**: Tests checking ticket availability for an event
- **Update Event Test**: Tests updating event information

### Booking Service Tests

- **Create Booking Test**: Tests booking creation functionality
- **Get Booking Test**: Tests retrieving a specific booking
- **Get User Bookings Test**: Tests retrieving all bookings for a user
- **Cancel Booking Test**: Tests booking cancellation functionality

### Notification Service Tests

- **Health Endpoint Test**: Tests the service health endpoint
- **Send Booking Confirmation Test**: Tests sending booking confirmation messages via RabbitMQ
- **Send Booking Cancellation Test**: Tests sending booking cancellation messages via RabbitMQ
- **Get User Notifications Test**: Tests retrieving notifications for a user

## Architecture

The test suite is designed to test the integration between microservices in the Event Booking Platform. Each service has its own test file that focuses on testing the API endpoints and functionality of that service.

The tests are designed to be run in a specific order, as some tests depend on the results of previous tests. For example, the booking service tests depend on having a valid user and event created first.

## Troubleshooting

### Common Issues

1. **Connection Refused**: Make sure all services are running. Check with `docker ps`.
2. **Authentication Failures**: Ensure the JWT secret is consistent across services.
3. **RabbitMQ Connection Issues**: Verify RabbitMQ is running and accessible at the specified URL.

### Debugging

For more detailed logs, you can modify the test files to include more console.log statements. The load test has a `verbose` option that can be set to `true` for more detailed output.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 