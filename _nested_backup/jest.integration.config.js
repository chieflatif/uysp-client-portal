/**
 * Jest Configuration - Integration Tests
 *
 * Tests that run against real database
 * Must use node environment, not jsdom
 */

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  testEnvironment: 'node',  // Use node, not jsdom
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/__tests__/integration/**/*.test.ts',
  ],
  testTimeout: 30000,  // 30 second timeout for database operations
  verbose: true,
}

module.exports = createJestConfig(customJestConfig)
