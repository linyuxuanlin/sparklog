export interface BuildTimeNote {
  id: string
  title: string
  content: string
  contentPreview: string
  createdDate: string
  updatedDate: string
  isPrivate: boolean
  tags: string[]
  filename: string
  compiledAt: string
  sha: string
  path: string
}

export interface NotesIndex {
  version: string
  compiledAt: string
  totalNotes: number
  publicNotes: number
  notes: {
    [filename: string]: {
      id: string
      title: string
      contentPreview: string
      createdDate: string
      updatedDate: string
      tags: string[]
      sha: string
      path: string
    }
  }
}

export interface BuildConfig {
  githubToken: string
  repoOwner: string
  repoName: string
  outputDir: string
  includePrivate: boolean
}
