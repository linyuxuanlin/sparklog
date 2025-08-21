
import { getDevStaticNotesBase, isDevelopment } from '@/config/dev'

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
  
  // 动态获取静态笔记基础路径
  private getStaticNotesBase(): string {
    if (isDevelopment()) {
      return getDevStaticNotesBase()
    }
    
    // 生产模式
    return '/static-notes'
  }

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
      const basePath = this.getStaticNotesBase()
      const url = `${basePath}/index.json`
      console.log('🔍 尝试获取静态笔记索引:')
      console.log('  - 基础路径:', basePath)
      console.log('  - 完整URL:', url)
      console.log('  - 当前页面URL:', window.location.href)
      console.log('  - 开发模式:', import.meta.env.DEV)
      
      const response = await fetch(url)
      console.log('📡 索引响应状态:', response.status, response.ok)
      console.log('📡 响应头:', Object.fromEntries(response.headers.entries()))
      
      if (response.ok) {
        this.notesIndex = await response.json()
        if (this.notesIndex && this.notesIndex.notes) {
          console.log('✅ 成功获取笔记索引，包含笔记数量:', Object.keys(this.notesIndex.notes).length)
        }
        return this.notesIndex
      } else {
        console.warn('❌ 获取笔记索引失败，状态码:', response.status)
        console.warn('❌ 响应文本:', await response.text())
      }
    } catch (error) {
      console.warn('❌ 获取笔记索引失败:', error)
      if (error instanceof Error) {
        console.warn('❌ 错误详情:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
      } else {
        console.warn('❌ 未知错误类型:', error)
      }
    }

    return null
  }

  // 从静态文件获取静态笔记
  async getStaticNote(filename: string): Promise<StaticNote | null> {
    // 检查内存缓存
    const cached = this.cache.get(filename)
    if (cached && Date.now() - new Date(cached.compiledAt).getTime() < this.CACHE_DURATION) {
      console.log('✅ 使用缓存的静态笔记:', filename)
      return cached
    }

    try {
      // 从静态文件获取内容
      const basePath = this.getStaticNotesBase()
      const url = `${basePath}/${encodeURIComponent(filename)}.json`
      console.log('🔍 尝试获取静态笔记:', url)
      const response = await fetch(url)
      console.log('📡 笔记响应状态:', response.status, response.ok, '文件名:', filename)
      if (response.ok) {
        const staticNote: StaticNote = await response.json()
        // 更新缓存
        this.cache.set(filename, staticNote)
        console.log('✅ 成功获取静态笔记:', filename)
        return staticNote
      } else {
        console.warn('❌ 获取静态笔记失败，状态码:', response.status, '文件名:', filename)
      }
    } catch (error) {
      console.warn('❌ 获取静态笔记失败:', error, '文件名:', filename)
    }

    return null
  }

  // 批量获取静态笔记
  async getBatchStaticNotes(filenames: string[]): Promise<Map<string, StaticNote>> {
    console.log('🔍 getBatchStaticNotes 被调用，请求文件数量:', filenames.length)
    console.log('🔍 请求的文件名:', filenames)
    
    const result = new Map<string, StaticNote>()
    const uncachedFilenames: string[] = []

    // 检查缓存
    for (const filename of filenames) {
      const cached = this.cache.get(filename)
      if (cached && Date.now() - new Date(cached.compiledAt).getTime() < this.CACHE_DURATION) {
        console.log('✅ 使用缓存的静态笔记:', filename)
        result.set(filename, cached)
      } else {
        console.log('⚠️ 笔记未缓存或已过期:', filename)
        uncachedFilenames.push(filename)
      }
    }

    // 批量获取未缓存的笔记
    if (uncachedFilenames.length > 0) {
      console.log('📥 开始获取未缓存的笔记，数量:', uncachedFilenames.length)
      const batchPromises = uncachedFilenames.map(async (filename) => {
        try {
          console.log('🔍 正在获取笔记:', filename)
          const staticNote = await this.getStaticNote(filename)
          if (staticNote) {
            console.log('✅ 成功获取笔记:', filename)
            result.set(filename, staticNote)
          } else {
            console.log('❌ 获取笔记失败，返回 null:', filename)
          }
        } catch (error) {
          console.warn(`获取笔记 ${filename} 失败:`, error)
        }
      })

      await Promise.all(batchPromises)
      console.log('📊 批量获取完成，最终结果数量:', result.size)
    } else {
      console.log('✅ 所有笔记都使用缓存，无需网络请求')
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
  
  // 测试静态笔记服务是否正常工作
  async testService(): Promise<void> {
    console.log('🧪 开始测试静态笔记服务...')
    console.log('🔍 开发模式:', import.meta.env.DEV)
    console.log('🔍 基础路径:', this.getStaticNotesBase())
    
    try {
      const index = await this.getNotesIndex()
      if (index) {
        console.log('✅ 服务测试成功，索引包含笔记数量:', Object.keys(index.notes).length)
      } else {
        console.log('❌ 服务测试失败，无法获取索引')
      }
    } catch (error) {
      console.error('❌ 服务测试出错:', error)
    }
  }
}
