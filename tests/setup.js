const mongoose = require('mongoose');

// Set necessary environment variables for the test suite
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'a-super-secret-key-for-testing-sessions';
process.env.JWT_SECRET = 'a-super-secret-key-for-testing-jwt';
process.env.JWT_REFRESH_SECRET = 'a-super-secret-key-for-testing-jwt-refresh';
process.env.FRONTEND_URL = 'http://localhost:3000';

beforeAll(async () => {
  // The MONGODB_URI is set globally by global-setup.js
  // We just need to connect mongoose to it.
  await mongoose.connect(process.env.MONGODB_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
  // The in-memory server will be stopped by global-teardown.js
});

beforeEach(async () => {
  // Clear all data from all collections before each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Mock the email utility so we don't send real emails during tests
jest.mock('../src/utils/email', () => ({
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));