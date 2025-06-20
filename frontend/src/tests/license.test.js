const request = require('supertest');
const express = require('express');
const mainRouter = require('../../src/routes/index'); // Main app router from src/routes/index.js
const prisma = require('../../src/lib/prisma');    // Actual Prisma client
const jwt = require('jsonwebtoken');         // To generate mock tokens for protected routes
const { JWT_SECRET } = require('../../src/config'); // For JWT signing
const bcrypt = require('bcryptjs');          // For hashing passwords for test user creation
const crypto = require('crypto');            // For generating UUIDs in test data

const app = express();
app.use(express.json()); // Enable JSON request body parsing
app.use('/api', mainRouter); // Mount the main router under /api prefix, as in server.js

let testUser;
let adminUser;
let testUserToken;
let adminUserToken;

// Setup initial users and clean database
beforeAll(async () => {
  await prisma.licenseProductAccess.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.license.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});

  testUser = await prisma.user.create({
    data: {
      email: 'testuser.license@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'CLIENT',
    },
  });
  adminUser = await prisma.user.create({
    data: {
      email: 'admin.license@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'ADMIN',
    },
  });

  testUserToken = jwt.sign({ user: { id: testUser.id, email: testUser.email, role: testUser.role } }, JWT_SECRET, { expiresIn: '1h' });
  adminUserToken = jwt.sign({ user: { id: adminUser.id, email: adminUser.email, role: adminUser.role } }, JWT_SECRET, { expiresIn: '1h' });
});

beforeEach(async () => {
  await prisma.licenseProductAccess.deleteMany({});
  await prisma.license.deleteMany({});
});

afterAll(async () => {
  await prisma.licenseProductAccess.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.license.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});

describe('License API Endpoints with Prisma (Updated)', () => {
  it('should allow an admin to create a license, and key should have "inv-" prefix', async () => {
    const res = await request(app)
      .post('/api/licenses')
      .set('x-auth-token', adminUserToken)
      .send({ userId: testUser.id, status: 'ACTIVE' });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('licenseKey');
    expect(res.body.licenseKey.startsWith('inv-')).toBe(true); // Check for prefix
    expect(res.body.userId).toEqual(testUser.id);

    const dbLicense = await prisma.license.findUnique({ where: { id: res.body.id } });
    expect(dbLicense).not.toBeNull();
    expect(dbLicense.status).toEqual('ACTIVE');
    expect(dbLicense.licenseKey.startsWith('inv-')).toBe(true);
  });

  it('should allow a non-admin to create a license for themselves, key should have "inv-" prefix', async () => {
    const res = await request(app)
      .post('/api/licenses')
      .set('x-auth-token', testUserToken)
      .send({ status: 'ACTIVE' });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('licenseKey');
    expect(res.body.licenseKey.startsWith('inv-')).toBe(true); // Check for prefix
    expect(res.body.userId).toEqual(testUser.id);
  });

  it('should NOT allow creating a license without a token (protected route)', async () => {
    const res = await request(app)
      .post('/api/licenses')
      .send({ userId: testUser.id, status: 'ACTIVE' });
    expect(res.statusCode).toEqual(401); // No token, authorization denied
  });

  // --- Tests for PUBLIC /api/licenses/validate endpoint ---
  it('should validate an active license key successfully (public)', async () => {
    const license = await prisma.license.create({
      data: {
        licenseKey: `inv-${crypto.randomUUID()}`, // Manually create with prefix for test data
        userId: testUser.id,
        status: 'ACTIVE',
      }
    });

    const res = await request(app) // NO .set('x-auth-token', ...)
      .post('/api/licenses/validate')
      .send({ licenseKey: license.licenseKey });
    expect(res.statusCode).toEqual(200);
    expect(res.body.isValid).toBe(true);
    expect(res.body.licenseDetails.userId).toEqual(testUser.id);
  });

  it('should fail to validate an inactive license key (public)', async () => {
     const license = await prisma.license.create({
      data: {
        licenseKey: `inv-${crypto.randomUUID()}`,
        userId: testUser.id,
        status: 'INACTIVE',
      }
    });
    const res = await request(app) // NO .set('x-auth-token', ...)
      .post('/api/licenses/validate')
      .send({ licenseKey: license.licenseKey });
    expect(res.statusCode).toEqual(403);
    expect(res.body.isValid).toBe(false);
    expect(res.body.message).toContain('License is not active');
  });

  it('should identify and update an expired license upon validation (public)', async () => {
    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
    const license = await prisma.license.create({
      data: {
        licenseKey: `inv-${crypto.randomUUID()}`,
        userId: testUser.id,
        status: 'ACTIVE',
        expiresAt: expiredDate,
      }
    });

    const res = await request(app) // NO .set('x-auth-token', ...)
      .post('/api/licenses/validate')
      .send({ licenseKey: license.licenseKey });
    expect(res.statusCode).toEqual(403);
    expect(res.body.isValid).toBe(false);
    expect(res.body.message).toContain('License has expired');
    expect(res.body.status).toEqual('EXPIRED');

    const dbLicense = await prisma.license.findUnique({ where: { id: license.id } });
    expect(dbLicense.status).toEqual('EXPIRED');
  });

  it('should fail to validate a non-existent license key (public)', async () => {
    const res = await request(app) // NO .set('x-auth-token', ...)
      .post('/api/licenses/validate')
      .send({ licenseKey: `inv-${crypto.randomUUID()}` }); // A non-existent but correctly formatted key
    expect(res.statusCode).toEqual(404);
  });

  // Test other protected license routes (GET, PUT, DELETE) still require token
  it('GET /api/licenses should require a token', async () => {
    const res = await request(app).get('/api/licenses');
    expect(res.statusCode).toEqual(401);
  });

  it('PUT /api/licenses/:id should require a token', async () => {
    // Create a dummy license first to have an ID
    const license = await prisma.license.create({ data: { licenseKey: `inv-${crypto.randomUUID()}`, status: 'ACTIVE' }});
    const res = await request(app)
        .put(`/api/licenses/${license.id}`)
        .send({ status: 'BLOCKED' });
    expect(res.statusCode).toEqual(401);
  });
});
