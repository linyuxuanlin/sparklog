import { useState, useEffect, useCallback, useRef } from 'react'
import { Note } from '@/types/Note'
import { useGitHub } from '@/hooks/useGitHub'
import { useStaticNotes } from '@/hooks/useStaticNotes'
import { StaticContentService } from '@/services/staticContentService'
import { NoteCacheService, CachedNote } from '@/services/noteCacheService'
import { NoteOperationsService } from '@/services/noteOperationsService'
import { EncryptionService } from '@/services/encryptionService'
import { getR2ConfigFromEnv } from '@/config/env'

interface UseR2NotesReturn {
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
  cacheStats: {
    totalCached: number
    building: number
    completed: number
    failed: number
  }
  // 笔记操作方法
  createNote: (noteData: any, adminPassword?: string) => Promise<boolean>
  updateNote: (note: Note, noteData: any, adminPassword?: string) => Promise<boolean>
  deleteNote: (note: Note) => Promise<boolean>
  // 其他方法
  refreshNotes: () => Promise<void>
  searchNotes: (query: string) => Note[]
  filterNotesByTags: (notesToFilter: Note[], selectedTags: string[]) => Note[]
  getAllTags: () => string[]
  decryptNote: (note: Note, password: string) => Promise<Note | null>
  isR2Enabled: boolean
}

