import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { DraftService } from '../draftService'

// 模拟 localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    })
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// 模拟 btoa 和 atob
Object.defineProperty(window, 'btoa', {
  value: vi.fn((str: string) => Buffer.from(str, 'binary').toString('base64'))
})

Object.defineProperty(window, 'atob', {
  value: vi.fn((str: string) => Buffer.from(str, 'base64').toString('binary'))
})

// 模拟 fetch
global.fetch = vi.fn()

// 模拟 parseNoteContent
vi.mock('@/utils/noteUtils', () => ({
  parseNoteContent: vi.fn((content: string, _filename: string) => ({
    contentPreview: content.substring(0, 100),
    createdDate: '2024-01-01T00:00:00.000Z',
    updatedDate: '2024-01-01T00:00:00.000Z',
    isPrivate: false,
    tags: ['test']
  }))
}))

describe('DraftService', () => {
  let draftService: DraftService

  beforeEach(() => {
    // 清空 localStorage
    localStorageMock.clear()
    vi.clearAllMocks()
    
    // 获取 DraftService 实例
    draftService = DraftService.getInstance()
  })

  afterEach(() => {
    // 清理草稿
    draftService.clearAllDrafts()
  })

  describe('单例模式', () => {
    it('应该返回同一个实例', () => {
      const instance1 = DraftService.getInstance()
      const instance2 = DraftService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('草稿保存和获取', () => {
    it('应该能保存草稿', () => {
      const noteId = 'test-note'
      const content = '# Test Note\n这是测试内容'
      
      draftService.saveDraft(noteId, content, 'create')
      
      const draft = draftService.getDraft(noteId)
      expect(draft).toBeTruthy()
      expect(draft?.id).toBe(noteId)
      expect(draft?.fullContent).toBe(content)
      expect(draft?.operation).toBe('create')
      expect(draft?.isDraft).toBe(true)
    })

    it('应该能获取不存在的草稿返回null', () => {
      const draft = draftService.getDraft('nonexistent')
      expect(draft).toBeNull()
    })

    it('应该能保存不同操作类型的草稿', () => {
      draftService.saveDraft('note1', 'content1', 'create')
      draftService.saveDraft('note2', 'content2', 'update')
      draftService.saveDraft('note3', 'content3', 'delete')

      expect(draftService.getDraft('note1')?.operation).toBe('create')
      expect(draftService.getDraft('note2')?.operation).toBe('update')
      expect(draftService.getDraft('note3')?.operation).toBe('delete')
    })
  })

  describe('草稿列表管理', () => {
    it('应该能获取所有草稿', () => {
      draftService.saveDraft('note1', 'content1', 'create')
      draftService.saveDraft('note2', 'content2', 'update')
      
      const drafts = draftService.getAllDrafts()
      expect(drafts).toHaveLength(2)
      // 草稿按时间戳倒序排列，但由于时间间隔很小，实际顺序可能不确定
      // 所以我们只检查长度和内容存在
      const ids = drafts.map(d => d.id)
      expect(ids).toContain('note1')
      expect(ids).toContain('note2')
    })

    it('应该能移除草稿', () => {
      draftService.saveDraft('note1', 'content1', 'create')
      expect(draftService.getDraft('note1')).toBeTruthy()
      
      draftService.removeDraft('note1')
      expect(draftService.getDraft('note1')).toBeNull()
    })

    it('应该能检查草稿是否存在', () => {
      expect(draftService.hasDraft('note1')).toBe(false)
      
      draftService.saveDraft('note1', 'content1', 'create')
      expect(draftService.hasDraft('note1')).toBe(true)
    })

    it('应该能获取草稿操作类型', () => {
      expect(draftService.getDraftOperation('note1')).toBeNull()
      
      draftService.saveDraft('note1', 'content1', 'update')
      expect(draftService.getDraftOperation('note1')).toBe('update')
    })
  })

  describe('草稿状态管理', () => {
    it('应该能标记草稿为已编译', () => {
      draftService.saveDraft('note1', 'content1', 'create')
      
      draftService.markAsStaticCompiled('note1')
      
      const status = draftService.getDraftStatus('note1')
      expect(status?.staticCompiled).toBe(true)
    })

    it('应该能获取草稿统计信息', () => {
      draftService.saveDraft('note1', 'content1', 'create')
      draftService.saveDraft('note2', 'content2', 'update')
      draftService.saveDraft('note3', 'content3', 'delete')
      
      const stats = draftService.getDraftStats()
      expect(stats.total).toBe(3)
      expect(stats.creates).toBe(1)
      expect(stats.updates).toBe(1)
      expect(stats.deletes).toBe(1)
    })
  })

  describe('静态文件检查', () => {
    it('应该能检查静态文件是否已更新', async () => {
      // 模拟生产环境
      const originalDev = import.meta.env.DEV
      Object.defineProperty(import.meta.env, 'DEV', { value: false })
      
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          compiledAt: new Date(Date.now() + 1000).toISOString()
        })
      }
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as any)
      
      const result = await draftService.checkStaticFileUpdated('note1', Date.now() - 1000)
      expect(result).toBe(true)
      
      // 恢复原始环境
      Object.defineProperty(import.meta.env, 'DEV', { value: originalDev })
    })

    it('应该能检查静态文件是否已删除', async () => {
      // 模拟生产环境
      const originalDev = import.meta.env.DEV
      Object.defineProperty(import.meta.env, 'DEV', { value: false })
      
      const mockResponse = {
        ok: false,
        status: 404
      }
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as any)
      
      const result = await draftService.checkStaticFileDeleted('note1')
      expect(result).toBe(true)
      
      // 恢复原始环境
      Object.defineProperty(import.meta.env, 'DEV', { value: originalDev })
    })
  })

  describe('草稿与静态数据合并', () => {
    it('应该能合并创建操作的草稿', async () => {
      const staticNotes = [
        {
          id: 'existing-note',
          title: 'Existing Note',
          sha: 'sha1',
          name: 'existing-note.md',
          path: 'notes/existing-note.md',
          contentPreview: 'existing content',
          fullContent: '',
          createdDate: '2024-01-01',
          updatedDate: '2024-01-01',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          isPrivate: false,
          tags: [],
          type: 'file'
        }
      ]

      // 模拟静态文件未更新
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404
      } as any)

      draftService.saveDraft('new-note', '# New Note', 'create')
      
      const mergedNotes = await draftService.mergeWithStaticData(staticNotes)
      
      expect(mergedNotes).toHaveLength(2)
      expect(mergedNotes[0].id).toBe('new-note')  // 新草稿在前
      expect(mergedNotes[1].id).toBe('existing-note')
    })

    it('应该能合并更新操作的草稿', async () => {
      const staticNotes = [
        {
          id: 'existing-note',
          title: 'Existing Note',
          sha: 'sha1',
          name: 'existing-note.md',
          path: 'notes/existing-note.md',
          contentPreview: 'old content',
          fullContent: '',
          createdDate: '2024-01-01',
          updatedDate: '2024-01-01',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          isPrivate: false,
          tags: [],
          type: 'file'
        }
      ]

      // 模拟静态文件未更新
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404
      } as any)

      draftService.saveDraft('existing-note', '# Updated Note', 'update', 'sha1')
      
      const mergedNotes = await draftService.mergeWithStaticData(staticNotes)
      
      expect(mergedNotes).toHaveLength(1)
      expect(mergedNotes[0].contentPreview).toContain('# Updated Note')
    })

    it('应该能合并删除操作的草稿', async () => {
      const staticNotes = [
        {
          id: 'to-delete',
          title: 'To Delete',
          sha: 'sha1',
          name: 'to-delete.md',
          path: 'notes/to-delete.md',
          contentPreview: 'will be deleted',
          fullContent: '',
          createdDate: '2024-01-01',
          updatedDate: '2024-01-01',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          isPrivate: false,
          tags: [],
          type: 'file'
        }
      ]

      // 模拟静态文件仍存在（未删除）
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({})
      } as any)

      draftService.saveDraft('to-delete', '', 'delete', 'sha1')
      
      const mergedNotes = await draftService.mergeWithStaticData(staticNotes)
      
      expect(mergedNotes).toHaveLength(0)  // 应该被过滤掉
    })
  })

  describe('清理功能', () => {
    it('应该能清空所有草稿', () => {
      draftService.saveDraft('note1', 'content1', 'create')
      draftService.saveDraft('note2', 'content2', 'update')
      
      expect(draftService.getAllDrafts()).toHaveLength(2)
      
      draftService.clearAllDrafts()
      
      expect(draftService.getAllDrafts()).toHaveLength(0)
    })

    it('应该能处理无效的草稿数据', () => {
      // 直接在 localStorage 中放入无效数据
      localStorage.setItem('sparklog_draft_invalid', 'invalid json')
      
      // 获取草稿时应该忽略无效数据
      const drafts = draftService.getAllDrafts()
      expect(drafts).toHaveLength(0)
    })
  })

  describe('错误处理', () => {
    it('应该能处理 localStorage 异常', () => {
      // 模拟 localStorage 抛出异常
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage full')
      })
      
      // 保存草稿不应该抛出异常
      expect(() => {
        draftService.saveDraft('test', 'content', 'create')
      }).not.toThrow()
    })

    it('应该能处理网络请求异常', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))
      
      const result = await draftService.checkStaticFileUpdated('note1', Date.now())
      expect(result).toBe(false)
    })
  })
})