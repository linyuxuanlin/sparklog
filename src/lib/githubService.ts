import { getDefaultRepoConfig, getDefaultGitHubToken } from './defaultRepo'
import { StaticService } from './staticService'
import { DraftService } from './draftService'

interface GitHubFile {
  name: string
  path: string
  sha: string
  url: string
  git_url?: string
  html_url?: string
  download_url?: string
  created_at?: string
  updated_at?: string
  type: string
}

interface GitHubContentResponse { content: string; encoding: string; sha: string }
interface BatchContentResponse { [path: string]: GitHubContentResponse }

export class GitHubService {
  private static instance: GitHubService
  private authData: any = null
  private cache: Map<string, { data: any, timestamp: number, etag?: string }> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000

  private constructor() { this.initializeAuth() }
  static getInstance(): GitHubService { return this.instance || (this.instance = new GitHubService()) }

  private initializeAuth() {
    const cfg = getDefaultRepoConfig()
    if (cfg) this.authData = { username: cfg.owner, repo: cfg.repo, accessToken: getDefaultGitHubToken() }
  }
  setAuthData(authData: any) { this.authData = authData }
  private getHeaders(etag?: string) {
    const headers: any = { 'Accept': 'application/vnd.github.v3+json' }
    if (this.authData?.accessToken) headers['Authorization'] = `token ${this.authData.accessToken}`
    if (etag) headers['If-None-Match'] = etag
    return headers
  }
  private getCacheKey(endpoint: string) { return `${this.authData?.username}-${this.authData?.repo}-${endpoint}` }
  private isValidCache(key: string) { const c = this.cache.get(key); return !!c && (Date.now() - c.timestamp < this.CACHE_DURATION) }
  clearCache() { this.cache.clear() }

  async getNotesFiles(): Promise<GitHubFile[]> {
    if (!this.authData) throw new Error('未配置认证信息')
    const cacheKey = this.getCacheKey('notes-files')
    if (this.isValidCache(cacheKey)) return this.cache.get(cacheKey)!.data
    const cached = this.cache.get(cacheKey)
    const apiUrl = `https://api.github.com/repos/${this.authData.username}/${this.authData.repo}/contents/notes`
    const res = await fetch(apiUrl, { headers: this.getHeaders(cached?.etag) })
    if (res.status === 304 && cached) { this.cache.set(cacheKey, { ...cached, timestamp: Date.now() }); return cached.data }
    if (!res.ok) { if (res.status === 404) return []; const err = await res.json().catch(()=>({})); throw new Error(`GitHub API错误: ${res.status} - ${err.message || res.statusText}`) }
    const files = await res.json()
    const markdownFiles = files.filter((f: any) => f.type === 'file' && f.name.endsWith('.md')).sort((a: any, b: any) => b.name.localeCompare(a.name))
    const etag = res.headers.get('ETag') || undefined
    this.cache.set(cacheKey, { data: markdownFiles, timestamp: Date.now(), etag })
    return markdownFiles
  }

