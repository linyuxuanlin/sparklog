import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, ArrowLeft, FileText, Tag, X } from 'lucide-react'
import { useGitHub } from '@/hooks/useGitHub'
import { useNotes } from '@/hooks/useNotes'
import { Note } from '@/types/Note'
import { parseNoteContent, formatTagsForFrontMatter, showMessage } from '@/utils/noteUtils'
import { R2Service } from '@/services/r2Service'
import { StaticContentService } from '@/services/staticContentService'

interface EditNotePageProps {
  isCreate?: boolean
}

const EditNotePage: React.FC<EditNotePageProps> = ({ isCreate = false }) => {
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
  
  // 使用 useRef 跟踪笔记加载状态，避免无限循环
  const hasLoadedNoteRef = useRef(false)
  const isLoadingRef = useRef(false)

  // 显示消息
  const handleShowMessage = (text: string, type: 'success' | 'error') => {
    showMessage(setMessage, setMessageType, text, type)
  }

  // 加载笔记内容（仅在编辑模式下）
  useEffect(() => {
    if (isCreate) {
      setIsLoading(false)
      return
    }

    // 如果已经加载过笔记或者正在加载，则跳过
    if (hasLoadedNoteRef.current || isLoadingRef.current) {
      return
    }

    // 如果笔记列表为空，等待笔记加载完成
    if (notes.length === 0) {
      return
    }

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
        isLoadingRef.current = true
        setIsLoading(true)
        
        // 先从已加载的笔记中查找
        const decodedNoteId = decodeURIComponent(noteId)
        
        let targetNote = notes.find(n => n.name.replace(/\.md$/, '') === decodedNoteId)
        
        // 如果仍然找不到，尝试从静态内容中查找（使用不同的字段匹配）
        if (!targetNote) {
          targetNote = notes.find(n => 
            n.name.replace(/\.md$/, '') === decodedNoteId ||
            (n as any).filename?.replace(/\.md$/, '') === decodedNoteId ||
            (n as any).id === decodedNoteId
          )
        }

        // 如果仍然找不到，尝试更宽松的匹配策略
        if (!targetNote) {
          // 尝试部分匹配
          targetNote = notes.find(n => {
            const noteName = n.name.replace(/\.md$/, '')
            const notePath = n.path.replace(/^notes\//, '').replace(/\.md$/, '')
            return noteName === decodedNoteId || 
                   notePath === decodedNoteId ||
                   noteName.includes(decodedNoteId) ||
                   notePath.includes(decodedNoteId)
          })
        }

        // 如果仍然找不到，尝试从所有可能的字段中查找
        if (!targetNote) {
          targetNote = notes.find(n => {
            // 检查所有可能的字段
            const fields = [
              n.name,
              n.path,
              (n as any).filename,
              (n as any).id,
              n.sha
            ].filter(Boolean)
            
            return fields.some(field => {
              if (!field) return false
              const cleanField = field.toString().replace(/\.md$/, '').replace(/^notes\//, '')
              return cleanField === decodedNoteId || cleanField.includes(decodedNoteId)
            })
          })
        }

        // 如果仍然找不到，尝试直接从R2获取笔记信息（作为备用方案）
        if (!targetNote) {
          try {
            const r2Service = R2Service.getInstance()
            const notePath = `notes/${decodedNoteId}.md`
            const noteContent = await r2Service.getFileContent(notePath)
            
            if (noteContent) {
              // 检查返回的内容是否是HTML页面
              if (noteContent.trim().startsWith('<!DOCTYPE html>') || noteContent.trim().startsWith('<html')) {
                handleShowMessage('R2配置可能有问题，但已从缓存加载笔记内容', 'error')
                // 继续尝试从缓存中查找
              } else {
                // 创建一个临时的笔记对象
                targetNote = {
                  sha: `temp-${decodedNoteId}`,
                  path: notePath,
                  name: `${decodedNoteId}.md`,
                  size: noteContent.length,
                  url: '',
                  git_url: '',
                  html_url: '',
                  download_url: '',
                  type: 'file',
                  content: noteContent,
                  fullContent: noteContent,
                  contentPreview: noteContent.substring(0, 100) + '...',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  isPrivate: false,
                  tags: []
                } as Note
              }
            }
          } catch (r2Error) {
            // 不立即跳转，而是继续尝试从缓存中查找
          }
        }

        if (!targetNote) {
          handleShowMessage('未找到指定的笔记', 'error')
          navigate('/')
          return
        }

        setNote(targetNote)

        // 获取完整内容
        let fullContent = targetNote.fullContent || targetNote.content || ''
        
        // 如果笔记内容不完整，尝试从R2获取（但这不是必需的）
        if (!fullContent && targetNote.path) {
          try {
            const r2Service = R2Service.getInstance()
            const fetchedContent = await r2Service.getFileContent(targetNote.path)
            if (fetchedContent && !fetchedContent.trim().startsWith('<!DOCTYPE html>')) {
              fullContent = fetchedContent
            }
          } catch (error) {
            // 使用缓存内容
          }
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
          // 如果没有完整内容，尝试从笔记的其他字段获取
          const fallbackContent = targetNote.contentPreview || (targetNote as any).excerpt || targetNote.content || ''
          setContent(fallbackContent)
          setIsPrivate(targetNote.isPrivate || false)
          setTags(targetNote.tags || [])
        }
        
        // 标记笔记已加载完成
        hasLoadedNoteRef.current = true
      } catch (error) {
        handleShowMessage('加载笔记失败', 'error')
        navigate('/')
      } finally {
        isLoadingRef.current = false
        setIsLoading(false)
      }
    }

    loadNote()
  }, [noteId, hasManagePermission, navigate, notes, loadNotes, isCreate])

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
    if (isCreate && !content.trim()) {
      handleShowMessage('笔记内容不能为空', 'error')
      return
    }

    if (!isCreate && !note) return

    setIsSaving(true)
    try {
      let filePath: string
      let fileName: string

      if (isCreate) {
        // 创建新笔记
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        fileName = `${timestamp}.md`
        filePath = `notes/${fileName}`
      } else {
        // 编辑现有笔记
        filePath = note!.path
        fileName = note!.name
      }

      // 生成front matter
      const now = new Date().toISOString()
      const frontMatter = [
        '---',
        `created_at: "${isCreate ? now : (note?.created_at || note?.createdDate || now)}"`,
        `updated_at: "${now}"`,
        `private: ${isPrivate}`,
        `tags: ${formatTagsForFrontMatter(tags)}`,
        '---'
      ].join('\n')

      const fullContent = frontMatter + '\n\n' + content.trim()

      // 保存到R2
      const r2Service = R2Service.getInstance()
      await r2Service.saveFile(filePath, fullContent)

      if (isCreate) {
        // 创建新笔记对象
        const parsedContent = parseNoteContent(fullContent, fileName)
        const newNote = {
          name: fileName,
          path: filePath,
          sha: `note-${Date.now()}`,
          size: fullContent.length,
          url: '',
          git_url: '',
          html_url: '',
          download_url: '',
          type: 'file',
          contentPreview: parsedContent.contentPreview,
          fullContent: fullContent,
          content: fullContent,
          isPrivate: isPrivate,
          tags: tags,
          created_at: now,
          updated_at: now,
          createdDate: now,
          updatedDate: now
        }

        // 立即更新缓存，让用户看到新笔记
        const staticContentService = StaticContentService.getInstance()
        staticContentService.updateNoteInCache(newNote, isPrivate)

        // 触发后台构建
        staticContentService.triggerBuild()

        handleShowMessage('笔记创建成功！', 'success')
      } else {
        // 解析更新后的内容
        const parsedContent = parseNoteContent(fullContent, note!.name)
        
        // 创建更新后的笔记对象
        const updatedNote = {
          ...note!,
          contentPreview: parsedContent.contentPreview,
          fullContent: fullContent,
          content: fullContent,
          isPrivate: isPrivate,
          tags: tags,
          updated_at: now,
          updatedDate: now
        }

        // 立即更新缓存，让用户看到更改
        const staticContentService = StaticContentService.getInstance()
        staticContentService.updateNoteInCache(updatedNote, isPrivate)

        // 触发后台构建
        staticContentService.triggerBuild()

        handleShowMessage('笔记保存成功！', 'success')
      }
      
      // 延迟跳转，让用户看到成功消息
      setTimeout(() => {
        navigate('/', { state: { shouldRefresh: true } })
      }, 1000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '请重试'
      const action = isCreate ? '创建' : '保存'
      handleShowMessage(`${action}失败: ${errorMessage}`, 'error')
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
            <p className="text-gray-600 dark:text-gray-400 mb-6">{isCreate ? '创建' : '编辑'}笔记需要管理员身份验证</p>
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

  if (!isCreate && isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">加载笔记中...</p>
        </div>
      </div>
    )
  }

  if (!isCreate && !note) {
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
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <FileText className="w-4 h-4" />
          <span>{isCreate ? '新建笔记' : `编辑笔记: ${note?.name.replace(/\.md$/, '')}`}</span>
        </div>
      </div>

      {/* 内容编辑器 */}
      <div className="mb-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="在这里写下你的想法..."
          className="w-full h-96 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none font-mono"
        />
      </div>

      {/* 标签和隐私设置区域 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {/* 标签管理 */}
          <div className="flex-1 max-w-2xl">
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

          {/* 隐私设置 */}
          <div className="ml-8 flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-white dark:bg-gray-700"
              />
              <span className="ml-3 text-base text-gray-700 dark:text-gray-300">私密笔记</span>
            </label>
          </div>
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving || (isCreate && !content.trim())}
          className="btn-primary inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {isCreate ? '创建中...' : '保存中...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isCreate ? '创建笔记' : '保存'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default EditNotePage