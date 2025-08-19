export const getDefaultRepoConfig = () => {
  const owner = process.env.NEXT_PUBLIC_REPO_OWNER || process.env.VITE_REPO_OWNER
  const repo = process.env.NEXT_PUBLIC_REPO_NAME || process.env.VITE_REPO_NAME
  
  if (!owner || !repo) {
    return null
  }
  
  return { owner, repo }
}

export const getDefaultGitHubToken = () => {
  return process.env.NEXT_PUBLIC_GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN || ''
}

export const getAdminPassword = () => {
  return process.env.NEXT_PUBLIC_ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || ''
}

export const checkEnvVarsConfigured = (): boolean => {
  const config = getDefaultRepoConfig()
  const token = getDefaultGitHubToken()
  const password = getAdminPassword()
  
  return !!(config && token && password)
}