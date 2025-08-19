export const getDefaultRepoConfig = () => {
  const owner = process.env.SPARKLOG_REPO_OWNER
  const repo = process.env.SPARKLOG_REPO_NAME
  
  if (!owner || !repo) {
    return null
  }
  
  return { owner, repo }
}

export const getDefaultGitHubToken = () => {
  return process.env.SPARKLOG_GITHUB_TOKEN || ''
}

export const getAdminPassword = () => {
  return process.env.SPARKLOG_ADMIN_PASSWORD || ''
}

export const checkEnvVarsConfigured = (): boolean => {
  const config = getDefaultRepoConfig()
  const token = getDefaultGitHubToken()
  const password = getAdminPassword()
  
  return !!(config && token && password)
}