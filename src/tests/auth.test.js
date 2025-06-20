const request = require('supertest');
const express = require('express');
const mainRouter = require('../routes/index');
const prisma = require('../lib/prisma'); // Import the actual Prisma client

const app = express();
app.use(express.json());
app.use('/api', mainRouter);

// Clean up database before each test in this suite
beforeEach(async () => {
  // Order of deletion matters due to foreign key constraints
  // If using onDelete: Cascade, deleting users might be enough for some related data.
  // However, explicit deletion is safer for tests.
  await prisma.licenseProductAccess.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.license.deleteMany({});
  await prisma.product.deleteMany({}); // If products are created by tests
  await prisma.user.deleteMany({});
});

// Clean up database after all tests in this suite
afterAll(async () => {
  await prisma.licenseProductAccess.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.license.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect(); // Disconnect Prisma client
});

describe('Auth API Endpoints with Prisma', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    role: 'CLIENT' // Use string values as per controller
  };
  const testAdminUser = {
    email: 'admin@example.com',
    password: 'password123',
    role: 'ADMIN'
  };


  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toEqual(testUser.email.toLowerCase());

    const dbUser = await prisma.user.findUnique({ where: { email: testUser.email.toLowerCase() } });
    expect(dbUser).not.toBeNull();
    expect(dbUser.email).toEqual(testUser.email.toLowerCase());
    expect(dbUser.role).toEqual(testUser.role);
  });

  it('should fail to register a duplicate user', async () => {
    await request(app).post('/api/auth/register').send(testUser); // First registration

    const res = await request(app) // Attempt second registration
      .post('/api/auth/register')
      .send(testUser);
    expect(res.statusCode).toEqual(409);
    expect(res.body.message).toMatch(/User already exists/i); // More flexible message check
  });

  it('should login an existing user successfully', async () => {
    await request(app).post('/api/auth/register').send(testUser); // Register user first

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toEqual(testUser.email.toLowerCase());
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
    expect(res.body.message).toEqual('Invalid credentials (user not found)');
  });

  it('should register a new admin user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testAdminUser);
    expect(res.statusCode).toEqual(201);
    expect(res.body.user.email).toEqual(testAdminUser.email.toLowerCase());
    expect(res.body.user.role).toEqual(testAdminUser.role);

    const dbUser = await prisma.user.findUnique({ where: { email: testAdminUser.email.toLowerCase() } });
    expect(dbUser).not.toBeNull();
    expect(dbUser.role).toEqual(testAdminUser.role);
  });
});
