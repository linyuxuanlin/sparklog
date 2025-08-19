import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { StaticContentService } from '@/services/staticContentService'

// Mock environment variables
vi.mock('@/config/env', () => ({
  getStaticBranch: vi.fn(() => 'static-content')
}))

describe('StaticContentService', () => {
  let staticContentService: StaticContentService
  let mockFetch: any

  beforeEach(() => {
    staticContentService = StaticContentService.getInstance()
    mockFetch = vi.fn()
    global.fetch = mockFetch
    
    // 使用全局的 window mock
    Object.defineProperty(global, 'window', {
      value: {
        location: {
          origin: 'https://example.com'
        }
      },
      writable: true
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    staticContentService.clearCache()
  })

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = StaticContentService.getInstance()
      const instance2 = StaticContentService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('getPublicNotes', () => {
    it('should get public notes successfully', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          filename: 'test-note-1.md',
          title: 'Test Note 1',
          content: '# Test Note 1\n\nContent 1',
          excerpt: 'Content 1',
          createdDate: '2024-01-01T00:00:00.000Z',
          updatedDate: '2024-01-01T00:00:00.000Z',
          isPrivate: false,
          tags: ['test', 'note']
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNotes),
        headers: {
          get: vi.fn((key) => {
            if (key === 'ETag') return '"etag-123"'
            if (key === 'Last-Modified') return 'Wed, 01 Jan 2024 00:00:00 GMT'
            return null
          })
        }
      })

      const result = await staticContentService.getPublicNotes()
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockNotes)
      expect(result.lastModified).toBe('Wed, 01 Jan 2024 00:00:00 GMT')
    })

    it('should handle 404 errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      const result = await staticContentService.getPublicNotes()
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('静态内容文件不存在，可能还在构建中')
    })

    it('should handle other API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      const result = await staticContentService.getPublicNotes()
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('获取静态内容失败: 500 - Internal Server Error')
    })

    it('should use cache for subsequent calls', async () => {
      const mockNotes = [{ id: 'note-1', title: 'Test Note' }]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNotes),
        headers: {
          get: vi.fn(() => null)
        }
      })

      // First call
      await staticContentService.getPublicNotes()
      
      // Second call should use cache
      const result = await staticContentService.getPublicNotes()
      
      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(1) // Only called once due to caching
    })
  })

  describe('getAllNotes', () => {
    it('should get all notes successfully', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          filename: 'test-note-1.md',
          title: 'Test Note 1',
          content: '# Test Note 1\n\nContent 1',
          excerpt: 'Content 1',
          createdDate: '2024-01-01T00:00:00.000Z',
          updatedDate: '2024-01-01T00:00:00.000Z',
          isPrivate: false,
          tags: ['test', 'note']
        },
        {
          id: 'note-2',
          filename: 'test-note-2.md',
          title: 'Test Note 2',
          content: '# Test Note 2\n\nContent 2',
          excerpt: 'Content 2',
          createdDate: '2024-01-02T00:00:00.000Z',
          updatedDate: '2024-01-02T00:00:00.000Z',
          isPrivate: true,
          tags: ['private', 'note']
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNotes),
        headers: {
          get: vi.fn((key) => {
            if (key === 'ETag') return '"etag-456"'
            if (key === 'Last-Modified') return 'Thu, 02 Jan 2024 00:00:00 GMT'
            return null
          })
        }
      })

      const result = await staticContentService.getAllNotes()
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockNotes)
      expect(result.lastModified).toBe('Thu, 02 Jan 2024 00:00:00 GMT')
    })

    it('should handle 404 errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      const result = await staticContentService.getAllNotes()
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('所有笔记静态内容文件不存在，可能还在构建中')
    })
  })

  describe('checkBuildStatus', () => {
    it('should return isBuilding false when public notes exist', async () => {
      const mockNotes = [{ id: 'note-1', title: 'Test Note' }]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNotes),
        headers: {
          get: vi.fn(() => null)
        }
      })

      const status = await staticContentService.checkBuildStatus()
      
      expect(status.isBuilding).toBe(false)
      expect(status.lastBuildTime).toBeDefined()
    })

    it('should return isBuilding true when public notes do not exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      const status = await staticContentService.checkBuildStatus()
      
      expect(status.isBuilding).toBe(true)
      expect(status.lastBuildTime).toBeUndefined()
    })

    it('should handle errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const status = await staticContentService.checkBuildStatus()
      
      expect(status.isBuilding).toBe(true)
    })
  })

  describe('forceRefresh', () => {
    it('should clear cache and allow fresh requests', async () => {
      const mockNotes = [{ id: 'note-1', title: 'Test Note' }]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNotes),
        headers: {
          get: vi.fn(() => null)
        }
      })

      // First call to populate cache
      await staticContentService.getPublicNotes()
      
      // Force refresh
      await staticContentService.forceRefresh()
      
      // Second call should make a new request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNotes),
        headers: {
          get: vi.fn(() => null)
        }
      })
      
      await staticContentService.getPublicNotes()
      
      expect(mockFetch).toHaveBeenCalledTimes(2) // Called twice due to cache clearing
    })
  })

  describe('getStaticBranchUrl', () => {
    it('should generate correct URL for GitHub Pages', async () => {
      // Mock GitHub Pages URL
      Object.defineProperty(global, 'window', {
        value: {
          location: {
            origin: 'https://username.github.io'
          }
        },
        writable: true
      })

      const mockNotes = [{ id: 'note-1', title: 'Test Note' }]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNotes),
        headers: {
          get: vi.fn(() => null)
        }
      })

      await staticContentService.getPublicNotes()
      
      // Check if the fetch was called with the correct GitHub Pages URL format
      expect(mockFetch).toHaveBeenCalledWith(
        'https://raw.githubusercontent.com/username.github.io/static-content/public-notes.json',
        expect.any(Object)
      )
    })

    it('should generate correct URL for other platforms', async () => {
      // Mock other platform URL
      Object.defineProperty(global, 'window', {
        value: {
          location: {
            origin: 'https://example.com'
          }
        },
        writable: true
      })

      const mockNotes = [{ id: 'note-1', title: 'Test Note' }]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNotes),
        headers: {
          get: vi.fn(() => null)
        }
      })

      await staticContentService.getPublicNotes()
      
      // Check if the fetch was called with the correct URL format
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/static-content/public-notes.json',
        expect.any(Object)
      )
    })
  })
})
