import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { GitHubService } from '../githubService'

// 模拟配置模块
vi.mock('@/config/defaultRepo', () => ({
  getDefaultRepoConfig: vi.fn(() => ({
    owner: 'testuser',
    repo: 'testrepo'
  })),
  getDefaultGitHubToken: vi.fn(() => 'test-token')
}))

describe('GitHubService', () => {
  let service: GitHubService
  let mockFetch: any

  beforeEach(() => {
    vi.clearAllMocks()
    service = GitHubService.getInstance()
    
    // 模拟 fetch
    mockFetch = vi.fn()
    global.fetch = mockFetch
  })

  afterEach(() => {
    service.clearCache()
  })

  describe('getInstance', () => {
    it('应该返回单例实例', () => {
      const instance1 = GitHubService.getInstance()
      const instance2 = GitHubService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('setAuthData', () => {
    it('应该设置认证数据', () => {
      const authData = {
        username: 'newuser',
        repo: 'newrepo',
        accessToken: 'new-token'
      }
      
      service.setAuthData(authData)
      
      // 通过调用需要认证的方法来验证
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => []
      })
      
      service.getNotesFiles()
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/newuser/newrepo/contents/notes',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'token new-token'
          })
        })
      )
    })
  })

  describe('getNotesFiles', () => {
    it('应该成功获取笔记文件列表', async () => {
      const mockFiles = [
        {
          name: 'note1.md',
          path: 'notes/note1.md',
          sha: 'sha1',
          url: 'url1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          type: 'file'
        },
        {
          name: 'note2.md',
          path: 'notes/note2.md',
          sha: 'sha2',
          url: 'url2',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          type: 'file'
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: vi.fn((name: string) => name === 'ETag' ? 'etag123' : null)
        },
        json: async () => mockFiles
      })

      const result = await service.getNotesFiles()

      expect(result).toHaveLength(2)
      // 由于排序逻辑，顺序可能不同，所以检查是否包含这两个文件
      expect(result.map(f => f.name)).toContain('note1.md')
      expect(result.map(f => f.name)).toContain('note2.md')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/contents/notes'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('token ')
          })
        })
      )
    })

    it('应该过滤非 markdown 文件', async () => {
      const mockFiles = [
        {
          name: 'note1.md',
          path: 'notes/note1.md',
          sha: 'sha1',
          url: 'url1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          type: 'file'
        },
        {
          name: 'image.png',
          path: 'notes/image.png',
          sha: 'sha2',
          url: 'url2',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          type: 'file'
        },
        {
          name: 'folder',
          path: 'notes/folder',
          sha: 'sha3',
          url: 'url3',
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z',
          type: 'dir'
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: vi.fn((name: string) => name === 'ETag' ? 'etag123' : null)
        },
        json: async () => mockFiles
      })

      const result = await service.getNotesFiles()

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('note1.md')
    })

    it('应该处理 404 错误（notes 目录不存在）', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      const result = await service.getNotesFiles()

      expect(result).toEqual([])
    })

    it('应该处理其他 API 错误', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'GitHub API 错误' })
      })

      await expect(service.getNotesFiles()).rejects.toThrow('GitHub API错误: 500 - GitHub API 错误')
    })

    it('应该使用缓存当内容未改变', async () => {
      const mockFiles = [
        {
          name: 'note1.md',
          path: 'notes/note1.md',
          sha: 'sha1',
          url: 'url1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          type: 'file'
        }
      ]

      // 第一次调用
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: vi.fn((name: string) => name === 'ETag' ? 'etag123' : null)
        },
        json: async () => mockFiles
      })

      await service.getNotesFiles()

      // 第二次调用，返回 304
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 304,
        headers: {
          get: vi.fn((name: string) => name === 'ETag' ? 'etag123' : null)
        }
      })

      const result = await service.getNotesFiles()

      expect(result).toEqual(mockFiles)
      // 由于缓存机制，第二次调用可能不会触发新的 fetch
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('getBatchNotesContent', () => {
    it('应该批量获取笔记内容', async () => {
      const mockFiles = [
        {
          name: 'note1.md',
          path: 'notes/note1.md',
          sha: 'sha1',
          url: 'url1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          type: 'file'
        },
        {
          name: 'note2.md',
          path: 'notes/note2.md',
          sha: 'sha2',
          url: 'url2',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          type: 'file'
        }
      ]

      const mockContent1 = {
        content: 'SGVsbG8gV29ybGQ=', // Base64 for "Hello World"
        encoding: 'base64',
        sha: 'sha1'
      }

      const mockContent2 = {
        content: 'VGVzdCBjb250ZW50', // Base64 for "Test content"
        encoding: 'base64',
        sha: 'sha2'
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map([['ETag', 'etag1']]),
          json: async () => mockContent1
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map([['ETag', 'etag2']]),
          json: async () => mockContent2
        })

      const result = await service.getBatchNotesContent(mockFiles)

      expect(Object.keys(result)).toHaveLength(2)
      expect(result['notes/note1.md']).toEqual(mockContent1)
      expect(result['notes/note2.md']).toEqual(mockContent2)
    })

    it('应该处理空文件列表', async () => {
      const result = await service.getBatchNotesContent([])
      expect(result).toEqual({})
    })

    it('应该处理获取内容失败的情况', async () => {
      const mockFiles = [
        {
          name: 'note1.md',
          path: 'notes/note1.md',
          sha: 'sha1',
          url: 'url1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          type: 'file'
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      const result = await service.getBatchNotesContent(mockFiles)

      expect(result).toEqual({})
    })
  })

  describe('getSingleNoteContent', () => {
    it('应该获取单个笔记内容', async () => {
      const mockFile = {
        name: 'note1.md',
        path: 'notes/note1.md',
        sha: 'sha1',
        url: 'url1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        type: 'file'
      }

      const mockContent = {
        content: 'SGVsbG8gV29ybGQ=',
        encoding: 'base64',
        sha: 'sha1'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockContent
      })

      const result = await service.getSingleNoteContent(mockFile)

      expect(result).toEqual(mockContent)
    })

    it('应该处理获取失败的情况', async () => {
      const mockFile = {
        name: 'note1.md',
        path: 'notes/note1.md',
        sha: 'sha1',
        url: 'url1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        type: 'file'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      const result = await service.getSingleNoteContent(mockFile)

      expect(result).toBeNull()
    })
  })

  describe('deleteNote', () => {
    it('应该成功删除笔记', async () => {
      const mockNote = {
        name: 'note1.md',
        path: 'notes/note1.md',
        sha: 'sha1'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      })

      const result = await service.deleteNote(mockNote)

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/contents/notes/note1.md'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('token'),
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            message: '删除笔记: note1.md',
            sha: 'sha1'
          })
        })
      )
    })

    it('应该处理删除失败的情况', async () => {
      const mockNote = {
        name: 'note1.md',
        path: 'notes/note1.md',
        sha: 'sha1'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: '文件不存在' })
      })

      await expect(service.deleteNote(mockNote)).rejects.toThrow('删除失败: 文件不存在')
    })
  })

  describe('缓存管理', () => {
    it('应该清除所有缓存', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      service.clearCache()
      expect(consoleSpy).toHaveBeenCalledWith('GitHub API 缓存已清除')
    })

    it('应该清除特定类型的缓存', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      service.clearCacheByType('files')
      expect(consoleSpy).toHaveBeenCalledWith('已清除 files 类型的缓存，共 0 项')
    })
  })
})
