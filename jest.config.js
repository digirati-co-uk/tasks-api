const { resolve } = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: resolve(__dirname, './jest.environment.ts'),
  rootDir: __dirname,
  globalSetup: require.resolve('@trendyol/jest-testcontainers/dist/setup.js'),
  globalTeardown: require.resolve('@trendyol/jest-testcontainers/dist/teardown.js'),

};


require('@trendyol/jest-testcontainers');
