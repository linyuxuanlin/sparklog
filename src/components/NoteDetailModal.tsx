import React, { useEffect, useState } from 'react'
import { X, Edit, Trash2, Share, Check, Github, Tag } from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer'
import { Note } from '@/types/Note'
import { useGitHub } from '@/hooks/useGitHub'

// 过滤front matter的函数
const removeFrontMatter = (content: string): string => {
  // 按行分割内容
  const lines = content.split('\n')
  
  let inFrontmatter = false
  let frontmatterEndIndex = -1
  
  // 查找front matter的结束位置
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
  
  // 如果找到了front matter，从结束位置后开始提取内容
  if (frontmatterEndIndex >= 0) {
    const contentLines = lines.slice(frontmatterEndIndex + 1)
    return contentLines.join('\n').trim()
  }
  
  // 如果没有找到标准front matter，使用原来的过滤方法
  const filteredLines = lines.filter(line => {
    const trimmedLine = line.trim()
    // 跳过空行和包含front matter字段的行
    return trimmedLine !== '' && 
           !trimmedLine.includes('created_at:') && 
           !trimmedLine.includes('updated_at:') && 
           !trimmedLine.includes('private:')
  })
  
  return filteredLines.join('\n').trim()
}

interface NoteDetailModalProps {
  note: Note | null
  isOpen: boolean
  onClose: () => void
  onEdit: (note: Note) => void
  onDelete: (note: Note) => void
  onConfirmDelete: (note: Note) => void
  confirmingDeleteId: string | null
  deletingNoteId: string | null
}

const NoteDetailModal: React.FC<NoteDetailModalProps> = ({
  note,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onConfirmDelete,
  confirmingDeleteId,
  deletingNoteId
}) => {
  const { isLoggedIn } = useGitHub()
  const [isVisible, setIsVisible] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [animationPhase, setAnimationPhase] = useState<'entering' | 'entered' | 'exiting' | 'exited'>('exited')

  // 处理动画状态
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setAnimationPhase('entering')
      const timer = setTimeout(() => setAnimationPhase('entered'), 50)
      return () => clearTimeout(timer)
    } else {
      setAnimationPhase('exiting')
      const timer = setTimeout(() => {
        setIsVisible(false)
        setAnimationPhase('exited')
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // 处理分享功能
  const handleShare = async () => {
    if (!note) return
    
    const noteUrl = `${window.location.origin}/note/${encodeURIComponent(note.name.replace(/\.md$/, ''))}`
    
    try {
      await navigator.clipboard.writeText(noteUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      // 降级方案：使用传统方法复制
      const textArea = document.createElement('textarea')
      textArea.value = noteUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isVisible || !note) return null

  const isConfirming = confirmingDeleteId === note.sha
  const isDeletingNote = deletingNoteId === note.sha

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          animationPhase === 'entering' || animationPhase === 'entered' 
            ? 'opacity-100' 
            : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* 卡片容器 */}
      <div 
        className={`relative w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden transition-all duration-300 ease-out ${
          animationPhase === 'entering' 
            ? 'scale-95 opacity-0 translate-y-4' 
            : animationPhase === 'entered'
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
                 {/* 拟物卡片 */}
         <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                       {/* 卡片头部 - 只显示操作按钮 */}
            <div className="flex items-center justify-end p-4">
                           {/* 操作按钮 */}
              <div className="flex items-center space-x-2">
                {/* 分享按钮 */}
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 group"
                  title="分享笔记"
                >
                  {isCopied ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Share className="w-5 h-5" />
                  )}
                </button>
                
                {/* 管理员操作按钮 */}
                {isLoggedIn() && (
                  <>
                    {/* 编辑按钮 */}
                    <button
                      onClick={() => {
                        console.log('NoteDetailModal编辑按钮点击:', { noteName: note.name, noteSha: note.sha })
                        onEdit(note)
                      }}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                      title="编辑笔记"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    
                    {/* GitHub链接按钮 */}
                    <a
                      href={note.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                      title="在GitHub查看"
                    >
                      <Github className="w-5 h-5" />
                    </a>
                    
                    {/* 删除按钮 */}
                    {isConfirming ? (
                      <button
                        onClick={() => onConfirmDelete(note)}
                        className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                        title="确认删除"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onDelete(note)}
                        disabled={isDeletingNote}
                        className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="删除笔记"
                      >
                        {isDeletingNote ? (
                          <div className="w-5 h-5 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </>
                )}
                
                {/* 关闭按钮 */}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                  title="关闭"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
                        </div>
            
            {/* 分割线 */}
            <div className="border-t border-gray-200 dark:border-gray-700"></div>
            
                         {/* 卡片内容 - 只显示笔记内容 */}
             <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] scrollbar-hide">
                                 {note.fullContent ? (
                   <div className="prose prose-gray dark:prose-invert max-w-none prose-2xl prose-p:my-0">
                     <MarkdownRenderer content={removeFrontMatter(note.fullContent)} />
                   </div>
                 ) : note.content ? (
                   <div className="prose prose-gray dark:prose-invert max-w-none prose-2xl prose-p:my-0">
                     <MarkdownRenderer content={removeFrontMatter(note.content)} />
                   </div>
               ) : (
                 <div className="text-center py-12">
                   <div className="text-gray-500 dark:text-gray-400">
                     无法加载笔记内容
                   </div>
                 </div>
               )}
               
               {/* 标签显示 */}
               {note.tags && note.tags.length > 0 && (
                 <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                   <div className="flex flex-wrap gap-2">
                     {note.tags.map((tag, index) => (
                       <span
                         key={index}
                         className="inline-flex items-center px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-lg"
                       >
                         <Tag className="w-4 h-4 mr-1.5" />
                         {tag}
                       </span>
                     ))}
                   </div>
                 </div>
               )}
             </div>
         </div>
      </div>
      
      {/* 分享成功提示 */}
      {isCopied && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-60 bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200 px-4 py-2 rounded-lg shadow-lg border border-green-200 dark:border-green-700">
          <div className="flex items-center">
            <Check className="w-4 h-4 mr-2" />
            <span>链接已复制到剪贴板</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default NoteDetailModal 