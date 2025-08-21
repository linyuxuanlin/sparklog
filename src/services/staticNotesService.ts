

export interface StaticNote {
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
}

export interface NotesIndex {
  version: string
  compiledAt: string
  totalNotes: number
  publicNotes: number
  notes: {
    [filename: string]: {
      id: string
      title: string
      contentPreview: string
      createdDate: string
      updatedDate: string
      tags: string[]
      sha: string
      path: string
    }
  }
}

export class StaticNotesService {
  private static instance: StaticNotesService
  private cache: Map<string, StaticNote> = new Map()
  private notesIndex: NotesIndex | null = null
  private readonly CACHE_DURATION = 10 * 60 * 1000 // 10分钟缓存
  private readonly STATIC_NOTES_BASE = '/static-notes'

  private constructor() {}

  static getInstance(): StaticNotesService {
    if (!StaticNotesService.instance) {
      StaticNotesService.instance = new StaticNotesService()
    }
    return StaticNotesService.instance
  }

  // 获取笔记索引
  async getNotesIndex(): Promise<NotesIndex | null> {
    if (this.notesIndex) {
      return this.notesIndex
    }

    try {
      const response = await fetch(`${this.STATIC_NOTES_BASE}/index.json`)
      if (response.ok) {
        this.notesIndex = await response.json()
        return this.notesIndex
      }
    } catch (error) {
      console.warn('获取笔记索引失败:', error)
    }

    return null
  }

  // 从静态文件获取静态笔记
  async getStaticNote(filename: string): Promise<StaticNote | null> {
    // 检查内存缓存
    const cached = this.cache.get(filename)
    if (cached && Date.now() - new Date(cached.compiledAt).getTime() < this.CACHE_DURATION) {
      return cached
    }

    try {
      // 从静态文件获取内容
      const response = await fetch(`${this.STATIC_NOTES_BASE}/${encodeURIComponent(filename)}.json`)
      if (response.ok) {
        const staticNote: StaticNote = await response.json()
        // 更新缓存
        this.cache.set(filename, staticNote)
        return staticNote
      }
    } catch (error) {
      console.warn('获取静态笔记失败:', error)
    }

    return null
  }

  // 批量获取静态笔记
  async getBatchStaticNotes(filenames: string[]): Promise<Map<string, StaticNote>> {
    const result = new Map<string, StaticNote>()
    const uncachedFilenames: string[] = []

    // 检查缓存
    for (const filename of filenames) {
      const cached = this.cache.get(filename)
      if (cached && Date.now() - new Date(cached.compiledAt).getTime() < this.CACHE_DURATION) {
        result.set(filename, cached)
      } else {
        uncachedFilenames.push(filename)
      }
    }

    // 批量获取未缓存的笔记
    if (uncachedFilenames.length > 0) {
      const batchPromises = uncachedFilenames.map(async (filename) => {
        try {
          const staticNote = await this.getStaticNote(filename)
          if (staticNote) {
            result.set(filename, staticNote)
          }
        } catch (error) {
          console.warn(`获取笔记 ${filename} 失败:`, error)
        }
      })

      await Promise.all(batchPromises)
    }

    return result
  }

  // 触发笔记编译（现在只是记录日志，实际编译在构建时进行）
  async triggerNoteCompilation(filename: string, _noteData: any): Promise<boolean> {
    try {
      console.log(`📝 笔记 ${filename} 已更新，将在下次构建时重新编译`)
      // 清除相关缓存
      this.clearNoteCache(filename)
      return true
    } catch (error) {
      console.error('记录笔记更新失败:', error)
      return false
    }
  }

  // 检查笔记是否有静态版本
  async hasStaticVersion(filename: string): Promise<boolean> {
    // 先检查索引
    const index = await this.getNotesIndex()
    if (index && index.notes[filename]) {
      return true
    }
    
    // 回退到直接检查文件
    const staticNote = await this.getStaticNote(filename)
    return staticNote !== null
  }

  // 获取所有可用的静态笔记文件名
  async getAvailableStaticNotes(): Promise<string[]> {
    const index = await this.getNotesIndex()
    if (index) {
      return Object.keys(index.notes)
    }
    return []
  }

  // 清除缓存
  clearCache(): void {
    this.cache.clear()
  }

  // 清除特定笔记的缓存
  clearNoteCache(filename: string): void {
    this.cache.delete(filename)
  }
}
