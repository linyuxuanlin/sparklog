import { useState, useEffect, useCallback, useRef } from 'react'
import { Note } from '@/types/Note'
import { useGitHub } from '@/hooks/useGitHub'
import { getDefaultRepoConfig, getDefaultGitHubToken } from '@/config/defaultRepo'
import { parseNoteContent, decodeBase64Content } from '@/utils/noteUtils'
import { GitHubService } from '@/services/githubService'
import { R2Service } from '@/services/r2Service'
import { StaticContentService } from '@/services/staticContentService'

export const useNotes = () => {
  const { isConnected, isLoggedIn, getGitHubToken, isLoading } = useGitHub()
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [loginStatus, setLoginStatus] = useState(isLoggedIn())
  const [hasMoreNotes, setHasMoreNotes] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 })
  const [preloadedNotes, setPreloadedNotes] = useState<Note[]>([])
  const [isPreloading, setIsPreloading] = useState(false)
  const [allMarkdownFiles, setAllMarkdownFiles] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [buildStatus, setBuildStatus] = useState<{ isBuilding: boolean; lastBuildTime?: string }>({ isBuilding: false })
  
  // 使用ref来避免重复加载
  const isInitialLoadRef = useRef(false)
  const lastLoginStatusRef = useRef(loginStatus)

  // 检查构建状态
  const checkBuildStatus = useCallback(async () => {
    try {
      const staticContentService = StaticContentService.getInstance()
      const status = await staticContentService.checkBuildStatus()
      setBuildStatus(status)
      return status
    } catch (error) {
      console.error('检查构建状态失败:', error)
      return { isBuilding: true }
    }
  }, [])

  // 从静态内容加载笔记
  const loadNotesFromStatic = useCallback(async (isAdmin: boolean): Promise<Note[]> => {
    try {
      const staticContentService = StaticContentService.getInstance()
      
      let notesData: any[] = []
      
      if (isAdmin) {
        // 管理员可以查看所有笔记
        const allNotesResponse = await staticContentService.getAllNotes()
        if (allNotesResponse.success) {
          notesData = allNotesResponse.data
        } else {
          // 如果获取所有笔记失败，尝试获取公开笔记
          const publicNotesResponse = await staticContentService.getPublicNotes()
          if (publicNotesResponse.success) {
            notesData = publicNotesResponse.data
          }
        }
      } else {
        // 普通用户只能查看公开笔记
        const publicNotesResponse = await staticContentService.getPublicNotes()
        if (publicNotesResponse.success) {
          notesData = publicNotesResponse.data
        }
      }

      // 转换笔记格式
      const convertedNotes = notesData.map((noteData: any) => ({
        ...noteData,
        sha: noteData.id || noteData.sha || `note-${Date.now()}`,
        path: noteData.path || `notes/${noteData.filename || noteData.name}`,
        name: noteData.filename || noteData.name,
        created_at: noteData.created_at || noteData.createdDate,
        updated_at: noteData.updated_at || noteData.updatedDate,
        contentPreview: noteData.contentPreview || noteData.excerpt || '',
        fullContent: noteData.fullContent || noteData.content || '',
        isPrivate: noteData.isPrivate || false,
        tags: noteData.tags || []
      }))

      return convertedNotes
    } catch (error) {
      console.error('从静态内容加载笔记失败:', error)
      return []
    }
  }, [])

  // 从 R2 存储加载笔记（作为备用方案）
  const loadNotesFromR2 = useCallback(async (isAdmin: boolean): Promise<Note[]> => {
    try {
      const r2Service = R2Service.getInstance()
      
      // 获取所有 markdown 文件
      const files = await r2Service.listFiles('notes/')
      setAllMarkdownFiles(files)
      
      if (files.length === 0) {
        return []
      }

      // 批量获取文件内容
      const batchContent = await r2Service.getBatchFileContent(files)
      
      // 处理文件内容
      const notesWithContent = files.map((file: any) => {
        const content = batchContent[file.path]
        
        if (content) {
          // 解析笔记内容
          const parsed = parseNoteContent(content, file.name)
          
          return {
            ...file,
            contentPreview: parsed.contentPreview,
            fullContent: content,
            createdDate: parsed.createdDate,
            updatedDate: parsed.updatedDate,
            isPrivate: parsed.isPrivate,
            tags: parsed.tags,
            created_at: parsed.createdDate || file.uploaded,
            updated_at: parsed.updatedDate || file.uploaded
          }
        }
        
        return file
      })

      // 根据登录状态过滤笔记
      const visibleNotes = notesWithContent.filter(note => {
        if (!isAdmin) {
          return !note.isPrivate
        }
        return true
      })

      return visibleNotes
    } catch (error) {
      console.error('从 R2 加载笔记失败:', error)
      return []
    }
  }, [])

  // 预加载下一批笔记
  const preloadNextBatch = useCallback(async (markdownFiles: any[], startIndex: number, isAdmin: boolean) => {
    if (isPreloading) return
    
    setIsPreloading(true)
    
    try {
      const pageSize = 5 // 预加载5篇笔记
      const endIndex = startIndex + pageSize
      const nextBatchFiles = markdownFiles.slice(startIndex, endIndex)
      
      // 从 R2 获取内容
      const r2Service = R2Service.getInstance()
      const batchContent = await r2Service.getBatchFileContent(nextBatchFiles)
      
      // 处理批量获取的内容
      const nextBatchNotes = nextBatchFiles.map((file: any) => {
        const content = batchContent[file.path]
        
        if (content) {
          const parsed = parseNoteContent(content, file.name)
          
          return {
            ...file,
            contentPreview: parsed.contentPreview,
            fullContent: content,
            createdDate: parsed.createdDate,
            updatedDate: parsed.updatedDate,
            isPrivate: parsed.isPrivate,
            tags: parsed.tags,
            created_at: parsed.createdDate || file.uploaded,
            updated_at: parsed.updatedDate || file.uploaded
          }
        }
        
        return file
      })
      
      // 过滤笔记 - 根据登录状态显示笔记
      const visibleNextBatchNotes = nextBatchNotes.filter(note => {
        if (!isAdmin) {
          return !note.isPrivate
        }
        return true
      })
      
      setPreloadedNotes(visibleNextBatchNotes)
    } catch (error) {
      console.error('预加载笔记失败:', error)
    } finally {
      setIsPreloading(false)
    }
  }, [isPreloading])

  // 加载笔记（优先从静态内容，失败时从 R2 加载）
  const loadNotes = useCallback(async (forceRefresh = false, page = 1) => {
    if (isLoadingNotes && !forceRefresh) {
      return
    }
    
    setIsLoadingNotes(true)
    setError(null)
    setIsRateLimited(false)
    
    try {
      // 获取当前登录状态
      const currentLoginStatus = isLoggedIn()
      
      // 首先尝试从静态内容加载
      let notesFromStatic = await loadNotesFromStatic(currentLoginStatus)
      
      if (notesFromStatic.length > 0) {
        console.log('从静态内容加载笔记成功:', notesFromStatic.length, '个')
        
        // 分页处理
        let startIndex: number
        let pageSize: number
        
        if (page === 1) {
          startIndex = 0
          pageSize = 10
        } else {
          startIndex = 10 + (page - 2) * 5
          pageSize = 5
        }
        
        const endIndex = startIndex + pageSize
        const currentPageNotes = notesFromStatic.slice(startIndex, endIndex)
        
        setLoadingProgress({ current: currentPageNotes.length, total: currentPageNotes.length })
        setHasMoreNotes(endIndex < notesFromStatic.length)
        
        if (page === 1 || forceRefresh) {
          setNotes(currentPageNotes)
          setCurrentPage(1)
        } else {
          setNotes(prev => {
            const existingIds = new Set(prev.map(note => note.sha))
            const newNotes = currentPageNotes.filter(note => !existingIds.has(note.sha))
            return [...prev, ...newNotes]
          })
          setCurrentPage(page)
        }
        
        setIsLoadingNotes(false)
        setHasLoaded(true)
        return
      }
      
      // 如果静态内容加载失败，从 R2 加载
      console.log('静态内容加载失败，尝试从 R2 加载')
      const notesFromR2 = await loadNotesFromR2(currentLoginStatus)
      
      if (notesFromR2.length > 0) {
        console.log('从 R2 加载笔记成功:', notesFromR2.length, '个')
        
        // 分页处理
        let startIndex: number
        let pageSize: number
        
        if (page === 1) {
          startIndex = 0
          pageSize = 10
        } else {
          startIndex = 10 + (page - 2) * 5
          pageSize = 5
        }
        
        const endIndex = startIndex + pageSize
        const currentPageNotes = notesFromR2.slice(startIndex, endIndex)
        
        setLoadingProgress({ current: currentPageNotes.length, total: currentPageNotes.length })
        setHasMoreNotes(endIndex < notesFromR2.length)
        
        if (page === 1 || forceRefresh) {
          setNotes(currentPageNotes)
          setCurrentPage(1)
          // 预加载下一批笔记
          if (endIndex < notesFromR2.length) {
            preloadNextBatch(notesFromR2, endIndex, currentLoginStatus)
          }
        } else {
          setNotes(prev => {
            const existingIds = new Set(prev.map(note => note.sha))
            const newNotes = currentPageNotes.filter(note => !existingIds.has(note.sha))
            return [...prev, ...newNotes]
          })
          setCurrentPage(page)
          // 预加载下一批笔记
          if (endIndex < notesFromR2.length) {
            preloadNextBatch(notesFromR2, endIndex, currentLoginStatus)
          }
        }
        
        setIsLoadingNotes(false)
        setHasLoaded(true)
        return
      }
      
      // 如果都失败了，显示错误
      setError('无法加载笔记内容，请检查网络连接或稍后重试')
      setIsLoadingNotes(false)
      
    } catch (error) {
      console.error('加载笔记失败:', error)
      const errorMessage = error instanceof Error ? error.message : '请重试'
      setError(`加载笔记失败: ${errorMessage}`)
      setIsLoadingNotes(false)
    }
  }, [isConnected, getGitHubToken, preloadNextBatch, isLoggedIn, loadNotesFromStatic, loadNotesFromR2])

  // 加载更多笔记
  const loadMoreNotes = useCallback(() => {
    if (!isLoadingNotes && hasMoreNotes) {
      // 如果有预加载的笔记，立即显示（去重）
      if (preloadedNotes.length > 0) {
        setNotes(prev => {
          const existingIds = new Set(prev.map(note => note.sha))
          const newNotes = preloadedNotes.filter(note => !existingIds.has(note.sha))
          return [...prev, ...newNotes]
        })
        const newCurrentPage = currentPage + 1
        setCurrentPage(newCurrentPage)
        setPreloadedNotes([])
        
        // 检查是否还有更多笔记需要预加载
        let nextStartIndex: number
        
        if (newCurrentPage === 1) {
          nextStartIndex = 10
        } else {
          nextStartIndex = 10 + (newCurrentPage - 1) * 5
        }
        
        const hasMoreToPreload = nextStartIndex < allMarkdownFiles.length
        
        if (hasMoreToPreload) {
          const currentLoginStatus = isLoggedIn()
          preloadNextBatch(allMarkdownFiles, nextStartIndex, currentLoginStatus)
        } else {
          setHasMoreNotes(false)
        }
      } else {
        // 如果没有预加载的笔记，正常加载
        loadNotes(false, currentPage + 1)
      }
    }
  }, [loadNotes, isLoadingNotes, hasMoreNotes, currentPage, preloadedNotes, allMarkdownFiles, preloadNextBatch, isLoggedIn])

  // 删除笔记
  const deleteNote = async (note: Note) => {
    try {
      const r2Service = R2Service.getInstance()
      await r2Service.deleteFile(note.path)
      
      setNotes(prev => prev.filter(n => n.sha !== note.sha))
      return true
    } catch (error) {
      console.error('删除笔记失败:', error)
      throw error
    }
  }

  // 强制刷新静态内容
  const forceRefreshStatic = useCallback(async () => {
    try {
      const staticContentService = StaticContentService.getInstance()
      await staticContentService.forceRefresh()
      
      // 重新检查构建状态
      await checkBuildStatus()
      
      // 重新加载笔记
      await loadNotes(true)
    } catch (error) {
      console.error('强制刷新失败:', error)
    }
  }, [checkBuildStatus, loadNotes])

  // 优化后的初始化加载逻辑
  useEffect(() => {
    if (!isLoading && !isInitialLoadRef.current) {
      isInitialLoadRef.current = true
      loadNotes(true)
      checkBuildStatus()
    }
  }, [isLoading, loadNotes, checkBuildStatus])

  // 优化后的登录状态监听
  useEffect(() => {
    if (!isLoading && hasLoaded) {
      const currentStatus = isLoggedIn()
      if (currentStatus !== lastLoginStatusRef.current) {
        lastLoginStatusRef.current = currentStatus
        setLoginStatus(currentStatus)
        // 只有在登录状态真正改变时才重新加载
        loadNotes(true)
      }
    }
  }, [isLoading, hasLoaded, loadNotes])

  // 定期检查构建状态
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasLoaded) {
        checkBuildStatus()
      }
    }, 30000) // 每30秒检查一次

    return () => clearInterval(interval)
  }, [hasLoaded, checkBuildStatus])

  return {
    notes,
    isLoadingNotes,
    loadNotes,
    loadMoreNotes,
    deleteNote,
    hasMoreNotes,
    loadingProgress,
    isPreloading,
    preloadedNotes,
    error,
    isRateLimited,
    buildStatus,
    forceRefreshStatic
  }
} 