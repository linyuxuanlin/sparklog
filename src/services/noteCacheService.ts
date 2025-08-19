/**
 * 笔记缓存服务
 * 负责管理编辑后的笔记缓存，在编译完成前提供即时显示
 */

import { Note } from '@/types/Note'

export interface CachedNote extends Note {
  isCached: boolean
  isBuilding: boolean
  buildStartTime?: Date
  originalNote?: Note // 保存原始的静态内容
  cacheTime: Date
}

export interface CacheStats {
  totalCached: number
  building: number
  completed: number
  failed: number
}

export class NoteCacheService {
  private static instance: NoteCacheService
  private cache = new Map<string, CachedNote>()
  private readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24小时过期
  private readonly BUILD_TIMEOUT = 10 * 60 * 1000 // 10分钟构建超时

  private constructor() {
    // 定期清理过期缓存
    setInterval(() => {
      this.cleanupExpiredCache()
    }, 60 * 1000) // 每分钟检查一次
  }

  static getInstance(): NoteCacheService {
    if (!NoteCacheService.instance) {
      NoteCacheService.instance = new NoteCacheService()
    }
    return NoteCacheService.instance
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(note: Note): string {
    return note.sha || note.path || note.name
  }

  /**
   * 缓存编辑后的笔记
   */
  cacheNote(editedNote: Note, originalNote?: Note): void {
    const key = this.getCacheKey(editedNote)
    
    const cachedNote: CachedNote = {
      ...editedNote,
      isCached: true,
      isBuilding: true,
      buildStartTime: new Date(),
      originalNote: originalNote,
      cacheTime: new Date()
    }

    this.cache.set(key, cachedNote)
    
    console.log('笔记已缓存:', {
      key,
      name: editedNote.name,
      isPrivate: editedNote.isPrivate,
      hasOriginal: !!originalNote
    })
  }

  /**
   * 获取缓存的笔记
   */
  getCachedNote(noteKey: string): CachedNote | null {
    return this.cache.get(noteKey) || null
  }

  /**
   * 获取缓存的笔记（通过 Note 对象）
   */
  getCachedNoteByNote(note: Note): CachedNote | null {
    const key = this.getCacheKey(note)
    return this.getCachedNote(key)
  }

  /**
   * 更新笔记构建状态
   */
  updateBuildStatus(noteKey: string, isBuilding: boolean): void {
    const cached = this.cache.get(noteKey)
    if (cached) {
      cached.isBuilding = isBuilding
      if (!isBuilding) {
        cached.buildStartTime = undefined
      }
      console.log('更新构建状态:', { noteKey, isBuilding })
    }
  }

  /**
   * 标记笔记构建完成，用静态内容替换缓存
   */
  markBuildCompleted(noteKey: string, staticNote: Note): void {
    const cached = this.cache.get(noteKey)
    if (cached) {
      // 用静态内容更新缓存
      const updatedNote: CachedNote = {
        ...staticNote,
        isCached: false,
        isBuilding: false,
        cacheTime: cached.cacheTime,
        originalNote: cached.originalNote
      }
      
      this.cache.set(noteKey, updatedNote)
      console.log('笔记构建完成，已更新为静态内容:', { noteKey, name: staticNote.name })
    }
  }

  /**
   * 移除缓存的笔记
   */
  removeCachedNote(noteKey: string): void {
    const removed = this.cache.delete(noteKey)
    if (removed) {
      console.log('已移除缓存笔记:', noteKey)
    }
  }

  /**
   * 移除缓存的笔记（通过 Note 对象）
   */
  removeCachedNoteByNote(note: Note): void {
    const key = this.getCacheKey(note)
    this.removeCachedNote(key)
  }

  /**
   * 获取所有缓存的笔记
   */
  getAllCachedNotes(): CachedNote[] {
    return Array.from(this.cache.values())
  }

  /**
   * 合并缓存笔记和静态笔记
   * 缓存笔记优先显示，用于提供即时反馈
   */
  mergeWithStaticNotes(staticNotes: Note[]): Note[] {
    const mergedNotes: Note[] = []
    const cachedKeys = new Set<string>()

    // 首先添加所有缓存的笔记
    for (const cached of this.cache.values()) {
      mergedNotes.push(cached)
      
      // 记录缓存的键，用于避免重复
      if (cached.originalNote) {
        const originalKey = this.getCacheKey(cached.originalNote)
        cachedKeys.add(originalKey)
      }
      
      const currentKey = this.getCacheKey(cached)
      cachedKeys.add(currentKey)
    }

    // 然后添加未缓存的静态笔记
    for (const staticNote of staticNotes) {
      const key = this.getCacheKey(staticNote)
      if (!cachedKeys.has(key)) {
        mergedNotes.push(staticNote)
      }
    }

    // 按时间排序（新到旧）
    return mergedNotes.sort((a, b) => {
      const timeA = a.updated_at || a.created_at || ''
      const timeB = b.updated_at || b.created_at || ''
      return timeB.localeCompare(timeA)
    })
  }

  /**
   * 检查笔记是否正在构建中
   */
  isNoteBuilding(noteKey: string): boolean {
    const cached = this.cache.get(noteKey)
    return cached ? cached.isBuilding : false
  }

  /**
   * 检查笔记是否已缓存
   */
  isNoteCached(noteKey: string): boolean {
    return this.cache.has(noteKey)
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): CacheStats {
    const notes = Array.from(this.cache.values())
    
    return {
      totalCached: notes.length,
      building: notes.filter(note => note.isBuilding).length,
      completed: notes.filter(note => !note.isBuilding && note.isCached).length,
      failed: notes.filter(note => this.isBuildTimeout(note)).length
    }
  }

  /**
   * 检查构建是否超时
   */
  private isBuildTimeout(note: CachedNote): boolean {
    if (!note.isBuilding || !note.buildStartTime) {
      return false
    }
    
    const now = new Date()
    const timeDiff = now.getTime() - note.buildStartTime.getTime()
    return timeDiff > this.BUILD_TIMEOUT
  }

  /**
   * 清理过期的缓存
   */
  private cleanupExpiredCache(): void {
    const now = new Date()
    const keysToDelete: string[] = []

    for (const [key, note] of this.cache.entries()) {
      const timeDiff = now.getTime() - note.cacheTime.getTime()
      
      // 删除过期的缓存或构建超时的笔记
      if (timeDiff > this.CACHE_EXPIRY || this.isBuildTimeout(note)) {
        keysToDelete.push(key)
      }
    }

    if (keysToDelete.length > 0) {
      keysToDelete.forEach(key => this.cache.delete(key))
      console.log('清理过期缓存:', keysToDelete.length, '项')
    }
  }

  /**
   * 清空所有缓存
   */
  clearAllCache(): void {
    const count = this.cache.size
    this.cache.clear()
    console.log('已清空所有缓存:', count, '项')
  }

  /**
   * 获取正在构建的笔记列表
   */
  getBuildingNotes(): CachedNote[] {
    return Array.from(this.cache.values()).filter(note => note.isBuilding)
  }

  /**
   * 检查是否有正在构建的笔记
   */
  hasBuildingNotes(): boolean {
    return this.getBuildingNotes().length > 0
  }

  /**
   * 更新缓存笔记的内容
   */
  updateCachedNoteContent(noteKey: string, newContent: string, newPreview?: string): void {
    const cached = this.cache.get(noteKey)
    if (cached) {
      cached.content = newContent
      cached.fullContent = newContent
      if (newPreview) {
        cached.contentPreview = newPreview
      }
      cached.updated_at = new Date().toISOString()
      console.log('已更新缓存笔记内容:', noteKey)
    }
  }

  /**
   * 获取缓存大小（估算）
   */
  getCacheSize(): { count: number; estimatedSizeKB: number } {
    const notes = Array.from(this.cache.values())
    let totalSize = 0

    notes.forEach(note => {
      totalSize += (note.content || '').length
      totalSize += (note.fullContent || '').length
      totalSize += (note.contentPreview || '').length
      totalSize += JSON.stringify(note).length
    })

    return {
      count: notes.length,
      estimatedSizeKB: Math.round(totalSize / 1024)
    }
  }
}
