module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '../../backend/src/**/*.(t|j)s',
    '!../../backend/src/**/*.dto.ts',
    '!../../backend/src/**/*.entity.ts',
    '!../../backend/src/**/*.module.ts',
    '!../../backend/src/main.ts',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../../backend/src/$1',
  },
};
