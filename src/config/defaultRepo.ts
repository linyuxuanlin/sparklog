import { getRepoConfigFromEnv, getGitHubToken, isDevelopment, isCloudflarePages } from './env'

// Default public notes repository configuration
// These configurations are used for users who haven't connected GitHub to view public notes
export const DEFAULT_REPO_CONFIG = {
  owner: 'linyuxuanlin', // Replace with actual GitHub username
  repo: 'sparklog-notes', // Replace with actual public repository name
  description: 'SparkLog Public Notes Repository'
}

// Get default repository configuration
export const getDefaultRepoConfig = () => {
  console.log('=== Default Repository Configuration Check ===')
  
  // First try environment variable configuration
  const envConfig = getRepoConfigFromEnv()
  console.log('Environment config:', envConfig)
  
  if (envConfig) {
    console.log('Using environment configuration')
    return envConfig
  }

  // Check if it's Cloudflare Pages environment
  const isCloudflare = isCloudflarePages()
  console.log('Is Cloudflare Pages:', isCloudflare)
  
  // In Cloudflare Pages, if no environment variables, use default config
  if (isCloudflare) {
    console.log('Using default configuration for Cloudflare Pages')
    return DEFAULT_REPO_CONFIG
  }

  // Development environment uses default configuration
  if (isDevelopment()) {
    console.log('Using default configuration for development')
    return DEFAULT_REPO_CONFIG
  }

  // Production environment without environment variables, return null
  console.log('No configuration found, returning null')
  return null
}

// Get GitHub Token (for accessing private repositories)
export const getDefaultGitHubToken = () => {
  const token = getGitHubToken()
  console.log('Default GitHub Token:', token ? 'Available' : 'Not available')
  return token
} 