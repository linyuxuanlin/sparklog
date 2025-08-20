import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, ArrowLeft, FileText, Tag, X } from 'lucide-react'
import { useGitHub } from '@/hooks/useGitHub'
import { useNotes } from '@/hooks/useNotes'
import { Note } from '@/types/Note'
import { parseNoteContent, formatTagsForFrontMatter, showMessage } from '@/utils/noteUtils'
import { R2Service } from '@/services/r2Service'
import { StaticContentService } from '@/services/staticContentService'

const EditNotePage: React.FC = () => {
  const { noteId } = useParams<{ noteId: string }>()
  const navigate = useNavigate()
  const { hasManagePermission } = useGitHub()
  const { notes, loadNotes } = useNotes()
  
  const [note, setNote] = useState<Note | null>(null)
  const [content, setContent] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')

  // 显示消息
  const handleShowMessage = (text: string, type: 'success' | 'error') => {
    showMessage(setMessage, setMessageType, text, type)
  }

  // 加载笔记内容
  useEffect(() => {
    const loadNote = async () => {
      if (!noteId) {
        handleShowMessage('笔记ID无效', 'error')
        navigate('/')
        return
      }

      // 检查管理权限
      if (!hasManagePermission()) {
        handleShowMessage('需要管理权限才能编辑笔记', 'error')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        
        // 先从已加载的笔记中查找
        const decodedNoteId = decodeURIComponent(noteId)
        let targetNote = notes.find(n => n.name.replace(/\.md$/, '') === decodedNoteId)
        
        if (!targetNote) {
          // 如果没找到，尝试重新加载笔记列表
          await loadNotes(true)
          targetNote = notes.find(n => n.name.replace(/\.md$/, '') === decodedNoteId)
        }

        if (!targetNote) {
          handleShowMessage('未找到指定的笔记', 'error')
          navigate('/')
          return
        }

        setNote(targetNote)

        // 获取完整内容
        let fullContent = targetNote.fullContent || targetNote.content || ''
        
        if (!fullContent && targetNote.path) {
          // 如果没有完整内容，从R2获取
          const r2Service = R2Service.getInstance()
          const fetchedContent = await r2Service.getFileContent(targetNote.path)
          fullContent = fetchedContent || ''
        }

        if (fullContent) {
          // 解析front matter
          const parsed = parseNoteContent(fullContent, targetNote.name)
          
          // 移除front matter，只保留正文内容
          const lines = fullContent.split('\n')
          let contentStartIndex = 0
          let inFrontmatter = false
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim()
            if (line === '---' && !inFrontmatter) {
              inFrontmatter = true
              continue
            }
            if (line === '---' && inFrontmatter) {
              contentStartIndex = i + 1
              break
            }
          }
          
          const bodyContent = lines.slice(contentStartIndex).join('\n').trim()
          setContent(bodyContent)
          setIsPrivate(parsed.isPrivate)
          setTags(parsed.tags || [])
        } else {
          setContent('')
        }
      } catch (error) {
        console.error('加载笔记失败:', error)
        handleShowMessage('加载笔记失败', 'error')
        navigate('/')
      } finally {
        setIsLoading(false)
      }
    }

    loadNote()
  }, [noteId, notes, loadNotes, hasManagePermission, navigate])

  // 添加标签
  const handleAddTag = () => {
    const trimmedTag = newTag.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setNewTag('')
    }
  }

  // 移除标签
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  // 保存笔记
  const handleSave = async () => {
    if (!note) return

    setIsSaving(true)
    try {
      // 生成front matter
      const frontMatter = [
        '---',
        `created_at: "${note.created_at || note.createdDate || new Date().toISOString()}"`,
        `updated_at: "${new Date().toISOString()}"`,
        `private: ${isPrivate}`,
        `tags: ${formatTagsForFrontMatter(tags)}`,
        '---'
      ].join('\n')

      const fullContent = frontMatter + '\n\n' + content.trim()

      // 保存到R2
      const r2Service = R2Service.getInstance()
      await r2Service.saveFile(note.path, fullContent)

      // 解析更新后的内容
      const parsedContent = parseNoteContent(fullContent, note.name)
      
      // 创建更新后的笔记对象
      const updatedNote = {
        ...note,
        contentPreview: parsedContent.contentPreview,
        fullContent: fullContent,
        content: fullContent,
        isPrivate: isPrivate,
        tags: tags,
        updated_at: new Date().toISOString(),
        updatedDate: new Date().toISOString()
      }

      // 立即更新缓存，让用户看到更改
      const staticContentService = StaticContentService.getInstance()
      staticContentService.updateNoteInCache(updatedNote, isPrivate)

      // 触发后台构建
      staticContentService.triggerBuild()

      handleShowMessage('笔记保存成功！', 'success')
      
      // 延迟跳转，让用户看到成功消息
      setTimeout(() => {
        navigate('/', { state: { shouldRefresh: true } })
      }, 1000)
    } catch (error) {
      console.error('保存笔记失败:', error)
      const errorMessage = error instanceof Error ? error.message : '请重试'
      handleShowMessage(`保存失败: ${errorMessage}`, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (!hasManagePermission()) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">需要管理员权限</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">编辑笔记需要管理员身份验证</p>
            <div className="space-x-3">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                返回首页
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                前往登录
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">加载笔记中...</p>
        </div>
      </div>
    )
  }

  if (!note) {
    return (
      <div className="max-w-4xl mx-auto py-8 text-center">
        <div className="text-gray-500 dark:text-gray-400">未找到笔记</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      {/* 消息提示 */}
      {message && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg border ${
          messageType === 'success' 
            ? 'bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700' 
            : 'bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'
        }`}>
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded-full mr-3 ${
              messageType === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span>{message}</span>
          </div>
        </div>
      )}

      {/* 头部 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
        
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <FileText className="w-4 h-4" />
          <span>编辑笔记: {note.name.replace(/\.md$/, '')}</span>
        </div>
      </div>

      {/* 设置区域 */}
      <div className="mb-6 space-y-4">
        {/* 隐私设置 */}
        <div className="flex items-center space-x-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-white dark:bg-gray-700"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">私密笔记</span>
          </label>
        </div>

        {/* 标签管理 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            标签
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-md"
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="添加标签"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
            <button
              onClick={handleAddTag}
              disabled={!newTag.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              添加
            </button>
          </div>
        </div>
      </div>

      {/* 内容编辑器 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          内容
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="在这里写下你的想法..."
          className="w-full h-96 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none font-mono"
        />
      </div>
    </div>
  )
}

export default EditNotePage