export interface Note {
  name: string
  path: string
  sha: string
  size: number
  url: string
  git_url: string
  html_url: string
  download_url: string
  type: string
  content?: string
  encoding?: string
  created_at?: string
  updated_at?: string
  parsedTitle?: string
  contentPreview?: string
  fullContent?: string
  createdDate?: string
  updatedDate?: string
  isPrivate?: boolean
} 