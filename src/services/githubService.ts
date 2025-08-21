import { getDefaultRepoConfig, getDefaultGitHubToken } from '@/config/defaultRepo'

interface GitHubFile {
  name: string
  path: string
  sha: string
  url: string
  created_at: string
  updated_at: string
  type: string
}

interface GitHubContentResponse {
  content: string
  encoding: string
  sha: string
}

interface BatchContentResponse {
  [path: string]: GitHubContentResponse
}

export class GitHubService {
  private static instance: GitHubService
  private authData: any = null
  private baseHeaders: any = {
    'Accept': 'application/vnd.github.v3+json'
  }
  private cache: Map<string, { data: any, timestamp: number, etag?: string }> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

  private constructor() {
    this.initializeAuth()
  }

  static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService()
    }
    return GitHubService.instance
  }

  private initializeAuth() {
    const defaultConfig = getDefaultRepoConfig()
    if (defaultConfig) {
      this.authData = {
        username: defaultConfig.owner,
        repo: defaultConfig.repo,
        accessToken: getDefaultGitHubToken()
      }
    }
  }

  setAuthData(authData: any) {
    this.authData = authData
  }

  private getHeaders(etag?: string): any {
    const headers = { ...this.baseHeaders }
    if (this.authData?.accessToken) {
      headers['Authorization'] = `token ${this.authData.accessToken}`
    }
    if (etag) {
      headers['If-None-Match'] = etag
    }
    return headers
  }

  private isValidCache(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey)
    if (!cached) return false
    return Date.now() - cached.timestamp < this.CACHE_DURATION
  }

  private getCacheKey(endpoint: string): string {
    return `${this.authData?.username}-${this.authData?.repo}-${endpoint}`
  }

  // 清除缓存
  public clearCache(): void {
    this.cache.clear()
  }

  // 清除特定类型的缓存
  public clearCacheByType(type: 'files' | 'content' | 'all' = 'all'): void {
    if (type === 'all') {
      this.clearCache()
      return
    }

    const keysToDelete: string[] = []
    for (const [key] of this.cache) {
      if (type === 'files' && key.includes('-notes-files')) {
        keysToDelete.push(key)
      } else if (type === 'content' && key.includes('-content-')) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  // 获取notes目录下的所有文件
  async getNotesFiles(): Promise<GitHubFile[]> {
    if (!this.authData) {
      throw new Error('未配置认证信息')
    }

    const cacheKey = this.getCacheKey('notes-files')
    
    // 检查缓存
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey)!.data
    }

    const cached = this.cache.get(cacheKey)
    const apiUrl = `https://api.github.com/repos/${this.authData.username}/${this.authData.repo}/contents/notes`
    
    const response = await fetch(apiUrl, {
      headers: this.getHeaders(cached?.etag)
    })

    // 如果返回304，说明内容未改变，使用缓存
    if (response.status === 304 && cached) {
      // 更新缓存时间戳
      this.cache.set(cacheKey, { ...cached, timestamp: Date.now() })
      return cached.data
    }

    if (!response.ok) {
      if (response.status === 404) {
        return []
      }
      
      const errorData = await response.json().catch(() => ({}))
      console.error('GitHub API错误详情:', errorData)
      throw new Error(`GitHub API错误: ${response.status} - ${errorData.message || response.statusText}`)
    }

    const files = await response.json()

    // 过滤出.md文件并按时间排序（新到旧）
    const markdownFiles = files
      .filter((file: any) => file.type === 'file' && file.name.endsWith('.md'))
      .sort((a: any, b: any) => {
        // 按文件名中的时间戳排序（新到旧）
        const timeA = a.name.replace(/\.md$/, '').split('-').slice(0, 6).join('-')
        const timeB = b.name.replace(/\.md$/, '').split('-').slice(0, 6).join('-')
        return timeB.localeCompare(timeA)
      })

    // 缓存结果
    const etag = response.headers.get('ETag')
    this.cache.set(cacheKey, {
      data: markdownFiles,
      timestamp: Date.now(),
      etag: etag || undefined
    })

    return markdownFiles
  }

  // 批量获取笔记内容 - 使用GitHub API的批量获取功能
  async getBatchNotesContent(files: GitHubFile[]): Promise<BatchContentResponse> {
    if (!this.authData || files.length === 0) {
      return {}
    }

    const batchResponses: BatchContentResponse = {}

    // 由于GitHub API没有直接的批量获取内容接口，我们使用并发请求
    // 但通过合理的并发控制来减少API压力
    const batchSize = 5 // 每批处理5个请求，进一步减少API调用
    const batches = []

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize)
      batches.push(batch)
    }



    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]

      // 并发处理当前批次
      const batchPromises = batch.map(async (file) => {
        try {
          // 检查单个文件缓存
          const fileCacheKey = this.getCacheKey(`content-${file.sha}`)
          if (this.isValidCache(fileCacheKey)) {
            return {
              path: file.path,
              content: this.cache.get(fileCacheKey)!.data
            }
          }

          const cached = this.cache.get(fileCacheKey)
          const contentResponse = await fetch(file.url, {
            headers: this.getHeaders(cached?.etag)
          })

          // 如果返回304，使用缓存
          if (contentResponse.status === 304 && cached) {
            this.cache.set(fileCacheKey, { ...cached, timestamp: Date.now() })
            return {
              path: file.path,
              content: cached.data
            }
          }

          if (contentResponse.ok) {
            const contentData = await contentResponse.json()
            
            // 缓存内容
            const etag = contentResponse.headers.get('ETag')
            this.cache.set(fileCacheKey, {
              data: contentData,
              timestamp: Date.now(),
              etag: etag || undefined
            })
            
            return {
              path: file.path,
              content: contentData
            }
          } else {
            console.error(`获取文件内容失败: ${file.name}`, contentResponse.status)
            return null
          }
        } catch (error) {
          console.error(`获取文件内容异常: ${file.name}`, error)
          return null
        }
      })

      // 等待当前批次完成
      const batchResults = await Promise.all(batchPromises)
      
      // 处理批次结果
      batchResults.forEach(result => {
        if (result) {
          batchResponses[result.path] = result.content
        }
      })

      // 批次间延迟，避免触发GitHub API限制
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return batchResponses
  }

  // 获取单个笔记内容（用于特殊情况）
  async getSingleNoteContent(file: GitHubFile): Promise<GitHubContentResponse | null> {
    if (!this.authData) {
      return null
    }

    try {
      const timestamp = Date.now()
      const separator = file.url.includes('?') ? '&' : '?'
      const contentResponse = await fetch(`${file.url}${separator}t=${timestamp}`, {
        headers: this.getHeaders()
      })

      if (contentResponse.ok) {
        return await contentResponse.json()
      }
    } catch (error) {
      console.error(`获取单个文件内容失败: ${file.name}`, error)
    }

    return null
  }

  // 删除笔记
  async deleteNote(note: any): Promise<boolean> {
    if (!this.authData) {
      throw new Error('未配置认证信息')
    }

    const response = await fetch(`https://api.github.com/repos/${this.authData.username}/${this.authData.repo}/contents/${note.path}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${this.authData.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `删除笔记: ${note.name}`,
        sha: note.sha
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`删除失败: ${errorData.message || response.statusText}`)
    }

    return true
  }
} 