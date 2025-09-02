module.exports = {
  testEnvironment: 'node',
  globalSetup: './tests/global-setup.js',
  globalTeardown: './tests/global-teardown.js',
  // The file that will run before all tests
  setupFilesAfterEnv: ['./tests/setup.js'],
  // Increase timeout for async operations like DB connections
  testTimeout: 30000,
};