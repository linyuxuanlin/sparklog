/**
 * 静态内容服务
 * 负责从预编译的静态 JSON 文件加载笔记数据
 * 支持公开内容和私密内容的分离加载
 */

import { Note } from '@/types/Note'

interface BuildInfo {
  buildTime: string
  totalNotes: number
  publicNotes: number
  privateNotes: number
  tags: string[]
  type: 'public' | 'complete'
}

interface StaticNotesData {
  notes: Note[]
  buildInfo: BuildInfo
}

interface BuildStatus {
  isBuilding: boolean
  lastBuildTime?: string
  error?: string
}

export class StaticContentService {
  private static instance: StaticContentService
  private cache: Map<string, { data: any, timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 分钟缓存
  private buildStatusCache: { status: BuildStatus, timestamp: number } | null = null

  private constructor() {}

  static getInstance(): StaticContentService {
    if (!StaticContentService.instance) {
      StaticContentService.instance = new StaticContentService()
    }
    return StaticContentService.instance
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.cache.clear()
    this.buildStatusCache = null
    console.log('静态内容缓存已清除')
  }

  /**
   * 检查缓存是否有效
   */
  private isValidCache(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey)
    if (!cached) return false
    return Date.now() - cached.timestamp < this.CACHE_DURATION
  }

  /**
   * 获取公开笔记数据
   */
  async getPublicNotes(): Promise<StaticNotesData> {
    const cacheKey = 'public-notes'
    
    // 检查缓存
    if (this.isValidCache(cacheKey)) {
      console.log('使用缓存的公开笔记数据')
      return this.cache.get(cacheKey)!.data
    }

    try {
      console.log('从静态文件加载公开笔记数据')
      const response = await fetch('/public-notes.json?' + Date.now())
      
      if (!response.ok) {
        throw new Error(`加载公开笔记失败: ${response.status} ${response.statusText}`)
      }

      const data: StaticNotesData = await response.json()
      
      // 验证数据结构
      if (!data.notes || !Array.isArray(data.notes)) {
        throw new Error('公开笔记数据格式无效')
      }

      // 缓存数据
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      })

      console.log(`加载了 ${data.notes.length} 个公开笔记`)
      return data

    } catch (error) {
      console.error('加载公开笔记失败:', error)
      throw error
    }
  }

  /**
   * 获取完整笔记数据（包括私密笔记）
   * 需要登录验证
   */
  async getAllNotes(isAuthenticated: boolean): Promise<StaticNotesData> {
    if (!isAuthenticated) {
      // 如果未认证，返回公开笔记
      return this.getPublicNotes()
    }

    const cacheKey = 'all-notes'
    
    // 检查缓存
    if (this.isValidCache(cacheKey)) {
      console.log('使用缓存的完整笔记数据')
      return this.cache.get(cacheKey)!.data
    }

    try {
      console.log('从静态文件加载完整笔记数据')
      const response = await fetch('/all-notes.json?' + Date.now())
      
      if (!response.ok) {
        // 如果完整笔记文件不存在，降级到公开笔记
        if (response.status === 404) {
          console.warn('完整笔记文件不存在，降级到公开笔记')
          return this.getPublicNotes()
        }
        throw new Error(`加载完整笔记失败: ${response.status} ${response.statusText}`)
      }

      const data: StaticNotesData = await response.json()
      
      // 验证数据结构
      if (!data.notes || !Array.isArray(data.notes)) {
        throw new Error('完整笔记数据格式无效')
      }

      // 缓存数据
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      })

      console.log(`加载了 ${data.notes.length} 个笔记（包含私密笔记）`)
      return data

    } catch (error) {
      console.error('加载完整笔记失败:', error)
      // 降级到公开笔记
      console.log('降级到公开笔记')
      return this.getPublicNotes()
    }
  }

  /**
   * 获取构建信息
   */
  async getBuildInfo(): Promise<BuildInfo | null> {
    const cacheKey = 'build-info'
    
    // 检查缓存
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey)!.data
    }

    try {
      const response = await fetch('/build-info.json?' + Date.now())
      
      if (!response.ok) {
        if (response.status === 404) {
          return null // 构建信息文件不存在
        }
        throw new Error(`加载构建信息失败: ${response.status}`)
      }

      const data: BuildInfo = await response.json()
      
      // 缓存数据
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      })

      return data

    } catch (error) {
      console.error('加载构建信息失败:', error)
      return null
    }
  }

  /**
   * 检查构建状态
   * 通过 GitHub API 检查是否有正在进行的构建
   */
  async getBuildStatus(): Promise<BuildStatus> {
    // 检查缓存（构建状态缓存时间较短）
    if (this.buildStatusCache && Date.now() - this.buildStatusCache.timestamp < 30000) { // 30 秒缓存
      return this.buildStatusCache.status
    }

    try {
      // 这里可以通过 GitHub API 检查工作流状态
      // 为了简化，我们先返回基本状态
      const buildInfo = await this.getBuildInfo()
      
      const status: BuildStatus = {
        isBuilding: false,
        lastBuildTime: buildInfo?.buildTime,
        error: undefined
      }

      this.buildStatusCache = {
        status,
        timestamp: Date.now()
      }

      return status

    } catch (error) {
      console.error('检查构建状态失败:', error)
      
      const status: BuildStatus = {
        isBuilding: false,
        error: error instanceof Error ? error.message : '未知错误'
      }

      this.buildStatusCache = {
        status,
        timestamp: Date.now()
      }

      return status
    }
  }

  /**
   * 触发内容重新加载
   * 清除缓存并重新加载数据
   */
  async refreshContent(isAuthenticated: boolean): Promise<StaticNotesData> {
    console.log('刷新静态内容...')
    this.clearCache()
    return this.getAllNotes(isAuthenticated)
  }

  /**
   * 获取所有标签
   */
  async getAllTags(isAuthenticated: boolean): Promise<string[]> {
    try {
      const data = await this.getAllNotes(isAuthenticated)
      return data.buildInfo.tags || []
    } catch (error) {
      console.error('获取标签失败:', error)
      return []
    }
  }

  /**
   * 搜索笔记
   */
  searchNotes(notes: Note[], query: string): Note[] {
    if (!query.trim()) return notes
    
    const searchLower = query.toLowerCase().trim()
    
    return notes.filter(note => {
      const content = (note.contentPreview || note.content || '').toLowerCase()
      const tags = (note.tags || []).join(' ').toLowerCase()
      const title = (note.name || '').toLowerCase()
      
      return content.includes(searchLower) || 
             tags.includes(searchLower) || 
             title.includes(searchLower)
    })
  }

  /**
   * 按标签筛选笔记
   */
  filterNotesByTags(notes: Note[], selectedTags: string[]): Note[] {
    if (selectedTags.length === 0) return notes
    
    return notes.filter(note => {
      if (!note.tags || note.tags.length === 0) return false
      return selectedTags.every(tag => note.tags!.includes(tag))
    })
  }
}
