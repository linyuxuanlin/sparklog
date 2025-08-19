import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useStaticNotes } from '../useStaticNotes'
import { mockAllNotesData, mockPublicNotesData, mockBuildInfo } from '../../test/utils'

// Mock dependencies
vi.mock('@/hooks/useGitHub', () => ({
  useGitHub: vi.fn(() => ({
    isLoggedIn: vi.fn(() => false),
    isLoading: false
  }))
}))

vi.mock('@/services/staticContentService', () => ({
  StaticContentService: {
    getInstance: vi.fn()
  }
}))

describe('useStaticNotes', () => {
  let mockStaticService: any
  let mockUseGitHub: any

  beforeEach(async () => {
    // Mock StaticContentService
    mockStaticService = {
      getAllNotes: vi.fn(),
      refreshContent: vi.fn(),
      getBuildStatus: vi.fn(),
      searchNotes: vi.fn(),
      filterNotesByTags: vi.fn(),
      getInstance: vi.fn(() => mockStaticService)
    }

    // Mock useGitHub
    mockUseGitHub = {
      isLoggedIn: vi.fn(() => false),
      isLoading: false
    }

    const { StaticContentService } = await import('@/services/staticContentService')
    vi.mocked(StaticContentService.getInstance).mockReturnValue(mockStaticService)

    const { useGitHub } = await import('@/hooks/useGitHub')
    vi.mocked(useGitHub).mockReturnValue(mockUseGitHub)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('初始化加载', () => {
    it('应该在组件挂载时加载笔记数据', async () => {
      mockStaticService.getAllNotes.mockResolvedValueOnce(mockPublicNotesData)
      mockStaticService.getBuildStatus.mockResolvedValueOnce({
        isBuilding: false,
        lastBuildTime: '2024-01-01T12:00:00Z'
      })

      const { result } = renderHook(() => useStaticNotes())

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockStaticService.getAllNotes).toHaveBeenCalledWith(false)
      expect(mockStaticService.getBuildStatus).toHaveBeenCalled()
      expect(result.current.notes).toEqual(mockPublicNotesData.notes)
      expect(result.current.buildInfo).toEqual(mockPublicNotesData.buildInfo)
    })

    it('应该在GitHub正在加载时等待', () => {
      mockUseGitHub.isLoading = true

      const { result } = renderHook(() => useStaticNotes())

      expect(result.current.isLoading).toBe(false)
      expect(mockStaticService.getAllNotes).not.toHaveBeenCalled()
    })

    it('应该处理加载错误', async () => {
      const errorMessage = '网络连接失败'
      mockStaticService.getAllNotes.mockRejectedValueOnce(new Error(errorMessage))
      mockStaticService.getBuildStatus.mockResolvedValueOnce({
        isBuilding: false
      })

      const { result } = renderHook(() => useStaticNotes())

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage)
      })

      expect(result.current.notes).toEqual([])
      expect(result.current.buildInfo).toBeNull()
    })
  })

  describe('登录状态变化', () => {
    it('应该在登录状态变化时重新加载数据', async () => {
      // 初始状态：未登录
      mockStaticService.getAllNotes.mockResolvedValueOnce(mockPublicNotesData)
      mockStaticService.getBuildStatus.mockResolvedValueOnce({
        isBuilding: false
      })

      const { result, rerender } = renderHook(() => useStaticNotes())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockStaticService.getAllNotes).toHaveBeenCalledWith(false)
      expect(result.current.notes).toHaveLength(1)

      // 模拟用户登录
      mockUseGitHub.isLoggedIn.mockReturnValue(true)
      mockStaticService.getAllNotes.mockResolvedValueOnce(mockAllNotesData)

      rerender()

      await waitFor(() => {
        expect(mockStaticService.getAllNotes).toHaveBeenCalledWith(true)
      })

      expect(result.current.notes).toHaveLength(2)
    })
  })

  describe('refreshNotes', () => {
    it('应该强制刷新笔记数据', async () => {
      mockStaticService.getAllNotes.mockResolvedValueOnce(mockPublicNotesData)
      mockStaticService.refreshContent.mockResolvedValueOnce(mockAllNotesData)
      mockStaticService.getBuildStatus.mockResolvedValue({
        isBuilding: false
      })

      const { result } = renderHook(() => useStaticNotes())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // 调用刷新
      await result.current.refreshNotes()

      expect(mockStaticService.refreshContent).toHaveBeenCalledWith(false)
      expect(mockStaticService.getBuildStatus).toHaveBeenCalledTimes(2)
    })
  })

  describe('searchNotes', () => {
    it('应该调用静态服务的搜索方法', async () => {
      const searchResults = [mockAllNotesData.notes[0]]
      mockStaticService.getAllNotes.mockResolvedValueOnce(mockAllNotesData)
      mockStaticService.getBuildStatus.mockResolvedValueOnce({
        isBuilding: false
      })
      mockStaticService.searchNotes.mockReturnValue(searchResults)

      const { result } = renderHook(() => useStaticNotes())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const searchResult = result.current.searchNotes('测试')

      expect(mockStaticService.searchNotes).toHaveBeenCalledWith(
        mockAllNotesData.notes,
        '测试'
      )
      expect(searchResult).toEqual(searchResults)
    })
  })

  describe('filterNotesByTags', () => {
    it('应该调用静态服务的标签筛选方法', async () => {
      const filterResults = [mockAllNotesData.notes[1]]
      mockStaticService.getAllNotes.mockResolvedValueOnce(mockAllNotesData)
      mockStaticService.getBuildStatus.mockResolvedValueOnce({
        isBuilding: false
      })
      mockStaticService.filterNotesByTags.mockReturnValue(filterResults)

      const { result } = renderHook(() => useStaticNotes())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const notes = mockAllNotesData.notes
      const filterResult = result.current.filterNotesByTags(notes, ['私密'])

      expect(mockStaticService.filterNotesByTags).toHaveBeenCalledWith(
        notes,
        ['私密']
      )
      expect(filterResult).toEqual(filterResults)
    })
  })

  describe('getAllTags', () => {
    it('应该返回构建信息中的标签', async () => {
      mockStaticService.getAllNotes.mockResolvedValueOnce(mockAllNotesData)
      mockStaticService.getBuildStatus.mockResolvedValueOnce({
        isBuilding: false
      })

      const { result } = renderHook(() => useStaticNotes())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const tags = result.current.getAllTags()

      expect(tags).toEqual(mockBuildInfo.tags)
    })

    it('应该在没有构建信息时返回空数组', async () => {
      mockStaticService.getAllNotes.mockResolvedValueOnce({
        notes: [],
        buildInfo: null
      })
      mockStaticService.getBuildStatus.mockResolvedValueOnce({
        isBuilding: false
      })

      const { result } = renderHook(() => useStaticNotes())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const tags = result.current.getAllTags()

      expect(tags).toEqual([])
    })
  })

  describe('buildStatus', () => {
    it('应该定期检查构建状态', async () => {
      vi.useFakeTimers()

      mockStaticService.getAllNotes.mockResolvedValueOnce(mockPublicNotesData)
      mockStaticService.getBuildStatus
        .mockResolvedValueOnce({ isBuilding: true })
        .mockResolvedValueOnce({ isBuilding: false })

      const { result } = renderHook(() => useStaticNotes())

      await waitFor(() => {
        expect(result.current.buildStatus.isBuilding).toBe(true)
      })

      // 快进10秒
      vi.advanceTimersByTime(10000)

      await waitFor(() => {
        expect(mockStaticService.getBuildStatus).toHaveBeenCalledTimes(2)
      })

      vi.useRealTimers()
    })

    it('应该在构建完成时停止定期检查', async () => {
      vi.useFakeTimers()

      mockStaticService.getAllNotes.mockResolvedValueOnce(mockPublicNotesData)
      mockStaticService.getBuildStatus.mockResolvedValue({
        isBuilding: false
      })

      const { result } = renderHook(() => useStaticNotes())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // 快进10秒
      vi.advanceTimersByTime(10000)

      // 不应该再次检查状态
      expect(mockStaticService.getBuildStatus).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })
  })

  describe('错误处理', () => {
    it('应该处理getBuildStatus的错误', async () => {
      mockStaticService.getAllNotes.mockResolvedValueOnce(mockPublicNotesData)
      mockStaticService.getBuildStatus.mockRejectedValueOnce(new Error('Status check failed'))

      const { result } = renderHook(() => useStaticNotes())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // 应该正常加载笔记数据，即使构建状态检查失败
      expect(result.current.notes).toEqual(mockPublicNotesData.notes)
      expect(result.current.buildStatus.isBuilding).toBe(false)
    })

    it('应该处理refreshNotes的错误', async () => {
      mockStaticService.getAllNotes.mockResolvedValueOnce(mockPublicNotesData)
      mockStaticService.refreshContent.mockRejectedValueOnce(new Error('Refresh failed'))
      mockStaticService.getBuildStatus.mockResolvedValue({
        isBuilding: false
      })

      const { result } = renderHook(() => useStaticNotes())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // 调用刷新应该设置错误状态
      await result.current.refreshNotes()

      expect(result.current.error).toBe('Refresh failed')
    })
  })
})
