import { useState, useEffect, useCallback, useRef } from 'react'
import { Note } from '@/types/Note'
import { useGitHub } from '@/hooks/useGitHub'
import { getDefaultRepoConfig, getDefaultGitHubToken } from '@/config/defaultRepo'
import { parseNoteContent, decodeBase64Content } from '@/utils/noteUtils'
import { GitHubService } from '@/services/githubService'
import { StaticService } from '@/services/staticService'

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

  // 尝试从静态文件加载笔记
  const loadNotesFromStatic = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🚀 尝试从静态文件加载笔记...')
      const staticService = StaticService.getInstance()
      const staticIndex = await staticService.getStaticIndex()
      
      if (!staticIndex) {
        console.log('⚠️ 静态索引文件不存在，回退到 GitHub API')
        return false
      }

      console.log('📊 静态索引加载成功:', {
        totalNotes: staticIndex.totalNotes,
        publicNotes: staticIndex.publicNotes,
        compiledAt: staticIndex.compiledAt
      })

      // 检查静态文件是否过期（超过 1 小时）
      const compiledTime = new Date(staticIndex.compiledAt).getTime()
      const now = new Date().getTime()
      const hourInMs = 60 * 60 * 1000
      
      if (now - compiledTime > hourInMs) {
        console.log('⏰ 静态文件已过期，回退到 GitHub API')
        return false
      }

      // 转换静态数据为笔记格式
      const staticNotes = Object.values(staticIndex.notes).map((note: any) => ({
        ...note,
        id: note.sha,
        name: note.filename,
        sha: note.sha,
        path: note.path,
        created_at: note.createdDate,
        updated_at: note.updatedDate,
        fullContent: '', // 静态索引不包含完整内容
        type: 'file'
      }))

      // 根据登录状态过滤笔记
      const currentLoginStatus = isLoggedIn()
      const filteredNotes = staticNotes.filter((note: any) => {
        if (!currentLoginStatus) {
          return !note.isPrivate // 未登录只显示公开笔记
        }
        return true // 已登录显示所有笔记
      })

      // 按时间排序（新到旧）
      filteredNotes.sort((a, b) => {
        return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
      })

      // 分页处理：首次加载前10篇
      const firstPageNotes = filteredNotes.slice(0, 10)
      setNotes(firstPageNotes)
      setHasMoreNotes(filteredNotes.length > 10)
      setCurrentPage(1)
      
      console.log('✅ 从静态文件加载完成:', firstPageNotes.length, '个笔记')
      return true
    } catch (error) {
      console.error('❌ 从静态文件加载失败:', error)
      return false
    }
  }, [isLoggedIn])

  // 从GitHub仓库加载笔记（分页加载）
  const loadNotes = useCallback(async (forceRefresh = false, page = 1) => {
    // 如果正在加载且不是强制刷新，避免重复请求
    if (isLoadingNotes && !forceRefresh) {
      return
    }
    
    setIsLoadingNotes(true)
    setError(null)
    setIsRateLimited(false)
    
    try {
      // 获取当前登录状态
      const currentLoginStatus = isLoggedIn()
      
      // 优先尝试从静态文件加载（适用于所有用户）
      if (page === 1 && !forceRefresh) {
        const staticLoadSuccess = await loadNotesFromStatic()
        if (staticLoadSuccess) {
          setIsLoadingNotes(false)
          setHasLoaded(true)
          return
        }
      }
      
      // 初始化GitHub服务
      const githubService = GitHubService.getInstance()
      
      // 设置认证信息
      const defaultConfig = getDefaultRepoConfig()
      if (!defaultConfig) {
        throw new Error('未配置默认仓库，请设置环境变量')
      }
      
      const authData = {
        username: defaultConfig.owner,
        repo: defaultConfig.repo,
        accessToken: getDefaultGitHubToken()
      }
      
      // 如果是管理员且已登录，使用GitHub Token
      if (currentLoginStatus) {
        const adminToken = getGitHubToken()
        if (adminToken) {
          authData.accessToken = adminToken
        }
      }
      
      githubService.setAuthData(authData)
      
      // 获取所有markdown文件列表
      const markdownFiles = await githubService.getNotesFiles()
      
      // 保存所有markdown文件列表，用于预加载
      setAllMarkdownFiles(markdownFiles)
      
      // 分页处理
      let startIndex: number
      let pageSize: number
      
      if (page === 1) {
        // 首次加载：加载前10篇
        startIndex = 0
        pageSize = 10
      } else {
        // 后续加载：每次加载5篇
        startIndex = 10 + (page - 2) * 5 // 10 + (page-2)*5
        pageSize = 5
      }
      
      const endIndex = startIndex + pageSize
      const currentPageFiles = markdownFiles.slice(startIndex, endIndex)
      
      setLoadingProgress({ current: 0, total: currentPageFiles.length })
      
      // 检查是否还有更多笔记
      setHasMoreNotes(endIndex < markdownFiles.length)
      
      // 批量获取当前页的笔记内容
      const batchContent = await githubService.getBatchNotesContent(currentPageFiles)
      
      // 处理批量获取的内容
      const notesWithContent = currentPageFiles.map((file: any, index: number) => {
        const contentData = batchContent[file.path]
        
        if (contentData) {
          const content = decodeBase64Content(contentData.content)
          
          // 解析笔记内容
          const parsed = parseNoteContent(content, file.name)
          
          // 优先使用从frontmatter解析的日期，如果没有则使用GitHub文件元数据
          const created_at = parsed.createdDate || file.created_at
          const updated_at = parsed.updatedDate || file.updated_at
          
          // 更新加载进度
          setLoadingProgress(prev => ({ ...prev, current: index + 1 }))
          
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
        
        // 如果批量获取失败，返回原始文件信息
        setLoadingProgress(prev => ({ ...prev, current: index + 1 }))
        return file
      })
      
      // 过滤笔记 - 根据登录状态显示笔记，并确保每个笔记都有有效的sha
      const visibleNotes = notesWithContent.filter(note => {
        // 确保笔记有有效的sha
        if (!note.sha) {
          return false
        }
        
        if (!currentLoginStatus) {
          return !note.isPrivate
        }
        return true
      })
      
      // 如果是第一页或强制刷新，替换笔记列表；否则追加（去重）
      if (page === 1 || forceRefresh) {
        setNotes(visibleNotes)
        setCurrentPage(1)
        // 预加载下一批笔记
        if (endIndex < markdownFiles.length) {
          preloadNextBatch(markdownFiles, endIndex, authData, currentLoginStatus)
        }
      } else {
        // 追加时去重，避免重复的笔记
        setNotes(prev => {
          const existingShas = new Set(prev.map(note => note.sha))
          const newNotes = visibleNotes.filter(note => !existingShas.has(note.sha))
          return [...prev, ...newNotes]
        })
        setCurrentPage(page)
        // 预加载下一批笔记
        if (endIndex < markdownFiles.length) {
          preloadNextBatch(markdownFiles, endIndex, authData, currentLoginStatus)
        }
      }
      
      setIsLoadingNotes(false)
      setHasLoaded(true)
      
    } catch (error) {
      console.error('加载笔记失败:', error)
      const errorMessage = error instanceof Error ? error.message : '请重试'
      
      // 检测GitHub API速率限制错误
      if (errorMessage.includes('API rate limit exceeded') || errorMessage.includes('403')) {
        setIsRateLimited(true)
        setError('API 访问已达上限（每小时 5000 次），请稍作等待后刷新。')
      } else if (errorMessage.includes('未配置默认仓库')) {
        setError('网站未配置默认仓库，请联系管理员或连接GitHub查看笔记')
      } else {
        setError(`加载笔记失败: ${errorMessage}`)
      }
      
      setIsLoadingNotes(false)
      return
    }
  }, [getGitHubToken, preloadNextBatch, isLoggedIn, isLoadingNotes, loadNotesFromStatic])

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
    loadMoreNotes,
    deleteNote,
    hasMoreNotes,
    loadingProgress,
    isPreloading,
    preloadedNotes,
    error,
    isRateLimited
  }
} 