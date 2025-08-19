

interface StaticContentResponse {
  success: boolean
  data?: any
  error?: string
  lastModified?: string
}

export class StaticContentService {
  private static instance: StaticContentService
  private cache: Map<string, { data: any, timestamp: number, etag?: string }> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

  private constructor() {}

  static getInstance(): StaticContentService {
    if (!StaticContentService.instance) {
      StaticContentService.instance = new StaticContentService()
    }
    return StaticContentService.instance
  }

  private isValidCache(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey)
    if (!cached) return false
    return Date.now() - cached.timestamp < this.CACHE_DURATION
  }

  // 清除缓存
  public clearCache(): void {
    this.cache.clear()
    console.log('静态内容服务缓存已清除')
  }

  // 获取静态分支的 URL
  private getStaticBranchUrl(): string {
    // 在 Cloudflare Pages 环境下，静态内容文件应该在同一域名下
    const currentOrigin = window.location.origin
    return `${currentOrigin}`
  }

  // 获取公开笔记的静态内容
  async getPublicNotes(): Promise<StaticContentResponse> {
    const cacheKey = 'public-notes'
    
    if (this.isValidCache(cacheKey)) {
      console.log('使用缓存的公开笔记')
      const cached = this.cache.get(cacheKey)!
      return {
        success: true,
        data: cached.data,
        lastModified: new Date(cached.timestamp).toISOString()
      }
    }

    try {
      const baseUrl = this.getStaticBranchUrl()
      const url = `${baseUrl}/public-notes.json`
      
      console.log('请求静态内容:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          console.log('静态内容文件不存在，可能还在构建中')
          return {
            success: false,
            error: '静态内容文件不存在，可能还在构建中'
          }
        }
        throw new Error(`获取静态内容失败: ${response.status} - ${response.statusText}`)
      }

      // 检查响应内容类型
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('响应不是 JSON 格式:', contentType, 'URL:', url)
        return {
          success: false,
          error: '响应格式错误，不是有效的 JSON 文件'
        }
      }

      const data = await response.json()
      const etag = response.headers.get('ETag')
      const lastModified = response.headers.get('Last-Modified')

      // 缓存结果
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        etag: etag || undefined
      })

      return {
        success: true,
        data,
        lastModified: lastModified || new Date().toISOString()
      }
    } catch (error) {
      console.error('获取公开笔记失败:', error)
      
      // 如果是 JSON 解析错误，提供更明确的错误信息
      if (error instanceof SyntaxError) {
        return {
          success: false,
          error: '静态内容文件格式错误，可能不是有效的 JSON 文件'
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  // 获取所有笔记的静态内容（需要管理员权限）
  async getAllNotes(): Promise<StaticContentResponse> {
    const cacheKey = 'all-notes'
    
    if (this.isValidCache(cacheKey)) {
      console.log('使用缓存的所有笔记')
      const cached = this.cache.get(cacheKey)!
      return {
        success: true,
        data: cached.data,
        lastModified: new Date(cached.timestamp).toISOString()
      }
    }

    try {
      const baseUrl = this.getStaticBranchUrl()
      const url = `${baseUrl}/all-notes.json`
      
      console.log('请求所有笔记静态内容:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          console.log('所有笔记静态内容文件不存在，可能还在构建中')
          return {
            success: false,
            error: '所有笔记静态内容文件不存在，可能还在构建中'
          }
        }
        throw new Error(`获取所有笔记静态内容失败: ${response.status} - ${response.statusText}`)
      }

      // 检查响应内容类型
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('响应不是 JSON 格式:', contentType, 'URL:', url)
        return {
          success: false,
          error: '响应格式错误，不是有效的 JSON 文件'
        }
      }

      const data = await response.json()
      const etag = response.headers.get('ETag')
      const lastModified = response.headers.get('Last-Modified')

      // 缓存结果
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        etag: etag || undefined
      })

      return {
        success: true,
        data,
        lastModified: lastModified || new Date().toISOString()
      }
    } catch (error) {
      console.error('获取所有笔记失败:', error)
      
      // 如果是 JSON 解析错误，提供更明确的错误信息
      if (error instanceof SyntaxError) {
        return {
          success: false,
          error: '静态内容文件格式错误，可能不是有效的 JSON 文件'
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  // 检查构建状态
  async checkBuildStatus(): Promise<{ isBuilding: boolean; lastBuildTime?: string }> {
    try {
      // 尝试获取公开笔记，如果成功说明构建完成
      const publicNotesResponse = await this.getPublicNotes()
      
      if (publicNotesResponse.success) {
        return {
          isBuilding: false,
          lastBuildTime: publicNotesResponse.lastModified
        }
      } else {
        // 如果获取失败，可能正在构建中
        return {
          isBuilding: true
        }
      }
    } catch (error) {
      console.error('检查构建状态失败:', error)
      return {
        isBuilding: true
      }
    }
  }

  // 强制刷新缓存
  async forceRefresh(): Promise<void> {
    this.clearCache()
    console.log('已强制刷新静态内容缓存')
  }
}
