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
  contentPreview?: string
  fullContent?: string
  createdDate?: string
  updatedDate?: string
  isPrivate?: boolean
  tags?: string[]
}

export interface GitHubFile {
  name: string
  path: string
  sha: string
  url: string
  created_at: string
  updated_at: string
  type: string
}

export interface GitHubContentResponse {
  content: string
  encoding: string
  sha: string
}

export interface AuthData {
  username: string
  repo: string
  accessToken: string
}

export interface NotesStore {
  notes: Note[]
  isLoading: boolean
  error: string | null
  hasMoreNotes: boolean
  searchQuery: string
  selectedTags: string[]
  setNotes: (notes: Note[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSearchQuery: (query: string) => void
  setSelectedTags: (tags: string[]) => void
  addNote: (note: Note) => void
  updateNote: (sha: string, updatedNote: Partial<Note>) => void
  deleteNote: (sha: string) => void
}

export interface AuthStore {
  isLoggedIn: boolean
  token: string | null
  setAuth: (token: string) => void
  logout: () => void
}