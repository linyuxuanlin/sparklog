import React, { useState, useEffect } from 'react'
import { Globe, Calendar, Tag, ChevronDown, ChevronUp } from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer'
import { useGitHub } from '@/hooks/useGitHub'
import { Note } from '@/types/Note'

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

interface NoteCardProps {
  note: Note
  onOpen: (_note: Note) => void
  onTagClick?: (_tag: string) => void
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
    <div className="flex items-center flex-shrink-0 min-w-0">
      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
      <span 
        className="cursor-help hover:text-gray-700 dark:hover:text-gray-200 transition-colors whitespace-nowrap text-xs sm:text-sm truncate"
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
        setShowExpandButton(isContentTruncated)
      } else if (isExpanded) {
        // 如果已展开，总是显示收起按钮（只要有内容）
        setShowExpandButton(Boolean(note.contentPreview))
      } else {
        // 如果没有内容引用，回退到长度判断
        setShowExpandButton(Boolean(note.contentPreview && note.contentPreview.length > 200))
      }

      // 检测按钮文字显示空间
      if (buttonRef.current && containerRef.current && tagScrollRef.current) {
        const container = containerRef.current
        const tagContainer = tagScrollRef.current
        
        // 获取各个区域的宽度
        const containerWidth = container.offsetWidth
        const tagAreaWidth = tagContainer.parentElement?.offsetWidth || 0
        const timeAreaElement = container.children[1] as HTMLElement // 第二个子元素是时间区域
        const timeAreaWidth = timeAreaElement?.offsetWidth || 0
        
        // 按钮区域的预估宽度 (在移动端使用更小的尺寸)
        const isMobile = windowWidth < 640
        const buttonWithTextWidth = isMobile ? 60 : 80 // 移动端减少宽度需求
        const buttonMargin = isMobile ? 8 : 16 // 移动端减少margin
        
        // 计算总的非按钮占用空间
        const nonButtonSpace = tagAreaWidth + timeAreaWidth + buttonMargin
        
        // 计算按钮可用空间
        const availableForButton = containerWidth - nonButtonSpace
        
        // 判断是否应该显示文字：可用空间是否足够容纳带文字的按钮，并且在桌面端
        const shouldShowText = availableForButton >= buttonWithTextWidth && !isMobile
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

  // 计算标签组的显示模式和宽度
  const calculateTagDisplayMode = () => {
    if (!note.tags || note.tags.length === 0) {
      return { mode: 'none', width: 0, needsScroll: false }
    }
    
    // 计算标签组需要的总宽度
    const tagCount = note.tags.length
    const tagWidth = 50 // 每个标签的预估宽度
    const gapWidth = (tagCount - 1) * 4 // gap-1 = 4px
    const totalTagWidth = tagCount * tagWidth + gapWidth
    
    // 获取容器宽度
    const containerWidth = containerRef.current?.offsetWidth || 0
    const timeAreaWidth = 120 // 时间区域的预估宽度
    const buttonWidth = showButtonText ? 80 : 40 // 按钮区域的预估宽度
    const margin = 16 // 边距
    
    // 计算标签组可用的最大宽度
    const availableWidth = containerWidth - timeAreaWidth - buttonWidth - margin
    
    // 确保有一个最小宽度（至少能显示一个标签）
    const minTagWidth = Math.max(tagWidth + 20, windowWidth < 640 ? 60 : 80)
    const maxAllowedWidth = Math.max(availableWidth, minTagWidth)
    
    if (totalTagWidth <= maxAllowedWidth) {
      // 空间充足，显示所有标签，使用自然宽度
      return { mode: 'full', width: 'auto', needsScroll: false }
    } else {
      // 空间不足，使用滚动模式
      // 计算一个合适的宽度，确保至少能显示1.5个标签
      const reasonableWidth = Math.min(
        Math.max(maxAllowedWidth, minTagWidth),
        Math.max(windowWidth * 0.3, windowWidth < 640 ? 120 : 160)
      )
      return { mode: 'scroll', width: reasonableWidth, needsScroll: true }
    }
  }

  const tagDisplayInfo = calculateTagDisplayMode()

  return (
    <div 
      className="card p-4 sm:p-6 hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg"
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
                      content={removeFrontMatter(note.content || note.contentPreview)}
                      preview={false}
                    />
                  </div>
                ) : (
                  <div>
                    <div ref={contentRef} className="line-clamp-3">
                      <MarkdownRenderer 
                        content={removeFrontMatter(note.content || note.contentPreview)}
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
       <div ref={containerRef} className="flex items-center justify-between mt-0 min-w-0">
                 {/* 第一组：标签显示 - 动态宽度，支持横向滚动，带渐隐效果 */}
        <div 
          className="relative flex-shrink-0"
          style={{
            width: tagDisplayInfo.mode === 'none' ? 0 : tagDisplayInfo.width
          }}
        >
          <div 
            ref={tagScrollRef} 
            className={`flex gap-1 ${tagDisplayInfo.needsScroll ? 'overflow-x-auto scrollbar-hide' : 'overflow-visible'} relative`} 
            style={{ width: tagDisplayInfo.needsScroll ? '100%' : 'auto' }}
          >
           {note.tags && note.tags.length > 0 && (
             note.tags.map((tag, index) => (
               <span
                 key={index}
                 onClick={(e) => {
                   e.stopPropagation()
                   onTagClick?.(tag)
                 }}
                 className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-md cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex-shrink-0"
               >
                 <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                 <span className="truncate max-w-[3rem] sm:max-w-none">{tag}</span>
               </span>
             ))
           )}
          </div>
          {/* 左渐隐遮罩 - 只在需要滚动时显示 */}
          {tagDisplayInfo.needsScroll && canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white dark:from-gray-800 to-transparent pointer-events-none z-10" />
          )}
          {/* 右渐隐遮罩 - 只在需要滚动时显示 */}
          {tagDisplayInfo.needsScroll && canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white dark:from-gray-800 to-transparent pointer-events-none z-10" />
          )}
        </div>
         
         {/* 第二组：时间显示、公开状态和全文/收起按钮 - 在右侧，按钮紧贴时间 */}
         <div className="flex flex-row items-center gap-1 text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap min-w-0 ml-2">
            {/* 全文/收起按钮 - 放在时间显示的左侧 */}
            {note.contentPreview && showExpandButton && !hideCollapseButton && (
              <div className="flex-shrink-0 min-w-0 mr-1 sm:mr-2">
                <span 
                  ref={buttonRef}
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsExpanded(!isExpanded)
                  }}
                  className={`inline-flex items-center justify-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs sm:text-sm font-medium cursor-pointer px-2 sm:px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 h-6 sm:h-7 ${showButtonText && windowWidth >= 640 ? 'gap-1 sm:gap-1.5 min-w-[2.5rem] sm:min-w-[3.5rem]' : 'min-w-[2rem] sm:min-w-[2.5rem]'}`}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                      {showButtonText && windowWidth >= 640 && <span className="hidden sm:inline">收起</span>}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                      {showButtonText && windowWidth >= 640 && <span className="hidden sm:inline">全文</span>}
                    </>
                  )}
                </span>
              </div>
            )}
            <TimeDisplay note={note} />
            {isLoggedIn() && (
              <div className="flex items-center space-x-1 flex-shrink-0 min-w-0">
                {note.isPrivate ? (
                  <>
                    <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <span className="text-red-600 dark:text-red-400 text-xs sm:text-sm hidden sm:inline">私密</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-green-600 dark:text-green-400 text-xs sm:text-sm hidden sm:inline">公开</span>
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