  async getBatchNotesContent(files: GitHubFile[]): Promise<BatchContentResponse> {
    if (!this.authData || files.length === 0) return {}
    const out: BatchContentResponse = {}
    const batchSize = 5
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize)
      const results = await Promise.all(batch.map(async (file) => {
        const ckey = this.getCacheKey(`content-${file.sha}`)
        if (this.isValidCache(ckey)) return { path: file.path, content: this.cache.get(ckey)!.data }
        const cached = this.cache.get(ckey)
        const res = await fetch(file.url, { headers: this.getHeaders(cached?.etag) })
        if (res.status === 304 && cached) { this.cache.set(ckey, { ...cached, timestamp: Date.now() }); return { path: file.path, content: cached.data } }
        if (!res.ok) return null
        const data = await res.json()
        const etag = res.headers.get('ETag') || undefined
        this.cache.set(ckey, { data, timestamp: Date.now(), etag })
        return { path: file.path, content: data }
      }))
      results.forEach(r => { if (r) out[r.path] = r.content })
      if (i + batchSize < files.length) await new Promise(r => setTimeout(r, 100))
    }
    return out
  }

  async createNote(fileName: string, content: string, saveAsDraft = true) {
    if (!this.authData) throw new Error('未配置认证信息')
    const noteId = fileName.replace(/\.md$/, '')
    if (saveAsDraft) DraftService.getInstance().saveDraft(noteId, content, 'create', undefined, { username: this.authData.username, repo: this.authData.repo })
    const res = await fetch(
      `https://api.github.com/repos/${this.authData.username}/${this.authData.repo}/contents/notes/${fileName}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.authData.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `新增笔记: ${fileName}`,
          content: btoa(unescape(encodeURIComponent(content))),
          branch: 'main'
        })
      }
    )
    if (!res.ok) { const e = await res.json(); throw new Error(`创建笔记失败: ${e.message || res.statusText}`) }
    return res.json()
  }

  async updateNote(fileName: string, content: string, sha: string, saveAsDraft = true) {
    if (!this.authData) throw new Error('未配置认证信息')
    const noteId = fileName.replace(/\.md$/, '')
    if (saveAsDraft) DraftService.getInstance().saveDraft(noteId, content, 'update', sha, { username: this.authData.username, repo: this.authData.repo })
    const res = await fetch(
      `https://api.github.com/repos/${this.authData.username}/${this.authData.repo}/contents/notes/${fileName}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.authData.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `更新笔记: ${fileName}`,
          content: btoa(unescape(encodeURIComponent(content))),
          sha,
          branch: 'main'
        })
      }
    )
    if (!res.ok) { const e = await res.json(); throw new Error(`更新笔记失败: ${e.message || res.statusText}`) }
    return res.json()
  }

  private convertToRelativePath(absolutePath: string): string {
    if (!absolutePath.startsWith('/')) return absolutePath
    const notesIndex = absolutePath.lastIndexOf('/notes/')
    if (notesIndex !== -1) return absolutePath.substring(notesIndex + 1)
    const fileName = absolutePath.split('/').pop()
    if (fileName && fileName.endsWith('.md')) return `notes/${fileName}`
    return absolutePath.startsWith('/') ? absolutePath.substring(1) : absolutePath
  }

  async deleteNote(note: any, saveAsDraft = true): Promise<boolean> {
    if (!this.authData) throw new Error('未配置认证信息')
    const noteId = note.name?.replace(/\.md$/, '') || note.id
    let originalSha = note.sha
    if (!originalSha) {
      const relativePath = this.convertToRelativePath(note.path)
      const info = await fetch(`https://api.github.com/repos/${this.authData.username}/${this.authData.repo}/contents/${relativePath}`, { headers: { 'Authorization': `token ${this.authData.accessToken}`, 'Accept': 'application/vnd.github.v3+json' } })
      if (!info.ok) throw new Error(`无法获取文件信息: ${info.status} ${info.statusText}`)
      const fileInfo = await info.json(); originalSha = fileInfo.sha
    }
    const relativePath = this.convertToRelativePath(note.path)
    const res = await fetch(`https://api.github.com/repos/${this.authData.username}/${this.authData.repo}/contents/${relativePath}`,
      { method: 'DELETE', headers: { 'Authorization': `token ${this.authData.accessToken}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `删除笔记: ${note.name}`, sha: originalSha }) })
    if (!res.ok) { const data = await res.json().catch(()=>({})); throw new Error(`删除失败: ${data.message || res.statusText}`) }

    // Remove static only after remote succeeded
    if (!note.isPrivate) {
      try { await StaticService.getInstance().deleteStaticNote(note.name || note.path.split('/').pop(), { username: this.authData.username, repo: this.authData.repo, accessToken: this.authData.accessToken }) } catch {}
    }
    if (saveAsDraft) DraftService.getInstance().saveDraft(noteId, '', 'delete', originalSha, { username: this.authData.username, repo: this.authData.repo })
    return true
  }
}
