import { Note } from '@/types/note'
import { parseNoteContent } from './note-utils'

interface DraftNote extends Partial<Note> {
  id: string
  sha: string
  name: string
  path: string
  title: string
  contentPreview: string
  fullContent: string
  createdDate: string
  updatedDate: string
  created_at: string
  updated_at: string
  isPrivate: boolean
  tags: string[]
  type: string
  isDraft: boolean
  operation: 'create' | 'update' | 'delete'
  originalSha?: string
  draftTimestamp: number
}

export class DraftService {
  private static instance: DraftService
  private readonly STORAGE_PREFIX = 'sparklog_draft_'

  static getInstance(): DraftService { return this.instance || (this.instance = new DraftService()) }

  saveDraft(
    noteId: string,
    content: string,
    operation: 'create' | 'update' | 'delete',
    originalSha?: string,
    authData?: { username: string; repo: string }
  ): void {
    try {
      const ts = Date.now()
      const parsed = parseNoteContent(content, `${noteId}.md`)
      const draft: DraftNote = {
        id: noteId,
        sha: originalSha || `draft_${noteId}_${ts}`,
        name: `${noteId}.md`,
        path: `notes/${noteId}.md`,
        title: noteId,
        contentPreview: parsed.contentPreview,
        fullContent: content,
        createdDate: parsed.createdDate || new Date().toISOString(),
        updatedDate: parsed.updatedDate || new Date().toISOString(),
        created_at: parsed.createdDate || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isPrivate: parsed.isPrivate,
        tags: parsed.tags,
        type: 'file',
        isDraft: true,
        operation,
        originalSha,
        draftTimestamp: ts
      }
      localStorage.setItem(`${this.STORAGE_PREFIX}${noteId}`, JSON.stringify(draft))
    } catch {}
  }

  getDraft(noteId: string): DraftNote | null {
    try {
      const raw = localStorage.getItem(`${this.STORAGE_PREFIX}${noteId}`)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  }

  getAllDrafts(): DraftNote[] {
    const list: DraftNote[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this.STORAGE_PREFIX)) {
        try { const d = JSON.parse(localStorage.getItem(key) || ''); if (d) list.push(d) } catch {}
      }
    }
    return list.sort((a,b)=> (b.draftTimestamp||0) - (a.draftTimestamp||0))
  }

  async mergeWithStaticData(staticNotes: Note[]): Promise<Note[]> {
    const drafts = this.getAllDrafts()
    const byId = new Map<string, Note>()
    staticNotes.forEach(n => byId.set(n.id || n.sha || n.name, n))
    for (const d of drafts) {
      const id = d.id
      if (d.operation === 'create') {
        byId.set(id, { ...d, isDraft: false, type: 'file' } as Note)
      } else if (d.operation === 'update') {
        byId.set(id, { ...(byId.get(id) || {}), ...d, isDraft: false, type: 'file' } as Note)
      } else if (d.operation === 'delete') {
        byId.delete(id)
      }
    }
    return Array.from(byId.values())
  }
}

