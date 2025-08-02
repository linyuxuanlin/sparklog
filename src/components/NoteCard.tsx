import React from 'react'
import { Globe, Calendar, Edit, Trash2, Github, Check, X, Loader2 } from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer'
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
  contentPreview?: string
  fullContent?: string
  createdDate?: string
  updatedDate?: string
  isPrivate?: boolean
}

interface NoteCardProps {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (note: Note) => void
  onConfirmDelete: (note: Note) => void
  onCancelDelete: () => void
  confirmingDeleteId: string | null
  deletingNoteId: string | null
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  confirmingDeleteId,
  deletingNoteId
}) => {
  const { isLoggedIn } = useGitHub()
  const isConfirming = confirmingDeleteId === note.sha
  const isDeletingNote = deletingNoteId === note.sha

  return (
    <div className="card p-6 hover:shadow-md transition-shadow bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* 显示内容预览 */}
          {note.contentPreview && (
            <div className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">
              <MarkdownRenderer 
                content={note.contentPreview}
                preview={true}
              />
            </div>
          )}
          
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>
                {(() => {
                  // 调试：查看笔记的日期数据
                  console.log(`笔记 ${note.name} 的日期数据:`, {
                    created_at: note.created_at,
                    createdDate: note.createdDate,
                    updated_at: note.updated_at,
                    updatedDate: note.updatedDate
                  })
                  
                  // 优先使用GitHub API提供的日期
                  const dateToUse = note.created_at || note.createdDate || note.updated_at || note.updatedDate
                  
                  if (!dateToUse) {
                    return '未知日期'
                  }
                  
                  try {
                    const date = new Date(dateToUse)
                    if (isNaN(date.getTime())) {
                      return '未知日期'
                    }
                    
                    // 格式化日期
                    const now = new Date()
                    const diffTime = Math.abs(now.getTime() - date.getTime())
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    
                    if (diffDays === 0) {
                      return '今天'
                    } else if (diffDays === 1) {
                      return '昨天'
                    } else if (diffDays <= 7) {
                      return `${diffDays}天前`
                    } else if (diffDays <= 30) {
                      const weeks = Math.floor(diffDays / 7)
                      return `${weeks}周前`
                    } else {
                      return date.toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    }
                  } catch {
                    return '未知日期'
                  }
                })()}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              {note.isPrivate ? (
                <>
                  <Globe className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-red-600 dark:text-red-400">私密</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400">公开</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isConfirming ? (
            <>
              <button
                onClick={() => onConfirmDelete(note)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="确认删除"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={onCancelDelete}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="取消删除"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              {isLoggedIn() && (
                <>
                  <button
                    onClick={() => onEdit(note)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    title="编辑笔记"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(note)}
                    disabled={isDeletingNote}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="删除笔记"
                  >
                    {isDeletingNote ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </>
              )}
              <a
                href={note.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
}

export default NoteCard 