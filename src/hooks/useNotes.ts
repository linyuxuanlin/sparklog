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
  const loadNotesRef = useRef<((_forceRefresh?: boolean, _page?: number) => Promise<void>) | null>(null)
  
  // 添加请求去重机制
  const [isLoadingIndex, setIsLoadingIndex] = useState(false)
  const indexRequestRef = useRef<Promise<boolean> | null>(null)
  
  // 从静态文件加载笔记（支持草稿合并）
  const loadNotesFromStatic = useCallback(async (): Promise<boolean> => {
    // 如果正在加载索引，返回现有的请求
    if (isLoadingIndex && indexRequestRef.current) {
      console.log('🔄 索引正在加载中，等待现有请求完成...')
      return indexRequestRef.current
    }
    
    // 如果已经有请求在进行中，直接返回该请求
    if (indexRequestRef.current) {
      console.log('🔄 索引请求已在进行中，复用现有请求...')
      return indexRequestRef.current
    }
    
    console.log('📥 尝试从静态文件加载笔记（支持草稿合并）...')
    setIsLoadingIndex(true)
    
    try {
      const staticService = StaticService.getInstance()
      
      // 创建请求函数，返回 Promise<boolean>
      const request = (async (): Promise<boolean> => {
        try {
          // 准备认证信息用于草稿的删除检查
          const defaultConfig = getDefaultRepoConfig()
          const currentLoginStatus = isLoggedIn()
          let authData: { username: string; repo: string; accessToken: string } | undefined = undefined
          
          if (defaultConfig) {
            let accessToken = getDefaultGitHubToken()
            
            // 如果已登录，使用管理员token
            if (currentLoginStatus) {
              const adminToken = getGitHubToken()
              if (adminToken) {
                accessToken = adminToken
              }
            }
            
            // 只有当accessToken不为null时才创建authData
            if (accessToken) {
              authData = {
                username: defaultConfig.owner,
                repo: defaultConfig.repo,
                accessToken: accessToken
              }
            }
          }
          
          // 使用新的混合数据获取方法，传入认证信息
          const mergedNotes = await staticService.getMergedNotes(authData)
          
          if (mergedNotes && mergedNotes.length > 0) {
            console.log(`✅ 混合数据加载成功，获取到 ${mergedNotes.length} 篇笔记`)
            
            // 根据登录状态过滤笔记
            const filteredNotes = mergedNotes.filter((note: any) => {
              if (!currentLoginStatus) {
                return !note.isPrivate // 未登录只显示公开笔记
              }
              return true // 已登录显示所有笔记
            })
            
            // 按时间排序（新到旧）
            filteredNotes.sort((a, b) => {
              const timeA = new Date(a.createdDate || a.created_at || '1970-01-01').getTime()
              const timeB = new Date(b.createdDate || b.created_at || '1970-01-01').getTime()
              return timeB - timeA
            })
            
            // 分页处理：首次加载前10篇
            const firstPageNotes = filteredNotes.slice(0, 10)
            setNotes(firstPageNotes)
            setHasMoreNotes(filteredNotes.length > 10)
            setCurrentPage(1)
            
            console.log('✅ 从混合数据加载完成:', firstPageNotes.length, '个笔记')
            return true
          } else {
            console.log('⚠️ 混合数据为空或未找到')
            return false
          }
        } catch (error) {
          console.error('❌ 混合数据加载失败:', error)
          return false
        }
      })()
      
      // 保存请求引用，供后续调用复用
      indexRequestRef.current = request
      
      // 等待请求完成
      const result = await request
      return result
      
    } finally {
      setIsLoadingIndex(false)
      // 清除请求引用
      indexRequestRef.current = null
    }
  }, [isLoggedIn, isLoadingIndex, getGitHubToken])

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

  // 从GitHub仓库加载笔记（分页加载）
  const loadNotes = useCallback(async (forceRefresh = false, page = 1) => {
    console.log('🔄 loadNotes 被调用:', { forceRefresh, page })
    
    // 如果正在加载且不是强制刷新，避免重复请求
    if (isLoadingNotes && !forceRefresh) {
      console.log('⚠️ 跳过重复加载')
      return
    }
    
    setIsLoadingNotes(true)
    setError(null)
    setIsRateLimited(false)
    
    try {
      // 获取当前登录状态
      const currentLoginStatus = isLoggedIn()
      console.log('👤 当前登录状态:', currentLoginStatus)
      
      // 优先尝试从静态文件加载（适用于所有用户）
      if (page === 1 && !forceRefresh) {
        console.log('📥 尝试静态文件加载 (page=1, forceRefresh=false)')
        const staticLoadSuccess = await loadNotesFromStatic()
        if (staticLoadSuccess) {
          setIsLoadingNotes(false)
          setHasLoaded(true)
          console.log('✅ 静态文件加载成功，退出')
          return
        } else {
          console.log('❌ 静态文件加载失败，继续 GitHub API')
        }
      } else {
        console.log('⏭️ 跳过静态文件加载:', { page, forceRefresh })
      }
      
      // 初始化GitHub服务
      console.log('🔗 开始 GitHub API 调用...')
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
      const notesWithContent = currentPageFiles.map((file: any, _index: number) => {
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
      const visibleNotes = notesWithContent.filter(note => {
        if (!currentLoginStatus) {
          return !note.isPrivate
        }
        return true
      })
      
      // 更新状态
      if (page === 1) {
        setNotes(visibleNotes)
        setCurrentPage(1)
      } else {
        setNotes(prev => [...prev, ...visibleNotes])
        setCurrentPage(page)
      }
      
      setHasLoaded(true)
      setError(null)
      
      console.log(`✅ 成功加载 ${visibleNotes.length} 篇笔记 (第${page}页)`)
      
      // 预加载下一批笔记
      if (endIndex < markdownFiles.length) {
        const nextStartIndex = endIndex
        const authDataForPreload = {
          username: defaultConfig.owner,
          repo: defaultConfig.repo,
          accessToken: getDefaultGitHubToken()
        }
        const currentLoginStatus = isLoggedIn()
        if (currentLoginStatus) {
          const adminToken = getGitHubToken()
          if (adminToken) {
            authDataForPreload.accessToken = adminToken
          }
        }
        preloadNextBatch(markdownFiles, nextStartIndex, authDataForPreload, currentLoginStatus)
      } else {
        setHasMoreNotes(false)
      }
      
    } catch (error: any) {
      console.error('❌ 加载笔记失败:', error)
      
      if (error.message?.includes('rate limit')) {
        setIsRateLimited(true)
        setError('GitHub API 速率限制，请稍后再试')
      } else {
        setError(error.message || '加载笔记失败')
      }
    } finally {
      setIsLoadingNotes(false)
      setLoadingProgress({ current: 0, total: 0 })
    }
  }, [isLoadingNotes, isLoggedIn, getGitHubToken, loadNotesFromStatic, preloadNextBatch])

  // 更新 loadNotes ref
  useEffect(() => {
    loadNotesRef.current = loadNotes
  }, [loadNotes])

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
        // 如果没有预加载的笔记，使用 ref 调用
        if (loadNotesRef.current) {
          loadNotesRef.current(false, currentPage + 1)
        }
      }
    }
  }, [isLoadingNotes, hasMoreNotes, currentPage, preloadedNotes, allMarkdownFiles, preloadNextBatch, isLoggedIn, getGitHubToken])

  // 创建新笔记
  const createNote = useCallback(async (fileName: string, content: string) => {
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
      
      // 使用GitHub服务创建笔记（默认启用草稿）
      const githubService = GitHubService.getInstance()
      githubService.setAuthData(authData)
      
      await githubService.createNote(fileName, content, true)
      
      // 立即刷新笔记列表（会显示草稿版本）
      if (loadNotesRef.current) {
        loadNotesRef.current(true, 1)
      }
      
      return true
    } catch (error) {
      console.error('创建笔记失败:', error)
      throw error
    }
  }, [getGitHubToken, isLoggedIn])

  // 更新笔记
  const updateNote = useCallback(async (fileName: string, content: string, sha: string) => {
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
      
      // 使用GitHub服务更新笔记（默认启用草稿）
      const githubService = GitHubService.getInstance()
      githubService.setAuthData(authData)
      
      await githubService.updateNote(fileName, content, sha, true)
      
      // 立即刷新笔记列表（会显示草稿版本）
      if (loadNotesRef.current) {
        loadNotesRef.current(true, 1)
      }
      
      return true
    } catch (error) {
      console.error('更新笔记失败:', error)
      throw error
    }
  }, [getGitHubToken, isLoggedIn])
  // 删除笔记（支持草稿）
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
      
      // 使用GitHub服务删除笔记（默认启用草稿）
      const githubService = GitHubService.getInstance()
      githubService.setAuthData(authData)
      
      await githubService.deleteNote(note, true)
      
      // 立即刷新笔记列表（会隐藏被删除的笔记）
      if (loadNotesRef.current) {
        loadNotesRef.current(true, 1)
      }
      
      return true
    } catch (error) {
      console.error('删除笔记失败:', error)
      throw error
    }
  }, [getGitHubToken, isLoggedIn])

  // 优化后的初始化加载逻辑
  useEffect(() => {
    console.log('🏁 useNotes useEffect 触发:', { isLoading, isInitialLoadRef: isInitialLoadRef.current })
    if (!isLoading && !isInitialLoadRef.current) {
      console.log('🚀 开始初始化加载笔记 (非强制刷新)')
      isInitialLoadRef.current = true
      if (loadNotesRef.current) {
        loadNotesRef.current(false) // 使用 ref，避免依赖变化
      }
    }
  }, [isLoading])

  // 优化后的登录状态监听
  useEffect(() => {
    if (!isLoading && hasLoaded) {
      const currentStatus = isLoggedIn()
      if (currentStatus !== lastLoginStatusRef.current) {
        console.log('👤 登录状态变化:', { 
          from: lastLoginStatusRef.current, 
          to: currentStatus,
          action: '尝试静态文件重新加载'
        })
        lastLoginStatusRef.current = currentStatus
        setLoginStatus(currentStatus)
        // 登录状态变化时也优先尝试静态文件
        if (loadNotesRef.current) {
          loadNotesRef.current(false) // 使用 ref，优先静态文件
        }
      }
    }
  }, [isLoading, hasLoaded, isLoggedIn])

  return {
    notes,
    isLoadingNotes,
    loadNotes,
    loadMoreNotes,
    createNote,
    updateNote,
    deleteNote,
    hasMoreNotes,
    loadingProgress,
    isPreloading,
    preloadedNotes,
    error,
    isRateLimited
  }
} 