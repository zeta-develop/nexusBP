const request = require('supertest');
const express = require('express');
const mainRouter = require('../routes/index');
const jwt = require('jsonwebtoken'); // To generate mock tokens
const { JWT_SECRET } = require('../config');

// Mock the in-memory stores
const { licensesStore } = require('../controllers/licenseController');
const { usersStore } = require('../controllers/authController'); // For creating mock users for tokens

const app = express();
app.use(express.json());
app.use('/api', mainRouter);


let testUserToken;
let adminUserToken;
let testUserId;
let adminUserId;

beforeEach(() => {
  // Clear in-memory stores
  licensesStore.length = 0;
  usersStore.length = 0; // Clear users as well, as authController is imported

  // Create mock users and tokens for tests
  const testUser = { id: 1, email: 'testuser@example.com', role: 'client' };
  const adminUser = { id: 2, email: 'admin@example.com', role: 'admin' };

  // Simulate user registration for authController's in-memory store if needed by other parts
  usersStore.push({ ...testUser, password_hash: 'hashedpassword' });
  usersStore.push({ ...adminUser, password_hash: 'hashedpassword' });

  testUserId = testUser.id;
  adminUserId = adminUser.id;

  testUserToken = jwt.sign({ user: testUser }, JWT_SECRET, { expiresIn: '1h' });
  adminUserToken = jwt.sign({ user: adminUser }, JWT_SECRET, { expiresIn: '1h' });
});

describe('License API Endpoints', () => {
  const sampleLicenseData = {
    userId: testUserId, // Will be overridden by token usually, or used by admin
    status: 'active',
    // expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
  };

  it('should allow an admin to create a license', async () => {
    const res = await request(app)
      .post('/api/licenses')
      .set('x-auth-token', adminUserToken)
      .send({ ...sampleLicenseData, userId: testUserId }); // Admin creates for testUser
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('license_key');
    expect(res.body.user_id).toEqual(testUserId);
    expect(licensesStore.length).toBe(1);
  });

  it('should (for now) allow a non-admin to create a license (pending strict role enforcement)', async () => {
    // Current controller logic has a console.warn but allows it.
    // This test reflects current behavior, not necessarily desired final behavior.
    const res = await request(app)
      .post('/api/licenses')
      .set('x-auth-token', testUserToken) // Non-admin user
      .send({ ...sampleLicenseData, userId: testUserId }); // User creates for themselves
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('license_key');
    expect(res.body.user_id).toEqual(testUserId);
    // The warning "Non-admin user creating license" should appear in console during test run
  });


  it('should NOT allow creating a license without a token', async () => {
    const res = await request(app)
      .post('/api/licenses')
      .send(sampleLicenseData);
    expect(res.statusCode).toEqual(401); // No token, authorization denied
    expect(res.body.message).toEqual('No token, authorization denied');
  });

  it('should validate an active license key successfully', async () => {
    // Admin creates a license
    const creationRes = await request(app)
      .post('/api/licenses')
      .set('x-auth-token', adminUserToken)
      .send({ ...sampleLicenseData, userId: testUserId, status: 'active' });
    const licenseKey = creationRes.body.license_key;

    const res = await request(app)
      .post('/api/licenses/validate')
      .set('x-auth-token', testUserToken) // Any authenticated user can try to validate
      .send({ licenseKey });
    expect(res.statusCode).toEqual(200);
    expect(res.body.isValid).toBe(true);
    expect(res.body.licenseDetails.userId).toEqual(testUserId);
  });

  it('should fail to validate an inactive license key', async () => {
    const creationRes = await request(app)
      .post('/api/licenses')
      .set('x-auth-token', adminUserToken)
      .send({ ...sampleLicenseData, userId: testUserId, status: 'inactive' });
    const licenseKey = creationRes.body.license_key;

    const res = await request(app)
      .post('/api/licenses/validate')
      .set('x-auth-token', testUserToken)
      .send({ licenseKey });
    expect(res.statusCode).toEqual(403);
    expect(res.body.isValid).toBe(false);
    expect(res.body.message).toContain('License is not active');
  });

  it('should fail to validate an expired license key', async () => {
    const creationRes = await request(app)
      .post('/api/licenses')
      .set('x-auth-token', adminUserToken)
      .send({
          ...sampleLicenseData,
          userId: testUserId,
          status: 'active',
          expiresAt: new Date(Date.now() - 1000).toISOString() // Expired yesterday
        });
    const licenseKey = creationRes.body.license_key;

    const res = await request(app)
      .post('/api/licenses/validate')
      .set('x-auth-token', testUserToken)
      .send({ licenseKey });
    expect(res.statusCode).toEqual(403);
    expect(res.body.isValid).toBe(false);
    expect(res.body.message).toContain('License has expired');
  });


  it('should fail to validate a non-existent license key', async () => {
    const res = await request(app)
      .post('/api/licenses/validate')
      .set('x-auth-token', testUserToken)
      .send({ licenseKey: 'non-existent-key-uuid' });
    expect(res.statusCode).toEqual(404);
    expect(res.body.isValid).toBe(false);
    expect(res.body.message).toEqual('License key not found');
  });

  // TODO: Add more tests for GET, PUT, DELETE licenses, checking admin/user roles
});
