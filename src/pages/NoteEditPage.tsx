import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Github, Save, Loader2 } from 'lucide-react'
import { useGitHub } from '@/hooks/useGitHub'
import { getDefaultRepoConfig } from '@/config/defaultRepo'

const NoteEditPage: React.FC = () => {
  const { id, title } = useParams()
  const navigate = useNavigate()
  const { isConnected, isLoading: isGitHubLoading, isLoggedIn, getGitHubToken } = useGitHub()
  const isNewNote = id === 'new'
  const isEditMode = title !== undefined
  
  const [noteTitle, setNoteTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')

  // 权限检查
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/notes')
      return
    }
  }, [isLoggedIn, navigate])

  // 加载现有笔记
  useEffect(() => {
    if (isEditMode && title) {
      loadExistingNote(decodeURIComponent(title))
    }
  }, [isEditMode, title])

  const loadExistingNote = async (noteTitle: string) => {
    setIsLoading(true)
    
    try {
      // 获取默认仓库配置
      const defaultConfig = getDefaultRepoConfig()
      if (!defaultConfig) {
        throw new Error('未配置默认仓库')
      }
      
      let authData: any = null
      let selectedRepo: string | null = null
      
      // 如果是管理员且已登录，使用GitHub Token
      if (isLoggedIn()) {
        const adminToken = getGitHubToken()
        if (adminToken) {
          authData = {
            username: defaultConfig.owner,
            accessToken: adminToken
          }
          selectedRepo = defaultConfig.repo
          console.log('管理员模式，使用GitHub Token加载笔记')
        }
      }
      
      // 如果没有管理员Token，尝试从localStorage获取
      if (!authData) {
        const auth = localStorage.getItem('sparklog_github_auth')
        const repo = localStorage.getItem('sparklog_selected_repo')
        
        if (!auth || !repo) {
          throw new Error('未找到授权信息或仓库信息')
        }
        
        authData = JSON.parse(auth)
        selectedRepo = repo
      }
      
      // 查找笔记文件
      const response = await fetch(`https://api.github.com/repos/${authData.username}/${selectedRepo}/contents/notes`, {
        headers: {
          'Authorization': `token ${authData.accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })
      
      if (!response.ok) {
        throw new Error('无法获取笔记列表')
      }
      
      const files = await response.json()
      const noteFile = files.find((file: any) => 
        file.name.endsWith('.md') && 
        (file.name.replace(/\.md$/, '') === noteTitle || 
         file.name.includes(noteTitle))
      )
      
      if (!noteFile) {
        throw new Error('未找到笔记文件')
      }
      
      // 获取笔记内容
      const contentResponse = await fetch(noteFile.url, {
        headers: {
          'Authorization': `token ${authData.accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })
      
      if (!contentResponse.ok) {
        throw new Error('无法获取笔记内容')
      }
      
      const contentData = await contentResponse.json()
      const fullContent = atob(contentData.content)
      
      // 解析笔记内容
      const lines = fullContent.split('\n')
      let inFrontmatter = false
      let frontmatterEndIndex = -1
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (line === '---' && !inFrontmatter) {
          inFrontmatter = true
          continue
        }
        if (line === '---' && inFrontmatter) {
          frontmatterEndIndex = i
          break
        }
      }
      
      // 提取标题和内容
      const contentLines = frontmatterEndIndex >= 0 
        ? lines.slice(frontmatterEndIndex + 1) 
        : lines
      
      let extractedTitle = noteTitle
      let extractedContent = contentLines.join('\n')
      
      // 查找标题行
      for (const line of contentLines) {
        if (line.startsWith('# ')) {
          extractedTitle = line.replace(/^#\s*/, '')
          extractedContent = contentLines.slice(contentLines.indexOf(line) + 1).join('\n')
          break
        }
      }
      
      setNoteTitle(extractedTitle)
      setContent(extractedContent.trim())
      
    } catch (error) {
      console.error('加载笔记失败:', error)
      showMessage(`加载笔记失败: ${error instanceof Error ? error.message : '请重试'}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/')
  }

  // 显示消息提示
  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => {
      setMessage('')
      setMessageType('')
    }, 5000)
  }

  const handleSave = async () => {
    if (!noteTitle.trim()) {
      showMessage('请输入笔记标题', 'error')
      return
    }
    
    if (!content.trim()) {
      showMessage('请输入笔记内容', 'error')
      return
    }
    
    setIsSaving(true)
    
    try {
      // 获取默认仓库配置
      const defaultConfig = getDefaultRepoConfig()
      if (!defaultConfig) {
        throw new Error('未配置默认仓库')
      }
      
      let authData: any = null
      let selectedRepo: string | null = null
      
      // 如果是管理员且已登录，使用GitHub Token
      if (isLoggedIn()) {
        const adminToken = getGitHubToken()
        if (adminToken) {
          authData = {
            username: defaultConfig.owner,
            accessToken: adminToken
          }
          selectedRepo = defaultConfig.repo
          console.log('管理员模式，使用GitHub Token保存笔记')
        }
      }
      
      // 如果没有管理员Token，尝试从localStorage获取
      if (!authData) {
        const auth = localStorage.getItem('sparklog_github_auth')
        const repo = localStorage.getItem('sparklog_selected_repo')
        
        if (!auth || !repo) {
          throw new Error('未找到GitHub授权信息或仓库信息')
        }
        
        authData = JSON.parse(auth)
        selectedRepo = repo
      }
      
      // 创建笔记文件名
      const fileName = `${noteTitle.trim().replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')}.md`
      const filePath = `notes/${fileName}`
      
      // 创建笔记内容
      const noteContent = `---
created_at: ${new Date().toISOString()}
updated_at: ${new Date().toISOString()}
private: ${isPrivate}
---

# ${noteTitle.trim()}

${content.trim()}
`

             // 如果是编辑模式，需要先获取文件的SHA
       let sha = ''
       if (isEditMode) {
         try {
           const existingFileResponse = await fetch(`https://api.github.com/repos/${authData.username}/${selectedRepo}/contents/${filePath}`, {
             headers: {
               'Authorization': `token ${authData.accessToken}`,
               'Accept': 'application/vnd.github.v3+json'
             }
           })
           
           if (existingFileResponse.ok) {
             const existingFileData = await existingFileResponse.json()
             sha = existingFileData.sha
           }
         } catch (error) {
           console.warn('获取现有文件SHA失败，将创建新文件:', error)
         }
       }

       // 调用GitHub API保存笔记
       const requestBody: any = {
         message: `${isNewNote ? '创建' : '更新'}笔记: ${noteTitle.trim()}`,
         content: btoa(unescape(encodeURIComponent(noteContent))), // Base64编码
         branch: 'main'
       }
       
       if (sha) {
         requestBody.sha = sha
       }

       const response = await fetch(`https://api.github.com/repos/${authData.username || 'user'}/${selectedRepo}/contents/${filePath}`, {
         method: 'PUT',
         headers: {
           'Authorization': `token ${authData.accessToken}`,
           'Accept': 'application/vnd.github.v3+json',
           'Content-Type': 'application/json'
         },
         body: JSON.stringify(requestBody)
       })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`保存失败: ${errorData.message || response.statusText}`)
      }
      
      showMessage('笔记保存成功！', 'success')
      setTimeout(() => {
        navigate('/notes')
      }, 1500)
    } catch (error) {
      console.error('保存笔记失败:', error)
      showMessage(`保存失败: ${error instanceof Error ? error.message : '请重试'}`, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // 如果正在加载，显示加载状态
  if (isGitHubLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">检查GitHub连接状态...</p>
        </div>
      </div>
    )
  }

  // 如果未连接GitHub，显示提示
  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="mb-8">
            <Github className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              需要连接GitHub
            </h2>
            <p className="text-gray-600 mb-6">
              请先连接GitHub账号才能创建和编辑笔记
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              连接GitHub步骤：
            </h3>
            <ol className="text-left text-sm text-gray-600 space-y-2 mb-6">
              <li>1. 前往 <a href="https://github.com/settings/applications/new" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">GitHub OAuth应用设置</a></li>
              <li>2. 创建新的OAuth应用</li>
              <li>3. 设置回调URL为：<code className="bg-gray-200 px-1 rounded">https://your-domain.pages.dev/auth/callback</code></li>
              <li>4. 复制Client ID和Client Secret</li>
              <li>5. 在设置页面配置这些信息</li>
            </ol>
            
            <button 
              onClick={() => navigate('/settings')}
              className="btn-primary"
            >
              前往设置
            </button>
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
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isNewNote ? '创建新笔记' : '编辑笔记'}
        </h1>
      </div>

      <div className="card p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载笔记中...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标题
              </label>
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="输入笔记标题..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                内容
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="开始编写你的笔记..."
                rows={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                    />
                    <div className="w-5 h-5 bg-gray-200 border-2 border-gray-300 rounded-md peer-checked:bg-blue-600 peer-checked:border-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2 transition-colors group-hover:bg-gray-100 peer-checked:group-hover:bg-blue-700">
                      <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    设为私密笔记
                  </span>
                </label>
              </div>

              <div className="flex space-x-3">
                <button 
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  取消
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving || isLoading || !noteTitle.trim() || !content.trim()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      保存笔记
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default NoteEditPage 