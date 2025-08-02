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
  onOpen: (note: Note) => void
  confirmingDeleteId: string | null
  deletingNoteId: string | null
}

// 格式化时间显示
const formatTimeDisplay = (dateString: string | undefined): string => {
  if (!dateString) return '未知日期'
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return '未知日期'
    }
    
    const now = new Date()
    
    // 获取日期部分（忽略时间）
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayOnly = new Date(todayOnly.getTime() - 24 * 60 * 60 * 1000)
    
    // 调试信息
    console.log('时间计算调试:', {
      originalDate: dateString,
      parsedDate: date.toISOString(),
      dateOnly: dateOnly.toISOString(),
      todayOnly: todayOnly.toISOString(),
      yesterdayOnly: yesterdayOnly.toISOString(),
      isToday: dateOnly.getTime() === todayOnly.getTime(),
      isYesterday: dateOnly.getTime() === yesterdayOnly.getTime()
    })
    
    if (dateOnly.getTime() === todayOnly.getTime()) {
      return '今天'
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return '昨天'
    } else {
      // 计算天数差
      const diffTime = todayOnly.getTime() - dateOnly.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays <= 7) {
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
    }
  } catch {
    return '未知日期'
  }
}

// 格式化精确时间
const formatExactTime = (dateString: string | undefined): string => {
  if (!dateString) return '未知'
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return '无效日期'
    }
    
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return '无效日期'
  }
}

// 时间显示组件
const TimeDisplay: React.FC<{ note: Note }> = ({ note }) => {
  const createdTime = note.created_at || note.createdDate
  const updatedTime = note.updated_at || note.updatedDate
  
  // 优先使用更新时间，如果没有则使用创建时间
  const displayTime = updatedTime || createdTime
  
  // 生成悬停提示内容
  const getTooltipContent = () => {
    const created = formatExactTime(createdTime)
    const updated = formatExactTime(updatedTime)
    
    let tooltip = ''
    if (createdTime && updatedTime) {
      tooltip = `创建时间: ${created}\n修改时间: ${updated}`
    } else if (createdTime) {
      tooltip = `创建时间: ${created}`
    } else if (updatedTime) {
      tooltip = `修改时间: ${updated}`
    } else {
      tooltip = '时间信息未知'
    }
    
    return tooltip
  }
  
  return (
    <div className="flex items-center">
      <Calendar className="w-4 h-4 mr-1" />
      <span 
        className="cursor-help hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        title={getTooltipContent()}
      >
        {formatTimeDisplay(displayTime)}
      </span>
    </div>
  )
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onOpen,
  confirmingDeleteId,
  deletingNoteId
}) => {
  const { isLoggedIn } = useGitHub()
  const isConfirming = confirmingDeleteId === note.sha
  const isDeletingNote = deletingNoteId === note.sha

  return (
    <div 
      className="card p-6 hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer hover:scale-[1.02] hover:shadow-lg"
      onClick={() => onOpen(note)}
    >
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
            <TimeDisplay note={note} />
            {isLoggedIn() && (
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
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isConfirming ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onConfirmDelete(note)
                }}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="确认删除"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCancelDelete()
                }}
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
                    onClick={(e) => {
                      e.stopPropagation()
                      console.log('NoteCard编辑按钮点击:', { noteName: note.name, noteSha: note.sha })
                      onEdit(note)
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    title="编辑笔记"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(note)
                    }}
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
                  <a
                    href={note.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    title="在GitHub查看"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default NoteCard 