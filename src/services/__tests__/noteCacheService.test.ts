/**
 * 笔记缓存服务单元测试
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { NoteCacheService } from '../noteCacheService'
import { Note } from '../../types/Note'

// Mock 定时器
vi.useFakeTimers()

describe('NoteCacheService', () => {
  let cacheService: NoteCacheService
  let mockNote: Note

  beforeEach(() => {
    cacheService = NoteCacheService.getInstance()
    
    mockNote = {
      name: '2024-01-01-12-00-00.md',
      path: 'notes/2024-01-01-12-00-00.md',
      sha: 'abc123',
      size: 1000,
      url: 'https://example.com/note.md',
      git_url: '',
      html_url: '',
      download_url: '',
      type: 'file',
      content: '这是测试笔记内容',
      fullContent: '这是测试笔记内容',
      contentPreview: '这是测试笔记内容',
      created_at: '2024-01-01T12:00:00Z',
      updated_at: '2024-01-01T12:00:00Z',
      isPrivate: false,
      tags: ['测试', '单元测试']
    }
    
    // 清空缓存
    cacheService.clearAllCache()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('应该是单例模式', () => {
    const instance1 = NoteCacheService.getInstance()
    const instance2 = NoteCacheService.getInstance()
    expect(instance1).toBe(instance2)
  })

  it('应该能缓存笔记', () => {
    cacheService.cacheNote(mockNote)
    
    const cached = cacheService.getCachedNoteByNote(mockNote)
    expect(cached).toBeDefined()
    expect(cached?.isCached).toBe(true)
    expect(cached?.isBuilding).toBe(true)
    expect(cached?.name).toBe(mockNote.name)
  })

  it('应该能获取缓存的笔记', () => {
    cacheService.cacheNote(mockNote)
    
    const cached = cacheService.getCachedNote('abc123')
    expect(cached).toBeDefined()
    expect(cached?.sha).toBe('abc123')
  })

  it('应该能更新构建状态', () => {
    cacheService.cacheNote(mockNote)
    
    cacheService.updateBuildStatus('abc123', false)
    
    const cached = cacheService.getCachedNote('abc123')
    expect(cached?.isBuilding).toBe(false)
  })

  it('应该能标记构建完成', () => {
    cacheService.cacheNote(mockNote)
    
    const staticNote = { ...mockNote, content: '更新后的内容' }
    cacheService.markBuildCompleted('abc123', staticNote)
    
    const cached = cacheService.getCachedNote('abc123')
    expect(cached?.isCached).toBe(false)
    expect(cached?.isBuilding).toBe(false)
    expect(cached?.content).toBe('更新后的内容')
  })

  it('应该能移除缓存的笔记', () => {
    cacheService.cacheNote(mockNote)
    expect(cacheService.getCachedNote('abc123')).toBeDefined()
    
    cacheService.removeCachedNote('abc123')
    expect(cacheService.getCachedNote('abc123')).toBeNull()
  })

  it('应该能合并缓存笔记和静态笔记', () => {
    const staticNotes = [mockNote]
    const cachedNote = { ...mockNote, sha: 'cached123', content: '缓存内容' }
    
    cacheService.cacheNote(cachedNote)
    
    const merged = cacheService.mergeWithStaticNotes(staticNotes)
    
    // 应该包含缓存笔记和静态笔记
    expect(merged.length).toBe(2)
    expect(merged.some(note => note.sha === 'cached123')).toBe(true)
    expect(merged.some(note => note.sha === 'abc123')).toBe(true)
  })

  it('应该避免重复的笔记', () => {
    const staticNotes = [mockNote]
    
    // 缓存相同的笔记
    cacheService.cacheNote(mockNote, mockNote)
    
    const merged = cacheService.mergeWithStaticNotes(staticNotes)
    
    // 不应该有重复
    expect(merged.length).toBe(1)
  })

  it('应该能获取缓存统计', () => {
    const buildingNote = { ...mockNote, sha: 'building1' }
    const completedNote = { ...mockNote, sha: 'completed1' }
    
    cacheService.cacheNote(buildingNote) // 构建中
    cacheService.cacheNote(completedNote)
    cacheService.updateBuildStatus('completed1', false) // 已完成
    
    const stats = cacheService.getCacheStats()
    
    expect(stats.totalCached).toBe(2)
    expect(stats.building).toBe(1)
    expect(stats.completed).toBe(1)
  })

  it('应该能检查笔记是否正在构建', () => {
    cacheService.cacheNote(mockNote)
    
    expect(cacheService.isNoteBuilding('abc123')).toBe(true)
    
    cacheService.updateBuildStatus('abc123', false)
    expect(cacheService.isNoteBuilding('abc123')).toBe(false)
  })

  it('应该能检查笔记是否已缓存', () => {
    expect(cacheService.isNoteCached('abc123')).toBe(false)
    
    cacheService.cacheNote(mockNote)
    expect(cacheService.isNoteCached('abc123')).toBe(true)
  })

  it('应该能获取正在构建的笔记列表', () => {
    const buildingNote1 = { ...mockNote, sha: 'building1' }
    const buildingNote2 = { ...mockNote, sha: 'building2' }
    const completedNote = { ...mockNote, sha: 'completed1' }
    
    cacheService.cacheNote(buildingNote1)
    cacheService.cacheNote(buildingNote2)
    cacheService.cacheNote(completedNote)
    cacheService.updateBuildStatus('completed1', false)
    
    const buildingNotes = cacheService.getBuildingNotes()
    
    expect(buildingNotes.length).toBe(2)
    expect(buildingNotes.every(note => note.isBuilding)).toBe(true)
  })

  it('应该能检查是否有正在构建的笔记', () => {
    expect(cacheService.hasBuildingNotes()).toBe(false)
    
    cacheService.cacheNote(mockNote)
    expect(cacheService.hasBuildingNotes()).toBe(true)
    
    cacheService.updateBuildStatus('abc123', false)
    expect(cacheService.hasBuildingNotes()).toBe(false)
  })

  it('应该能更新缓存笔记内容', () => {
    cacheService.cacheNote(mockNote)
    
    const newContent = '更新后的内容'
    const newPreview = '更新后的预览'
    
    cacheService.updateCachedNoteContent('abc123', newContent, newPreview)
    
    const cached = cacheService.getCachedNote('abc123')
    expect(cached?.content).toBe(newContent)
    expect(cached?.contentPreview).toBe(newPreview)
    expect(cached?.fullContent).toBe(newContent)
  })

  it('应该能获取缓存大小统计', () => {
    cacheService.cacheNote(mockNote)
    
    const cacheSize = cacheService.getCacheSize()
    
    expect(cacheSize.count).toBe(1)
    expect(cacheSize.estimatedSizeKB).toBeGreaterThan(0)
  })

  it('应该能清空所有缓存', () => {
    cacheService.cacheNote(mockNote)
    expect(cacheService.getCacheStats().totalCached).toBe(1)
    
    cacheService.clearAllCache()
    expect(cacheService.getCacheStats().totalCached).toBe(0)
  })
})
