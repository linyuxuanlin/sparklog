import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Github, BookOpen, Globe, Calendar, Tag, Settings, Search, Loader2, RefreshCw } from 'lucide-react'
import { useGitHub } from '@/hooks/useGitHub'

interface Note {
  name: string
  path: string
  sha: string
  size: number
  url: string
  git_url: string
  html_url: string
  download_url: string
  type: string
  content?: string
  encoding?: string
  created_at?: string
  updated_at?: string
  parsedTitle?: string
  contentPreview?: string
  fullContent?: string
}

const NotesPage: React.FC = () => {
  const { isConnected, isLoading } = useGitHub()
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')

  // 显示消息提示
  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => {
      setMessage('')
      setMessageType('')
    }, 5000)
  }

  // 从GitHub仓库加载笔记
  const loadNotes = async () => {
    if (!isConnected) return

    setIsLoadingNotes(true)
    
    try {
      // 获取授权信息
      const auth = localStorage.getItem('sparklog_github_auth')
      if (!auth) {
        throw new Error('未找到授权信息')
      }
      
      const authData = JSON.parse(auth)
      
      // 获取选择的仓库
      const selectedRepo = localStorage.getItem('sparklog_selected_repo')
      if (!selectedRepo) {
        throw new Error('未选择笔记仓库')
      }
      
      // 调用GitHub API获取notes目录下的文件
      const response = await fetch(`https://api.github.com/repos/${authData.username}/${selectedRepo}/contents/notes`, {
        headers: {
          'Authorization': `token ${authData.accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          // notes目录不存在，返回空数组
          setNotes([])
          setIsLoadingNotes(false)
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
      
      // 获取每个笔记的详细内容
      const notesWithContent = await Promise.all(
        markdownFiles.map(async (file: any) => {
          try {
            const contentResponse = await fetch(file.url, {
              headers: {
                'Authorization': `token ${authData.accessToken}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            })
            
            if (contentResponse.ok) {
              const contentData = await contentResponse.json()
              const content = atob(contentData.content) // 解码Base64内容
              
                             // 解析笔记标题和内容
               const lines = content.split('\n')
               
               // 解析Frontmatter
               let title = file.name.replace(/\.md$/, '')
               let contentPreview = ''
               let inFrontmatter = false
               let frontmatterEndIndex = -1
               
               for (let i = 0; i < lines.length; i++) {
                 const line = lines[i].trim()
                 
                 // 检测Frontmatter开始
                 if (line === '---' && !inFrontmatter) {
                   inFrontmatter = true
                   continue
                 }
                 
                 // 检测Frontmatter结束
                 if (line === '---' && inFrontmatter) {
                   frontmatterEndIndex = i
                   break
                 }
               }
               
               // 提取标题和内容（跳过Frontmatter）
               const contentLines = frontmatterEndIndex >= 0 
                 ? lines.slice(frontmatterEndIndex + 1) 
                 : lines
               
               // 查找第一个标题行
               for (const line of contentLines) {
                 if (line.startsWith('# ')) {
                   title = line.replace(/^#\s*/, '')
                   break
                 }
               }
               
               // 生成内容预览（排除Frontmatter和标题）
               const previewLines = contentLines.filter(line => !line.startsWith('# '))
               const previewText = previewLines.join('\n').trim()
               contentPreview = previewText.substring(0, 200) + (previewText.length > 200 ? '...' : '')
              
              return {
                ...file,
                parsedTitle: title,
                contentPreview: contentPreview,
                fullContent: content
              }
            }
            
            return file
          } catch (error) {
            console.error(`获取笔记内容失败: ${file.name}`, error)
            return file
          }
        })
      )
      
      setNotes(notesWithContent)
      setIsLoadingNotes(false)
      showMessage(`成功加载 ${notesWithContent.length} 个笔记`, 'success')
    } catch (error) {
      console.error('加载笔记失败:', error)
      showMessage(`加载笔记失败: ${error instanceof Error ? error.message : '请重试'}`, 'error')
      setIsLoadingNotes(false)
    }
  }

  // 当连接状态改变时加载笔记
  useEffect(() => {
    if (isConnected) {
      loadNotes()
    }
  }, [isConnected])

  // 过滤笔记
  const filteredNotes = notes.filter(note => {
    const searchLower = searchQuery.toLowerCase()
    const titleMatch = (note.parsedTitle || note.name).toLowerCase().includes(searchLower)
    const contentMatch = note.contentPreview?.toLowerCase().includes(searchLower) || false
    return titleMatch || contentMatch
  })

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">检查GitHub连接状态...</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="mb-8">
            <Github className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              尚未连接GitHub
            </h2>
            <p className="text-gray-600 mb-6">
              请先连接GitHub账号才能查看和管理笔记
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4">连接步骤</h3>
            <ol className="text-left space-y-3 text-sm">
              <li className="flex items-start">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</span>
                <span>前往设置页面配置GitHub Personal Access Token</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
                <span>选择或创建笔记存储仓库</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
                <span>开始创建和管理笔记</span>
              </li>
            </ol>
            
            <div className="mt-6">
              <Link
                to="/settings"
                className="btn-primary inline-flex items-center"
              >
                <Settings className="w-4 h-4 mr-2" />
                前往设置
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 消息提示 */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          messageType === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded-full mr-3 ${
              messageType === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span>{message}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">所有笔记</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadNotes}
            disabled={isLoadingNotes}
            className="btn-secondary inline-flex items-center"
          >
            {isLoadingNotes ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            刷新
          </button>
          <Link
            to="/note/new"
            className="btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            新建笔记
          </Link>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="搜索笔记..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {isLoadingNotes ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载笔记中...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {searchQuery ? '没有找到匹配的笔记' : '还没有笔记'}
          </h2>
          <p className="text-gray-600 mb-6">
            {searchQuery ? '尝试调整搜索关键词' : '创建你的第一篇笔记开始记录想法'}
          </p>
          <Link
            to="/note/new"
            className="btn-primary inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            创建第一篇笔记
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredNotes.map((note) => {
            // 使用解析的标题或文件名
            const title = note.parsedTitle || note.name.replace(/\.md$/, '')
            // 从文件名提取日期（如果有日期格式）
            const dateMatch = note.name.match(/(\d{4}-\d{2}-\d{2})/)
            const date = dateMatch ? dateMatch[1] : '未知日期'
            
            return (
              <div key={note.sha} className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 mr-3">
                        {title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-600">公开</span>
                      </div>
                    </div>
                    
                    {/* 显示内容预览 */}
                    {note.contentPreview && (
                      <p className="text-gray-600 mb-3 line-clamp-3">
                        {note.contentPreview}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{date}</span>
                      </div>
                      <div className="flex items-center">
                        <Tag className="w-4 h-4 mr-1" />
                        <span>Markdown</span>
                      </div>
                      <div className="flex items-center">
                        <span>{(note.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={note.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      在GitHub查看
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default NotesPage 