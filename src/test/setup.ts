import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
vi.mock('@/config/env', () => ({
  checkEnvVarsConfigured: vi.fn(() => true),
  getRepoConfigFromEnv: vi.fn(() => ({
    owner: 'test-owner',
    repo: 'test-repo'
  })),
  getGitHubToken: vi.fn(() => 'test-token'),
  isDevelopment: vi.fn(() => true)
}))

// Mock fetch globally
global.fetch = vi.fn()

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    reload: vi.fn(),
  },
  writable: true,
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
