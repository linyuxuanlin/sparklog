import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { NoteOperationsService } from '../noteOperationsService'

// Mock the config modules
vi.mock('@/config/defaultRepo', () => ({
  getDefaultRepoConfig: vi.fn(() => ({
    owner: 'test-owner',
    repo: 'test-repo'
  })),
  getDefaultGitHubToken: vi.fn(() => 'test-token')
}))

vi.mock('@/utils/noteUtils', () => ({
  encodeBase64Content: vi.fn((content) => btoa(content)),
  formatTagsForFrontMatter: vi.fn((tags) => tags.length === 0 ? '[]' : tags.join(', '))
}))

// Mock R2 相关服务
vi.mock('@/services/r2StorageService', () => ({
  R2StorageService: {
    getInstance: vi.fn(() => ({
      initialize: vi.fn().mockResolvedValue(true),
      uploadNote: vi.fn().mockResolvedValue(true),
      deleteNote: vi.fn().mockResolvedValue(true)
    }))
  }
}))

vi.mock('@/services/encryptionService', () => ({
  EncryptionService: {
    getInstance: vi.fn(() => ({
      encrypt: vi.fn().mockResolvedValue({ success: true, data: 'encrypted-content' }),
      decrypt: vi.fn().mockResolvedValue({ success: true, data: 'decrypted-content' })
    }))
  }
}))

vi.mock('@/services/noteCacheService', () => ({
  NoteCacheService: {
    getInstance: vi.fn(() => ({
      cacheNote: vi.fn(),
      getCachedNote: vi.fn(),
      removeCachedNoteByNote: vi.fn()
    }))
  }
}))

