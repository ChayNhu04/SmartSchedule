const path = require('path');

module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../../mobile/$1',
  },
  modulePaths: ['<rootDir>/../../mobile/node_modules'],
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx)',
    '**/*.(test|spec).(ts|tsx)',
  ],
  transform: {
    '\\.[jt]sx?$': [
      'babel-jest',
      { configFile: path.resolve(__dirname, 'babel.config.js') },
    ],
  },
  collectCoverageFrom: [
    '../../mobile/**/*.{ts,tsx}',
    '!../../mobile/**/*.d.ts',
    '!../../mobile/**/node_modules/**',
    '!../../mobile/app/**',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|(jest-)?react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|@testing-library))',
    '/node_modules/react-native-worklets/plugin/',
  ],
};
