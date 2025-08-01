import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, Loader2 } from 'lucide-react'
import { useGitHub } from '@/hooks/useGitHub'
import { getDefaultRepoConfig, getDefaultGitHubToken } from '@/config/defaultRepo'

const NoteEditPage: React.FC = () => {
  const { id, title } = useParams()
  const navigate = useNavigate()
  const { isConnected, isLoading: isGitHubLoading, isLoggedIn, getGitHubToken } = useGitHub()
  const isNewNote = id === 'new'
  const isEditMode = title !== undefined
  
  const [content, setContent] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [originalFile, setOriginalFile] = useState<{ path: string; sha: string } | null>(null)

  // 直接使用isLoggedIn，现在它已经是稳定的了
  const isLoggedInStable = isLoggedIn

  // 权限检查
  useEffect(() => {
    console.log('NoteEditPage权限检查:', {
      isLoggedIn: isLoggedInStable(),
      isGitHubLoading,
      isConnected
    })
    
    // 等待GitHub状态加载完成后再检查权限
    if (!isGitHubLoading && !isLoggedInStable()) {
      console.log('权限检查失败，重定向到笔记页面')
      navigate('/notes')
      return
    }
  }, [isLoggedInStable, isGitHubLoading, navigate])

  // 加载现有笔记
  useEffect(() => {
    console.log('编辑笔记useEffect调试:', {
      isEditMode,
      title,
      isLoggedIn: isLoggedInStable(),
      shouldLoad: isEditMode && title && isLoggedInStable()
    })
    
    if (isEditMode && title && isLoggedInStable()) {
      console.log('开始加载笔记:', decodeURIComponent(title))
      loadExistingNote(decodeURIComponent(title))
    }
  }, [isEditMode, title, isLoggedInStable])

  // 如果正在加载GitHub状态，显示加载界面
  if (isGitHubLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">正在检查权限...</p>
        </div>
      </div>
    )
  }

  // 如果未登录，显示权限不足界面
  if (!isLoggedInStable()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">权限不足</h2>
            <p className="text-gray-600 mb-6">您需要登录管理员账户才能创建和编辑笔记。</p>
            <button
              onClick={() => navigate('/settings')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              前往设置页面登录
            </button>
          </div>
        </div>
      </div>
    )
  }

  const loadExistingNote = async (noteTitle: string) => {
    console.log('loadExistingNote开始:', noteTitle)
    setIsLoading(true)
    
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
      
      console.log('loadExistingNote配置:', {
        noteTitle,
        defaultConfig,
        authData,
        selectedRepo
      })
      
      // 如果是管理员且已登录，使用GitHub Token
      if (isLoggedInStable()) {
        const adminToken = getGitHubToken()
        if (adminToken) {
          authData.accessToken = adminToken
          console.log('管理员模式，使用GitHub Token加载笔记')
        }
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
      console.log('获取到的文件列表:', files.map((f: any) => f.name))
      
      const noteFile = files.find((file: any) => 
        file.name.endsWith('.md') && 
        (file.name.replace(/\.md$/, '') === noteTitle || 
         file.name.includes(noteTitle))
      )
      
      console.log('查找笔记文件结果:', {
        noteTitle,
        foundFile: noteFile,
        searchPattern: noteTitle
      })
      
      if (!noteFile) {
        throw new Error('未找到笔记文件')
      }
      
      // 保存原始文件信息，用于编辑时的更新
      setOriginalFile({
        path: noteFile.path,
        sha: noteFile.sha
      })
      
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
      
             // 提取内容
       const contentLines = frontmatterEndIndex >= 0 
         ? lines.slice(frontmatterEndIndex + 1) 
         : lines
       
       const extractedContent = contentLines.join('\n')
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
      
      // 基础配置使用环境变量
      authData = {
        username: defaultConfig.owner,
        accessToken: getDefaultGitHubToken()
      }
      selectedRepo = defaultConfig.repo
      
      // 如果是管理员且已登录，使用GitHub Token
      if (isLoggedInStable()) {
        const adminToken = getGitHubToken()
        if (adminToken) {
          authData.accessToken = adminToken
          console.log('管理员模式，使用GitHub Token保存笔记')
        }
      }
      
             // 创建笔记文件名（使用时间戳）
       const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').replace('Z', '')
       const fileName = `${timestamp}.md`
       let filePath = `notes/${fileName}`
       
       // 如果是编辑模式，使用原始文件路径
       if (isEditMode && originalFile) {
         filePath = originalFile.path
         console.log('编辑模式，使用原始文件路径:', filePath)
       }
       
       // 创建笔记内容
       const noteContent = `---
 created_at: ${new Date().toISOString()}
 updated_at: ${new Date().toISOString()}
 private: ${isPrivate}
 ---

 ${content.trim()}
 `

       // 如果是编辑模式，检查是否需要更新现有文件或创建新文件
       let sha = ''
       let shouldDeleteOriginal = false
       
       if (isEditMode && originalFile) {
         // 检查是否使用原始文件路径
         const isUsingOriginalPath = filePath === originalFile.path
         
         console.log('文件路径比较:', {
           originalPath: originalFile.path,
           newPath: filePath,
           isUsingOriginal: isUsingOriginalPath
         })
         
         if (isUsingOriginalPath) {
           // 使用原始文件路径，更新现有文件
           sha = originalFile.sha
           console.log('编辑模式，更新现有文件，SHA:', sha)
         } else {
           // 使用新文件路径，创建新文件，稍后删除旧文件
           console.log('编辑模式，创建新文件，稍后删除旧文件')
           shouldDeleteOriginal = true
         }
       }

       // 调用GitHub API保存笔记
       const requestBody: any = {
         message: `${isNewNote ? '创建' : '更新'}笔记: ${timestamp}`,
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
       
       // 如果文件名改变了，删除原始文件
       if (shouldDeleteOriginal && originalFile) {
         try {
           console.log('删除原始文件:', originalFile.path)
           const deleteResponse = await fetch(`https://api.github.com/repos/${authData.username}/${selectedRepo}/contents/${originalFile.path}`, {
             method: 'DELETE',
             headers: {
               'Authorization': `token ${authData.accessToken}`,
               'Accept': 'application/vnd.github.v3+json',
               'Content-Type': 'application/json'
             },
             body: JSON.stringify({
               message: `删除旧文件: ${originalFile.path}`,
               sha: originalFile.sha
             })
           })
           
           if (!deleteResponse.ok) {
             console.warn('删除原始文件失败:', deleteResponse.statusText)
           } else {
             console.log('原始文件删除成功')
           }
         } catch (error) {
           console.warn('删除原始文件时出错:', error)
         }
       }
       
       showMessage('笔记保存成功！', 'success')
       setTimeout(() => {
         navigate('/notes', { state: { shouldRefresh: true } })
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
                   disabled={isSaving || isLoading || !content.trim()}
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