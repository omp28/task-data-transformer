module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/backend', '<rootDir>/cli'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'backend/**/*.ts',
    'cli/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ]
};
