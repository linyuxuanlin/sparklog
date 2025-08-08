import React, { useState, useEffect } from 'react'
import { Globe, Calendar, Tag, ChevronDown, ChevronUp } from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer'
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
  onOpen: (note: Note) => void
  onTagClick?: (tag: string) => void
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
  onOpen,
  onTagClick
}) => {
  const { isLoggedIn } = useGitHub()
  const [isExpanded, setIsExpanded] = useState(false)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [showButtonText, setShowButtonText] = useState(true)
  const buttonRef = React.useRef<HTMLSpanElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 检测按钮文字显示空间
  useEffect(() => {
    const checkButtonSpace = () => {
      if (!buttonRef.current || !containerRef.current) return
      
      const container = containerRef.current
      const button = buttonRef.current
      
      // 测量按钮的当前宽度（可能包含或不包含文字）
      const currentButtonWidth = button.offsetWidth
      
      // 临时显示文字来测量完整宽度
      const originalDisplay = button.style.display
      button.style.display = 'inline-flex'
      
      const containerWidth = container.offsetWidth
      
      // 恢复原始状态
      button.style.display = originalDisplay
      
      // 计算空余空间
      const availableSpace = containerWidth - currentButtonWidth
      
      // 只有当空余空间小于60px时才隐藏文字
      const minGap = 60 // 最小间隔空白
      setShowButtonText(availableSpace >= minGap)
    }

    // 初始检查
    checkButtonSpace()
    
    // 监听容器大小变化
    const resizeObserver = new ResizeObserver(checkButtonSpace)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [windowWidth])

  return (
    <div 
      className="card p-6 hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg"
      onClick={() => onOpen(note)}
    >
             <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-0">
           {/* 显示内容预览 */}
           {note.contentPreview && (
             <div className="text-gray-600 dark:text-gray-300 mb-3">
                               {isExpanded ? (
                  <div>
                    <MarkdownRenderer 
                      content={removeFrontMatter(note.fullContent || note.content || note.contentPreview)}
                      preview={false}
                    />
                  </div>
                ) : (
                  <div>
                    <div className="line-clamp-3">
                      <MarkdownRenderer 
                        content={note.contentPreview}
                        preview={true}
                      />
                    </div>
                  </div>
                )}
             </div>
           )}
         </div>
       </div>
      
             {/* 底部信息栏：标签、时间、状态 */}
       <div ref={containerRef} className="flex items-center justify-between gap-4 mt-0">
         {/* 第一组：标签显示 - 动态宽度，支持横向滚动 */}
         <div className="flex gap-1 overflow-x-auto scrollbar-hide" style={{
           width: note.tags && note.tags.length > 0 
             ? Math.min(Math.max(note.tags.length * 60, 60), Math.max(windowWidth * 0.3, 120)) 
             : 0
         }}>
           {note.tags && note.tags.length > 0 && (
             note.tags.map((tag, index) => (
               <span
                 key={index}
                 onClick={(e) => {
                   e.stopPropagation()
                   onTagClick?.(tag)
                 }}
                 className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-md cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex-shrink-0"
               >
                 <Tag className="w-3 h-3 mr-1 flex-shrink-0" />
                 <span className="truncate">{tag}</span>
               </span>
             ))
           )}
         </div>
         
         {/* 第二组：全文/收起按钮 - 智能显示文字 */}
         {note.contentPreview && note.contentPreview.length > 200 && (
           <div className="flex-shrink-0 min-w-0">
             <span 
               ref={buttonRef}
               onClick={(e) => {
                 e.stopPropagation()
                 setIsExpanded(!isExpanded)
               }}
               className="inline-flex items-center justify-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium cursor-pointer px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 min-w-[2.5rem] h-7"
             >
               {isExpanded ? (
                 <>
                   <ChevronUp className="w-4 h-4" />
                   {showButtonText && <span>收起</span>}
                 </>
               ) : (
                 <>
                   <ChevronDown className="w-4 h-4" />
                   {showButtonText && <span>全文</span>}
                 </>
               )}
             </span>
           </div>
         )}
         
         {/* 第三组：时间显示和公开状态 - 根据按钮文字显示状态决定堆叠 */}
         <div className={`flex gap-1 sm:gap-2 text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 min-w-0 ${showButtonText ? 'flex-row items-center' : 'flex-col sm:flex-row sm:items-center'}`}>
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