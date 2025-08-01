import { useState, useEffect, useCallback } from 'react'
import { Note } from '@/types/Note'
import { useGitHub } from '@/hooks/useGitHub'
import { getDefaultRepoConfig, getDefaultGitHubToken } from '@/config/defaultRepo'
import { parseNoteContent } from '@/utils/noteUtils'

export const useNotes = () => {
  const { isConnected, isLoggedIn, getGitHubToken } = useGitHub()
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  // 从GitHub仓库加载笔记
  const loadNotes = useCallback(async () => {
    // 如果正在加载，避免重复请求
    if (isLoadingNotes) {
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
      
      // 调试信息
      console.log('基础配置:', {
        owner: defaultConfig.owner,
        repo: defaultConfig.repo,
        hasToken: !!authData.accessToken,
        envVars: {
          VITE_REPO_OWNER: import.meta.env.VITE_REPO_OWNER,
          VITE_REPO_NAME: import.meta.env.VITE_REPO_NAME,
          VITE_GITHUB_TOKEN: import.meta.env.VITE_GITHUB_TOKEN ? '已设置' : '未设置',
          VITE_ADMIN_PASSWORD: import.meta.env.VITE_ADMIN_PASSWORD ? '已设置' : '未设置'
        }
      })
      
      // 如果是管理员且已登录，使用GitHub Token
      if (isLoggedIn()) {
        const adminToken = getGitHubToken()
        console.log('管理员Token检查:', {
          isLoggedIn: isLoggedIn(),
          adminToken: adminToken ? '已获取' : '未获取',
          hasToken: !!adminToken
        })
        if (adminToken) {
          authData.accessToken = adminToken
          console.log('管理员模式，使用GitHub Token访问私密笔记')
        } else {
          console.log('管理员模式但未获取到Token，使用默认Token')
        }
      } else {
        console.log('非管理员模式，使用默认Token')
      }
      
      // 调用GitHub API获取notes目录下的文件
      const headers: any = {
        'Accept': 'application/vnd.github.v3+json'
      }
      
      // 如果有accessToken，无论是连接用户还是默认配置，都添加Authorization头
      if (authData.accessToken) {
        headers['Authorization'] = `token ${authData.accessToken}`
      }
      
      const response = await fetch(`https://api.github.com/repos/${authData.username}/${selectedRepo}/contents/notes`, {
        headers
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          // notes目录不存在，返回空数组
          setNotes([])
          setIsLoadingNotes(false)
          setHasLoaded(true)
          return
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`GitHub API错误: ${response.status} - ${errorData.message || response.statusText}`)
      }
      
      const files = await response.json()
      
      // 过滤出.md文件并获取内容
      const markdownFiles = files.filter((file: any) => 
        file.type === 'file' && file.name.endsWith('.md')
      )
      
      // 获取每个笔记的详细内容（限制并发数量以提高性能）
      const batchSize = 5 // 每次处理5个笔记
      const notesWithContent = []
      
      for (let i = 0; i < markdownFiles.length; i += batchSize) {
        const batch = markdownFiles.slice(i, i + batchSize)
        const batchResults = await Promise.all(
          batch.map(async (file: any) => {
            try {
              const contentHeaders: any = {
                'Accept': 'application/vnd.github.v3+json'
              }
              
              // 如果有accessToken，无论是连接用户还是默认配置，都添加Authorization头
              if (authData.accessToken) {
                contentHeaders['Authorization'] = `token ${authData.accessToken}`
              }
              
              const contentResponse = await fetch(file.url, {
                headers: contentHeaders
              })
              
              if (contentResponse.ok) {
                const contentData = await contentResponse.json()
                const content = atob(contentData.content) // 解码Base64内容
                
                // 获取文件的提交历史来获取创建和修改时间
                let created_at = file.created_at
                let updated_at = file.updated_at
                
                try {
                  // 获取文件的提交历史
                  const commitsResponse = await fetch(
                    `https://api.github.com/repos/${authData.username}/${selectedRepo}/commits?path=${file.path}&per_page=1`,
                    { headers: contentHeaders }
                  )
                  
                  if (commitsResponse.ok) {
                    const commits = await commitsResponse.json()
                    if (commits.length > 0) {
                      // 使用最新的提交时间作为更新时间
                      updated_at = commits[0].commit.author.date
                      
                      // 获取第一个提交（创建时间）
                      const firstCommitResponse = await fetch(
                        `https://api.github.com/repos/${authData.username}/${selectedRepo}/commits?path=${file.path}&per_page=100`,
                        { headers: contentHeaders }
                      )
                      
                      if (firstCommitResponse.ok) {
                        const allCommits = await firstCommitResponse.json()
                        if (allCommits.length > 0) {
                          // 使用最后一个提交的时间作为创建时间（GitHub按时间倒序返回）
                          created_at = allCommits[allCommits.length - 1].commit.author.date
                        }
                      }
                    }
                  }
                } catch (error) {
                  console.warn(`获取文件 ${file.name} 的提交历史失败:`, error)
                }
                
                // 调试：查看GitHub API返回的原始数据
                console.log(`笔记 ${file.name} 的GitHub API数据:`, {
                  name: file.name,
                  created_at: created_at,
                  updated_at: updated_at,
                  path: file.path,
                  sha: file.sha
                })
                
                // 解析笔记内容
                const parsed = parseNoteContent(content, file.name)
                
                // 调试：查看解析后的数据
                console.log(`笔记 ${file.name} 的解析数据:`, {
                  title: parsed.title,
                  createdDate: parsed.createdDate,
                  updatedDate: parsed.updatedDate,
                  isPrivate: parsed.isPrivate
                })
                
                return {
                  ...file,
                  parsedTitle: parsed.title,
                  contentPreview: parsed.contentPreview,
                  fullContent: content,
                  createdDate: parsed.createdDate,
                  updatedDate: parsed.updatedDate,
                  isPrivate: parsed.isPrivate,
                  // 使用从commits API获取的日期信息
                  created_at: created_at,
                  updated_at: updated_at
                }
              }
              
              return file
            } catch (error) {
              console.error(`获取笔记内容失败: ${file.name}`, error)
              return file
            }
          })
        )
        
        notesWithContent.push(...batchResults)
        
        // 更新状态以显示进度
        if (i + batchSize < markdownFiles.length) {
          setNotes(notesWithContent)
        }
      }
      
      // 过滤笔记 - 根据登录状态显示笔记
      const visibleNotes = notesWithContent.filter(note => {
        if (!isLoggedIn()) {
          // 未登录用户只能看到公开笔记
          return !note.isPrivate
        }
        // 已登录用户可以看到所有笔记（包括私密笔记）
        return true
      })
      
      // 按创建时间从新到旧排序
      const sortedNotes = visibleNotes.sort((a, b) => {
        const dateA = a.created_at || a.createdDate || a.updated_at || a.updatedDate
        const dateB = b.created_at || b.createdDate || b.updated_at || b.updatedDate
        
        if (!dateA && !dateB) return 0
        if (!dateA) return 1
        if (!dateB) return -1
        
        try {
          const timeA = new Date(dateA).getTime()
          const timeB = new Date(dateB).getTime()
          return timeB - timeA // 从新到旧排序
        } catch {
          return 0
        }
      })
      
      setNotes(sortedNotes)
      setIsLoadingNotes(false)
      setHasLoaded(true)
    } catch (error) {
      console.error('加载笔记失败:', error)
      const errorMessage = error instanceof Error ? error.message : '请重试'
      
      // 特殊处理配置错误
      if (errorMessage.includes('未配置默认仓库')) {
        throw new Error('网站未配置默认仓库，请联系管理员或连接GitHub查看笔记')
      } else {
        throw new Error(`加载笔记失败: ${errorMessage}`)
      }
    }
  }, [isConnected, isLoggedIn, getGitHubToken])

  // 删除笔记
  const deleteNote = async (note: Note) => {
    try {
      // 获取默认仓库配置
      const defaultConfig = getDefaultRepoConfig()
      if (!defaultConfig) {
        throw new Error('未配置默认仓库')
      }
      
      let authData: any = null
      let selectedRepo: string | null = null
      
      // 基础配置使用环境变量
      authData = {
        username: defaultConfig.owner,
        accessToken: getDefaultGitHubToken()
      }
      selectedRepo = defaultConfig.repo
      
      // 如果是管理员且已登录，使用GitHub Token
      if (isLoggedIn()) {
        const adminToken = getGitHubToken()
        if (adminToken) {
          authData.accessToken = adminToken
          console.log('管理员模式，使用GitHub Token删除笔记')
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
          message: `删除笔记: ${note.parsedTitle || note.name}`,
          sha: note.sha
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`删除失败: ${errorData.message || response.statusText}`)
      }
      
      // 从列表中移除笔记
      setNotes(prev => prev.filter(n => n.sha !== note.sha))
      return true
    } catch (error) {
      console.error('删除笔记失败:', error)
      throw error
    }
  }

  // 当连接状态改变时加载笔记，以及组件挂载时加载
  useEffect(() => {
    loadNotes()
  }, [isConnected])

  return {
    notes,
    isLoadingNotes,
    loadNotes,
    deleteNote
  }
} 