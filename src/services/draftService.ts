import { Note } from '@/types/Note'
import { parseNoteContent } from '@/utils/noteUtils'

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

interface DraftStatus {
  [noteId: string]: {
    operation: 'create' | 'update' | 'delete'
    timestamp: number
    staticCompiled: boolean
  }
}

export class DraftService {
  private static instance: DraftService
  private readonly STORAGE_PREFIX = 'sparklog_draft_'
  private readonly STATUS_KEY = 'sparklog_draft_status'
  private readonly MAX_DRAFT_AGE = 24 * 60 * 60 * 1000 // 24小时

  private constructor() {
    this.cleanExpiredDrafts()
  }

  static getInstance(): DraftService {
    if (!DraftService.instance) {
      DraftService.instance = new DraftService()
    }
    return DraftService.instance
  }

  /**
   * 保存草稿笔记
   */
  saveDraft(noteId: string, content: string, operation: 'create' | 'update' | 'delete', originalSha?: string): void {
    try {
      const timestamp = Date.now()
      
      // 解析笔记内容
      const parsed = parseNoteContent(content, `${noteId}.md`)
      
      const draftNote: DraftNote = {
        id: noteId,
        sha: originalSha || `draft_${noteId}_${timestamp}`,
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
        draftTimestamp: timestamp
      }

      // 保存草稿内容
      localStorage.setItem(`${this.STORAGE_PREFIX}${noteId}`, JSON.stringify(draftNote))
      
      // 更新草稿状态
      this.updateDraftStatus(noteId, operation, timestamp, false)
      
      console.log(`💾 草稿已保存: ${noteId} (${operation})`)
    } catch (error) {
      console.error('保存草稿失败:', error)
    }
  }

  /**
   * 获取草稿笔记
   */
  getDraft(noteId: string): DraftNote | null {
    try {
      const draftData = localStorage.getItem(`${this.STORAGE_PREFIX}${noteId}`)
      if (!draftData) return null
      
      const draft: DraftNote = JSON.parse(draftData)
      
      // 检查草稿是否过期
      if (Date.now() - draft.draftTimestamp > this.MAX_DRAFT_AGE) {
        this.removeDraft(noteId)
        return null
      }
      
      return draft
    } catch (error) {
      console.error('获取草稿失败:', error)
      return null
    }
  }

