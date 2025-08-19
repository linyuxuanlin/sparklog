import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { R2Service } from '@/services/r2Service'

// Mock environment variables
vi.mock('@/config/env', () => ({
  getR2Config: vi.fn(() => ({
    accountId: 'test-account-id',
    accessKeyId: 'test-access-key-id',
    secretAccessKey: 'test-secret-access-key',
    bucketName: 'test-bucket',
    publicUrl: 'https://test.example.com'
  }))
}))

describe('R2Service', () => {
  let r2Service: R2Service
  let mockFetch: any

  beforeEach(() => {
    r2Service = R2Service.getInstance()
    mockFetch = vi.fn()
    global.fetch = mockFetch
  })

  afterEach(() => {
    vi.clearAllMocks()
    r2Service.clearCache()
  })

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = R2Service.getInstance()
      const instance2 = R2Service.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('listFiles', () => {
    it('should list files successfully', async () => {
      const mockXmlResponse = `
        <?xml version="1.0" encoding="UTF-8"?>
        <ListBucketResult>
          <Contents>
            <Key>notes/test-note.md</Key>
            <Size>1024</Size>
            <LastModified>2024-01-01T00:00:00.000Z</LastModified>
            <ETag>"test-etag"</ETag>
          </Contents>
        </ListBucketResult>
      `

      // Mock DOMParser for this specific test
      const mockDOMParser = vi.fn().mockImplementation(() => ({
        parseFromString: vi.fn().mockReturnValue({
          getElementsByTagName: vi.fn().mockReturnValue([
            {
              getElementsByTagName: vi.fn().mockImplementation((tagName: string) => {
                switch (tagName) {
                  case 'Key':
                    return [{ textContent: 'notes/test-note.md' }]
                  case 'Size':
                    return [{ textContent: '1024' }]
                  case 'LastModified':
                    return [{ textContent: '2024-01-01T00:00:00.000Z' }]
                  case 'ETag':
                    return [{ textContent: '"test-etag"' }]
                  default:
                    return []
                }
              })
            }
          ])
        })
      }))
      
      // Temporarily replace global DOMParser
      const originalDOMParser = global.DOMParser
      global.DOMParser = mockDOMParser

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockXmlResponse)
      })

      const files = await r2Service.listFiles('notes/')
      
      expect(files).toHaveLength(1)
      expect(files[0].name).toBe('test-note.md')
      expect(files[0].path).toBe('notes/test-note.md')
      expect(files[0].size).toBe(1024)
      expect(files[0].etag).toBe('test-etag')

      // Restore original DOMParser
      global.DOMParser = originalDOMParser
    })

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      await expect(r2Service.listFiles()).rejects.toThrow('R2 API 错误: 500 - Internal Server Error')
    })

    it('should use cache for subsequent calls', async () => {
      const mockXmlResponse = `
        <?xml version="1.0" encoding="UTF-8"?>
        <ListBucketResult>
          <Contents>
            <Key>notes/test-note.md</Key>
            <Size>1024</Size>
            <LastModified>2024-01-01T00:00:00.000Z</LastModified>
            <ETag>"test-etag"</ETag>
          </Contents>
        </ListBucketResult>
      `

      // Mock DOMParser for this specific test
      const mockDOMParser = vi.fn().mockImplementation(() => ({
        parseFromString: vi.fn().mockReturnValue({
          getElementsByTagName: vi.fn().mockReturnValue([
            {
              getElementsByTagName: vi.fn().mockReturnValue([
                { textContent: 'notes/test-note.md' },
                { textContent: '1024' },
                { textContent: '2024-01-01T00:00:00.000Z' },
                { textContent: '"test-etag"' }
              ])
            }
          ])
        })
      }))
      
      // Temporarily replace global DOMParser
      const originalDOMParser = global.DOMParser
      global.DOMParser = mockDOMParser

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockXmlResponse)
      })

      // First call
      await r2Service.listFiles()
      
      // Second call should use cache
      const files = await r2Service.listFiles()
      
      expect(files).toHaveLength(1)
      expect(mockFetch).toHaveBeenCalledTimes(1) // Only called once due to caching

      // Restore original DOMParser
      global.DOMParser = originalDOMParser
    })
  })

  describe('getFileContent', () => {
    it('should get file content successfully', async () => {
      const mockContent = '# Test Note\n\nThis is a test note content.'
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockContent)
      })

      const content = await r2Service.getFileContent('notes/test-note.md')
      
      expect(content).toBe(mockContent)
    })

    it('should return null for non-existent files', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      const content = await r2Service.getFileContent('notes/non-existent.md')
      
      expect(content).toBeNull()
    })

    it('should use cache for subsequent calls', async () => {
      const mockContent = '# Test Note\n\nThis is a test note content.'
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockContent)
      })

      // First call
      await r2Service.getFileContent('notes/test-note.md')
      
      // Second call should use cache
      const content = await r2Service.getFileContent('notes/test-note.md')
      
      expect(content).toBe(mockContent)
      expect(mockFetch).toHaveBeenCalledTimes(1) // Only called once due to caching
    })
  })

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: vi.fn(() => '"uploaded-etag"')
        }
      })

      const result = await r2Service.uploadFile('notes/test-note.md', '# Test Note', false)
      
      expect(result.success).toBe(true)
      expect(result.etag).toBe('uploaded-etag')
    })

    it('should handle upload errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      const result = await r2Service.uploadFile('notes/test-note.md', '# Test Note', false)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('R2 上传失败: 500 - Internal Server Error')
    })
  })

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true
      })

      const result = await r2Service.deleteFile('notes/test-note.md')
      
      expect(result).toBe(true)
    })

    it('should handle delete errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      await expect(r2Service.deleteFile('notes/test-note.md')).rejects.toThrow('R2 删除失败: 500 - Internal Server Error')
    })
  })

  describe('getBatchFileContent', () => {
    it('should get batch file content successfully', async () => {
      const mockFiles = [
        { path: 'notes/note1.md', name: 'note1.md' },
        { path: 'notes/note2.md', name: 'note2.md' }
      ]

      const mockContent1 = '# Note 1\n\nContent 1'
      const mockContent2 = '# Note 2\n\nContent 2'

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockContent1)
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockContent2)
        })

      const result = await r2Service.getBatchFileContent(mockFiles)
      
      expect(Object.keys(result)).toHaveLength(2)
      expect(result['notes/note1.md']).toBe(mockContent1)
      expect(result['notes/note2.md']).toBe(mockContent2)
    })

    it('should handle empty file list', async () => {
      const result = await r2Service.getBatchFileContent([])
      
      expect(result).toEqual({})
    })
  })

  describe('clearCache', () => {
    it('should clear all cache', async () => {
      // First, populate cache
      const mockXmlResponse = `
        <?xml version="1.0" encoding="UTF-8"?>
        <ListBucketResult>
          <Contents>
            <Key>notes/test-note.md</Key>
            <Size>1024</Size>
            <LastModified>2024-01-01T00:00:00.000Z</LastModified>
            <ETag>"test-etag"</ETag>
          </Contents>
        </ListBucketResult>
      `

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockXmlResponse)
      })

      await r2Service.listFiles()
      
      // Clear cache
      r2Service.clearCache()
      
      // Try to get files again - should make a new API call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockXmlResponse)
      })
      
      await r2Service.listFiles()
      
      expect(mockFetch).toHaveBeenCalledTimes(2) // Called twice due to cache clearing
    })
  })
})
