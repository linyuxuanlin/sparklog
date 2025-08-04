import { useState, useEffect, useCallback, useRef } from 'react'
import { Note } from '@/types/Note'
import { useGitHub } from '@/hooks/useGitHub'
import { getDefaultRepoConfig, getDefaultGitHubToken } from '@/config/defaultRepo'
import { parseNoteContent, decodeBase64Content } from '@/utils/noteUtils'
import { isCloudflarePages } from '@/config/env'

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
  
  // Use ref to avoid duplicate loading
  const isInitialLoadRef = useRef(false)
  const lastLoginStatusRef = useRef(loginStatus)

  // Preload next batch of notes
  const preloadNextBatch = useCallback(async (markdownFiles: any[], startIndex: number, authData: any, currentLoginStatus: boolean) => {
    if (isPreloading) return
    
    setIsPreloading(true)
    
    try {
      const pageSize = 5 // Preload 5 notes
      const endIndex = startIndex + pageSize
      const nextBatchFiles = markdownFiles.slice(startIndex, endIndex)
      
      // Concurrently load next batch of note content
      const nextBatchNotes = await Promise.all(
        nextBatchFiles.map(async (file: any) => {
          try {
            const contentHeaders: any = {
              'Accept': 'application/vnd.github.v3+json'
            }
            
            if (authData.accessToken) {
              contentHeaders['Authorization'] = `token ${authData.accessToken}`
            }
            
            // Get note content
            const timestamp = Date.now()
            const separator = file.url.includes('?') ? '&' : '?'
            const contentResponse = await fetch(`${file.url}${separator}t=${timestamp}`, {
              headers: contentHeaders
            })
            
            if (contentResponse.ok) {
              const contentData = await contentResponse.json()
              const content = decodeBase64Content(contentData.content)
              
              // Parse note content
              const parsed = parseNoteContent(content, file.name)
              
              // Prioritize dates parsed from frontmatter, if not available use GitHub file metadata
              let created_at = parsed.createdDate || file.created_at
              let updated_at = parsed.updatedDate || file.updated_at
              
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
            console.error(`Failed to preload note content: ${file.name}`, error)
            return file
          }
        })
      )
      
      // Filter notes - display notes based on login status
      const visibleNextBatchNotes = nextBatchNotes.filter(note => {
        if (!currentLoginStatus) {
          return !note.isPrivate
        }
        return true
      })
      
      setPreloadedNotes(visibleNextBatchNotes)
    } catch (error) {
      console.error('Failed to preload notes:', error)
    } finally {
      setIsPreloading(false)
    }
  }, [isPreloading])

  // Load notes from GitHub repository (paged loading)
  const loadNotes = useCallback(async (forceRefresh = false, page = 1) => {
    // If loading and not force refresh, avoid duplicate requests
    if (isLoadingNotes && !forceRefresh) {
      return
    }
    
    console.log('Start loading notes:', {
      forceRefresh,
      page,
      isCloudflarePages: isCloudflarePages(),
      isConnected,
      loginStatus: isLoggedIn()
    })
    
    setIsLoadingNotes(true)
    
    try {
      let authData: any = null
      let selectedRepo: string | null = null
      
      // Get default repository configuration
      const defaultConfig = getDefaultRepoConfig()
      console.log('Default config:', defaultConfig)
      
      if (!defaultConfig) {
        throw new Error('Default repository not configured, please set environment variables')
      }
      
      // Basic configuration uses environment variables
      selectedRepo = defaultConfig.repo
      authData = { 
        username: defaultConfig.owner,
        accessToken: getDefaultGitHubToken()
      }
      
      // Get current login status
      const currentLoginStatus = isLoggedIn()
      
      // If admin and logged in, use GitHub Token
      if (currentLoginStatus) {
        const adminToken = getGitHubToken()
        if (adminToken) {
          authData.accessToken = adminToken
        }
      }
      
      console.log('GitHub API configuration:', {
        username: authData.username,
        repo: selectedRepo,
        hasToken: !!authData.accessToken,
        isCloudflarePages: isCloudflarePages()
      })
      
      // Call GitHub API to get files in notes directory
      const headers: any = {
        'Accept': 'application/vnd.github.v3+json'
      }
      
      if (authData.accessToken) {
        headers['Authorization'] = `token ${authData.accessToken}`
      }
      
      const timestamp = Date.now()
      const apiUrl = `https://api.github.com/repos/${authData.username}/${selectedRepo}/contents/notes?t=${timestamp}`
      
      console.log('Request GitHub API:', apiUrl)
      
      const response = await fetch(apiUrl, {
        headers
      })
      
      console.log('GitHub API response status:', response.status, response.statusText)
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('notes directory does not exist, return empty list')
          setNotes([])
          setIsLoadingNotes(false)
          setHasLoaded(true)
          setHasMoreNotes(false)
          setAllMarkdownFiles([])
          return
        }
        
        const errorData = await response.json().catch(() => ({}))
        console.error('GitHub API error details:', errorData)
        throw new Error(`GitHub API error: ${response.status} - ${errorData.message || response.statusText}`)
      }
      
      const files = await response.json()
      console.log('Retrieved file list:', files.length, 'files')
      
      // Filter .md files and sort by time (new to old)
      const markdownFiles = files
        .filter((file: any) => file.type === 'file' && file.name.endsWith('.md'))
        .sort((a: any, b: any) => {
          // Sort by timestamp in filename (new to old)
          const timeA = a.name.replace(/\.md$/, '').split('-').slice(0, 6).join('-')
          const timeB = b.name.replace(/\.md$/, '').split('-').slice(0, 6).join('-')
          return timeB.localeCompare(timeA)
        })
      
      console.log('Filtered markdown files:', markdownFiles.length, 'files')
      
      // Save all markdown file list for preloading
      setAllMarkdownFiles(markdownFiles)
      
      // Paging processing
      let startIndex: number
      let pageSize: number
      
      if (page === 1) {
        // First load: load first 8
        startIndex = 0
        pageSize = 8
      } else {
        // Subsequent loads: load 5 each time
        startIndex = 8 + (page - 2) * 5 // 8 + (page-2)*5
        pageSize = 5
      }
      
      const endIndex = startIndex + pageSize
      const currentPageFiles = markdownFiles.slice(startIndex, endIndex)
      
      console.log('Current page files:', {
        startIndex,
        endIndex,
        pageSize,
        currentPageFiles: currentPageFiles.length
      })
      
      setLoadingProgress({ current: 0, total: currentPageFiles.length })
      
      // Check if there are more notes
      setHasMoreNotes(endIndex < markdownFiles.length)
      
      // Concurrently load current page note content
      const notesWithContent = await Promise.all(
        currentPageFiles.map(async (file: any, index: number) => {
          try {
            const contentHeaders: any = {
              'Accept': 'application/vnd.github.v3+json'
            }
            
            if (authData.accessToken) {
              contentHeaders['Authorization'] = `token ${authData.accessToken}`
            }
            
            // Get note content
            const timestamp = Date.now()
            const separator = file.url.includes('?') ? '&' : '?'
            const contentResponse = await fetch(`${file.url}${separator}t=${timestamp}`, {
              headers: contentHeaders
            })
            
            if (contentResponse.ok) {
              const contentData = await contentResponse.json()
              const content = decodeBase64Content(contentData.content)
              
              // Parse note content
              const parsed = parseNoteContent(content, file.name)
              
              // Prioritize dates parsed from frontmatter, if not available use GitHub file metadata
              let created_at = parsed.createdDate || file.created_at
              let updated_at = parsed.updatedDate || file.updated_at
              
              // Update loading progress
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
            console.error(`Failed to get note content: ${file.name}`, error)
            setLoadingProgress(prev => ({ ...prev, current: index + 1 }))
            return file
          }
        })
      )
      
      // Filter notes - display notes based on login status
      const visibleNotes = notesWithContent.filter(note => {
        if (!currentLoginStatus) {
          return !note.isPrivate
        }
        return true
      })
      
      console.log('Final visible notes:', visibleNotes.length, 'notes')
      
      // If first page or force refresh, replace note list; otherwise append
      if (page === 1 || forceRefresh) {
        setNotes(visibleNotes)
        setCurrentPage(1)
        // Preload next batch of notes
        if (endIndex < markdownFiles.length) {
          preloadNextBatch(markdownFiles, endIndex, authData, currentLoginStatus)
        }
      } else {
        setNotes(prev => [...prev, ...visibleNotes])
        setCurrentPage(page)
        // Preload next batch of notes
        if (endIndex < markdownFiles.length) {
          preloadNextBatch(markdownFiles, endIndex, authData, currentLoginStatus)
        }
      }
      
      setIsLoadingNotes(false)
      setHasLoaded(true)
      
    } catch (error) {
      console.error('Failed to load notes:', error)
      const errorMessage = error instanceof Error ? error.message : 'Please retry'
      
      if (errorMessage.includes('Default repository not configured')) {
        throw new Error('Website default repository not configured, please contact administrator or connect GitHub to view notes')
      } else {
        throw new Error(`Failed to load notes: ${errorMessage}`)
      }
    }
  }, [isConnected, getGitHubToken, preloadNextBatch, isLoggedIn])

  // Load more notes
  const loadMoreNotes = useCallback(() => {
    if (!isLoadingNotes && hasMoreNotes) {
      // If there are preloaded notes, display them immediately
      if (preloadedNotes.length > 0) {
        setNotes(prev => [...prev, ...preloadedNotes])
        const newCurrentPage = currentPage + 1
        setCurrentPage(newCurrentPage)
        setPreloadedNotes([])
        
        // Check if there are more notes to preload
        let nextStartIndex: number
        
        if (newCurrentPage === 1) {
          // After first page, preload notes 9-13
          nextStartIndex = 8
        } else {
          // Subsequent pages, preload next batch of 5
          nextStartIndex = 8 + (newCurrentPage - 1) * 5
        }
        
        const hasMoreToPreload = nextStartIndex < allMarkdownFiles.length
        
        if (hasMoreToPreload) {
          // Preload next batch
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
        // If no preloaded notes, load normally
        loadNotes(false, currentPage + 1)
      }
    }
  }, [loadNotes, isLoadingNotes, hasMoreNotes, currentPage, preloadedNotes, allMarkdownFiles, preloadNextBatch, isLoggedIn, getGitHubToken])

  // Delete note
  const deleteNote = async (note: Note) => {
    try {
      const defaultConfig = getDefaultRepoConfig()
      if (!defaultConfig) {
        throw new Error('Default repository not configured')
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
          message: `Delete note: ${note.name}`,
          sha: note.sha
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Delete failed: ${errorData.message || response.statusText}`)
      }
      
      setNotes(prev => prev.filter(n => n.sha !== note.sha))
      return true
    } catch (error) {
      console.error('Failed to delete note:', error)
      throw error
    }
  }

  // Optimized initialization loading logic
  useEffect(() => {
    if (!isLoading && !isInitialLoadRef.current) {
      isInitialLoadRef.current = true
      loadNotes(true)
    }
  }, [isLoading, loadNotes])

  // Optimized login status monitoring
  useEffect(() => {
    if (!isLoading && hasLoaded) {
      const currentStatus = isLoggedIn()
      if (currentStatus !== lastLoginStatusRef.current) {
        lastLoginStatusRef.current = currentStatus
        setLoginStatus(currentStatus)
        // Only reload when login status actually changes
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