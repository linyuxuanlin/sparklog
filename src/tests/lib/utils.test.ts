import { 
  decodeBase64Content, 
  encodeBase64Content, 
  parseNoteContent, 
  filterNotes, 
  filterNotesByTags, 
  getAllTags, 
  formatTagsForFrontMatter 
} from '@/lib/utils'
import { Note } from '@/types'

describe('Utils', () => {
  describe('Base64 encoding/decoding', () => {
    it('encodes and decodes content correctly', () => {
      const originalContent = '这是一个测试内容\n包含中文和换行符'
      const encoded = encodeBase64Content(originalContent)
      const decoded = decodeBase64Content(encoded)
      
      expect(decoded).toBe(originalContent)
    })

    it('handles empty content', () => {
      expect(encodeBase64Content('')).toBe('')
      expect(decodeBase64Content('')).toBe('')
    })

    it('handles special characters', () => {
      const content = '特殊字符: ★ ♠ ♣ ♥ ♦ ℃ ℉ ♪ ♫'
      const encoded = encodeBase64Content(content)
      const decoded = decodeBase64Content(encoded)
      
      expect(decoded).toBe(content)
    })
  })

  describe('parseNoteContent', () => {
    it('parses frontmatter correctly', () => {
      const content = `---
created_at: 2024-01-01T12:00:00.000Z
updated_at: 2024-01-01T13:00:00.000Z
private: true
tags: [React, TypeScript, Next.js]
---

# 测试笔记

这是笔记内容。`

      const result = parseNoteContent(content, 'test.md')
      
      expect(result.createdDate).toBe('2024-01-01T12:00:00.000Z')
      expect(result.updatedDate).toBe('2024-01-01T13:00:00.000Z')
      expect(result.isPrivate).toBe(true)
      expect(result.tags).toEqual(['React', 'TypeScript', 'Next.js'])
      expect(result.contentPreview).toContain('# 测试笔记')
      expect(result.fullContent).toBe(content)
    })

    it('handles content without frontmatter', () => {
      const content = '# 简单笔记\n\n这是没有frontmatter的笔记。'
      const result = parseNoteContent(content, 'simple.md')
      
      expect(result.createdDate).toBe('')
      expect(result.updatedDate).toBe('')
      expect(result.isPrivate).toBe(false)
      expect(result.tags).toEqual([])
      expect(result.contentPreview).toContain('# 简单笔记')
    })

    it('handles different tag formats', () => {
      const contentWithCommaTags = `---
tags: React, TypeScript, Next.js
---
Content`

      const contentWithSingleTag = `---
tags: React
---
Content`

      const result1 = parseNoteContent(contentWithCommaTags, 'test1.md')
      const result2 = parseNoteContent(contentWithSingleTag, 'test2.md')
      
      expect(result1.tags).toEqual(['React', 'TypeScript', 'Next.js'])
      expect(result2.tags).toEqual(['React'])
    })

    it('truncates long content for preview', () => {
      const longContent = 'a'.repeat(300)
      const content = `---
title: Test
---

${longContent}`
      
      const result = parseNoteContent(content, 'long.md')
      expect(result.contentPreview.length).toBeLessThanOrEqual(203) // 200 + "..."
      expect(result.contentPreview).toContain('...')
    })
  })

  describe('filterNotes', () => {
    const mockNotes: Note[] = [
      {
        name: 'react-tutorial.md',
        contentPreview: 'Learn React basics',
        tags: ['React', 'Tutorial'],
        path: '',
        sha: '1',
        size: 0,
        url: '',
        git_url: '',
        html_url: '',
        download_url: '',
        type: 'file'
      },
      {
        name: 'typescript-guide.md',
        contentPreview: 'TypeScript advanced guide',
        tags: ['TypeScript', 'Guide'],
        path: '',
        sha: '2',
        size: 0,
        url: '',
        git_url: '',
        html_url: '',
        download_url: '',
        type: 'file'
      },
      {
        name: 'javascript-tips.md',
        contentPreview: 'Useful JavaScript tips',
        tags: ['JavaScript', 'Tips'],
        path: '',
        sha: '3',
        size: 0,
        url: '',
        git_url: '',
        html_url: '',
        download_url: '',
        type: 'file'
      }
    ]

    it('filters notes by name', () => {
      const result = filterNotes(mockNotes, 'react')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('react-tutorial.md')
    })

    it('filters notes by content', () => {
      const result = filterNotes(mockNotes, 'advanced')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('typescript-guide.md')
    })

    it('filters notes by tags', () => {
      const result = filterNotes(mockNotes, 'Tutorial')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('react-tutorial.md')
    })

    it('returns all notes when query is empty', () => {
      const result = filterNotes(mockNotes, '')
      expect(result).toHaveLength(3)
    })

    it('is case insensitive', () => {
      const result = filterNotes(mockNotes, 'REACT')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('react-tutorial.md')
    })
  })

  describe('filterNotesByTags', () => {
    const mockNotes: Note[] = [
      {
        name: 'note1.md',
        tags: ['React', 'TypeScript'],
        path: '',
        sha: '1',
        size: 0,
        url: '',
        git_url: '',
        html_url: '',
        download_url: '',
        type: 'file'
      },
      {
        name: 'note2.md',
        tags: ['React', 'JavaScript'],
        path: '',
        sha: '2',
        size: 0,
        url: '',
        git_url: '',
        html_url: '',
        download_url: '',
        type: 'file'
      },
      {
        name: 'note3.md',
        tags: ['Vue', 'JavaScript'],
        path: '',
        sha: '3',
        size: 0,
        url: '',
        git_url: '',
        html_url: '',
        download_url: '',
        type: 'file'
      }
    ]

    it('filters notes by single tag', () => {
      const result = filterNotesByTags(mockNotes, ['React'])
      expect(result).toHaveLength(2)
      expect(result.map(note => note.name)).toEqual(['note1.md', 'note2.md'])
    })

    it('filters notes by multiple tags (AND operation)', () => {
      const result = filterNotesByTags(mockNotes, ['React', 'TypeScript'])
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('note1.md')
    })

    it('returns all notes when no tags selected', () => {
      const result = filterNotesByTags(mockNotes, [])
      expect(result).toHaveLength(3)
    })

    it('returns empty array when no notes match all tags', () => {
      const result = filterNotesByTags(mockNotes, ['React', 'Vue'])
      expect(result).toHaveLength(0)
    })
  })

  describe('getAllTags', () => {
    const mockNotes: Note[] = [
      {
        name: 'note1.md',
        tags: ['React', 'TypeScript'],
        path: '',
        sha: '1',
        size: 0,
        url: '',
        git_url: '',
        html_url: '',
        download_url: '',
        type: 'file'
      },
      {
        name: 'note2.md',
        tags: ['React', 'JavaScript'],
        path: '',
        sha: '2',
        size: 0,
        url: '',
        git_url: '',
        html_url: '',
        download_url: '',
        type: 'file'
      },
      {
        name: 'note3.md',
        tags: undefined,
        path: '',
        sha: '3',
        size: 0,
        url: '',
        git_url: '',
        html_url: '',
        download_url: '',
        type: 'file'
      }
    ]

    it('returns unique sorted tags', () => {
      const result = getAllTags(mockNotes)
      expect(result).toEqual(['JavaScript', 'React', 'TypeScript'])
    })

    it('handles notes without tags', () => {
      const result = getAllTags(mockNotes)
      expect(result).not.toContain(undefined)
    })

    it('returns empty array for empty notes array', () => {
      const result = getAllTags([])
      expect(result).toEqual([])
    })
  })

  describe('formatTagsForFrontMatter', () => {
    it('formats tags as array string', () => {
      const tags = ['React', 'TypeScript', 'Next.js']
      const result = formatTagsForFrontMatter(tags)
      expect(result).toBe('[React, TypeScript, Next.js]')
    })

    it('handles empty tags array', () => {
      const result = formatTagsForFrontMatter([])
      expect(result).toBe('[]')
    })

    it('handles single tag', () => {
      const result = formatTagsForFrontMatter(['React'])
      expect(result).toBe('[React]')
    })
  })
})