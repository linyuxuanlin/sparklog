import { useState, useEffect, useCallback, useRef } from 'react'
import { Note } from '@/types/Note'
import { useGitHub } from '@/hooks/useGitHub'
import { StaticContentService } from '@/services/staticContentService'

interface UseStaticNotesReturn {
  notes: Note[]
  isLoading: boolean
  error: string | null
  buildInfo: {
    buildTime?: string
    totalNotes: number
    publicNotes: number
    privateNotes: number
    tags: string[]
  } | null
  buildStatus: {
    isBuilding: boolean
    lastBuildTime?: string
    error?: string
  }
  refreshNotes: () => Promise<void>
  searchNotes: (query: string) => Note[]
  filterNotesByTags: (notesToFilter: Note[], selectedTags: string[]) => Note[]
  getAllTags: () => string[]
}

export const useStaticNotes = (): UseStaticNotesReturn => {
  const { isLoggedIn, isLoading: isGitHubLoading } = useGitHub()
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [buildInfo, setBuildInfo] = useState<any>(null)
  const [buildStatus, setBuildStatus] = useState<{
    isBuilding: boolean
    lastBuildTime?: string
    error?: string
  }>({
    isBuilding: false,
    lastBuildTime: undefined,
    error: undefined
  })
  
  // 使用 ref 避免重复加载
  const hasLoadedRef = useRef(false)
  const staticService = StaticContentService.getInstance()

  // 加载笔记数据
  const loadNotes = useCallback(async (forceRefresh = false) => {
    if (isGitHubLoading) return
    
    setIsLoading(true)
    setError(null)

    try {
      const isAuthenticated = isLoggedIn()
      console.log('加载静态笔记数据:', { isAuthenticated, forceRefresh })

      let data
      if (forceRefresh) {
        data = await staticService.refreshContent(isAuthenticated)
      } else {
        data = await staticService.getAllNotes(isAuthenticated)
      }

      setNotes(data.notes)
      setBuildInfo(data.buildInfo)

      console.log(`成功加载 ${data.notes.length} 个笔记`)

    } catch (err) {
      console.error('加载笔记失败:', err)
      const errorMessage = err instanceof Error ? err.message : '加载笔记失败'
      setError(errorMessage)
      
      // 如果加载失败，尝试设置空数据
      setNotes([])
      setBuildInfo(null)
    } finally {
      setIsLoading(false)
    }
  }, [isLoggedIn, isGitHubLoading, staticService])

  // 检查构建状态
  const checkBuildStatus = useCallback(async () => {
    try {
      const status = await staticService.getBuildStatus()
      setBuildStatus(status)
    } catch (err) {
      console.error('检查构建状态失败:', err)
    }
  }, [staticService])

  // 刷新笔记数据
  const refreshNotes = useCallback(async () => {
    console.log('手动刷新笔记数据')
    await loadNotes(true)
    await checkBuildStatus()
  }, [loadNotes, checkBuildStatus])

  // 搜索笔记
  const searchNotes = useCallback((query: string): Note[] => {
    return staticService.searchNotes(notes, query)
  }, [notes, staticService])

  // 按标签筛选笔记
  const filterNotesByTags = useCallback((notesToFilter: Note[], selectedTags: string[]): Note[] => {
    return staticService.filterNotesByTags(notesToFilter, selectedTags)
  }, [staticService])

  // 获取所有标签
  const getAllTags = useCallback((): string[] => {
    return buildInfo?.tags || []
  }, [buildInfo])

  // 初始加载
  useEffect(() => {
    if (!isGitHubLoading && !hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadNotes()
      checkBuildStatus()
    }
  }, [isGitHubLoading, loadNotes, checkBuildStatus])

  // 监听登录状态变化
  useEffect(() => {
    if (!isGitHubLoading && hasLoadedRef.current) {
      // 登录状态变化时重新加载数据
      loadNotes()
    }
  }, [isLoggedIn(), isGitHubLoading, loadNotes])

  // 定期检查构建状态
  useEffect(() => {
    const interval = setInterval(() => {
      if (buildStatus.isBuilding) {
        checkBuildStatus()
      }
    }, 10000) // 如果正在构建，每10秒检查一次

    return () => clearInterval(interval)
  }, [buildStatus.isBuilding, checkBuildStatus])

  return {
    notes,
    isLoading,
    error,
    buildInfo,
    buildStatus,
    refreshNotes,
    searchNotes,
    filterNotesByTags,
    getAllTags
  }
}
