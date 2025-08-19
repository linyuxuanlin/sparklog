import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, Loader2, AlertCircle } from 'lucide-react'
import { useGitHub } from '@/hooks/useGitHub'
import { checkEnvVarsConfigured } from '@/config/env'
import TagManager from '@/components/TagManager'
import { useR2Notes } from '@/hooks/useR2Notes'


const NoteEditPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isConnected, isLoading: isGitHubLoading, isLoggedIn } = useGitHub()
  const { 
    getAllTags: getAvailableTags,
    createNote
  } = useR2Notes()
  const isNewNote = id === 'new'
  
  const [content, setContent] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
      console.log('未登录，跳转到首页')
      navigate('/')
      return
    }
    
    // 检查环境变量配置
    const envConfigured = checkEnvVarsConfigured()
    if (!envConfigured) {
      setMessage('环境变量配置不完整，请检查配置后重试')
      setMessageType('error')
      return
    }
  }, [isLoggedInStable, isGitHubLoading, navigate])

  // 显示消息
  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => {
      setMessage('')
      setMessageType('')
    }, 3000)
  }

  // 保存笔记
  const handleSave = async () => {
    if (!content.trim()) {
      showMessage('笔记内容不能为空', 'error')
      return
    }

    setIsSaving(true)
    try {
      const noteData = {
        content: content.trim(),
        isPrivate,
        tags
      }

      let success = false
      if (isNewNote) {
        success = await createNote(noteData)
      } else {
        // For editing existing notes, we'd need to implement the update logic
        // For now, just show a message
        showMessage('编辑现有笔记功能正在开发中', 'error')
        return
      }

      if (success) {
        showMessage('笔记保存成功！', 'success')
        // 延迟跳转，让用户看到成功消息
        setTimeout(() => {
          navigate('/')
        }, 1500)
      } else {
        showMessage('保存失败，请重试', 'error')
      }
    } catch (error) {
      console.error('保存笔记时发生错误:', error)
      showMessage('保存时发生错误，请重试', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // 处理标签变化
  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags)
  }

  // 如果还在加载GitHub状态，显示加载状态
  if (isGitHubLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>正在加载...</span>
        </div>
      </div>
    )
  }

  // 如果没有登录，不渲染内容（会被useEffect重定向）
  if (!isLoggedInStable()) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isNewNote ? '新建笔记' : '编辑笔记'}
            </h1>
            <div className="flex items-center space-x-4">
              {/* 私密开关 */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  私密笔记
                </span>
              </label>
              
              {/* 保存按钮 */}
              <button
                onClick={handleSave}
                disabled={isSaving || !content.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    保存
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 消息提示 */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            messageType === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          </div>
        )}

        {/* 编辑区域 */}
        <div className="space-y-6">
          {/* 内容编辑器 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              笔记内容
            </label>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="在这里输入你的想法..."
              className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-500 font-mono text-sm"
            />
          </div>

          {/* 标签管理器 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              标签
            </label>
            <TagManager
              tags={tags}
              availableTags={getAvailableTags()}
              onChange={handleTagsChange}
              placeholder="添加标签..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default NoteEditPage