export const useR2Notes = (): UseR2NotesReturn => {
  const { isLoggedIn, isLoading: isGitHubLoading, getGitHubToken } = useGitHub()
  const staticNotesHook = useStaticNotes()
  
  const [mergedNotes, setMergedNotes] = useState<Note[]>([])
  const [cacheStats, setCacheStats] = useState({
    totalCached: 0,
    building: 0,
    completed: 0,
    failed: 0
  })
  const [isR2Enabled, setIsR2Enabled] = useState(false)
  
  // 服务实例
  const staticService = StaticContentService.getInstance()
  const cacheService = NoteCacheService.getInstance()
  const noteOpsService = NoteOperationsService.getInstance()
  const encryptionService = EncryptionService.getInstance()
  
  const hasInitializedRef = useRef(false)

  // 检查 R2 配置并初始化
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true
      
      const r2Config = getR2ConfigFromEnv()
      if (r2Config) {
        try {
          noteOpsService.initializeR2Storage(r2Config)
          setIsR2Enabled(true)
          console.log('R2 存储已启用')
        } catch (error) {
          console.error('R2 存储初始化失败:', error)
          setIsR2Enabled(false)
        }
      } else {
        console.log('未配置 R2 存储，使用传统模式')
        setIsR2Enabled(false)
      }
    }
  }, [])

  // 合并静态笔记和缓存笔记
  const updateMergedNotes = useCallback(() => {
    const staticNotes = staticNotesHook.notes
    const mergedWithCache = cacheService.mergeWithStaticNotes(staticNotes)
    setMergedNotes(mergedWithCache)
    
    // 更新缓存统计
    setCacheStats(cacheService.getCacheStats())
  }, [staticNotesHook.notes])

  // 监听静态笔记变化
  useEffect(() => {
    updateMergedNotes()
  }, [updateMergedNotes])

  // 定期更新缓存统计和构建状态
  useEffect(() => {
    const interval = setInterval(() => {
      setCacheStats(cacheService.getCacheStats())
      
      // 如果有正在构建的笔记，更频繁地检查状态
      if (cacheService.hasBuildingNotes()) {
        staticNotesHook.refreshNotes()
      }
    }, 5000) // 每5秒检查一次

    return () => clearInterval(interval)
  }, [])

  // 创建笔记
  const createNote = useCallback(async (noteData: any, adminPassword?: string): Promise<boolean> => {
    if (!isR2Enabled) {
      console.warn('R2 存储未启用，无法创建笔记')
      return false
    }

    try {
      const adminToken = getGitHubToken()
      const result = await noteOpsService.createNote(noteData, adminToken, adminPassword)
      
      if (result.success) {
        updateMergedNotes()
        return true
      } else {
        console.error('创建笔记失败:', result.message)
        return false
      }
    } catch (error) {
      console.error('创建笔记异常:', error)
      return false
    }
  }, [isR2Enabled, getGitHubToken, updateMergedNotes])

  // 更新笔记
  const updateNote = useCallback(async (note: Note, noteData: any, adminPassword?: string): Promise<boolean> => {
    if (!isR2Enabled) {
      console.warn('R2 存储未启用，无法更新笔记')
      return false
    }

    try {
      const adminToken = getGitHubToken()
      const result = await noteOpsService.updateNote(note, noteData, adminToken, adminPassword)
      
      if (result.success) {
        updateMergedNotes()
        return true
      } else {
        console.error('更新笔记失败:', result.message)
        return false
      }
    } catch (error) {
      console.error('更新笔记异常:', error)
      return false
    }
  }, [isR2Enabled, getGitHubToken, updateMergedNotes])

  // 删除笔记
  const deleteNote = useCallback(async (note: Note): Promise<boolean> => {
    if (!isR2Enabled) {
      console.warn('R2 存储未启用，无法删除笔记')
      return false
    }

    try {
      const adminToken = getGitHubToken()
      const result = await noteOpsService.deleteNote(note, adminToken)
      
      if (result.success) {
        // 立即从合并列表中移除
        setMergedNotes(prev => prev.filter(n => n.sha !== note.sha))
        updateMergedNotes()
        return true
      } else {
        console.error('删除笔记失败:', result.message)
        return false
      }
    } catch (error) {
      console.error('删除笔记异常:', error)
      return false
    }
  }, [isR2Enabled, getGitHubToken, updateMergedNotes])

  // 解密笔记
  const decryptNote = useCallback(async (note: Note, password: string): Promise<Note | null> => {
    if (!note.isPrivate) {
      return note // 公开笔记不需要解密
    }

    try {
      let contentToDecrypt = note.fullContent || note.content || ''
      
      // 检查是否有加密标记
      if (encryptionService.hasEncryptionMarker(contentToDecrypt)) {
        const encryptedContent = encryptionService.extractEncryptedContent(contentToDecrypt)
        if (!encryptedContent) {
          throw new Error('无法提取加密内容')
        }
        
        const decryptResult = await encryptionService.decrypt(encryptedContent, password)
        if (!decryptResult.success || !decryptResult.data) {
          throw new Error(decryptResult.error || '解密失败')
        }
        
        // 解析解密后的内容
        const decryptedContent = decryptResult.data
        
        // 这里可以进一步解析 frontmatter 和内容
        // 简化处理，直接返回解密的内容
        return {
          ...note,
          content: decryptedContent,
          fullContent: decryptedContent,
          contentPreview: decryptedContent.substring(0, 200) + (decryptedContent.length > 200 ? '...' : '')
        }
      }
      
      return note // 如果没有加密标记，直接返回原笔记
    } catch (error) {
      console.error('解密笔记失败:', error)
      return null
    }
  }, [])

  // 搜索笔记
  const searchNotes = useCallback((query: string): Note[] => {
    return staticService.searchNotes(mergedNotes, query)
  }, [mergedNotes])

  // 按标签筛选笔记
  const filterNotesByTags = useCallback((notesToFilter: Note[], selectedTags: string[]): Note[] => {
    return staticService.filterNotesByTags(notesToFilter, selectedTags)
  }, [])

  // 获取所有标签
  const getAllTags = useCallback((): string[] => {
    return staticNotesHook.getAllTags()
  }, [staticNotesHook])

  // 刷新笔记
  const refreshNotes = useCallback(async (): Promise<void> => {
    await staticNotesHook.refreshNotes()
    updateMergedNotes()
  }, [staticNotesHook, updateMergedNotes])

  return {
    notes: mergedNotes,
    isLoading: staticNotesHook.isLoading || isGitHubLoading,
    error: staticNotesHook.error,
    buildInfo: staticNotesHook.buildInfo,
    buildStatus: staticNotesHook.buildStatus,
    cacheStats,
    createNote,
    updateNote,
    deleteNote,
    refreshNotes,
    searchNotes,
    filterNotesByTags,
    getAllTags,
    decryptNote,
    isR2Enabled
  }
}
