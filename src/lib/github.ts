import { AuthData, GitHubFile, GitHubContentResponse } from '@/types'

export class GitHubService {
  private static instance: GitHubService
  private authData: AuthData | null = null
  private cache: Map<string, { data: unknown, timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

  private constructor() {}

  static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService()
    }
    return GitHubService.instance
  }

  setAuthData(authData: AuthData) {
    this.authData = authData
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    }
    
    if (this.authData?.accessToken) {
      headers['Authorization'] = `token ${this.authData.accessToken}`
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

  async getNotesFiles(): Promise<GitHubFile[]> {
    if (!this.authData) {
      throw new Error('未配置认证信息')
    }

    const cacheKey = this.getCacheKey('notes-files')
    
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey)!.data as GitHubFile[]
    }

    const apiUrl = `https://api.github.com/repos/${this.authData.username}/${this.authData.repo}/contents/notes`
    
    const response = await fetch(apiUrl, {
      headers: this.getHeaders()
    })

    if (!response.ok) {
      if (response.status === 404) {
        return []
      }
      throw new Error(`GitHub API错误: ${response.status}`)
    }

    const files = await response.json()
    const markdownFiles = files
      .filter((file: GitHubFile) => file.type === 'file' && file.name.endsWith('.md'))
      .sort((a: GitHubFile, b: GitHubFile) => {
        const timeA = a.name.replace(/\.md$/, '').split('-').slice(0, 6).join('-')
        const timeB = b.name.replace(/\.md$/, '').split('-').slice(0, 6).join('-')
        return timeB.localeCompare(timeA)
      })

    this.cache.set(cacheKey, {
      data: markdownFiles,
      timestamp: Date.now()
    })

    return markdownFiles
  }

  async getNoteContent(file: GitHubFile): Promise<GitHubContentResponse | null> {
    if (!this.authData) {
      return null
    }

    const cacheKey = this.getCacheKey(`content-${file.sha}`)
    
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey)!.data as GitHubContentResponse
    }

    try {
      const response = await fetch(file.url, {
        headers: this.getHeaders()
      })

      if (response.ok) {
        const contentData = await response.json()
        
        this.cache.set(cacheKey, {
          data: contentData,
          timestamp: Date.now()
        })
        
        return contentData
      }
    } catch (error) {
      console.error(`获取文件内容失败: ${file.name}`, error)
    }

    return null
  }

  async deleteNote(note: GitHubFile): Promise<boolean> {
    if (!this.authData) {
      throw new Error('未配置认证信息')
    }

    const response = await fetch(
      `https://api.github.com/repos/${this.authData.username}/${this.authData.repo}/contents/${note.path}`,
      {
        method: 'DELETE',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `删除笔记: ${note.name}`,
          sha: note.sha
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`删除失败: ${errorData.message || response.statusText}`)
    }

    return true
  }

  clearCache(): void {
    this.cache.clear()
  }
}