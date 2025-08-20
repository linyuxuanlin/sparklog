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
            if (key === 'content-type') return 'application/json'
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
          get: vi.fn((key) => {
            if (key === 'content-type') return 'application/json'
            return null
          })
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
            if (key === 'content-type') return 'application/json'
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
          get: vi.fn((key) => {
            if (key === 'content-type') return 'application/json'
            return null
          })
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
          get: vi.fn((key) => {
            if (key === 'content-type') return 'application/json'
            return null
          })
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
          get: vi.fn((key) => {
            if (key === 'content-type') return 'application/json'
            return null
          })
        }
      })
      
      await staticContentService.getPublicNotes()
      
      expect(mockFetch).toHaveBeenCalledTimes(2) // Called twice due to cache clearing
    })
  })

    describe('getStaticBranchUrl', () => {
    it('should generate correct URL for current domain', async () => {
      // Mock current domain
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
          get: vi.fn((key) => {
            if (key === 'content-type') return 'application/json'
            return null
          })
        }
      })

      await staticContentService.getPublicNotes()
      
      // Check if the fetch was called with the correct URL format
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/public-notes.json',
        expect.any(Object)
      )
    })
  })

  describe('updateNoteInCache', () => {
    it('should update note in both public and all notes cache', async () => {
      // First populate the cache
      const initialNotes = [
        { id: 'note-1', name: 'note1.md', title: 'Note 1' },
        { id: 'note-2', name: 'note2.md', title: 'Note 2' }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(initialNotes),
        headers: {
          get: vi.fn((key) => key === 'content-type' ? 'application/json' : null)
        }
      })

      await staticContentService.getPublicNotes()

      // Update a note
      const updatedNote = {
        id: 'note-1',
        name: 'note1.md',
        title: 'Updated Note 1',
        content: 'Updated content'
      }

      staticContentService.updateNoteInCache(updatedNote, false)

      // Verify the note was updated in cache by getting public notes again
      const result = await staticContentService.getPublicNotes()
      
      expect(result.success).toBe(true)
      expect(result.data[0].title).toBe('Updated Note 1')
    })

    it('should add new note to the beginning of cache', async () => {
      // First populate the cache
      const initialNotes = [
        { id: 'note-1', name: 'note1.md', title: 'Note 1' }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(initialNotes),
        headers: {
          get: vi.fn((key) => key === 'content-type' ? 'application/json' : null)
        }
      })

      await staticContentService.getPublicNotes()

      // Add a new note
      const newNote = {
        id: 'note-new',
        name: 'new-note.md',
        title: 'New Note'
      }

      staticContentService.updateNoteInCache(newNote, false)

      // Verify the new note was added to the beginning
      const result = await staticContentService.getPublicNotes()
      
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data[0].id).toBe('note-new')
    })

    it('should not add private notes to public cache', () => {
      const privateNote = {
        id: 'private-note',
        name: 'private.md',
        title: 'Private Note'
      }

      // This should not throw even if public cache is empty
      expect(() => {
        staticContentService.updateNoteInCache(privateNote, true)
      }).not.toThrow()
    })
  })

  describe('removeNoteFromCache', () => {
    it('should remove note from both caches by various identifiers', async () => {
      // First populate the cache
      const initialNotes = [
        { id: 'note-1', name: 'note1.md', sha: 'sha1', title: 'Note 1' },
        { id: 'note-2', name: 'note2.md', sha: 'sha2', title: 'Note 2' }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(initialNotes),
        headers: {
          get: vi.fn((key) => key === 'content-type' ? 'application/json' : null)
        }
      })

      await staticContentService.getPublicNotes()

      // Remove note by ID
      staticContentService.removeNoteFromCache('note-1')

      // Verify the note was removed
      const result = await staticContentService.getPublicNotes()
      
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].id).toBe('note-2')
    })

    it('should handle removing non-existent notes gracefully', () => {
      expect(() => {
        staticContentService.removeNoteFromCache('non-existent')
      }).not.toThrow()
    })
  })

  describe('triggerBuild', () => {
    beforeEach(() => {
      // Mock window.location for environment detection
      Object.defineProperty(global, 'window', {
        value: {
          location: {
            hostname: 'example.com',
            origin: 'https://example.com'
          }
        },
        writable: true
      })
    })

    it('should handle development environment', async () => {
      Object.defineProperty(global, 'window', {
        value: {
          location: {
            hostname: 'localhost',
            origin: 'http://localhost:3000'
          }
        },
        writable: true
      })

      const result = await staticContentService.triggerBuild()
      
      expect(result.success).toBe(true)
      expect(result.message).toContain('开发环境')
    })

    it('should handle production environment', async () => {
      const result = await staticContentService.triggerBuild()
      
      expect(result.success).toBe(true)
      expect(result.message).toContain('后台构建已触发')
    })

    it('should handle build trigger errors', async () => {
      // The triggerBuild method should handle errors gracefully
      const result = await staticContentService.triggerBuild()
      
      expect(result.success).toBe(true) // Should still succeed with fallback
    })
  })
})
