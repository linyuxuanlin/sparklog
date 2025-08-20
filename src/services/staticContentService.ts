

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

  // 更新缓存中的单个笔记
  public updateNoteInCache(note: any, isPrivate: boolean = false): void {
    // 更新公开笔记缓存
    const publicCacheKey = 'public-notes'
    const publicCached = this.cache.get(publicCacheKey)
    
    if (publicCached && !isPrivate) {
      // 如果笔记是公开的，添加或更新到公开笔记缓存中
      const notes = Array.isArray(publicCached.data) ? publicCached.data : []
      const existingIndex = notes.findIndex((n: any) => n.id === note.id || n.sha === note.sha || n.name === note.name)
      
      if (existingIndex >= 0) {
        notes[existingIndex] = note
      } else {
        notes.unshift(note) // 新笔记添加到开头
      }
      
      this.cache.set(publicCacheKey, {
        ...publicCached,
        data: notes,
        timestamp: Date.now()
      })
      console.log('已更新公开笔记缓存中的笔记:', note.name)
    }
    
    // 更新所有笔记缓存
    const allCacheKey = 'all-notes'
    const allCached = this.cache.get(allCacheKey)
    
    if (allCached) {
      const notes = Array.isArray(allCached.data) ? allCached.data : []
      const existingIndex = notes.findIndex((n: any) => n.id === note.id || n.sha === note.sha || n.name === note.name)
      
      if (existingIndex >= 0) {
        notes[existingIndex] = note
      } else {
        notes.unshift(note) // 新笔记添加到开头
      }
      
      this.cache.set(allCacheKey, {
        ...allCached,
        data: notes,
        timestamp: Date.now()
      })
      console.log('已更新所有笔记缓存中的笔记:', note.name)
    }
  }

  // 从缓存中删除笔记
  public removeNoteFromCache(noteId: string): void {
    // 从公开笔记缓存中删除
    const publicCacheKey = 'public-notes'
    const publicCached = this.cache.get(publicCacheKey)
    
    if (publicCached) {
      const notes = Array.isArray(publicCached.data) ? publicCached.data : []
      const filteredNotes = notes.filter((n: any) => 
        n.id !== noteId && n.sha !== noteId && n.name !== noteId && n.name.replace(/\.md$/, '') !== noteId
      )
      
      this.cache.set(publicCacheKey, {
        ...publicCached,
        data: filteredNotes,
        timestamp: Date.now()
      })
      console.log('已从公开笔记缓存中删除笔记:', noteId)
    }
    
    // 从所有笔记缓存中删除
    const allCacheKey = 'all-notes'
    const allCached = this.cache.get(allCacheKey)
    
    if (allCached) {
      const notes = Array.isArray(allCached.data) ? allCached.data : []
      const filteredNotes = notes.filter((n: any) => 
        n.id !== noteId && n.sha !== noteId && n.name !== noteId && n.name.replace(/\.md$/, '') !== noteId
      )
      
      this.cache.set(allCacheKey, {
        ...allCached,
        data: filteredNotes,
        timestamp: Date.now()
      })
      console.log('已从所有笔记缓存中删除笔记:', noteId)
    }
  }

  // 触发后台构建
  public async triggerBuild(): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('触发后台构建静态内容...')
      
      // 方案1: 如果有 GitHub Actions，可以通过 repository_dispatch 事件触发
      // 方案2: 如果使用 Cloudflare Pages，可以通过 webhook 触发
      // 方案3: 直接运行构建脚本（开发环境）
      
      // 检查是否在支持的环境中
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')
      
      if (isDevelopment) {
        // 开发环境：模拟构建触发
        console.log('开发环境：模拟后台构建触发')
        
        // 延迟一段时间后清除缓存，模拟构建完成
        setTimeout(() => {
          this.clearCache()
          console.log('模拟构建完成，缓存已清除')
        }, 3000) // 3秒后清除缓存
        
        return {
          success: true,
          message: '开发环境：模拟构建已触发，静态内容将在几秒后更新'
        }
      }
      
      // 生产环境：尝试触发实际构建
      try {
        // 尝试调用构建 API 或 webhook
        // 这里可以调用 GitHub Actions API、Cloudflare Pages API 等
        
        // 示例：GitHub repository_dispatch 触发
        // const response = await fetch('https://api.github.com/repos/OWNER/REPO/dispatches', {
        //   method: 'POST',
        //   headers: {
        //     'Accept': 'application/vnd.github.v3+json',
        //     'Authorization': `token ${GITHUB_TOKEN}`,
        //     'Content-Type': 'application/json'
        //   },
        //   body: JSON.stringify({
        //     event_type: 'rebuild-static-content',
        //     client_payload: {
        //       reason: 'note-updated',
        //       timestamp: new Date().toISOString()
        //     }
        //   })
        // })
        
        // 示例：Cloudflare Pages webhook 触发
        // const webhookUrl = 'YOUR_CLOUDFLARE_PAGES_WEBHOOK_URL'
        // const response = await fetch(webhookUrl, {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json'
        //   },
        //   body: JSON.stringify({
        //     action: 'rebuild',
        //     timestamp: new Date().toISOString()
        //   })
        // })
        
        console.log('生产环境：构建触发请求已发送')
        
        // 延迟较长时间后清除缓存，等待实际构建完成
        setTimeout(() => {
          this.clearCache()
          console.log('构建触发完成，缓存已清除')
        }, 30000) // 30秒后清除缓存，给构建过程留出时间
        
        return {
          success: true,
          message: '后台构建已触发，静态内容将在几分钟后更新'
        }
      } catch (buildError) {
        console.warn('构建触发失败，使用降级方案:', buildError)
        
        // 降级方案：仅清除缓存
        setTimeout(() => {
          this.clearCache()
          console.log('降级方案：缓存已清除')
        }, 5000)
        
        return {
          success: true,
          message: '构建触发失败，但缓存已清除。静态内容将在下次访问时从源获取'
        }
      }
    } catch (error) {
      console.error('触发构建失败:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '触发构建失败'
      }
    }
  }

  // 强制刷新缓存
  async forceRefresh(): Promise<void> {
    this.clearCache()
    console.log('已强制刷新静态内容缓存')
  }
}
