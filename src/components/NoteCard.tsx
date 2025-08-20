import React, { useState, useEffect } from 'react'
import { Globe, Calendar, Tag, ChevronDown, ChevronUp } from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer'
import { useGitHub } from '@/hooks/useGitHub'

// 过滤front matter的函数
const removeFrontMatter = (content: string): string => {
  if (!content) return content
  
  // 处理不同的换行符格式
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalizedContent.split('\n')
  
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
  
  // 如果找到了完整的front matter，从结束位置后开始提取内容
  if (frontmatterEndIndex >= 0) {
    const contentLines = lines.slice(frontmatterEndIndex + 1)
    const result = contentLines.join('\n').trim()
    return result
  }
  
  // 如果没有找到完整的front matter结束标记，但开头是---，则跳过front matter字段
  if (lines.length > 0 && lines[0].trim() === '---') {
    const filteredLines = lines.filter(line => {
      const trimmedLine = line.trim()
      // 跳过front matter相关的行
      return trimmedLine !== '---' && 
             !trimmedLine.includes('created_at:') && 
             !trimmedLine.includes('updated_at:') && 
             !trimmedLine.includes('private:') &&
             !trimmedLine.includes('tags:') &&
             !trimmedLine.match(/^[a-zA-Z_]+:/)  // 跳过任何看起来像YAML字段的行
    })
    
    const result = filteredLines.join('\n').trim()
    
    // 如果过滤后内容太短，返回原内容（但仍然去掉front matter标记）
    if (result.length < 50) {
      return normalizedContent.replace(/^---[\s\S]*?---\s*/, '').trim()
    }
    
    return result
  }
  
  // 如果不是以---开头，直接返回内容
  return content.trim()
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
  defaultExpanded?: boolean
  hideCollapseButton?: boolean
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
  onTagClick,
  defaultExpanded = false,
  hideCollapseButton = false
}) => {
  const { isLoggedIn } = useGitHub()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [showButtonText, setShowButtonText] = useState(true)
  const [showExpandButton, setShowExpandButton] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const buttonRef = React.useRef<HTMLSpanElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const tagScrollRef = React.useRef<HTMLDivElement>(null)

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 检测标签滚动状态
  useEffect(() => {
    const checkScrollState = () => {
      if (tagScrollRef.current) {
        const element = tagScrollRef.current
        const scrollLeft = element.scrollLeft
        const scrollWidth = element.scrollWidth
        const clientWidth = element.clientWidth
        
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1) // -1 for rounding errors
      }
    }

    const tagScrollElement = tagScrollRef.current
    if (tagScrollElement) {
      // 初始检测
      checkScrollState()
      
      // 监听滚动事件
      tagScrollElement.addEventListener('scroll', checkScrollState)
      
      // 监听内容变化
      const resizeObserver = new ResizeObserver(checkScrollState)
      resizeObserver.observe(tagScrollElement)
      
      return () => {
        tagScrollElement.removeEventListener('scroll', checkScrollState)
        resizeObserver.disconnect()
      }
    }
  }, [note.tags, windowWidth])

  // 检测内容是否被截断以及按钮文字显示空间
  useEffect(() => {
    const checkContentAndButton = () => {
      // 检测内容是否被截断
      if (contentRef.current && !isExpanded) {
        const contentElement = contentRef.current
        const isContentTruncated = contentElement.scrollHeight > contentElement.clientHeight
        // 如果原始内容较长，即使过滤后较短也显示按钮
        const hasLongOriginalContent = Boolean(note.contentPreview && note.contentPreview.length > 150)
        setShowExpandButton(isContentTruncated || hasLongOriginalContent)
      } else if (isExpanded) {
        // 如果已展开，总是显示收起按钮（只要有内容）
        setShowExpandButton(Boolean(note.contentPreview))
      } else {
        // 如果没有内容引用，回退到长度判断
        setShowExpandButton(Boolean(note.contentPreview && note.contentPreview.length > 150))
      }

      // 检测按钮文字显示空间
      if (buttonRef.current && containerRef.current && tagScrollRef.current) {
        const container = containerRef.current
        const tagContainer = tagScrollRef.current
        
        // 获取各个区域的宽度
        const containerWidth = container.offsetWidth
        const tagAreaWidth = tagContainer.parentElement?.offsetWidth || 0
        const timeAreaElement = container.children[2] as HTMLElement // 第三个子元素是时间区域
        const timeAreaWidth = timeAreaElement?.offsetWidth || 0
        
        // 按钮区域的预估宽度
        const buttonWithTextWidth = 80 // 约5rem，包含文字时的估算宽度
        const buttonMargin = 24 // 左右各12px的margin
        
        // 计算总的非按钮占用空间
        const nonButtonSpace = tagAreaWidth + timeAreaWidth + buttonMargin
        
        // 计算按钮可用空间
        const availableForButton = containerWidth - nonButtonSpace
        
        // 判断是否应该显示文字：可用空间是否足够容纳带文字的按钮
        const shouldShowText = availableForButton >= buttonWithTextWidth
        setShowButtonText(shouldShowText)
      }
    }

    // 初始检查 (延迟执行确保DOM已渲染)
    const timeoutId = setTimeout(checkContentAndButton, 100)
    
    // 监听容器和内容大小变化
    const resizeObserver = new ResizeObserver(checkContentAndButton)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }

    return () => {
      clearTimeout(timeoutId)
      resizeObserver.disconnect()
    }
  }, [windowWidth, isExpanded, note.contentPreview])

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
                    <div ref={contentRef} className="line-clamp-3">
                      <MarkdownRenderer 
                        content={removeFrontMatter(note.contentPreview)}
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
       <div ref={containerRef} className="flex items-center justify-between mt-0">
                 {/* 第一组：标签显示 - 动态宽度，支持横向滚动，带渐隐效果 */}
        <div 
          className="relative"
          style={{
            width: note.tags && note.tags.length > 0 
              ? Math.min(Math.max(note.tags.length * 60, 60), Math.max(windowWidth * 0.3, 120)) 
              : 0
          }}
        >
          <div ref={tagScrollRef} className="flex gap-1 overflow-x-auto scrollbar-hide relative" style={{ width: '100%' }}>
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
          {/* 左渐隐遮罩 */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white dark:from-gray-800 to-transparent pointer-events-none z-10" />
          )}
          {/* 右渐隐遮罩 */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white dark:from-gray-800 to-transparent pointer-events-none z-10" />
          )}
        </div>
         
         {/* 第二组：时间显示、公开状态和全文/收起按钮 - 在右侧，按钮紧贴时间 */}
         <div className="flex flex-row items-center gap-1 sm:gap-2 text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">
            {/* 全文/收起按钮 - 放在时间显示的左侧 */}
            {note.contentPreview && showExpandButton && !hideCollapseButton && (
              <div className="flex-shrink-0 min-w-0 mr-2">
                <span 
                  ref={buttonRef}
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsExpanded(!isExpanded)
                  }}
                  className={`inline-flex items-center justify-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium cursor-pointer px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 h-7 ${showButtonText ? 'gap-1.5 min-w-[3.5rem]' : 'min-w-[2.5rem]'}`}
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