import React from 'react'
import { Loader2, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react'

interface BuildStatusIndicatorProps {
  buildStatus: {
    isBuilding: boolean
    lastBuildTime?: string
    error?: string
  }
  buildInfo: {
    buildTime?: string
    totalNotes: number
    publicNotes: number
    privateNotes: number
  } | null
  onRefresh?: () => void
  className?: string
}

const BuildStatusIndicator: React.FC<BuildStatusIndicatorProps> = ({
  buildStatus,
  buildInfo,
  onRefresh,
  className = ''
}) => {
  // 格式化时间
  const formatTime = (timeString?: string) => {
    if (!timeString) return ''
    try {
      const date = new Date(timeString)
      if (isNaN(date.getTime())) {
        return timeString // 如果解析失败，返回原始字符串
      }
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return timeString
    }
  }

  // 计算内容新鲜度
  const getContentFreshness = () => {
    if (!buildInfo?.buildTime) return 'unknown'
    
    try {
      const buildTime = new Date(buildInfo.buildTime)
      if (isNaN(buildTime.getTime())) {
        return 'unknown'
      }
      
      const now = new Date()
      const diffMinutes = Math.floor((now.getTime() - buildTime.getTime()) / (1000 * 60))
      
      if (diffMinutes < 5) return 'fresh'
      if (diffMinutes < 30) return 'recent'
      if (diffMinutes < 120) return 'moderate'
      return 'stale'
    } catch {
      return 'unknown'
    }
  }

  const freshness = getContentFreshness()

  // 如果正在构建
  if (buildStatus.isBuilding) {
    return (
      <div 
        role="status"
        aria-live="polite"
        className={`inline-flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-700 ${className}`}
      >
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        <span className="text-sm font-medium">内容编译中...</span>
      </div>
    )
  }

  // 如果有错误
  if (buildStatus.error) {
    return (
      <div 
        role="status"
        aria-live="polite"
        className={`inline-flex items-center px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-700 ${className}`}
      >
        <AlertCircle className="w-4 h-4 mr-2" />
        <span className="text-sm font-medium">构建失败</span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="ml-2 p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded transition-colors"
            title="重新加载"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>
    )
  }

  // 正常状态显示
  const getStatusColor = () => {
    switch (freshness) {
      case 'fresh': return 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700'
      case 'recent': return 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'
      case 'moderate': return 'text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700'
      case 'stale': return 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700'
      default: return 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700'
    }
  }

  const getStatusIcon = () => {
    switch (freshness) {
      case 'fresh': return <CheckCircle className="w-4 h-4 mr-2" />
      case 'recent': return <CheckCircle className="w-4 h-4 mr-2" />
      case 'moderate': return <Clock className="w-4 h-4 mr-2" />
      case 'stale': return <AlertCircle className="w-4 h-4 mr-2" />
      default: return <Clock className="w-4 h-4 mr-2" />
    }
  }

  const getStatusText = () => {
    if (!buildInfo) return '内容状态未知'
    
    const timeText = formatTime(buildInfo.buildTime)
    if (!timeText) return '内容状态未知'
    
    switch (freshness) {
      case 'fresh': return `内容最新 (${timeText})`
      case 'recent': return `内容较新 (${timeText})`
      case 'moderate': return `内容稍旧 (${timeText})`
      case 'stale': return `内容较旧 (${timeText})`
      default: return `更新时间: ${timeText}`
    }
  }

  return (
    <div 
      role="status"
      aria-live="polite"
      className={`inline-flex items-center px-3 py-1.5 rounded-lg border ${getStatusColor()} ${className}`}
    >
      {getStatusIcon()}
      <span className="text-sm font-medium">{getStatusText()}</span>
      
      {buildInfo && (
        <div className="ml-3 flex items-center space-x-2 text-xs opacity-75">
          <span>{buildInfo.totalNotes} 篇</span>
          {buildInfo.privateNotes > 0 && (
            <span>({buildInfo.publicNotes} 公开)</span>
          )}
        </div>
      )}
      
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="ml-2 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
          title="刷新内容"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

export default BuildStatusIndicator
