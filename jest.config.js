module.exports = {
  testEnvironment: 'node',
  // The file that will run before all tests
  setupFilesAfterEnv: ['./tests/setup.js'],
  // Increase timeout for async operations like DB connections
  testTimeout: 30000,
};