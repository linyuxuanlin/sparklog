import { Note } from '@/types/Note'

// 正确处理UTF-8编码的Base64内容
export const decodeBase64Content = (base64Content: string): string => {
  try {
    // 现代浏览器推荐的方法
    const binaryString = atob(base64Content)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return new TextDecoder('utf-8').decode(bytes)
  } catch (error) {
    // 如果现代方法失败，回退到传统方法
    try {
      return decodeURIComponent(escape(atob(base64Content)))
    } catch (fallbackError) {
      console.error('Base64解码失败:', error, fallbackError)
      return atob(base64Content) // 最后的回退
    }
  }
}

// 正确编码内容为Base64
export const encodeBase64Content = (content: string): string => {
  try {
    // 现代浏览器推荐的方法
    const encoder = new TextEncoder()
    const bytes = encoder.encode(content)
    const binaryString = String.fromCharCode(...bytes)
    return btoa(binaryString)
  } catch (error) {
    // 如果现代方法失败，回退到传统方法
    try {
      return btoa(unescape(encodeURIComponent(content)))
    } catch (fallbackError) {
      console.error('Base64编码失败:', error, fallbackError)
      return btoa(content) // 最后的回退
    }
  }
}

// 显示消息提示
export const showMessage = (
  setMessage: (text: string) => void,
  setMessageType: (type: 'success' | 'error' | '') => void,
  text: string,
  type: 'success' | 'error'
) => {
  setMessage(text)
  setMessageType(type)
  setTimeout(() => {
    setMessage('')
    setMessageType('')
  }, 2000)
}

// 解析笔记内容
export const parseNoteContent = (content: string, fileName: string) => {
  const lines = content.split('\n')
  
  // 解析Frontmatter
  let contentPreview = ''
  let createdDate = ''
  let updatedDate = ''
  let isPrivate = false
  let tags: string[] = []
  let inFrontmatter = false
  let frontmatterEndIndex = -1
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // 检测Frontmatter开始
    if (line === '---' && !inFrontmatter) {
      inFrontmatter = true
      continue
    }
    
    // 检测Frontmatter结束
    if (line === '---' && inFrontmatter) {
      frontmatterEndIndex = i
      break
    }
    
    // 解析Frontmatter内容
    if (inFrontmatter && line.includes(':')) {
      const colonIndex = line.indexOf(':')
      const key = line.substring(0, colonIndex).trim()
      const value = line.substring(colonIndex + 1).trim()
      if (key === 'created_at') {
        const dateStr = value.replace(/"/g, '').trim()
        try {
          const parsedDate = new Date(dateStr)
          if (!isNaN(parsedDate.getTime())) {
            createdDate = parsedDate.toISOString()
          } else {
            console.warn(`⚠️ 无效的创建时间格式: ${dateStr}`)
          }
        } catch (error) {
          console.warn(`⚠️ 解析创建时间失败: ${dateStr}`, error)
        }
      } else if (key === 'updated_at') {
        const dateStr = value.replace(/"/g, '').trim()
        try {
          const parsedDate = new Date(dateStr)
          if (!isNaN(parsedDate.getTime())) {
            updatedDate = parsedDate.toISOString()
          } else {
            console.warn(`⚠️ 无效的更新时间格式: ${dateStr}`)
          }
        } catch (error) {
          console.warn(`⚠️ 解析更新时间失败: ${dateStr}`, error)
        }
      } else if (key === 'private') {
        isPrivate = value === 'true'
      } else if (key === 'tags') {
        // 解析标签数组或字符串
        const tagValue = value.replace(/"/g, '').trim()
        if (tagValue.startsWith('[') && tagValue.endsWith(']')) {
          // YAML数组格式: [tag1, tag2, tag3]
          const tagArray = tagValue.slice(1, -1).split(',').map(tag => tag.trim()).filter(tag => tag)
          tags = tagArray
        } else if (tagValue.includes(',')) {
          // 逗号分隔格式: tag1, tag2, tag3
          tags = tagValue.split(',').map(tag => tag.trim()).filter(tag => tag)
        } else if (tagValue) {
          // 单个标签
          tags = [tagValue]
        }
      }
    }
  }
  
  // 提取内容（跳过Frontmatter）
  const contentLines = frontmatterEndIndex >= 0 
    ? lines.slice(frontmatterEndIndex + 1) 
    : lines
  
  // 生成内容预览 - 改进截断逻辑，保留完整段落
  const previewText = contentLines.join('\n').trim()
  
  // 如果内容较短，直接返回
  if (previewText.length <= 200) {
    contentPreview = previewText
  } else {
    // 寻找合适的截断点：优先选择段落分隔、句号、或自然换行点
    let cutPoint = 200
    const searchRange = Math.min(previewText.length, 300) // 在200-300字符范围内寻找合适截断点
    
    // 寻找段落分隔（双换行）
    for (let i = 150; i < searchRange; i++) {
      if (previewText.substring(i, i + 2) === '\n\n') {
        cutPoint = i
        break
      }
    }
    
    // 如果没找到段落分隔，寻找句号
    if (cutPoint === 200) {
      for (let i = 150; i < searchRange; i++) {
        const char = previewText[i]
        if (char === '。' || char === '!' || char === '?' || char === '.') {
          cutPoint = i + 1
          break
        }
      }
    }
    
    // 如果没找到句号，寻找换行符
    if (cutPoint === 200) {
      for (let i = 150; i < searchRange; i++) {
        if (previewText[i] === '\n') {
          cutPoint = i
          break
        }
      }
    }
    
    // 避免在单词中间截断（对于英文内容）
    if (cutPoint === 200 && cutPoint < previewText.length) {
      while (cutPoint > 150 && /[a-zA-Z0-9]/.test(previewText[cutPoint]) && /[a-zA-Z0-9]/.test(previewText[cutPoint - 1])) {
        cutPoint--
      }
    }
    
    contentPreview = previewText.substring(0, cutPoint).trim() + '...'
  }
  
  return {
    title: fileName.replace(/\.md$/, ''), // 使用文件名作为标题
    contentPreview,
    createdDate,
    updatedDate,
    isPrivate,
    tags
  }
}

// 过滤笔记
export const filterNotes = (notes: Note[], searchQuery: string) => {
  if (!searchQuery.trim()) return notes
  
  const searchLower = searchQuery.toLowerCase().trim()
  
  return notes.filter(note => {
    const content = note.contentPreview?.toLowerCase() || ''
    const tags = note.tags?.join(' ').toLowerCase() || ''
    return content.includes(searchLower) || tags.includes(searchLower)
  })
}

// 按标签过滤笔记
export const filterNotesByTags = (notes: Note[], selectedTags: string[]) => {
  if (selectedTags.length === 0) return notes
  
  return notes.filter(note => {
    if (!note.tags || note.tags.length === 0) return false
    return selectedTags.every(tag => note.tags!.includes(tag))
  })
}

// 获取所有标签
export const getAllTags = (notes: Note[]): string[] => {
  const tagSet = new Set<string>()
  notes.forEach(note => {
    if (note.tags) {
      note.tags.forEach(tag => tagSet.add(tag))
    }
  })
  return Array.from(tagSet).sort()
}

// 格式化标签为Front Matter字符串
export const formatTagsForFrontMatter = (tags: string[]): string => {
  if (tags.length === 0) return '[]'
  if (tags.length === 1) return tags[0]
  return `[${tags.join(', ')}]`
} 