/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/tests/patterns/integration.test.ts'],
  projects: [
    {
      displayName: 'default',
      preset: 'ts-jest',
      testEnvironment: 'node',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
      },
      extensionsToTreatAsEsm: ['.ts'],
      moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
      testPathIgnorePatterns: ['/node_modules/', '/tests/patterns/integration.test.ts'],
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
      },
      extensionsToTreatAsEsm: ['.ts'],
      moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
      testMatch: ['**/tests/patterns/integration.test.ts'],
      setupFiles: ['<rootDir>/tests/patterns/setup.ts'],
    },
  ],
};
