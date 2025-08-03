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
        createdDate = value.replace(/"/g, '').trim()
      } else if (key === 'updated_at') {
        updatedDate = value.replace(/"/g, '').trim()
      } else if (key === 'private') {
        isPrivate = value === 'true'
      }
    }
  }
  
  // 提取内容（跳过Frontmatter）
  const contentLines = frontmatterEndIndex >= 0 
    ? lines.slice(frontmatterEndIndex + 1) 
    : lines
  
  // 生成内容预览
  const previewText = contentLines.join('\n').trim()
  contentPreview = previewText.substring(0, 200) + (previewText.length > 200 ? '...' : '')
  
  return {
    title: fileName.replace(/\.md$/, ''), // 使用文件名作为标题
    contentPreview,
    createdDate,
    updatedDate,
    isPrivate
  }
}

// 过滤笔记
export const filterNotes = (notes: Note[], searchQuery: string) => {
  if (!searchQuery.trim()) return notes
  
  const searchLower = searchQuery.toLowerCase().trim()
  
  return notes.filter(note => {
    const content = note.contentPreview?.toLowerCase() || ''
    return content.includes(searchLower)
  })
} 