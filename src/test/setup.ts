import { vi } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn()

// Mock crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    }),
    subtle: {
      generateKey: vi.fn(),
      importKey: vi.fn(),
      exportKey: vi.fn(),
      encrypt: vi.fn(),
      decrypt: vi.fn(),
    },
  },
})

// Mock DOMParser
global.DOMParser = vi.fn().mockImplementation(() => ({
  parseFromString: vi.fn().mockReturnValue({
    getElementsByTagName: vi.fn().mockReturnValue([]),
  }),
}))

// Mock btoa and atob
global.btoa = vi.fn((str) => Buffer.from(str, 'binary').toString('base64'))
global.atob = vi.fn((str) => Buffer.from(str, 'base64').toString('binary'))

// Mock window object
Object.defineProperty(global, 'window', {
  value: {
    location: {
      origin: 'https://example.com',
      hostname: 'example.com'
    }
  },
  writable: true
})

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}
