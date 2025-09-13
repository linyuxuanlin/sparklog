import { parseNoteContent, decodeBase64Content } from './note-utils'
import { Note } from '../types/note'

interface StaticNoteData {
  id: string
  title: string
  content: string
  contentPreview: string
  createdDate: string
  updatedDate: string
  isPrivate: boolean
  tags: string[]
  filename: string
  compiledAt: string
  sha: string
  path: string
  url?: string
  git_url?: string
  html_url?: string
  download_url?: string
}

interface StaticIndexData {
  version: string
  compiledAt: string
  totalNotes: number
  publicNotes: number
  notes: Record<string, Omit<StaticNoteData, 'content'>>
}

export class StaticService {
  private static instance: StaticService
  static getInstance(): StaticService { return this.instance || (this.instance = new StaticService()) }

  async deleteStaticNote(filename: string, authData: { username: string; repo: string; accessToken: string }) {
    const base = filename.replace(/\.md$/, '')
    const name = `${base}.md.json`
    const filePath = `public/static-notes/${name}`
    // Fetch file to get sha
    const info = await fetch(`https://api.github.com/repos/${authData.username}/${authData.repo}/contents/${filePath}`, { headers: { 'Authorization': `token ${authData.accessToken}`, 'Accept': 'application/vnd.github.v3+json' } })
    if (!info.ok) { if (info.status === 404) return; throw new Error(`获取文件信息失败: ${info.statusText}`) }
    const data = await info.json()
    const res = await fetch(`https://api.github.com/repos/${authData.username}/${authData.repo}/contents/${filePath}`, {
      method: 'DELETE',
      headers: { 'Authorization': `token ${authData.accessToken}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `删除静态文件 ${name}`, sha: data.sha, branch: 'main' })
    })
    if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(`删除静态文件失败: ${e.message || res.statusText}`) }
  }

  async getStaticNote(filename: string): Promise<StaticNoteData | null> {
    if (typeof window === 'undefined') return null
    const name = `${filename}.md.json`
    const res = await fetch(`/static-notes/${name}`)
    if (!res.ok) return null
    const ct = res.headers.get('content-type')
    if (!ct || !ct.includes('application/json')) return null
    return res.json()
  }

  async getStaticIndex(): Promise<StaticIndexData | null> {
    if (typeof window === 'undefined') return null
    const res = await fetch('/static-notes/index.json')
    if (!res.ok) return null
    const ct = res.headers.get('content-type')
    if (!ct || !ct.includes('application/json')) return null
    return res.json()
  }

  async getMergedNotes(authData?: { username: string; repo: string; accessToken: string }): Promise<Note[]> {
    const index = await this.getStaticIndex()
    if (!index || !index.notes) return []
    const staticNotes = Object.values(index.notes).map((note: any) => ({
      ...note,
      id: note.sha,
      name: note.filename,
      sha: note.sha,
      path: note.path,
      created_at: note.createdDate,
      updated_at: note.updatedDate,
      fullContent: '',
      type: 'file'
    }))
    return staticNotes
  }
}
