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
  const initialLoadRef = useRef(false)
  const loadingRef = useRef(false)

  // 预加载下一批笔记
  const preloadNextBatch = useCallback(async (markdownFiles: any[], startIndex: number, authData: any, currentLoginStatus: boolean) => {
    if (isPreloading) return
    
    setIsPreloading(true)
    
    try {
      const pageSize = 5
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
      
      // 分页处理
      const pageSize = 5 // 每页加载5个笔记
      const startIndex = (page - 1) * pageSize
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
      
      // 如果是第一页或强制刷新，替换笔记列表；否则追加（确保唯一性）
      if (page === 1 || forceRefresh) {
        setNotes(visibleNotes)
        setCurrentPage(1)
        // 预加载下一批笔记（简化版本，避免循环依赖）
        if (endIndex < markdownFiles.length && !isPreloading) {
          setTimeout(() => {
            preloadNextBatch(markdownFiles, endIndex, authData, currentLoginStatus)
          }, 100)
        }
      } else {
        setNotes(prev => {
          // 确保新添加的笔记不会与现有笔记重复
          const existingShas = new Set(prev.map(note => note.sha))
          const newNotes = visibleNotes.filter(note => !existingShas.has(note.sha))
          return [...prev, ...newNotes]
        })
        setCurrentPage(page)
        // 预加载下一批笔记（简化版本，避免循环依赖）
        if (endIndex < markdownFiles.length && !isPreloading) {
          setTimeout(() => {
            preloadNextBatch(markdownFiles, endIndex, authData, currentLoginStatus)
          }, 100)
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
  }, [isConnected, getGitHubToken])

  // 直接加载更多笔记的函数（不刷新整页）
  const loadMoreNotesDirectly = useCallback(async () => {
    if (isLoadingNotes || loadingRef.current) {
      console.log('跳过直接加载更多笔记:', { isLoadingNotes, loadingRef: loadingRef.current })
      return
    }
    
    console.log('开始直接加载更多笔记')
    loadingRef.current = true
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
          setHasMoreNotes(false)
          setIsLoadingNotes(false)
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
      
      // 分页处理
      const pageSize = 5 // 每页加载5个笔记
      const nextPage = currentPage + 1
      const startIndex = (nextPage - 1) * pageSize
      const endIndex = startIndex + pageSize
      const currentPageFiles = markdownFiles.slice(startIndex, endIndex)
      
      // 检查是否还有更多笔记
      const hasMore = endIndex < markdownFiles.length
      
      if (currentPageFiles.length === 0) {
        setHasMoreNotes(false)
        setIsLoadingNotes(false)
        return
      }
      
      setLoadingProgress({ current: 0, total: currentPageFiles.length })
      
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
      
      // 追加新笔记到现有列表
      setNotes(prev => {
        // 确保新添加的笔记不会与现有笔记重复
        const existingShas = new Set(prev.map(note => note.sha))
        const newNotes = visibleNotes.filter(note => !existingShas.has(note.sha))
        return [...prev, ...newNotes]
      })
      
      // 批量更新状态，减少重新渲染
      setCurrentPage(nextPage)
      setHasMoreNotes(hasMore)
      setIsLoadingNotes(false)
      loadingRef.current = false
      console.log('直接加载更多笔记完成:', { nextPage, hasMore, notesAdded: visibleNotes.length })
      
    } catch (error) {
      console.error('加载更多笔记失败:', error)
      setIsLoadingNotes(false)
      loadingRef.current = false
      const errorMessage = error instanceof Error ? error.message : '请重试'
      throw new Error(`加载更多笔记失败: ${errorMessage}`)
    }
  }, [currentPage, isLoggedIn, getGitHubToken, isLoadingNotes])

  // 加载更多笔记
  const loadMoreNotes = useCallback(() => {
    if (!isLoadingNotes && hasMoreNotes && !loadingRef.current) {
      console.log('开始加载更多笔记，当前状态:', { 
        isLoadingNotes, 
        hasMoreNotes, 
        currentPage, 
        preloadedNotesLength: preloadedNotes.length,
        notesLength: notes.length 
      })
      
      // 如果有预加载的笔记，立即显示
      if (preloadedNotes.length > 0) {
        console.log('使用预加载的笔记')
        setNotes(prev => {
          // 确保预加载的笔记不会与现有笔记重复
          const existingShas = new Set(prev.map(note => note.sha))
          const newNotes = preloadedNotes.filter(note => !existingShas.has(note.sha))
          console.log('添加预加载笔记:', { existing: prev.length, new: newNotes.length })
          return [...prev, ...newNotes]
        })
        setCurrentPage(prev => prev + 1)
        setPreloadedNotes([])
        
        // 检查是否还有更多笔记需要预加载
        if (currentPage * 5 + 5 < notes.length + preloadedNotes.length + 10) {
          // 这里需要重新获取文件列表来预加载下一批
          // 暂时先清空预加载状态，下次加载时会重新预加载
          setHasMoreNotes(true)
        } else {
          setHasMoreNotes(false)
        }
      } else {
        console.log('没有预加载笔记，直接加载下一页')
        // 如果没有预加载的笔记，直接加载下一页（不刷新整页）
        // 使用 setTimeout 避免在回调中直接调用，防止循环依赖
        setTimeout(() => {
          loadMoreNotesDirectly()
        }, 0)
      }
    } else {
      console.log('跳过加载更多笔记:', { 
        isLoadingNotes, 
        hasMoreNotes, 
        loadingRef: loadingRef.current 
      })
    }
  }, [isLoadingNotes, hasMoreNotes, currentPage, preloadedNotes, notes.length])

  // 监听登录状态变化
  useEffect(() => {
    if (!isLoading && initialLoadRef.current) {
      const currentStatus = isLoggedIn()
      if (currentStatus !== loginStatus) {
        setLoginStatus(currentStatus)
        if (hasLoaded) {
          // 使用 setTimeout 避免在 useEffect 中直接调用
          setTimeout(() => {
            loadNotes(true)
          }, 0)
        }
      }
    }
  }, [isLoggedIn, loginStatus, hasLoaded, isLoading])

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

  // 当连接状态改变时加载笔记，以及组件挂载时加载
  useEffect(() => {
    if (!isLoading && !initialLoadRef.current) {
      if (!hasLoaded || isConnected) {
        initialLoadRef.current = true
        // 使用 setTimeout 避免在 useEffect 中直接调用
        setTimeout(() => {
          loadNotes(true)
        }, 0)
      }
    }
  }, [isConnected, isLoading, hasLoaded])

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