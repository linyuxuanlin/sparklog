import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'

// Mock data for testing
export const mockNotes = [
  {
    name: '2024-01-01-test-note.md',
    path: 'notes/2024-01-01-test-note.md',
    title: '2024-01-01-test-note',
    content: '这是一个测试笔记内容',
    contentPreview: '这是一个测试笔记内容',
    fullContent: `---
created_at: 2024-01-01T10:00:00Z
updated_at: 2024-01-01T10:00:00Z
private: false
tags: [测试, 示例]
---

这是一个测试笔记内容`,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    createdDate: '2024-01-01T10:00:00Z',
    updatedDate: '2024-01-01T10:00:00Z',
    isPrivate: false,
    tags: ['测试', '示例'],
    sha: 'abc123',
    size: 100,
    type: 'file',
    url: 'https://api.github.com/repos/test/test/contents/notes/2024-01-01-test-note.md',
    git_url: 'https://api.github.com/repos/test/test/git/blobs/abc123',
    html_url: 'https://github.com/test/test/blob/main/notes/2024-01-01-test-note.md',
    download_url: 'https://raw.githubusercontent.com/test/test/main/notes/2024-01-01-test-note.md'
  },
  {
    name: '2024-01-02-private-note.md',
    path: 'notes/2024-01-02-private-note.md',
    title: '2024-01-02-private-note',
    content: '这是一个私密笔记内容',
    contentPreview: '这是一个私密笔记内容',
    fullContent: `---
created_at: 2024-01-02T10:00:00Z
updated_at: 2024-01-02T10:00:00Z
private: true
tags: [私密, 测试]
---

这是一个私密笔记内容`,
    created_at: '2024-01-02T10:00:00Z',
    updated_at: '2024-01-02T10:00:00Z',
    createdDate: '2024-01-02T10:00:00Z',
    updatedDate: '2024-01-02T10:00:00Z',
    isPrivate: true,
    tags: ['私密', '测试'],
    sha: 'def456',
    size: 120,
    type: 'file',
    url: 'https://api.github.com/repos/test/test/contents/notes/2024-01-02-private-note.md',
    git_url: 'https://api.github.com/repos/test/test/git/blobs/def456',
    html_url: 'https://github.com/test/test/blob/main/notes/2024-01-02-private-note.md',
    download_url: 'https://raw.githubusercontent.com/test/test/main/notes/2024-01-02-private-note.md'
  }
]

export const mockBuildInfo = {
  buildTime: '2024-01-01T12:00:00Z',
  totalNotes: 2,
  publicNotes: 1,
  privateNotes: 1,
  tags: ['测试', '示例', '私密'],
  type: 'complete' as const
}

export const mockPublicNotesData = {
  notes: [mockNotes[0]], // 只包含公开笔记
  buildInfo: {
    ...mockBuildInfo,
    type: 'public' as const
  }
}

export const mockAllNotesData = {
  notes: mockNotes,
  buildInfo: mockBuildInfo
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    initialEntries = ['/'],
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  }
}

// Mock fetch responses
export function mockFetchResponse(data: any, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue(data),
    headers: {
      get: vi.fn().mockReturnValue('application/json')
    }
  })
}

// Mock GitHub API responses
export function mockGitHubAPISuccess(data: any) {
  return mockFetchResponse(data, true, 200)
}

export function mockGitHubAPIError(message = 'API Error', status = 400) {
  return mockFetchResponse({ message }, false, status)
}

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Mock console methods
export function mockConsole() {
  const originalConsole = { ...console }
  
  beforeEach(() => {
    console.log = vi.fn()
    console.error = vi.fn()
    console.warn = vi.fn()
    console.info = vi.fn()
  })
  
  afterEach(() => {
    Object.assign(console, originalConsole)
  })
}

// Mock timers
export function mockTimers() {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  
  afterEach(() => {
    vi.useRealTimers()
  })
}
