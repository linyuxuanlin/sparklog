import { useState, useEffect, useCallback, useRef } from 'react'
import { Note } from '@/types/Note'
import { useGitHub } from '@/hooks/useGitHub'
import { getDefaultRepoConfig, getDefaultGitHubToken } from '@/config/defaultRepo'
import { parseNoteContent, decodeBase64Content } from '@/utils/noteUtils'

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
      
      // 并发加载下一批笔记内容
      const nextBatchNotes = await Promise.all(
        nextBatchFiles.map(async (file: any) => {
          try {
            const contentHeaders: any = {
              'Accept': 'application/vnd.github.v3+json'
            }
            
            if (authData.accessToken) {
              contentHeaders['Authorization'] = `token ${authData.accessToken}`
            }
            
            // 获取笔记内容
            const timestamp = Date.now()
            const separator = file.url.includes('?') ? '&' : '?'
            const contentResponse = await fetch(`${file.url}${separator}t=${timestamp}`, {
              headers: contentHeaders
            })
            
            if (contentResponse.ok) {
              const contentData = await contentResponse.json()
              const content = decodeBase64Content(contentData.content)
              
              // 简化时间获取：使用文件的基本信息，避免额外的API调用
              let created_at = file.created_at
              let updated_at = file.updated_at
              
              // 解析笔记内容
              const parsed = parseNoteContent(content, file.name)
              
              return {
                ...file,
                contentPreview: parsed.contentPreview,
                fullContent: content,
                createdDate: parsed.createdDate,
                updatedDate: parsed.updatedDate,
                isPrivate: parsed.isPrivate,
                created_at: created_at,
                updated_at: updated_at
              }
            }
            
            return file
          } catch (error) {
            console.error(`预加载笔记内容失败: ${file.name}`, error)
            return file
          }
        })
      )
      
      // 过滤笔记 - 根据登录状态显示笔记
      const visibleNextBatchNotes = nextBatchNotes.filter(note => {
        if (!currentLoginStatus) {
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

  // 从GitHub仓库加载笔记（分页加载）
  const loadNotes = useCallback(async (forceRefresh = false, page = 1) => {
    // 如果正在加载且不是强制刷新，避免重复请求
    if (isLoadingNotes && !forceRefresh) {
      return
    }
    
    setIsLoadingNotes(true)
    
    try {
      let authData: any = null
      let selectedRepo: string | null = null
      
      // 获取默认仓库配置
      const defaultConfig = getDefaultRepoConfig()
      if (!defaultConfig) {
        throw new Error('未配置默认仓库，请设置环境变量')
      }
      
      // 基础配置使用环境变量
      selectedRepo = defaultConfig.repo
      authData = { 
        username: defaultConfig.owner,
        accessToken: getDefaultGitHubToken()
      }
      
      // 获取当前登录状态
      const currentLoginStatus = isLoggedIn()
      
      // 如果是管理员且已登录，使用GitHub Token
      if (currentLoginStatus) {
        const adminToken = getGitHubToken()
        if (adminToken) {
          authData.accessToken = adminToken
        }
      }
      
      // 调用GitHub API获取notes目录下的文件
      const headers: any = {
        'Accept': 'application/vnd.github.v3+json'
      }
      
      if (authData.accessToken) {
        headers['Authorization'] = `token ${authData.accessToken}`
      }
      
      const timestamp = Date.now()
      const response = await fetch(`https://api.github.com/repos/${authData.username}/${selectedRepo}/contents/notes?t=${timestamp}`, {
        headers
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          setNotes([])
          setIsLoadingNotes(false)
          setHasLoaded(true)
          setHasMoreNotes(false)
          setAllMarkdownFiles([])
          return
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`GitHub API错误: ${response.status} - ${errorData.message || response.statusText}`)
      }
      
      const files = await response.json()
      
      // 过滤出.md文件并按时间排序（新到旧）
      const markdownFiles = files
        .filter((file: any) => file.type === 'file' && file.name.endsWith('.md'))
        .sort((a: any, b: any) => {
          // 按文件名中的时间戳排序（新到旧）
          const timeA = a.name.replace(/\.md$/, '').split('-').slice(0, 6).join('-')
          const timeB = b.name.replace(/\.md$/, '').split('-').slice(0, 6).join('-')
          return timeB.localeCompare(timeA)
        })
      
      // 保存所有markdown文件列表，用于预加载
      setAllMarkdownFiles(markdownFiles)
      
      // 分页处理
      let startIndex: number
      let pageSize: number
      
      if (page === 1) {
        // 首次加载：加载前8篇
        startIndex = 0
        pageSize = 8
      } else {
        // 后续加载：每次加载5篇
        startIndex = 8 + (page - 2) * 5 // 8 + (page-2)*5
        pageSize = 5
      }
      
      const endIndex = startIndex + pageSize
      const currentPageFiles = markdownFiles.slice(startIndex, endIndex)
      
      setLoadingProgress({ current: 0, total: currentPageFiles.length })
      
      // 检查是否还有更多笔记
      setHasMoreNotes(endIndex < markdownFiles.length)
      
      // 并发加载当前页的笔记内容
      const notesWithContent = await Promise.all(
        currentPageFiles.map(async (file: any, index: number) => {
          try {
            const contentHeaders: any = {
              'Accept': 'application/vnd.github.v3+json'
            }
            
            if (authData.accessToken) {
              contentHeaders['Authorization'] = `token ${authData.accessToken}`
            }
            
            // 获取笔记内容
            const timestamp = Date.now()
            const separator = file.url.includes('?') ? '&' : '?'
            const contentResponse = await fetch(`${file.url}${separator}t=${timestamp}`, {
              headers: contentHeaders
            })
            
            if (contentResponse.ok) {
              const contentData = await contentResponse.json()
              const content = decodeBase64Content(contentData.content)
              
              // 简化时间获取：使用文件的基本信息，避免额外的API调用
              let created_at = file.created_at
              let updated_at = file.updated_at
              
              // 解析笔记内容
              const parsed = parseNoteContent(content, file.name)
              
              // 更新加载进度
              setLoadingProgress(prev => ({ ...prev, current: index + 1 }))
              
              return {
                ...file,
                contentPreview: parsed.contentPreview,
                fullContent: content,
                createdDate: parsed.createdDate,
                updatedDate: parsed.updatedDate,
                isPrivate: parsed.isPrivate,
                created_at: created_at,
                updated_at: updated_at
              }
            }
            
            return file
          } catch (error) {
            console.error(`获取笔记内容失败: ${file.name}`, error)
            setLoadingProgress(prev => ({ ...prev, current: index + 1 }))
            return file
          }
        })
      )
      
      // 过滤笔记 - 根据登录状态显示笔记
      const visibleNotes = notesWithContent.filter(note => {
        if (!currentLoginStatus) {
          return !note.isPrivate
        }
        return true
      })
      
      // 如果是第一页或强制刷新，替换笔记列表；否则追加
      if (page === 1 || forceRefresh) {
        setNotes(visibleNotes)
        setCurrentPage(1)
        // 预加载下一批笔记
        if (endIndex < markdownFiles.length) {
          preloadNextBatch(markdownFiles, endIndex, authData, currentLoginStatus)
        }
      } else {
        setNotes(prev => [...prev, ...visibleNotes])
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
      
      if (errorMessage.includes('未配置默认仓库')) {
        throw new Error('网站未配置默认仓库，请联系管理员或连接GitHub查看笔记')
      } else {
        throw new Error(`加载笔记失败: ${errorMessage}`)
      }
    }
  }, [isConnected, getGitHubToken, preloadNextBatch, isLoggedIn])

  // 加载更多笔记
  const loadMoreNotes = useCallback(() => {
    if (!isLoadingNotes && hasMoreNotes) {
      // 如果有预加载的笔记，立即显示
      if (preloadedNotes.length > 0) {
        setNotes(prev => [...prev, ...preloadedNotes])
        const newCurrentPage = currentPage + 1
        setCurrentPage(newCurrentPage)
        setPreloadedNotes([])
        
        // 检查是否还有更多笔记需要预加载
        let nextStartIndex: number
        
        if (newCurrentPage === 1) {
          // 第一页后，预加载第9-13篇
          nextStartIndex = 8
        } else {
          // 后续页面，预加载下一批5篇
          nextStartIndex = 8 + (newCurrentPage - 1) * 5
        }
        
        const hasMoreToPreload = nextStartIndex < allMarkdownFiles.length
        
        if (hasMoreToPreload) {
          // 预加载下一批
          const authData = {
            username: getDefaultRepoConfig()?.owner,
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
  const deleteNote = async (note: Note) => {
    try {
      const defaultConfig = getDefaultRepoConfig()
      if (!defaultConfig) {
        throw new Error('未配置默认仓库')
      }
      
      let authData: any = null
      let selectedRepo: string | null = null
      
      authData = {
        username: defaultConfig.owner,
        accessToken: getDefaultGitHubToken()
      }
      selectedRepo = defaultConfig.repo
      
      const currentLoginStatus = isLoggedIn()
      
      if (currentLoginStatus) {
        const adminToken = getGitHubToken()
        if (adminToken) {
          authData.accessToken = adminToken
        }
      }
      
      const response = await fetch(`https://api.github.com/repos/${authData.username}/${selectedRepo}/contents/${note.path}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `token ${authData.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `删除笔记: ${note.name}`,
          sha: note.sha
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`删除失败: ${errorData.message || response.statusText}`)
      }
      
      setNotes(prev => prev.filter(n => n.sha !== note.sha))
      return true
    } catch (error) {
      console.error('删除笔记失败:', error)
      throw error
    }
  }

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
  }, [isLoading, hasLoaded, loadNotes])

  return {
    notes,
    isLoadingNotes,
    loadNotes,
    loadMoreNotes,
    deleteNote,
    hasMoreNotes,
    loadingProgress,
    isPreloading,
    preloadedNotes
  }
} 