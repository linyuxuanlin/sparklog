// Debug tools - for diagnosing issues in Cloudflare Pages environment

import { checkEnvVarsConfigured, isCloudflarePages } from '@/config/env'

export const debugEnvironment = () => {
  console.log('=== Environment Debug Information ===')
  console.log('Current URL:', window.location.href)
  console.log('User Agent:', navigator.userAgent)
  
  // Check environment variables configuration status
  const envConfigured = checkEnvVarsConfigured()
  console.log('Environment variables configuration status:', envConfigured)
  
  // Check if it's Cloudflare Pages environment
  const isCloudflare = isCloudflarePages()
  console.log('Is Cloudflare Pages:', isCloudflare)
  
  // Check localStorage
  try {
    const auth = localStorage.getItem('sparklog_admin_auth')
    console.log('localStorage authentication status:', auth ? JSON.parse(auth) : 'None')
  } catch (error) {
    console.error('localStorage access failed:', error)
  }
  
  // Test network connection
  testNetworkConnection()
  
  // If it's Cloudflare Pages environment, run special checks
  if (isCloudflare) {
    debugCloudflareSpecific()
  }
}

export const debugCloudflareSpecific = () => {
  console.log('=== Cloudflare Pages Special Checks ===')
  
  // Check Cloudflare-specific environment variables
  const cfKeys = [
    'CF_PAGES_URL',
    'CF_PAGES_BRANCH',
    'CF_PAGES_COMMIT_SHA',
    'CF_PAGES_ENVIRONMENT',
    'CF_PAGES_PROJECT_NAME'
  ]
  
  cfKeys.forEach(key => {
    const value = (window as any)[key]
    if (value) {
      console.log(`${key}:`, value)
    }
  })
  
  // Check build-time environment variables
  console.log('Build-time environment variables check:')
  const buildTimeKeys = [
    'VITE_REPO_OWNER',
    'VITE_REPO_NAME', 
    'VITE_GITHUB_TOKEN',
    'VITE_ADMIN_PASSWORD'
  ]
  
  buildTimeKeys.forEach(key => {
    const value = import.meta.env[key]
    console.log(`${key}:`, value ? (key.includes('TOKEN') || key.includes('PASSWORD') ? '***' : value) : 'undefined')
  })
}

export const testNetworkConnection = async () => {
  console.log('=== Network Connection Test ===')
  
  try {
    // Test GitHub API connection
    const response = await fetch('https://api.github.com/rate_limit', {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    
    console.log('GitHub API connection test:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('GitHub API rate limit info:', data)
    }
  } catch (error) {
    console.error('GitHub API connection failed:', error)
  }
  
  try {
    // Test basic network connection
    const response = await fetch('https://httpbin.org/get')
    console.log('Basic network connection test:', {
      status: response.status,
      ok: response.ok
    })
  } catch (error) {
    console.error('Basic network connection failed:', error)
  }
}

export const debugGitHubAPI = async (owner: string, repo: string, token?: string) => {
  console.log('=== GitHub API Debug ===')
  
  const headers: any = {
    'Accept': 'application/vnd.github.v3+json'
  }
  
  if (token) {
    headers['Authorization'] = `token ${token}`
  }
  
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/notes`
    console.log('Request URL:', url)
    console.log('Request headers:', headers)
    
    const response = await fetch(url, { headers })
    
    console.log('Response status:', response.status, response.statusText)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const data = await response.json()
      console.log('Response data:', data)
    } else {
      const errorData = await response.json().catch(() => ({}))
      console.error('API error:', errorData)
    }
  } catch (error) {
    console.error('GitHub API request failed:', error)
  }
}

// Manually trigger environment variables recheck
export const recheckEnvironmentVariables = () => {
  console.log('=== Manual Environment Variables Recheck ===')
  
  // Clear possible cache
  if (typeof window !== 'undefined') {
    // Try to reload page to refresh environment variables
    console.log('Suggest refreshing page to reload environment variables')
  }
  
  // Re-run environment check
  debugEnvironment()
}

// Auto-run debug in development environment
if (import.meta.env.DEV) {
  // Delay execution to ensure app is fully loaded
  setTimeout(() => {
    debugEnvironment()
  }, 1000)
}

// Also run debug in production environment (Cloudflare Pages)
if (import.meta.env.PROD) {
  setTimeout(() => {
    debugEnvironment()
  }, 2000)
} 