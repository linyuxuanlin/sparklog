import React from 'react'
import { Globe, Calendar, Edit, Trash2, Github, Check, X, Loader2, Tag } from 'lucide-react'
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
  tags?: string[]
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
         return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
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
        className="cursor-help hover:text-gray-700 dark:hover:text-gray-200 transition-colors whitespace-nowrap"
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
                 <div className="flex-1 min-w-0 pr-0">
          {/* 显示内容预览 */}
          {note.contentPreview && (
            <div className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">
              <MarkdownRenderer 
                content={note.contentPreview}
                preview={true}
              />
            </div>
          )}
        </div>
      </div>
      
             {/* 底部信息栏：标签、时间、状态 */}
       <div className="flex items-center justify-between mt-0">
         {/* 左侧：标签显示 */}
         <div className="flex flex-wrap gap-1">
           {note.tags && note.tags.length > 0 && (
             note.tags.map((tag, index) => (
               <span
                 key={index}
                 className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-md"
               >
                 <Tag className="w-3 h-3 mr-1" />
                 {tag}
               </span>
             ))
           )}
         </div>
         
         {/* 右侧：时间显示和公开状态 */}
         <div className="flex items-center gap-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
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
    </div>
  )
}

export default NoteCard 