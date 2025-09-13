import { getRepoConfigFromEnv, getGitHubToken, isDevelopment } from './env'

export const DEFAULT_REPO_CONFIG = {
  owner: 'your-username',
  repo: 'your-notes-repo',
  description: 'SparkLog公开笔记仓库'
}

export const getDefaultRepoConfig = () => {
  const envConfig = getRepoConfigFromEnv()
  if (envConfig) return envConfig
  if (isDevelopment()) return DEFAULT_REPO_CONFIG
  return null
}

export const getDefaultGitHubToken = () => getGitHubToken()

