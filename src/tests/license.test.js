const request = require('supertest');
const express = require('express');
const mainRouter = require('../routes/index');
const prisma = require('../lib/prisma');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

const app = express();
app.use(express.json());
app.use('/api', mainRouter);

let testUser;
let adminUser;
let testUserToken;
let adminUserToken;

// Helper function to hash passwords for test user creation
const bcrypt = require('bcryptjs');

// Setup initial users and clean database
beforeAll(async () => {
  // Clean up database before all tests in this suite
  await prisma.licenseProductAccess.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.license.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});

  // Create test users directly in DB for this test suite
  testUser = await prisma.user.create({
    data: {
      email: 'testuser.license@example.com',
      passwordHash: await bcrypt.hash('password123', 10), // Use bcrypt directly for test setup
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
  // Clean licenses before each individual test to avoid interference
  await prisma.licenseProductAccess.deleteMany({});
  await prisma.license.deleteMany({});
  // Products can also be cleaned if they are created per test.
  // For now, assuming products might be seeded or less frequently changed within this suite.
});

afterAll(async () => {
  // Final cleanup
  await prisma.licenseProductAccess.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.license.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});


describe('License API Endpoints with Prisma', () => {
  it('should allow an admin to create a license for a user', async () => {
    const res = await request(app)
      .post('/api/licenses')
      .set('x-auth-token', adminUserToken)
      .send({ userId: testUser.id, status: 'ACTIVE' });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('licenseKey');
    expect(res.body.userId).toEqual(testUser.id);

    const dbLicense = await prisma.license.findUnique({ where: { id: res.body.id } });
    expect(dbLicense).not.toBeNull();
    expect(dbLicense.status).toEqual('ACTIVE');
  });

  it('should allow a non-admin to create a license for themselves (as per current controller logic)', async () => {
    const res = await request(app)
      .post('/api/licenses')
      .set('x-auth-token', testUserToken) // Non-admin user
      .send({ status: 'ACTIVE' }); // userId will be inferred from token by controller logic
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('licenseKey');
    expect(res.body.userId).toEqual(testUser.id);
  });

  it('should NOT allow creating a license without a token', async () => {
    const res = await request(app)
      .post('/api/licenses')
      .send({ userId: testUser.id, status: 'ACTIVE' });
    expect(res.statusCode).toEqual(401);
  });

  it('should validate an active license key successfully', async () => {
    const license = await prisma.license.create({
      data: {
        userId: testUser.id,
        status: 'ACTIVE',
        // licenseKey is auto-generated
      }
    });

    const res = await request(app)
      .post('/api/licenses/validate')
      .set('x-auth-token', testUserToken)
      .send({ licenseKey: license.licenseKey });
    expect(res.statusCode).toEqual(200);
    expect(res.body.isValid).toBe(true);
    expect(res.body.licenseDetails.userId).toEqual(testUser.id);
  });

  it('should fail to validate an inactive license key', async () => {
     const license = await prisma.license.create({
      data: {
        userId: testUser.id,
        status: 'INACTIVE',
      }
    });
    const res = await request(app)
      .post('/api/licenses/validate')
      .set('x-auth-token', testUserToken)
      .send({ licenseKey: license.licenseKey });
    expect(res.statusCode).toEqual(403);
    expect(res.body.isValid).toBe(false);
    expect(res.body.message).toContain('License is not active');
  });

  it('should identify and update an expired license upon validation', async () => {
    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
    const license = await prisma.license.create({
      data: {
        userId: testUser.id,
        status: 'ACTIVE', // Was active
        expiresAt: expiredDate,
      }
    });

    const res = await request(app)
      .post('/api/licenses/validate')
      .set('x-auth-token', testUserToken)
      .send({ licenseKey: license.licenseKey });
    expect(res.statusCode).toEqual(403); // Should be forbidden
    expect(res.body.isValid).toBe(false);
    expect(res.body.message).toContain('License has expired');
    expect(res.body.status).toEqual('EXPIRED'); // Controller should update and return this

    const dbLicense = await prisma.license.findUnique({ where: { id: license.id } });
    expect(dbLicense.status).toEqual('EXPIRED'); // Verify DB was updated
  });

  it('should fail to validate a non-existent license key', async () => {
    const res = await request(app)
      .post('/api/licenses/validate')
      .set('x-auth-token', testUserToken)
      .send({ licenseKey: 'non-existent-key-uuid-format' }); // Ensure it's a valid UUID format if your DB expects it. Prisma default is String.
    expect(res.statusCode).toEqual(404); // Not found
  });

  // TODO: Add tests for GET all, GET by ID, PUT (update), DELETE licenses
  // Test role permissions for these operations.
});
