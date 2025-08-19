import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import { buildStaticContent } from '../build-static-content.js'

// Mock fs module
vi.mock('fs/promises')

describe('build-static-content', () => {
  let mockFs
  let originalCwd
  let originalConsole

  beforeEach(() => {
    mockFs = vi.mocked(fs)
    originalCwd = process.cwd()
    originalConsole = { ...console }
    
    // Mock console methods
    console.log = vi.fn()
    console.error = vi.fn()
    
    // Mock process.cwd
    vi.spyOn(process, 'cwd').mockReturnValue('/test-project')
    
    // Mock process.exit
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Object.assign(console, originalConsole)
  })

  describe('buildStaticContent', () => {
    it('应该成功构建静态内容', async () => {
      // Mock file system operations
      mockFs.access.mockResolvedValueOnce() // notes directory exists
      mockFs.readdir.mockResolvedValueOnce(['2024-01-01-test.md', '2024-01-02-private.md'])
      
      // Mock reading markdown files
      const testNote = `---
created_at: 2024-01-01T10:00:00Z
updated_at: 2024-01-01T10:00:00Z
private: false
tags: [测试, 示例]
---

# 测试笔记

这是一个测试笔记内容。`

      const privateNote = `---
created_at: 2024-01-02T10:00:00Z
updated_at: 2024-01-02T10:00:00Z
private: true
tags: [私密, 测试]
---

# 私密笔记

这是一个私密笔记内容。`

      mockFs.readFile
        .mockResolvedValueOnce(testNote)
        .mockResolvedValueOnce(privateNote)
      
      // Mock mkdir and writeFile
      mockFs.mkdir.mockResolvedValue()
      mockFs.writeFile.mockResolvedValue()

      await buildStaticContent()

      // Verify notes directory was checked
      expect(mockFs.access).toHaveBeenCalledWith('/test-project/notes')
      
      // Verify files were read
      expect(mockFs.readdir).toHaveBeenCalledWith('/test-project/notes')
      expect(mockFs.readFile).toHaveBeenCalledTimes(2)
      
      // Verify output directory was created
      expect(mockFs.mkdir).toHaveBeenCalledWith('/test-project/public', { recursive: true })
      
      // Verify JSON files were written
      expect(mockFs.writeFile).toHaveBeenCalledTimes(3)
      
      // Check public-notes.json (should only contain public notes)
      const publicNotesCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].includes('public-notes.json')
      )
      expect(publicNotesCall).toBeTruthy()
      const publicNotesData = JSON.parse(publicNotesCall[1])
      expect(publicNotesData.notes).toHaveLength(1)
      expect(publicNotesData.notes[0].isPrivate).toBe(false)
      
      // Check all-notes.json (should contain all notes)
      const allNotesCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].includes('all-notes.json')
      )
      expect(allNotesCall).toBeTruthy()
      const allNotesData = JSON.parse(allNotesCall[1])
      expect(allNotesData.notes).toHaveLength(2)
      
      // Check build-info.json
      const buildInfoCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].includes('build-info.json')
      )
      expect(buildInfoCall).toBeTruthy()
      const buildInfo = JSON.parse(buildInfoCall[1])
      expect(buildInfo.totalNotes).toBe(2)
      expect(buildInfo.publicNotes).toBe(1)
      expect(buildInfo.privateNotes).toBe(1)
      expect(buildInfo.tags).toEqual(expect.arrayContaining(['测试', '示例', '私密']))
    })

    it('应该在notes目录不存在时创建示例内容', async () => {
      // Mock notes directory doesn't exist
      mockFs.access.mockRejectedValueOnce(new Error('ENOENT'))
      
      // Mock creating directory and files
      mockFs.mkdir.mockResolvedValue()
      mockFs.writeFile.mockResolvedValue()
      mockFs.readdir.mockResolvedValueOnce([])

      await buildStaticContent()

      // Verify directory was created
      expect(mockFs.mkdir).toHaveBeenCalledWith('/test-project/notes', { recursive: true })
      
      // Verify example note was created
      const writeFileCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].includes('notes/') && call[0].endsWith('.md')
      )
      expect(writeFileCall).toBeTruthy()
      expect(writeFileCall[1]).toContain('欢迎使用 SparkLog')
    })

    it('应该正确解析frontmatter', async () => {
      mockFs.access.mockResolvedValueOnce()
      mockFs.readdir.mockResolvedValueOnce(['test.md'])
      
      const noteWithComplexFrontmatter = `---
created_at: "2024-01-01T10:00:00Z"
updated_at: "2024-01-01T11:00:00Z"
private: true
tags: [前端, React, "TypeScript"]
---

# 复杂笔记

内容...`

      mockFs.readFile.mockResolvedValueOnce(noteWithComplexFrontmatter)
      mockFs.mkdir.mockResolvedValue()
      mockFs.writeFile.mockResolvedValue()

      await buildStaticContent()

      const allNotesCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].includes('all-notes.json')
      )
      const allNotesData = JSON.parse(allNotesCall[1])
      const note = allNotesData.notes[0]
      
      expect(note.createdDate).toBe('2024-01-01T10:00:00Z')
      expect(note.updatedDate).toBe('2024-01-01T11:00:00Z')
      expect(note.isPrivate).toBe(true)
      expect(note.tags).toEqual(['前端', 'React', 'TypeScript'])
      expect(note.contentPreview).toContain('复杂笔记')
    })

    it('应该按时间排序笔记', async () => {
      mockFs.access.mockResolvedValueOnce()
      mockFs.readdir.mockResolvedValueOnce([
        '2024-01-01-old.md',
        '2024-01-03-newest.md',
        '2024-01-02-middle.md'
      ])
      
      const createMockNote = (date, title) => `---
created_at: ${date}
updated_at: ${date}
private: false
tags: []
---

# ${title}`

      mockFs.readFile
        .mockResolvedValueOnce(createMockNote('2024-01-01T10:00:00Z', '旧笔记'))
        .mockResolvedValueOnce(createMockNote('2024-01-03T10:00:00Z', '最新笔记'))
        .mockResolvedValueOnce(createMockNote('2024-01-02T10:00:00Z', '中间笔记'))
      
      mockFs.mkdir.mockResolvedValue()
      mockFs.writeFile.mockResolvedValue()

      await buildStaticContent()

      const allNotesCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].includes('all-notes.json')
      )
      const allNotesData = JSON.parse(allNotesCall[1])
      
      // 应该按时间从新到旧排序
      expect(allNotesData.notes[0].name).toBe('2024-01-03-newest.md')
      expect(allNotesData.notes[1].name).toBe('2024-01-02-middle.md')
      expect(allNotesData.notes[2].name).toBe('2024-01-01-old.md')
    })

    it('应该正确生成内容预览', async () => {
      mockFs.access.mockResolvedValueOnce()
      mockFs.readdir.mockResolvedValueOnce(['long-note.md'])
      
      const longContent = 'a'.repeat(300) // 超过200字符的内容
      const longNote = `---
created_at: 2024-01-01T10:00:00Z
updated_at: 2024-01-01T10:00:00Z
private: false
tags: []
---

${longContent}`

      mockFs.readFile.mockResolvedValueOnce(longNote)
      mockFs.mkdir.mockResolvedValue()
      mockFs.writeFile.mockResolvedValue()

      await buildStaticContent()

      const allNotesCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].includes('all-notes.json')
      )
      const allNotesData = JSON.parse(allNotesCall[1])
      const note = allNotesData.notes[0]
      
      expect(note.contentPreview).toHaveLength(203) // 200 + '...'
      expect(note.contentPreview).toEndWith('...')
      expect(note.content).toHaveLength(300)
    })

    it('应该在处理文件失败时跳过该文件', async () => {
      mockFs.access.mockResolvedValueOnce()
      mockFs.readdir.mockResolvedValueOnce(['good.md', 'bad.md'])
      
      mockFs.readFile
        .mockResolvedValueOnce('---\nprivate: false\n---\n\n# 正常笔记')
        .mockRejectedValueOnce(new Error('File read error'))
      
      mockFs.mkdir.mockResolvedValue()
      mockFs.writeFile.mockResolvedValue()

      // 应该不会抛出错误
      await buildStaticContent()

      const allNotesCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].includes('all-notes.json')
      )
      const allNotesData = JSON.parse(allNotesCall[1])
      
      // 只应该有一个成功处理的笔记
      expect(allNotesData.notes).toHaveLength(1)
      expect(allNotesData.notes[0].name).toBe('good.md')
    })

    it('应该在发生错误时退出进程', async () => {
      mockFs.access.mockRejectedValueOnce(new Error('Permission denied'))

      await expect(buildStaticContent()).rejects.toThrow('process.exit called')
      expect(process.exit).toHaveBeenCalledWith(1)
    })

    it('应该正确处理空的notes目录', async () => {
      mockFs.access.mockResolvedValueOnce()
      mockFs.readdir.mockResolvedValueOnce([])
      mockFs.mkdir.mockResolvedValue()
      mockFs.writeFile.mockResolvedValue()

      await buildStaticContent()

      const allNotesCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].includes('all-notes.json')
      )
      const allNotesData = JSON.parse(allNotesCall[1])
      
      expect(allNotesData.notes).toHaveLength(0)
      expect(allNotesData.buildInfo.totalNotes).toBe(0)
      expect(allNotesData.buildInfo.publicNotes).toBe(0)
      expect(allNotesData.buildInfo.privateNotes).toBe(0)
    })

    it('应该过滤掉非Markdown文件', async () => {
      mockFs.access.mockResolvedValueOnce()
      mockFs.readdir.mockResolvedValueOnce([
        'note.md',
        'image.jpg',
        'document.txt',
        'another-note.md',
        '.DS_Store'
      ])
      
      mockFs.readFile
        .mockResolvedValueOnce('---\nprivate: false\n---\n\n# 笔记1')
        .mockResolvedValueOnce('---\nprivate: false\n---\n\n# 笔记2')
      
      mockFs.mkdir.mockResolvedValue()
      mockFs.writeFile.mockResolvedValue()

      await buildStaticContent()

      // 只应该读取Markdown文件
      expect(mockFs.readFile).toHaveBeenCalledTimes(2)
      
      const allNotesCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].includes('all-notes.json')
      )
      const allNotesData = JSON.parse(allNotesCall[1])
      
      expect(allNotesData.notes).toHaveLength(2)
      expect(allNotesData.notes.every(note => note.name.endsWith('.md'))).toBe(true)
    })
  })
})