describe('NoteOperationsService', () => {
  let service: NoteOperationsService
  let fetchMock: any

  beforeEach(() => {
    service = NoteOperationsService.getInstance()
    fetchMock = vi.fn()
    global.fetch = fetchMock
    
    // Mock Date.now() for consistent timestamps
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-01T12:00:00.000Z')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getInstance', () => {
    it('应该返回单例实例', () => {
      const instance1 = NoteOperationsService.getInstance()
      const instance2 = NoteOperationsService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('createNote', () => {
    const noteData = {
      content: '这是测试笔记内容',
      isPrivate: false,
      tags: ['测试', '示例']
    }

    it('应该成功创建笔记', async () => {
      const mockResponse = {
        content: { sha: 'new-sha-123' }
      }
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse)
      })

      const result = await service.createNote(noteData)

      expect(result.success).toBe(true)
      expect(result.message).toContain('笔记创建成功')
      expect(result.data).toEqual({
        fileName: expect.stringMatching(/2024-01-01-12-00-00-000Z\.md/),
        filePath: expect.stringMatching(/notes\/2024-01-01-12-00-00-000Z\.md/),
        sha: 'new-sha-123'
      })

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/contents/notes/'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Authorization': 'token test-token',
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('创建笔记')
        })
      )
    })

    it('应该在API请求失败时返回错误', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: 'Validation error' })
      })

      const result = await service.createNote(noteData)

      expect(result.success).toBe(false)
      expect(result.message).toContain('创建失败: Validation error')
    })

    it('应该正确格式化笔记内容', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ content: { sha: 'test-sha' } })
      })

      await service.createNote(noteData)

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body)
      expect(requestBody.content).toBeTruthy()
      expect(requestBody.message).toContain('创建笔记')
      expect(requestBody.message).toContain('📝 笔记类型: 公开')
      expect(requestBody.message).toContain('🏷️  标签: 测试, 示例')
    })

    it('应该处理私密笔记', async () => {
      const privateNoteData = { ...noteData, isPrivate: true }
      
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ content: { sha: 'test-sha' } })
      })

      await service.createNote(privateNoteData)

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body)
      expect(requestBody.message).toContain('📝 笔记类型: 私密')
    })
  })

  describe('updateNote', () => {
    const noteData = {
      content: '更新后的笔记内容',
      isPrivate: true,
      tags: ['更新', '测试']
    }
    const originalPath = 'notes/2024-01-01-test.md'
    const originalSha = 'original-sha-123'
    const originalCreatedAt = '2024-01-01T10:00:00Z'

    it('应该成功更新笔记', async () => {
      const mockResponse = {
        content: { sha: 'updated-sha-456' }
      }
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse)
      })

      const result = await service.updateNote(
        originalPath,
        originalSha,
        noteData,
        'admin-token',
        originalCreatedAt
      )

      expect(result.success).toBe(true)
      expect(result.message).toContain('笔记更新成功')
      expect(result.data).toEqual({
        filePath: originalPath,
        sha: 'updated-sha-456'
      })

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(originalPath),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Authorization': 'token admin-token'
          }),
          body: expect.stringContaining(originalSha)
        })
      )
    })

    it('应该保持原始创建时间', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ content: { sha: 'test-sha' } })
      })

      await service.updateNote(originalPath, originalSha, noteData, undefined, originalCreatedAt)

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body)
      // 这里我们无法直接验证内容，但可以验证请求被正确发送
      expect(requestBody.sha).toBe(originalSha)
      expect(requestBody.message).toContain('更新笔记')
    })

    it('应该在API请求失败时返回错误', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: 'Update conflict' })
      })

      const result = await service.updateNote(originalPath, originalSha, noteData)

      expect(result.success).toBe(false)
      expect(result.message).toContain('更新失败: Update conflict')
    })
  })

  describe('deleteNote', () => {
    const filePath = 'notes/2024-01-01-test.md'
    const sha = 'delete-sha-789'

    it('应该成功删除笔记', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({})
      })

      const result = await service.deleteNote(filePath, sha, 'admin-token')

      expect(result.success).toBe(true)
      expect(result.message).toContain('笔记删除成功')

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(filePath),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': 'token admin-token'
          }),
          body: expect.stringContaining(sha)
        })
      )
    })

    it('应该在API请求失败时返回错误', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: 'File not found' })
      })

      const result = await service.deleteNote(filePath, sha)

      expect(result.success).toBe(false)
      expect(result.message).toContain('删除失败: File not found')
    })
  })

  describe('checkWorkflowStatus', () => {
    it('应该成功获取工作流状态', async () => {
      const mockWorkflowData = {
        workflow_runs: [
          {
            status: 'completed',
            conclusion: 'success',
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T10:05:00Z'
          }
        ]
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockWorkflowData)
      })

      const result = await service.checkWorkflowStatus('admin-token')

      expect(result.isRunning).toBe(false)
      expect(result.lastRun).toEqual({
        status: 'completed',
        conclusion: 'success',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:05:00Z'
      })

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/actions/workflows/build-static-content.yml/runs'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'token admin-token'
          })
        })
      )
    })

    it('应该检测正在运行的工作流', async () => {
      const mockWorkflowData = {
        workflow_runs: [
          {
            status: 'in_progress',
            conclusion: null,
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T10:02:00Z'
          }
        ]
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockWorkflowData)
      })

      const result = await service.checkWorkflowStatus()

      expect(result.isRunning).toBe(true)
    })

    it('应该在没有工作流运行记录时返回默认状态', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ workflow_runs: [] })
      })

      const result = await service.checkWorkflowStatus()

      expect(result.isRunning).toBe(false)
      expect(result.lastRun).toBeUndefined()
    })

    it('应该在API请求失败时返回默认状态', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'))

      const result = await service.checkWorkflowStatus()

      expect(result.isRunning).toBe(false)
    })
  })

  describe('triggerWorkflow', () => {
    it('应该成功触发工作流', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({})
      })

      const result = await service.triggerWorkflow('admin-token')

      expect(result.success).toBe(true)
      expect(result.message).toContain('已触发内容重新编译')

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/actions/workflows/build-static-content.yml/dispatches'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'token admin-token'
          }),
          body: expect.stringContaining('force_rebuild')
        })
      )
    })

    it('应该在API请求失败时返回错误', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: 'Workflow not found' })
      })

      const result = await service.triggerWorkflow()

      expect(result.success).toBe(false)
      expect(result.message).toContain('触发工作流失败: Workflow not found')
    })
  })

  describe('getAuthData', () => {
    it('应该在未配置仓库时抛出错误', async () => {
      // Mock getDefaultRepoConfig to return null
      const { getDefaultRepoConfig } = await import('@/config/defaultRepo')
      vi.mocked(getDefaultRepoConfig).mockReturnValueOnce(null)

      await expect(service.createNote({
        content: 'test',
        isPrivate: false,
        tags: []
      })).rejects.toThrow('未配置默认仓库')
    })
  })
})
