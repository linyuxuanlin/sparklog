import React, { useState } from 'react'
import { Calendar, ChevronDown, ChevronUp, Eye, Lock, Tag } from 'lucide-react'
import { Note } from '@/types'
import MarkdownRenderer from '@/components/ui/MarkdownRenderer'

interface NoteCardProps {
  note: Note
  onOpen: (note: Note) => void
  onTagClick?: (tag: string) => void
  defaultExpanded?: boolean
  hideCollapseButton?: boolean
}

const NoteCard: React.FC<NoteCardProps> = ({ 
  note, 
  onOpen, 
  onTagClick,
  defaultExpanded = false,
  hideCollapseButton = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const handleTagClick = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onTagClick?.(tag)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      {/* 头部信息 */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {note.isPrivate && (
                <Lock className="w-4 h-4 text-orange-500 flex-shrink-0" />
              )}
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {note.name.replace(/\.md$/, '')}
              </h3>
            </div>
            
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(note.createdDate || note.created_at || '')}</span>
              </div>
              
              <button
                onClick={() => onOpen(note)}
                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <Eye className="w-3 h-3" />
                <span>查看详情</span>
              </button>
            </div>
          </div>

          {!hideCollapseButton && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* 标签 */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {note.tags.map((tag) => (
              <button
                key={tag}
                onClick={(e) => handleTagClick(tag, e)}
                className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 内容预览 */}
      {(isExpanded || defaultExpanded) && (
        <div className="p-4">
          {note.contentPreview ? (
            <MarkdownRenderer 
              content={note.contentPreview} 
              className="text-sm prose-sm"
            />
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm italic">
              暂无内容预览
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default NoteCard