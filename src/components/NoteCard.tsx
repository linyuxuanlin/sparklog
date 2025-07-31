import React from 'react'
import { Globe, Calendar, Edit, Trash2, Github, Check, X, Loader2 } from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer'

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
  const title = note.parsedTitle || note.name.replace(/\.md$/, '')
  const isConfirming = confirmingDeleteId === note.sha
  const isDeletingNote = deletingNoteId === note.sha

  return (
    <div className="card p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          </div>
          
          {/* 显示内容预览 */}
          {note.contentPreview && (
            <div className="text-gray-600 mb-3 line-clamp-3">
              <MarkdownRenderer 
                content={note.contentPreview}
                preview={true}
              />
            </div>
          )}
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>
                {note.createdDate ? 
                  (() => {
                    try {
                      const date = new Date(note.createdDate)
                      return isNaN(date.getTime()) ? '未知日期' : date.toLocaleDateString()
                    } catch {
                      return '未知日期'
                    }
                  })() 
                  : '未知日期'
                }
              </span>
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
          {isConfirming ? (
            <>
              <button
                onClick={() => onConfirmDelete(note)}
                className="text-red-600 hover:text-red-800 text-sm p-1 rounded hover:bg-red-50 transition-colors"
                title="确认删除"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={onCancelDelete}
                className="text-gray-600 hover:text-gray-800 text-sm p-1 rounded hover:bg-gray-50 transition-colors"
                title="取消删除"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onEdit(note)}
                className="text-blue-600 hover:text-blue-800 text-sm p-1 rounded hover:bg-blue-50 transition-colors"
                title="编辑笔记"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(note)}
                disabled={isDeletingNote}
                className="text-red-600 hover:text-red-800 text-sm p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
}

export default NoteCard 