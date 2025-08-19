import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_REPO_OWNER = 'test-owner'
process.env.NEXT_PUBLIC_REPO_NAME = 'test-repo'
process.env.NEXT_PUBLIC_GITHUB_TOKEN = 'test-token'
process.env.NEXT_PUBLIC_ADMIN_PASSWORD = 'test-password'