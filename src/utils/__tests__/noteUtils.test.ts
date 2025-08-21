import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  decodeBase64Content,
  encodeBase64Content,
  showMessage,
  parseNoteContent,
  filterNotes,
  filterNotesByTags,
  getAllTags,
  formatTagsForFrontMatter
} from '../noteUtils'
import { Note } from '@/types/Note'

describe('noteUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('decodeBase64Content', () => {
    it('应该正确解码 Base64 内容', () => {
      const testContent = 'Hello, World!'
      const encoded = btoa(testContent)
      const decoded = decodeBase64Content(encoded)
      expect(decoded).toBe(testContent)
    })

    it('应该处理包含中文的 Base64 内容', () => {
      const testContent = '这是一个测试笔记'
      const encoded = btoa(unescape(encodeURIComponent(testContent)))
      const decoded = decodeBase64Content(encoded)
      expect(decoded).toBe(testContent)
    })

    it('应该处理空字符串', () => {
      const decoded = decodeBase64Content('')
      expect(decoded).toBe('')
    })
  })

  describe('encodeBase64Content', () => {
    it('应该正确编码内容为 Base64', () => {
      const testContent = 'Hello, World!'
      const encoded = encodeBase64Content(testContent)
      expect(encoded).toBe(btoa(testContent))
    })

    it('应该处理包含中文的内容', () => {
      const testContent = '这是一个测试笔记'
      const encoded = encodeBase64Content(testContent)
      expect(encoded).toBe(btoa(unescape(encodeURIComponent(testContent))))
    })

    it('应该处理空字符串', () => {
      const encoded = encodeBase64Content('')
      expect(encoded).toBe('')
    })
  })

  describe('showMessage', () => {
    it('应该设置消息和类型', () => {
      const setMessage = vi.fn()
      const setMessageType = vi.fn()
      
      showMessage(setMessage, setMessageType, '测试消息', 'success')
      
      expect(setMessage).toHaveBeenCalledWith('测试消息')
      expect(setMessageType).toHaveBeenCalledWith('success')
    })

    it('应该在 2 秒后清除消息', async () => {
      vi.useFakeTimers()
      const setMessage = vi.fn()
      const setMessageType = vi.fn()
      
      showMessage(setMessage, setMessageType, '测试消息', 'error')
      
      expect(setMessage).toHaveBeenCalledWith('测试消息')
      expect(setMessageType).toHaveBeenCalledWith('error')
      
      vi.advanceTimersByTime(2000)
      
      expect(setMessage).toHaveBeenCalledWith('')
      expect(setMessageType).toHaveBeenCalledWith('')
      
      vi.useRealTimers()
    })
  })

  describe('parseNoteContent', () => {
    it('应该解析包含 Frontmatter 的笔记内容', () => {
      const content = `---
created_at: "2024-01-01"
updated_at: "2024-01-02"
private: true
tags: [技术, 笔记, 测试]
---
这是笔记的实际内容。
包含多行文本。
`

      const result = parseNoteContent(content, 'test-note.md')
      
      expect(result.title).toBe('test-note')
      expect(result.createdDate).toBe('2024-01-01')
      expect(result.updatedDate).toBe('2024-01-02')
      expect(result.isPrivate).toBe(true)
      expect(result.tags).toEqual(['技术', '笔记', '测试'])
      expect(result.contentPreview).toContain('这是笔记的实际内容')
    })

    it('应该处理没有 Frontmatter 的笔记', () => {
      const content = '这是一个简单的笔记内容。'
      const result = parseNoteContent(content, 'simple-note.md')
      
      expect(result.title).toBe('simple-note')
      expect(result.createdDate).toBe('')
      expect(result.updatedDate).toBe('')
      expect(result.isPrivate).toBe(false)
      expect(result.tags).toEqual([])
      expect(result.contentPreview).toBe(content)
    })

    it('应该处理不同的标签格式', () => {
      const content1 = `---
tags: [标签1, 标签2]
---
内容`
      
      const content2 = `---
tags: 标签1, 标签2
---
内容`
      
      const content3 = `---
tags: 单个标签
---
内容`
      
      const result1 = parseNoteContent(content1, 'test1.md')
      const result2 = parseNoteContent(content2, 'test2.md')
      const result3 = parseNoteContent(content3, 'test3.md')
      
      expect(result1.tags).toEqual(['标签1', '标签2'])
      expect(result2.tags).toEqual(['标签1', '标签2'])
      expect(result3.tags).toEqual(['单个标签'])
    })

    it('应该生成正确的内容预览', () => {
      const longContent = 'a'.repeat(300)
      const result = parseNoteContent(longContent, 'long-note.md')
      
      expect(result.contentPreview).toHaveLength(203) // 200 + '...'
      expect(result.contentPreview.endsWith('...')).toBe(true)
    })
  })

  describe('filterNotes', () => {
    const mockNotes: Note[] = [
      {
        name: 'note1.md',
        path: 'notes/note1.md',
        sha: 'sha1',
        size: 100,
        url: 'url1',
        git_url: 'git1',
        html_url: 'html1',
        download_url: 'download1',
        type: 'file',
        contentPreview: '这是关于 React 的笔记',
        tags: ['React', '前端']
      },
      {
        name: 'note2.md',
        path: 'notes/note2.md',
        sha: 'sha2',
        size: 200,
        url: 'url2',
        git_url: 'git2',
        html_url: 'html2',
        download_url: 'download2',
        type: 'file',
        contentPreview: '这是关于 Vue 的笔记',
        tags: ['Vue', '前端']
      }
    ]

    it('应该返回所有笔记当搜索查询为空', () => {
      const result = filterNotes(mockNotes, '')
      expect(result).toEqual(mockNotes)
    })

    it('应该根据内容过滤笔记', () => {
      const result = filterNotes(mockNotes, 'React')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('note1.md')
    })

    it('应该根据标签过滤笔记', () => {
      const result = filterNotes(mockNotes, 'Vue')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('note2.md')
    })

    it('应该忽略大小写', () => {
      const result = filterNotes(mockNotes, 'react')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('note1.md')
    })
  })

  describe('filterNotesByTags', () => {
    const mockNotes: Note[] = [
      {
        name: 'note1.md',
        path: 'notes/note1.md',
        sha: 'sha1',
        size: 100,
        url: 'url1',
        git_url: 'git1',
        html_url: 'html1',
        download_url: 'download1',
        type: 'file',
        tags: ['React', '前端', 'JavaScript']
      },
      {
        name: 'note2.md',
        path: 'notes/note2.md',
        sha: 'sha2',
        size: 200,
        url: 'url2',
        git_url: 'git2',
        html_url: 'html2',
        download_url: 'download2',
        type: 'file',
        tags: ['Vue', '前端']
      },
      {
        name: 'note3.md',
        path: 'notes/note3.md',
        sha: 'sha3',
        size: 300,
        url: 'url3',
        git_url: 'git3',
        html_url: 'html3',
        download_url: 'download3',
        type: 'file',
        tags: ['后端', 'Node.js']
      }
    ]

    it('应该返回所有笔记当没有选择标签', () => {
      const result = filterNotesByTags(mockNotes, [])
      expect(result).toEqual(mockNotes)
    })

    it('应该根据单个标签过滤笔记', () => {
      const result = filterNotesByTags(mockNotes, ['前端'])
      expect(result).toHaveLength(2)
      expect(result.map(n => n.name)).toContain('note1.md')
      expect(result.map(n => n.name)).toContain('note2.md')
    })

    it('应该根据多个标签过滤笔记（AND 逻辑）', () => {
      const result = filterNotesByTags(mockNotes, ['前端', 'JavaScript'])
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('note1.md')
    })

    it('应该过滤没有标签的笔记', () => {
      const notesWithoutTags = mockNotes.map(note => ({ ...note, tags: undefined }))
      const result = filterNotesByTags(notesWithoutTags, ['前端'])
      expect(result).toHaveLength(0)
    })
  })

  describe('getAllTags', () => {
    it('应该返回所有唯一标签', () => {
      const mockNotes: Note[] = [
        { name: 'note1.md', path: 'notes/note1.md', sha: 'sha1', size: 100, url: 'url1', git_url: 'git1', html_url: 'html1', download_url: 'download1', type: 'file', tags: ['React', '前端'] },
        { name: 'note2.md', path: 'notes/note2.md', sha: 'sha2', size: 200, url: 'url2', git_url: 'git2', html_url: 'html2', download_url: 'download2', type: 'file', tags: ['Vue', '前端'] },
        { name: 'note3.md', path: 'notes/note3.md', sha: 'sha3', size: 300, url: 'url3', git_url: 'git3', html_url: 'html3', download_url: 'download3', type: 'file', tags: ['后端'] }
      ]

      const result = getAllTags(mockNotes)
      expect(result).toEqual(['React', 'Vue', '前端', '后端'])
    })

    it('应该处理没有标签的笔记', () => {
      const mockNotes: Note[] = [
        { name: 'note1.md', path: 'notes/note1.md', sha: 'sha1', size: 100, url: 'url1', git_url: 'git1', html_url: 'html1', download_url: 'download1', type: 'file', tags: ['React'] },
        { name: 'note2.md', path: 'notes/note2.md', sha: 'sha2', size: 200, url: 'url2', git_url: 'git2', html_url: 'html2', download_url: 'download2', type: 'file' }
      ]

      const result = getAllTags(mockNotes)
      expect(result).toEqual(['React'])
    })

    it('应该返回空数组当没有笔记', () => {
      const result = getAllTags([])
      expect(result).toEqual([])
    })
  })

  describe('formatTagsForFrontMatter', () => {
    it('应该格式化空标签数组', () => {
      const result = formatTagsForFrontMatter([])
      expect(result).toBe('[]')
    })

    it('应该格式化单个标签', () => {
      const result = formatTagsForFrontMatter(['React'])
      expect(result).toBe('[React]')
    })

    it('应该格式化多个标签', () => {
      const result = formatTagsForFrontMatter(['React', '前端', 'JavaScript'])
      expect(result).toBe('[React, 前端, JavaScript]')
    })
  })
})
