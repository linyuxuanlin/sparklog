import { Note } from '@/types'

// Base64解码函数
export const decodeBase64Content = (content: string): string => {
  try {
    const cleaned = content.replace(/\s+/g, '')
    const decoded = atob(cleaned)
    return decodeURIComponent(escape(decoded))
  } catch (error) {
    console.error('Base64解码失败:', error)
    return ''
  }
}

// Base64编码函数
export const encodeBase64Content = (content: string): string => {
  try {
    const utf8Bytes = unescape(encodeURIComponent(content))
    return btoa(utf8Bytes)
  } catch (error) {
    console.error('Base64编码失败:', error)
    return ''
  }
}

// 解析笔记内容
export const parseNoteContent = (content: string, fileName: string) => {
  const lines = content.split('\n')
  let inFrontmatter = false
  let frontmatterEndIndex = -1
  let createdDate = ''
  let updatedDate = ''
  let isPrivate = false
  let tags: string[] = []

  // 解析Frontmatter
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line === '---' && !inFrontmatter) {
      inFrontmatter = true
      continue
    }
    if (line === '---' && inFrontmatter) {
      frontmatterEndIndex = i
      break
    }
    
    if (inFrontmatter && line.includes(':')) {
      const colonIndex = line.indexOf(':')
      const key = line.substring(0, colonIndex).trim()
      const value = line.substring(colonIndex + 1).trim()
      
      if (key === 'created_at') {
        createdDate = value.replace(/"/g, '').trim()
      } else if (key === 'updated_at') {
        updatedDate = value.replace(/"/g, '').trim()
      } else if (key === 'private') {
        isPrivate = value === 'true'
      } else if (key === 'tags') {
        const tagValue = value.replace(/"/g, '').trim()
        if (tagValue.startsWith('[') && tagValue.endsWith(']')) {
          tags = tagValue.slice(1, -1).split(',').map(tag => tag.trim()).filter(tag => tag)
        } else if (tagValue.includes(',')) {
          tags = tagValue.split(',').map(tag => tag.trim()).filter(tag => tag)
        } else if (tagValue) {
          tags = [tagValue]
        }
      }
    }
  }

  // 提取正文内容
  const contentLines = frontmatterEndIndex >= 0 
    ? lines.slice(frontmatterEndIndex + 1) 
    : lines
  
  const mainContent = contentLines.join('\n').trim()
  const preview = mainContent.substring(0, 200) + (mainContent.length > 200 ? '...' : '')

  return {
    createdDate,
    updatedDate,
    isPrivate,
    tags,
    contentPreview: preview,
    fullContent: content
  }
}

// 过滤笔记
export const filterNotes = (notes: Note[], searchQuery: string): Note[] => {
  if (!searchQuery) return notes
  
  const query = searchQuery.toLowerCase()
  return notes.filter(note => 
    note.name.toLowerCase().includes(query) ||
    note.contentPreview?.toLowerCase().includes(query) ||
    note.tags?.some(tag => tag.toLowerCase().includes(query))
  )
}

// 按标签过滤笔记
export const filterNotesByTags = (notes: Note[], selectedTags: string[]): Note[] => {
  if (selectedTags.length === 0) return notes
  
  return notes.filter(note => 
    selectedTags.every(tag => note.tags?.includes(tag))
  )
}

// 获取所有标签
export const getAllTags = (notes: Note[]): string[] => {
  const allTags = notes.reduce((tags, note) => {
    if (note.tags) {
      tags.push(...note.tags)
    }
    return tags
  }, [] as string[])
  
  return Array.from(new Set(allTags)).sort()
}

// 格式化标签为frontmatter格式
export const formatTagsForFrontMatter = (tags: string[]): string => {
  if (tags.length === 0) return '[]'
  return `[${tags.join(', ')}]`
}

// 显示消息提示
export const showMessage = (
  setMessage: (msg: string) => void,
  setMessageType: (type: 'success' | 'error' | '') => void,
  text: string,
  type: 'success' | 'error'
) => {
  setMessage(text)
  setMessageType(type)
  setTimeout(() => {
    setMessage('')
    setMessageType('')
  }, 5000)
}