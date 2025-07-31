import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Github, BookOpen, Globe, Calendar, Tag, Settings, Search, Loader2, RefreshCw, Edit, Trash2, Check, X } from 'lucide-react'
import { useGitHub } from '@/hooks/useGitHub'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
  createdDate?: string
  updatedDate?: string
  isPrivate?: boolean
}

const NotesPage: React.FC = () => {
  const { isConnected, isLoading } = useGitHub()
  const navigate = useNavigate()
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [deletingNote, setDeletingNote] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)

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
      
             // 获取每个笔记的详细内容（限制并发数量以提高性能）
       const batchSize = 5 // 每次处理5个笔记
       const notesWithContent = []
       
       for (let i = 0; i < markdownFiles.length; i += batchSize) {
         const batch = markdownFiles.slice(i, i + batchSize)
         const batchResults = await Promise.all(
           batch.map(async (file: any) => {
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
                  let createdDate = ''
                  let updatedDate = ''
                  let isPrivate = false
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
                    
                    // 解析Frontmatter内容
                    if (inFrontmatter && line.includes(':')) {
                      const [key, value] = line.split(':').map(s => s.trim())
                      if (key === 'created_at') {
                        createdDate = value
                      } else if (key === 'updated_at') {
                        updatedDate = value
                      } else if (key === 'private') {
                        isPrivate = value === 'true'
                      }
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
                    fullContent: content,
                    createdDate,
                    updatedDate,
                    isPrivate
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

  // 编辑笔记
  const handleEditNote = (note: Note) => {
    // 提取笔记标题（去掉.md后缀）
    const title = note.parsedTitle || note.name.replace(/\.md$/, '')
    navigate(`/note/edit/${encodeURIComponent(title)}`)
  }

  // 删除笔记
  const handleDeleteNote = async (note: Note) => {
    setConfirmingDelete(note.sha)
  }

  const confirmDelete = async (note: Note) => {
    setConfirmingDelete(null)
    setDeletingNote(note.sha)
    
    try {
      const auth = localStorage.getItem('sparklog_github_auth')
      const selectedRepo = localStorage.getItem('sparklog_selected_repo')
      
      if (!auth || !selectedRepo) {
        throw new Error('未找到授权信息或仓库信息')
      }
      
      const authData = JSON.parse(auth)
      
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
      showMessage('笔记删除成功！', 'success')
    } catch (error) {
      console.error('删除笔记失败:', error)
      showMessage(`删除失败: ${error instanceof Error ? error.message : '请重试'}`, 'error')
    } finally {
      setDeletingNote(null)
    }
  }

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
            
                         return (
               <div key={note.sha} className="card p-6 hover:shadow-md transition-shadow">
                 <div className="flex items-start justify-between">
                   <div className="flex-1">
                     <div className="flex items-center mb-2">
                       <h3 className="text-lg font-semibold text-gray-900">
                         {title}
                       </h3>
                     </div>
                     
                     {/* 显示内容预览 */}
                     {note.contentPreview && (
                       <div className="text-gray-600 mb-3 line-clamp-3 prose prose-sm max-w-none">
                         <ReactMarkdown 
                           remarkPlugins={[remarkGfm]}
                           components={{
                             p: ({ children }) => <span className="text-gray-600">{children}</span>,
                             h1: ({ children }) => <span className="text-gray-600 font-semibold">{children}</span>,
                             h2: ({ children }) => <span className="text-gray-600 font-semibold">{children}</span>,
                             h3: ({ children }) => <span className="text-gray-600 font-semibold">{children}</span>,
                             strong: ({ children }) => <span className="text-gray-600 font-semibold">{children}</span>,
                             em: ({ children }) => <span className="text-gray-600 italic">{children}</span>,
                             code: ({ children }) => <code className="bg-gray-100 px-1 rounded text-sm">{children}</code>,
                             pre: ({ children }) => <span className="text-gray-600">{children}</span>
                           }}
                         >
                           {note.contentPreview}
                         </ReactMarkdown>
                       </div>
                     )}
                     
                     <div className="flex items-center space-x-4 text-sm text-gray-500">
                       <div className="flex items-center">
                         <Calendar className="w-4 h-4 mr-1" />
                         <span>{note.createdDate ? new Date(note.createdDate).toLocaleDateString() : '未知日期'}</span>
                       </div>
                       <div className="flex items-center">
                         <Tag className="w-4 h-4 mr-1" />
                         <span>Markdown</span>
                       </div>
                       <div className="flex items-center space-x-1">
                         {note.isPrivate ? (
                           <>
                             <Globe className="w-4 h-4 text-red-600" />
                             <span className="text-red-600">私密</span>
                           </>
                         ) : (
                           <>
                             <Globe className="w-4 h-4 text-green-600" />
                             <span className="text-green-600">公开</span>
                           </>
                         )}
                       </div>
                     </div>
                   </div>
                   
                   <div className="flex items-center space-x-2">
                     {confirmingDelete === note.sha ? (
                       <>
                         <button
                           onClick={() => confirmDelete(note)}
                           className="text-red-600 hover:text-red-800 text-sm p-1 rounded hover:bg-red-50 transition-colors"
                           title="确认删除"
                         >
                           <Check className="w-4 h-4" />
                         </button>
                         <button
                           onClick={() => setConfirmingDelete(null)}
                           className="text-gray-600 hover:text-gray-800 text-sm p-1 rounded hover:bg-gray-50 transition-colors"
                           title="取消删除"
                         >
                           <X className="w-4 h-4" />
                         </button>
                       </>
                     ) : (
                       <>
                         <button
                           onClick={() => handleEditNote(note)}
                           className="text-blue-600 hover:text-blue-800 text-sm p-1 rounded hover:bg-blue-50 transition-colors"
                           title="编辑笔记"
                         >
                           <Edit className="w-4 h-4" />
                         </button>
                         <button
                           onClick={() => handleDeleteNote(note)}
                           disabled={deletingNote === note.sha}
                           className="text-red-600 hover:text-red-800 text-sm p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                           title="删除笔记"
                         >
                           {deletingNote === note.sha ? (
                             <Loader2 className="w-4 h-4 animate-spin" />
                           ) : (
                             <Trash2 className="w-4 h-4" />
                           )}
                         </button>
                         <a
                           href={note.html_url}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-gray-600 hover:text-gray-800 text-sm p-1 rounded hover:bg-gray-50 transition-colors"
                           title="在GitHub查看"
                         >
                           <Github className="w-4 h-4" />
                         </a>
                       </>
                     )}
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