const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
    '!src/app/globals.css',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-markdown|remark-.*|unist-.*|unified|bail|is-plain-obj|trough|vfile|property-information|hast-util-.*|html-void-elements|space-separated-tokens|comma-separated-tokens|web-namespaces|zwitch|html-tag-names|markdown-table|character-entities|decode-named-character-reference|micromark|micromark-.*|parse-entities|character-entities-.*|mdast-.*|ccount|escape-string-regexp|unist-.*)/)',
  ],
}

module.exports = createJestConfig(customJestConfig)