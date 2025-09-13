import { Note } from '@/types/note'

export const decodeBase64Content = (base64Content: string): string => {
  try {
    const binaryString = atob(base64Content)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i)
    return new TextDecoder('utf-8').decode(bytes)
  } catch (error) {
    try { return decodeURIComponent(escape(atob(base64Content))) } catch {
      return atob(base64Content)
    }
  }
}

export const encodeBase64Content = (content: string): string => {
  try {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(content)
    const binaryString = String.fromCharCode(...bytes)
    return btoa(binaryString)
  } catch (error) {
    try { return btoa(unescape(encodeURIComponent(content))) } catch {
      return btoa(content)
    }
  }
}

export const showMessage = (
  setMessage: (_text: string) => void,
  setMessageType: (_type: 'success' | 'error' | '') => void,
  text: string,
  type: 'success' | 'error'
) => {
  setMessage(text)
  setMessageType(type)
  setTimeout(() => { setMessage(''); setMessageType('') }, 2000)
}

export const parseNoteContent = (content: string, fileName: string) => {
  const lines = content.split('\n')
  let contentPreview = ''
  let createdDate = ''
  let updatedDate = ''
  let isPrivate = false
  let tags: string[] = []
  let inFrontmatter = false
  let frontmatterEndIndex = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line === '---' && !inFrontmatter) { inFrontmatter = true; continue }
    if (line === '---' && inFrontmatter) { frontmatterEndIndex = i; break }
    if (inFrontmatter && line.includes(':')) {
      const colonIndex = line.indexOf(':')
      const key = line.substring(0, colonIndex).trim()
      const value = line.substring(colonIndex + 1).trim()
      if (key === 'created_at') createdDate = value.replace(/\"/g, '').trim()
      else if (key === 'updated_at') updatedDate = value.replace(/\"/g, '').trim()
      else if (key === 'private') isPrivate = value === 'true'
      else if (key === 'tags') {
        const tagValue = value.replace(/\"/g, '').trim()
        if (tagValue.startsWith('[') && tagValue.endsWith(']')) tags = tagValue.slice(1, -1).split(',').map(t=>t.trim()).filter(Boolean)
        else if (tagValue.includes(',')) tags = tagValue.split(',').map(t=>t.trim()).filter(Boolean)
        else if (tagValue) tags = [tagValue]
      }
    }
  }

  const contentLines = frontmatterEndIndex >= 0 ? lines.slice(frontmatterEndIndex + 1) : lines
  const previewText = contentLines.join('\n').trim()
  contentPreview = previewText.substring(0, 200) + (previewText.length > 200 ? '...' : '')
  return { title: fileName.replace(/\.md$/, ''), contentPreview, createdDate, updatedDate, isPrivate, tags }
}

export const filterNotes = (notes: Note[], searchQuery: string) => {
  if (!searchQuery.trim()) return notes
  const searchLower = searchQuery.toLowerCase().trim()
  return notes.filter(note => {
    const content = note.contentPreview?.toLowerCase() || ''
    const tags = note.tags?.join(' ').toLowerCase() || ''
    return content.includes(searchLower) || tags.includes(searchLower)
  })
}

export const filterNotesByTags = (notes: Note[], selectedTags: string[]) => {
  if (selectedTags.length === 0) return notes
  return notes.filter(note => {
    if (!note.tags || note.tags.length === 0) return false
    return selectedTags.every(tag => note.tags!.includes(tag))
  })
}

export const getAllTags = (notes: Note[]): string[] => {
  const tagSet = new Set<string>()
  notes.forEach(note => note.tags?.forEach(t => tagSet.add(t)))
  return Array.from(tagSet).sort()
}

export const formatTagsForFrontMatter = (tags: string[]): string => {
  if (tags.length === 0) return '[]'
  if (tags.length === 1) return tags[0]
  return `[${tags.join(', ')}]`
}

