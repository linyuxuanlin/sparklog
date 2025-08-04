// Environment variables configuration
// Support local development (.env file) and Cloudflare Pages environment variables

export interface RepoConfig {
  owner: string
  repo: string
  description: string
}

// Get all possible environment variable values
const getAllEnvValues = (key: string): string[] => {
  const values: string[] = []
  
  // Check all possible key names
  const possibleKeys = [
    key,
    `VITE_${key}`,
    key.toUpperCase(),
    `VITE_${key.toUpperCase()}`,
    key.toLowerCase(),
    `VITE_${key.toLowerCase()}`
  ]
  
  // Check import.meta.env
  possibleKeys.forEach(k => {
    const value = import.meta.env[k]
    if (value && typeof value === 'string') {
      values.push(value)
    }
  })
  
  // Check window object (environment variables might be here in some cases)
  if (typeof window !== 'undefined') {
    possibleKeys.forEach(k => {
      const value = (window as any)[k]
      if (value && typeof value === 'string') {
        values.push(value)
      }
    })
  }
  
  // Check process.env (build time)
  if (typeof process !== 'undefined' && process.env) {
    possibleKeys.forEach(k => {
      const value = process.env[k]
      if (value && typeof value === 'string') {
        values.push(value)
      }
    })
  }
  
  return [...new Set(values)] // Remove duplicates
}

// Check if environment variables are configured
export const checkEnvVarsConfigured = (): boolean => {
  // Check all environment variables
  const ownerValues = getAllEnvValues('REPO_OWNER')
  const repoValues = getAllEnvValues('REPO_NAME')
  const tokenValues = getAllEnvValues('GITHUB_TOKEN')
  const passwordValues = getAllEnvValues('ADMIN_PASSWORD')
  
  // Get first valid value
  const owner = ownerValues[0] || null
  const repo = repoValues[0] || null
  const token = tokenValues[0] || null
  const adminPassword = passwordValues[0] || null
  
  // Check if it's Cloudflare Pages environment
  const isCloudflare = isCloudflarePages()
  
  // In Cloudflare environment, if some variables are missing, try to use default values
  if (isCloudflare) {
    // If environment variables are not fully configured, but at least some configuration exists, allow to continue
    const hasBasicConfig = owner && repo
    
    if (hasBasicConfig) {
      return true
    }
  }
  
  // Check if all necessary environment variables are configured
  const allConfigured = !!(owner && repo && token && adminPassword)
  
  return allConfigured
}

// Get repository configuration from environment variables
export const getRepoConfigFromEnv = (): RepoConfig | null => {
  const ownerValues = getAllEnvValues('REPO_OWNER')
  const repoValues = getAllEnvValues('REPO_NAME')
  
  const owner = ownerValues[0] || null
  const repo = repoValues[0] || null

  if (owner && repo) {
    return {
      owner,
      repo,
      description: 'SparkLog Public Notes Repository'
    }
  }

  return null
}

// Get GitHub Access Token (for unconnected users to access private repositories)
export const getGitHubToken = (): string | null => {
  const tokenValues = getAllEnvValues('GITHUB_TOKEN')
  const token = tokenValues[0] || null
  
  return token
}

// Check if it's development environment
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development'
}

// Get current domain
export const getCurrentDomain = (): string => {
  return typeof window !== 'undefined' ? window.location.hostname : 'unknown'
}

// Check if it's Cloudflare Pages environment
export const isCloudflarePages = (): boolean => {
  if (typeof window === 'undefined') return false
  
  const hostname = window.location.hostname
  const isPages = hostname.includes('pages.dev') || 
                  hostname.includes('workers.dev') ||
                  hostname.includes('cloudflarepages.app')
  
  const isProd = import.meta.env.MODE === 'production'
  
  return isPages || isProd
} 