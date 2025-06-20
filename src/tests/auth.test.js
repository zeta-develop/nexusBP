const request = require('supertest');
const express = require('express'); // To setup a minimal app for testing routes
const mainRouter = require('../routes/index'); // Assuming this is your main app router
const { JWT_SECRET } = require('../config'); // For mocking JWT related things if needed

// Mock the in-memory stores or actual DB interactions if they were real
// This is crucial for unit tests to be predictable and not rely on previous test states.

// Setup a minimal express app with our router
const app = express();
app.use(express.json()); // Important for POST requests
app.use('/api', mainRouter); // Mount your main router, adjust base path as needed

// Clean up in-memory stores before each test for authController
// This is a simplified way. In a real app, you'd mock the controller's dependencies.
const { usersStore } = require('../controllers/authController'); // Direct import for cleanup

beforeEach(() => {
  usersStore.length = 0; // Clear the in-memory user store
});


describe('Auth API Endpoints', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    role: 'client'
  };

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toEqual(testUser.email);
    // Check if user is in our mock store
    expect(usersStore.find(u => u.email === testUser.email)).toBeDefined();
  });

  it('should fail to register a duplicate user', async () => {
    // First registration
    await request(app).post('/api/auth/register').send(testUser);
    // Attempt second registration
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    expect(res.statusCode).toEqual(409);
    expect(res.body.message).toEqual('User already exists with in-memory store');
  });

  it('should login an existing user successfully', async () => {
    // Register user first
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toEqual(testUser.email);
  });

  it('should fail to login with invalid credentials (wrong password)', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toEqual('Invalid credentials (password mismatch)');
  });

  it('should fail to login a non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nouser@example.com', password: 'password' });
    expect(res.statusCode).toEqual(401);
     expect(res.body.message).toEqual('Invalid credentials (user not found in-memory)');
  });
});
