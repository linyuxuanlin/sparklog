import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { StaticContentService } from '../staticContentService'
import { mockPublicNotesData, mockAllNotesData, mockBuildInfo } from '../../test/utils'

describe('StaticContentService', () => {
  let service: StaticContentService
  let fetchMock: any

  beforeEach(() => {
    // 获取单例实例
    service = StaticContentService.getInstance()
    // 清除缓存
    service.clearCache()
    
    // Mock fetch
    fetchMock = vi.fn()
    global.fetch = fetchMock
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getInstance', () => {
    it('应该返回单例实例', () => {
      const instance1 = StaticContentService.getInstance()
      const instance2 = StaticContentService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('getPublicNotes', () => {
    it('应该成功获取公开笔记数据', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockPublicNotesData)
      })

      const result = await service.getPublicNotes()

      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/public-notes.json'))
      expect(result).toEqual(mockPublicNotesData)
      expect(result.notes).toHaveLength(1)
      expect(result.notes[0].isPrivate).toBe(false)
    })

    it('应该在请求失败时抛出错误', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      await expect(service.getPublicNotes()).rejects.toThrow('加载公开笔记失败: 404 Not Found')
    })

    it('应该验证数据格式', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ invalid: 'data' })
      })

      await expect(service.getPublicNotes()).rejects.toThrow('公开笔记数据格式无效')
    })

    it('应该使用缓存', async () => {
      // 第一次请求
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockPublicNotesData)
      })

      await service.getPublicNotes()

      // 第二次请求应该使用缓存，不会再次调用fetch
      const result = await service.getPublicNotes()

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockPublicNotesData)
    })
  })

  describe('getAllNotes', () => {
    it('应该在未认证时返回公开笔记', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockPublicNotesData)
      })

      const result = await service.getAllNotes(false)

      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/public-notes.json'))
      expect(result).toEqual(mockPublicNotesData)
    })

    it('应该在认证后返回完整笔记数据', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockAllNotesData)
      })

      const result = await service.getAllNotes(true)

      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/all-notes.json'))
      expect(result).toEqual(mockAllNotesData)
      expect(result.notes).toHaveLength(2)
    })

    it('应该在完整笔记文件不存在时降级到公开笔记', async () => {
      // 第一次请求all-notes.json失败
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      // 第二次请求public-notes.json成功
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockPublicNotesData)
      })

      const result = await service.getAllNotes(true)

      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(result).toEqual(mockPublicNotesData)
    })
  })

  describe('getBuildInfo', () => {
    it('应该成功获取构建信息', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockBuildInfo)
      })

      const result = await service.getBuildInfo()

      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/build-info.json'))
      expect(result).toEqual(mockBuildInfo)
    })

    it('应该在文件不存在时返回null', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      const result = await service.getBuildInfo()

      expect(result).toBeNull()
    })
  })

  describe('getBuildStatus', () => {
    it('应该返回基本的构建状态', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockBuildInfo)
      })

      const result = await service.getBuildStatus()

      expect(result).toEqual({
        isBuilding: false,
        lastBuildTime: mockBuildInfo.buildTime,
        error: undefined
      })
    })

    it('应该在获取构建信息失败时返回错误状态', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'))

      const result = await service.getBuildStatus()

      expect(result.isBuilding).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('refreshContent', () => {
    it('应该清除缓存并重新加载数据', async () => {
      // 先加载一次数据建立缓存
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockAllNotesData)
      })

      await service.getAllNotes(true)
      expect(fetchMock).toHaveBeenCalledTimes(1)

      // 刷新内容应该清除缓存并重新请求
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockAllNotesData)
      })

      const result = await service.refreshContent(true)

      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(result).toEqual(mockAllNotesData)
    })
  })

  describe('getAllTags', () => {
    it('应该返回构建信息中的标签', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockAllNotesData)
      })

      const tags = await service.getAllTags(true)

      expect(tags).toEqual(mockBuildInfo.tags)
    })

    it('应该在获取失败时返回空数组', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'))

      const tags = await service.getAllTags(true)

      expect(tags).toEqual([])
    })
  })

  describe('searchNotes', () => {
    it('应该根据内容搜索笔记', () => {
      const notes = mockAllNotesData.notes
      const result = service.searchNotes(notes, '测试')

      expect(result).toHaveLength(2)
      expect(result.every(note => 
        note.content?.includes('测试') || 
        note.tags?.includes('测试') ||
        note.name?.includes('测试')
      )).toBe(true)
    })

    it('应该根据标签搜索笔记', () => {
      const notes = mockAllNotesData.notes
      const result = service.searchNotes(notes, '私密')

      expect(result).toHaveLength(1)
      expect(result[0].isPrivate).toBe(true)
    })

    it('应该在空查询时返回所有笔记', () => {
      const notes = mockAllNotesData.notes
      const result = service.searchNotes(notes, '')

      expect(result).toEqual(notes)
    })

    it('应该忽略大小写', () => {
      const notes = mockAllNotesData.notes
      const result = service.searchNotes(notes, '测试')

      expect(result).toHaveLength(2)
    })
  })

  describe('filterNotesByTags', () => {
    it('应该根据标签筛选笔记', () => {
      const notes = mockAllNotesData.notes
      const result = service.filterNotesByTags(notes, ['私密'])

      expect(result).toHaveLength(1)
      expect(result[0].tags).toContain('私密')
    })

    it('应该支持多标签筛选（AND逻辑）', () => {
      const notes = mockAllNotesData.notes
      const result = service.filterNotesByTags(notes, ['私密', '测试'])

      expect(result).toHaveLength(1)
      expect(result[0].tags).toEqual(expect.arrayContaining(['私密', '测试']))
    })

    it('应该在没有选择标签时返回所有笔记', () => {
      const notes = mockAllNotesData.notes
      const result = service.filterNotesByTags(notes, [])

      expect(result).toEqual(notes)
    })

    it('应该过滤掉没有标签的笔记', () => {
      const notesWithoutTags = [
        ...mockAllNotesData.notes,
        { ...mockAllNotesData.notes[0], tags: [] }
      ]
      const result = service.filterNotesByTags(notesWithoutTags, ['测试'])

      expect(result).toHaveLength(1)
      expect(result[0].tags).toContain('测试')
    })
  })

  describe('clearCache', () => {
    it('应该清除所有缓存', async () => {
      // 建立缓存
      fetchMock.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockPublicNotesData)
      })

      await service.getPublicNotes()
      expect(fetchMock).toHaveBeenCalledTimes(1)

      // 清除缓存
      service.clearCache()

      // 再次请求应该重新调用fetch
      await service.getPublicNotes()
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
  })
})
