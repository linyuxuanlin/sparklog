import { Note } from '@/types/Note'

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
      const [key, value] = line.split(':').map(s => s.trim())
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