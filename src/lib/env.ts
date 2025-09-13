// Env helpers for client-side only usage (NEXT_PUBLIC_*)

export interface RepoConfig {
  owner: string
  repo: string
  description?: string
}

export const getRepoConfigFromEnv = (): RepoConfig | null => {
  const owner = process.env.NEXT_PUBLIC_REPO_OWNER || ''
  const repo = process.env.NEXT_PUBLIC_REPO_NAME || ''
  if (owner && repo) return { owner, repo, description: 'SparkLog公开笔记仓库' }
  return null
}

export const getGitHubToken = (): string | null => {
  return process.env.NEXT_PUBLIC_GITHUB_TOKEN || null
}

export const getAdminPassword = (): string | null => {
  return process.env.NEXT_PUBLIC_ADMIN_PASSWORD || null
}

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development'
}

export const checkEnvVarsConfigured = (): boolean => {
  return !!(getRepoConfigFromEnv() && getGitHubToken() && getAdminPassword())
}