  /**
   * 获取所有草稿笔记
   */
  getAllDrafts(): DraftNote[] {
    const drafts: DraftNote[] = []
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.STORAGE_PREFIX) && !key.endsWith('_status')) {
          const noteId = key.replace(this.STORAGE_PREFIX, '')
          const draft = this.getDraft(noteId)
          if (draft) {
            drafts.push(draft)
          }
        }
      }
    } catch (error) {
      console.error('获取所有草稿失败:', error)
    }
    
    return drafts.sort((a, b) => b.draftTimestamp - a.draftTimestamp)
  }

  /**
   * 移除草稿
   */
  removeDraft(noteId: string): void {
    try {
      localStorage.removeItem(`${this.STORAGE_PREFIX}${noteId}`)
      this.removeDraftStatus(noteId)
      console.log(`🗑️ 草稿已移除: ${noteId}`)
    } catch (error) {
      console.error('移除草稿失败:', error)
    }
  }

  /**
   * 检查笔记是否有草稿
   */
  hasDraft(noteId: string): boolean {
    return !!this.getDraft(noteId)
  }

  /**
   * 获取草稿操作类型
   */
  getDraftOperation(noteId: string): 'create' | 'update' | 'delete' | null {
    const draft = this.getDraft(noteId)
    return draft?.operation || null
  }

  /**
   * 更新草稿状态
   */
  private updateDraftStatus(noteId: string, operation: 'create' | 'update' | 'delete', timestamp: number, staticCompiled: boolean): void {
    try {
      const statusData = localStorage.getItem(this.STATUS_KEY)
      const status: DraftStatus = statusData ? JSON.parse(statusData) : {}
      
      status[noteId] = {
        operation,
        timestamp,
        staticCompiled
      }
      
      localStorage.setItem(this.STATUS_KEY, JSON.stringify(status))
    } catch (error) {
      console.error('更新草稿状态失败:', error)
    }
  }

  /**
   * 获取草稿状态
   */
  getDraftStatus(noteId: string): { operation: string; timestamp: number; staticCompiled: boolean } | null {
    try {
      const statusData = localStorage.getItem(this.STATUS_KEY)
      if (!statusData) return null
      
      const status: DraftStatus = JSON.parse(statusData)
      return status[noteId] || null
    } catch (error) {
      console.error('获取草稿状态失败:', error)
      return null
    }
  }

  /**
   * 标记草稿已编译为静态文件
   */
  markAsStaticCompiled(noteId: string): void {
    const status = this.getDraftStatus(noteId)
    if (status) {
      this.updateDraftStatus(noteId, status.operation as any, status.timestamp, true)
      console.log(`✅ 草稿已标记为静态编译: ${noteId}`)
    }
  }

  /**
   * 检查静态文件是否已更新（用于页面刷新时的智能切换）
   */
  async checkStaticFileUpdated(noteId: string, draftTimestamp: number): Promise<boolean> {
    try {
      // 检查静态文件是否存在且更新时间晚于草稿时间
      const response = await fetch(`/static-notes/${noteId}.md.json?t=${Date.now()}`)
      if (!response.ok) {
        return false
      }
      
      const staticData = await response.json()
      const staticCompiledAt = new Date(staticData.compiledAt).getTime()
      
      // 如果静态文件的编译时间晚于草稿创建时间，说明已编译完成
      return staticCompiledAt > draftTimestamp
    } catch (error) {
      console.error('检查静态文件更新失败:', error)
      return false
    }
  }

  /**
   * 检查删除的静态文件是否已移除
   */
  async checkStaticFileDeleted(noteId: string): Promise<boolean> {
    try {
      const response = await fetch(`/static-notes/${noteId}.md.json?t=${Date.now()}`)
      return !response.ok // 如果返回404等错误，说明文件已删除
    } catch (error) {
      // 网络错误时假设文件仍存在
      return false
    }
  }

  /**
   * 智能合并草稿与静态数据（页面刷新时调用）
   */
  async mergeWithStaticData(staticNotes: Note[]): Promise<Note[]> {
    const drafts = this.getAllDrafts()
    if (drafts.length === 0) {
      return staticNotes
    }

    console.log(`🔄 开始合并草稿数据: ${drafts.length} 个草稿`)
    
    const mergedNotes: Note[] = [...staticNotes]
    const processedNoteIds = new Set<string>()

    for (const draft of drafts) {
      const noteId = draft.id || ''
      
      if (!noteId || processedNoteIds.has(noteId)) continue
      processedNoteIds.add(noteId)

      try {
        switch (draft.operation) {
          case 'create': {
            // 检查是否已编译为静态文件
            const createStaticUpdated = await this.checkStaticFileUpdated(noteId, draft.draftTimestamp || 0)
            if (createStaticUpdated) {
              // 静态文件已更新，移除草稿
              this.removeDraft(noteId)
              console.log(`✅ 新建笔记已编译完成，移除草稿: ${noteId}`)
            } else {
              // 静态文件未更新，使用草稿版本
              const existingIndex = mergedNotes.findIndex(n => n.id === noteId)
              if (existingIndex >= 0) {
                mergedNotes[existingIndex] = { ...draft, isDraft: false }
              } else {
                mergedNotes.unshift({ ...draft, isDraft: false })
              }
              console.log(`📝 使用新建笔记草稿版本: ${noteId}`)
            }
            break
          }

          case 'update': {
            // 检查是否已编译为静态文件
            const updateStaticUpdated = await this.checkStaticFileUpdated(noteId, draft.draftTimestamp || 0)
            if (updateStaticUpdated) {
              // 静态文件已更新，移除草稿
              this.removeDraft(noteId)
              console.log(`✅ 修改笔记已编译完成，移除草稿: ${noteId}`)
            } else {
              // 静态文件未更新，使用草稿版本替换静态版本
              const existingIndex = mergedNotes.findIndex(n => n.id === noteId || n.sha === noteId)
              if (existingIndex >= 0) {
                mergedNotes[existingIndex] = { ...draft, isDraft: false }
              } else {
                mergedNotes.unshift({ ...draft, isDraft: false })
              }
              console.log(`📝 使用修改笔记草稿版本: ${noteId}`)
            }
            break
          }

          case 'delete': {
            // 检查是否已从静态文件中删除
            const deleteStaticUpdated = await this.checkStaticFileDeleted(noteId)
            if (deleteStaticUpdated) {
              // 静态文件已删除，移除草稿
              this.removeDraft(noteId)
              console.log(`✅ 删除笔记已完成，移除草稿: ${noteId}`)
            } else {
              // 静态文件未删除，从合并列表中移除
              const existingIndex = mergedNotes.findIndex(n => n.id === noteId || n.sha === noteId)
              if (existingIndex >= 0) {
                mergedNotes.splice(existingIndex, 1)
              }
              console.log(`🗑️ 应用删除笔记草稿: ${noteId}`)
            }
            break
          }
        }
      } catch (error) {
        console.error(`处理草稿失败: ${noteId}`, error)
      }
    }

    console.log(`✅ 草稿合并完成，最终笔记数量: ${mergedNotes.length}`)
    return mergedNotes
  }

  /**
   * 移除草稿状态
   */
  private removeDraftStatus(noteId: string): void {
    try {
      const statusData = localStorage.getItem(this.STATUS_KEY)
      if (!statusData) return
      
      const status: DraftStatus = JSON.parse(statusData)
      delete status[noteId]
      
      localStorage.setItem(this.STATUS_KEY, JSON.stringify(status))
    } catch (error) {
      console.error('移除草稿状态失败:', error)
    }
  }

  /**
   * 清理过期的草稿
   */
  private cleanExpiredDrafts(): void {
    try {
      const currentTime = Date.now()
      const keysToRemove: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.STORAGE_PREFIX) && !key.endsWith('_status')) {
          const draftData = localStorage.getItem(key)
          if (draftData) {
            try {
              const draft: DraftNote = JSON.parse(draftData)
              if (currentTime - draft.draftTimestamp > this.MAX_DRAFT_AGE) {
                keysToRemove.push(key)
              }
            } catch {
              // 如果解析失败，也标记为删除
              keysToRemove.push(key)
            }
          }
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        const noteId = key.replace(this.STORAGE_PREFIX, '')
        this.removeDraftStatus(noteId)
      })
      
      if (keysToRemove.length > 0) {
        console.log(`🧹 清理了 ${keysToRemove.length} 个过期草稿`)
      }
    } catch (error) {
      console.error('清理过期草稿失败:', error)
    }
  }

  /**
   * 清空所有草稿
   */
  clearAllDrafts(): void {
    try {
      const keysToRemove: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.STORAGE_PREFIX)) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
      localStorage.removeItem(this.STATUS_KEY)
      
      console.log(`🧹 清空了所有草稿: ${keysToRemove.length} 项`)
    } catch (error) {
      console.error('清空草稿失败:', error)
    }
  }

  /**
   * 获取草稿统计信息
   */
  getDraftStats(): { total: number; creates: number; updates: number; deletes: number } {
    const drafts = this.getAllDrafts()
    return {
      total: drafts.length,
      creates: drafts.filter(d => d.operation === 'create').length,
      updates: drafts.filter(d => d.operation === 'update').length,
      deletes: drafts.filter(d => d.operation === 'delete').length
    }
  }
}