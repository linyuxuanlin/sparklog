export interface Note {
  id?: string
  name: string
  path: string
  sha: string
  size?: number
  url?: string
  git_url?: string
  html_url?: string
  download_url?: string
  type: string
  content?: string
  encoding?: string
  created_at?: string
  updated_at?: string
  contentPreview?: string
  fullContent?: string
  createdDate?: string
  updatedDate?: string
  isPrivate?: boolean
  tags?: string[]
  isDraft?: boolean
  title?: string
} 