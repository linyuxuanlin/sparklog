import { useState, useEffect, useCallback, useRef } from 'react'
import { Note } from '@/types/Note'
import { useGitHub } from '@/hooks/useGitHub'
import { getDefaultRepoConfig, getDefaultGitHubToken } from '@/config/defaultRepo'
import { parseNoteContent, decodeBase64Content } from '@/utils/noteUtils'
import { GitHubService } from '@/services/githubService'
import { StaticNotesService } from '@/services/staticNotesService'

export const useNotes = () => {
  const { isLoggedIn, getGitHubToken, isLoading } = useGitHub()
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
  const [staticNotesCount, setStaticNotesCount] = useState(0)
  
  // 使用ref来避免重复加载
  const isInitialLoadRef = useRef(false)
  const lastLoginStatusRef = useRef(loginStatus)

  // 预加载下一批笔记
  const preloadNextBatch = useCallback(async (markdownFiles: any[], startIndex: number, authData: any, currentLoginStatus: boolean) => {
    if (isPreloading) return
    
    setIsPreloading(true)
    
    try {
      const pageSize = 5 // 预加载5篇笔记
      const endIndex = startIndex + pageSize
      const nextBatchFiles = markdownFiles.slice(startIndex, endIndex)
      
      // 使用GitHub服务批量获取内容
      const githubService = GitHubService.getInstance()
      githubService.setAuthData(authData)
      
      const batchContent = await githubService.getBatchNotesContent(nextBatchFiles)
      
      // 处理批量获取的内容
      const nextBatchNotes = nextBatchFiles.map((file: any) => {
        const contentData = batchContent[file.path]
        
        if (contentData) {
          const content = decodeBase64Content(contentData.content)
          
          // 解析笔记内容
          const parsed = parseNoteContent(content, file.name)
          
          // 优先使用从frontmatter解析的日期，如果没有则使用GitHub文件元数据
          const created_at = parsed.createdDate || file.created_at
          const updated_at = parsed.updatedDate || file.updated_at
          
          return {
            ...file,
            contentPreview: parsed.contentPreview,
            fullContent: content,
            createdDate: parsed.createdDate,
            updatedDate: parsed.updatedDate,
            isPrivate: parsed.isPrivate,
            tags: parsed.tags,
            created_at: created_at,
            updated_at: updated_at
          }
        }
        
        return file
      })
      
      // 过滤笔记 - 根据登录状态显示笔记
      const visibleNextBatchNotes = nextBatchNotes.filter(note => {
        if (!currentLoginStatus) {
          return !note.isPrivate
        }
        return true
      })
      
      // 检查是否还有更多笔记可以预加载
      const nextStartIndex = endIndex
      const hasMoreToPreload = nextStartIndex < markdownFiles.length
      
      if (hasMoreToPreload) {
        // 预加载下一批
        const nextNextBatchFiles = markdownFiles.slice(nextStartIndex, nextStartIndex + pageSize)
        const nextBatchContent = await githubService.getBatchNotesContent(nextNextBatchFiles)
        
        // 处理下一批的内容
        const nextNextBatchNotes = nextNextBatchFiles.map((file: any) => {
          const contentData = nextBatchContent[file.path]
          
          if (contentData) {
            const content = decodeBase64Content(contentData.content)
            
            // 解析笔记内容
            const parsed = parseNoteContent(content, file.name)
            
            // 优先使用从frontmatter解析的日期，如果没有则使用GitHub文件元数据
            const created_at = parsed.createdDate || file.created_at
            const updated_at = parsed.updatedDate || file.updated_at
            
            return {
              ...file,
              contentPreview: parsed.contentPreview,
              fullContent: content,
              createdDate: parsed.createdDate,
              updatedDate: parsed.updatedDate,
              isPrivate: parsed.isPrivate,
              tags: parsed.tags,
              created_at: created_at,
              updated_at: updated_at
            }
          }
          
          return file
        })
        
        // 过滤下一批笔记
        const visibleNextNextBatchNotes = nextNextBatchNotes.filter(note => {
          if (!currentLoginStatus) {
            return !note.isPrivate
          }
          return true
        })
        
        // 合并两批笔记
        setPreloadedNotes([...visibleNextBatchNotes, ...visibleNextNextBatchNotes])
      } else {
        setPreloadedNotes(visibleNextBatchNotes)
      }
    } catch (error) {
      console.error('预加载笔记失败:', error)
    } finally {
      setIsPreloading(false)
    }
  }, [isPreloading])

  // 混合加载笔记：优先使用静态内容，回退到 GitHub API
  const loadNotesHybrid = useCallback(async (forceRefresh = false, page = 1) => {
    if (isLoadingNotes && !forceRefresh) {
      return
    }
    
    setIsLoadingNotes(true)
    setError(null)
    setIsRateLimited(false)
    
    try {
      const currentLoginStatus = isLoggedIn()
      const staticNotesService = StaticNotesService.getInstance()
      
      // 获取所有markdown文件列表
      const githubService = GitHubService.getInstance()
      const defaultConfig = getDefaultRepoConfig()
      if (!defaultConfig) {
        throw new Error('未配置默认仓库，请设置环境变量')
      }
      
      const authData = {
        username: defaultConfig.owner,
        repo: defaultConfig.repo,
        accessToken: getDefaultGitHubToken()
      }
      
      if (currentLoginStatus) {
        const adminToken = getGitHubToken()
        if (adminToken) {
          authData.accessToken = adminToken
        }
      }
      
      githubService.setAuthData(authData)
      const markdownFiles = await githubService.getNotesFiles()
      setAllMarkdownFiles(markdownFiles)
      
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
      const currentPageFiles = markdownFiles.slice(startIndex, endIndex)
      
      setLoadingProgress({ current: 0, total: currentPageFiles.length })
      setHasMoreNotes(endIndex < markdownFiles.length)
      
      // 尝试从静态内容获取笔记
      console.log('🔍 开始混合加载，当前页面文件数量:', currentPageFiles.length)
      
      // 强制初始化静态笔记服务
      try {
        console.log('🔧 初始化静态笔记服务...')
        await staticNotesService.testService()
        const notesIndex = await staticNotesService.getNotesIndex()
        if (notesIndex) {
          console.log('✅ 静态笔记索引加载成功，包含笔记数量:', Object.keys(notesIndex.notes).length)
        } else {
          console.log('⚠️ 静态笔记索引加载失败')
        }
      } catch (error) {
        console.warn('⚠️ 初始化静态笔记服务失败:', error)
      }
      
      const staticNotesMap = await staticNotesService.getBatchStaticNotes(
        currentPageFiles.map(file => file.name)
      )
      console.log('📊 静态笔记映射结果:', {
        请求文件数: currentPageFiles.length,
        获取到静态笔记数: staticNotesMap.size,
        静态笔记文件名: Array.from(staticNotesMap.keys())
      })
      
      const notesWithContent: any[] = []
      let staticCount = 0
      
      for (let i = 0; i < currentPageFiles.length; i++) {
        const file = currentPageFiles[i]
        setLoadingProgress(prev => ({ ...prev, current: i + 1 }))
        
        // 检查是否有静态版本
        const staticNote = staticNotesMap.get(file.name)
        if (staticNote) {
          // 使用静态内容
          console.log('✅ 使用静态笔记:', file.name)
          
          // 如果静态笔记缺少时间字段，尝试从文件名或 GitHub 文件元数据中获取
          let created_at = staticNote.createdDate
          let updated_at = staticNote.updatedDate
          
          if (!created_at || !updated_at) {
            // 尝试从文件名解析时间（格式：YYYY-MM-DD-HH-MM-SS.md）
            const timeMatch = file.name.match(/(\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2})/)
            if (timeMatch) {
              const timestamp = timeMatch[1].replace(/-/g, ':').replace(/(\d{2}):(\d{2}):(\d{2})$/, '$1:$2:$3')
              const date = new Date(timestamp)
              if (!isNaN(date.getTime())) {
                if (!created_at) created_at = date.toISOString()
                if (!updated_at) updated_at = date.toISOString()
              }
            }
            
            // 如果仍然没有时间，使用 GitHub 文件元数据
            if (!created_at) created_at = file.created_at
            if (!updated_at) updated_at = file.updated_at
          }
          
          notesWithContent.push({
            ...file,
            contentPreview: staticNote.contentPreview,
            fullContent: staticNote.content,
            createdDate: created_at,
            updatedDate: updated_at,
            isPrivate: staticNote.isPrivate,
            tags: staticNote.tags,
            created_at: created_at,
            updated_at: updated_at,
            isStatic: true
          })
          staticCount++
        } else {
          console.log('⚠️ 未找到静态笔记，回退到 GitHub API:', file.name)
          // 回退到 GitHub API
          try {
            const contentData = await githubService.getSingleNoteContent(file)
            if (contentData) {
              const content = decodeBase64Content(contentData.content)
              const parsed = parseNoteContent(content, file.name)
              
              const created_at = parsed.createdDate || file.created_at
              const updated_at = parsed.updatedDate || file.updated_at
              
              notesWithContent.push({
                ...file,
                contentPreview: parsed.contentPreview,
                fullContent: content,
                createdDate: parsed.createdDate,
                updatedDate: parsed.updatedDate,
                isPrivate: parsed.isPrivate,
                tags: parsed.tags,
                created_at: created_at,
                updated_at: updated_at,
                isStatic: false
              })
              
              // 记录笔记更新，将在下次构建时重新编译
              if (!parsed.isPrivate) {
                staticNotesService.triggerNoteCompilation(file.name, {
                  id: file.sha,
                  title: parsed.title || file.name.replace('.md', ''),
                  content: content,
                  contentPreview: parsed.contentPreview,
                  createdDate: created_at,
                  updatedDate: updated_at,
                  isPrivate: parsed.isPrivate,
                  tags: parsed.tags
                })
              }
            } else {
              notesWithContent.push(file)
            }
          } catch (error) {
            console.warn(`获取笔记 ${file.name} 内容失败:`, error)
            notesWithContent.push(file)
          }
        }
      }
      
      setStaticNotesCount(staticCount)
      
      // 过滤笔记
      const visibleNotes = notesWithContent.filter(note => {
        if (!note.sha) {
          console.warn('发现没有sha的笔记:', note.name || note.path)
          return false
        }
        
        if (!currentLoginStatus) {
          return !note.isPrivate
        }
        return true
      })
      
      // 设置笔记列表
      if (page === 1 || forceRefresh) {
        setNotes(visibleNotes)
        setCurrentPage(1)
        if (endIndex < markdownFiles.length) {
          preloadNextBatch(markdownFiles, endIndex, authData, currentLoginStatus)
        }
      } else {
        setNotes(prev => {
          const existingShas = new Set(prev.map(note => note.sha))
          const newNotes = visibleNotes.filter(note => !existingShas.has(note.sha))
          return [...prev, ...newNotes]
        })
        setCurrentPage(page)
        if (endIndex < markdownFiles.length) {
          preloadNextBatch(markdownFiles, endIndex, authData, currentLoginStatus)
        }
      }
      
      setIsLoadingNotes(false)
      setHasLoaded(true)
      
    } catch (error) {
      console.error('混合加载笔记失败:', error)
      setError(error instanceof Error ? error.message : '加载笔记失败')
      
      // 检查是否为速率限制错误
      if (error instanceof Error && error.message.includes('rate limit')) {
        setIsRateLimited(true)
      }
      
      setIsLoadingNotes(false)
    }
  }, [isLoadingNotes, setError, setIsRateLimited, isLoggedIn, getGitHubToken, setAllMarkdownFiles, setLoadingProgress, setHasMoreNotes, setNotes, setCurrentPage, setStaticNotesCount, setIsLoadingNotes, setHasLoaded, preloadNextBatch])

  // 从GitHub仓库加载笔记（分页加载）- 现在使用混合加载策略
  const loadNotes = useCallback(async (forceRefresh = false, page = 1) => {
    console.log('🚀 开始加载笔记，使用混合加载策略...')
    return loadNotesHybrid(forceRefresh, page)
  }, [loadNotesHybrid])

  // 加载更多笔记
  const loadMoreNotes = useCallback(() => {
    if (!isLoadingNotes && hasMoreNotes) {
      // 如果有预加载的笔记，立即显示（去重）
      if (preloadedNotes.length > 0) {
        setNotes(prev => {
          const existingShas = new Set(prev.map(note => note.sha))
          const newNotes = preloadedNotes.filter(note => !existingShas.has(note.sha))
          return [...prev, ...newNotes]
        })
        const newCurrentPage = currentPage + 1
        setCurrentPage(newCurrentPage)
        setPreloadedNotes([])
        
        // 检查是否还有更多笔记需要预加载
        let nextStartIndex: number
        
        if (newCurrentPage === 1) {
          // 第一页后，预加载第11-15篇
          nextStartIndex = 10
        } else {
          // 后续页面，预加载下一批5篇
          nextStartIndex = 10 + (newCurrentPage - 1) * 5
        }
        
        const hasMoreToPreload = nextStartIndex < allMarkdownFiles.length
        
        if (hasMoreToPreload) {
          // 预加载下一批（现在会自动预加载多一批）
          const authData = {
            username: getDefaultRepoConfig()?.owner,
            repo: getDefaultRepoConfig()?.repo,
            accessToken: getDefaultGitHubToken()
          }
          const currentLoginStatus = isLoggedIn()
          if (currentLoginStatus) {
            const adminToken = getGitHubToken()
            if (adminToken) {
              authData.accessToken = adminToken
            }
          }
          preloadNextBatch(allMarkdownFiles, nextStartIndex, authData, currentLoginStatus)
        } else {
          setHasMoreNotes(false)
        }
      } else {
        // 如果没有预加载的笔记，正常加载
        loadNotes(false, currentPage + 1)
      }
    }
  }, [loadNotes, isLoadingNotes, hasMoreNotes, currentPage, preloadedNotes, allMarkdownFiles, preloadNextBatch, isLoggedIn, getGitHubToken])

  // 删除笔记
  const deleteNote = useCallback(async (note: Note) => {
    try {
      const defaultConfig = getDefaultRepoConfig()
      if (!defaultConfig) {
        throw new Error('未配置默认仓库')
      }
      
      const authData = {
        username: defaultConfig.owner,
        repo: defaultConfig.repo,
        accessToken: getDefaultGitHubToken()
      }
      
      const currentLoginStatus = isLoggedIn()
      
      if (currentLoginStatus) {
        const adminToken = getGitHubToken()
        if (adminToken) {
          authData.accessToken = adminToken
        }
      }
      
      // 使用GitHub服务删除笔记
      const githubService = GitHubService.getInstance()
      githubService.setAuthData(authData)
      
      await githubService.deleteNote(note)
      
      setNotes(prev => prev.filter(n => n.sha !== note.sha))
      return true
    } catch (error) {
      console.error('删除笔记失败:', error)
      throw error
    }
  }, [getGitHubToken, isLoggedIn])

  // 优化后的初始化加载逻辑
  useEffect(() => {
    if (!isLoading && !isInitialLoadRef.current) {
      isInitialLoadRef.current = true
      loadNotes(true)
    }
  }, [isLoading, loadNotes])

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
  }, [isLoading, hasLoaded, loadNotes, isLoggedIn])

  return {
    notes,
    isLoadingNotes,
    loadNotes,
    loadNotesHybrid,
    loadMoreNotes,
    deleteNote,
    hasMoreNotes,
    loadingProgress,
    isPreloading,
    preloadedNotes,
    error,
    isRateLimited,
    staticNotesCount
  }
} 