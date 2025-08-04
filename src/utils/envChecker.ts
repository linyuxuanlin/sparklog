// Environment variable checker for debugging

export const checkEnvironmentVariables = () => {
  console.log('=== Environment Variables Check ===')
  
  // Check all possible environment variable names
  const envVars = {
    // Direct environment variables
    VITE_REPO_OWNER: import.meta.env.VITE_REPO_OWNER,
    VITE_REPO_NAME: import.meta.env.VITE_REPO_NAME,
    VITE_GITHUB_TOKEN: import.meta.env.VITE_GITHUB_TOKEN,
    VITE_ADMIN_PASSWORD: import.meta.env.VITE_ADMIN_PASSWORD,
    
    // Alternative names
    REPO_OWNER: import.meta.env.REPO_OWNER,
    REPO_NAME: import.meta.env.REPO_NAME,
    GITHUB_TOKEN: import.meta.env.GITHUB_TOKEN,
    ADMIN_PASSWORD: import.meta.env.ADMIN_PASSWORD,
    
    // GitHub specific names
    VITE_GITHUB_OWNER: import.meta.env.VITE_GITHUB_OWNER,
    VITE_GITHUB_REPO: import.meta.env.VITE_GITHUB_REPO,
    GITHUB_OWNER: import.meta.env.GITHUB_OWNER,
    GITHUB_REPO: import.meta.env.GITHUB_REPO,
  }
  
  console.log('Environment variables status:')
  Object.entries(envVars).forEach(([key, value]) => {
    const isSecret = key.includes('TOKEN') || key.includes('PASSWORD')
    const displayValue = value ? (isSecret ? '***' : value) : 'undefined'
    console.log(`  ${key}: ${displayValue}`)
  })
  
  // Check if we have the minimum required variables
  const hasOwner = !!(envVars.VITE_REPO_OWNER || envVars.REPO_OWNER || envVars.VITE_GITHUB_OWNER || envVars.GITHUB_OWNER)
  const hasRepo = !!(envVars.VITE_REPO_NAME || envVars.REPO_NAME || envVars.VITE_GITHUB_REPO || envVars.GITHUB_REPO)
  const hasToken = !!(envVars.VITE_GITHUB_TOKEN || envVars.GITHUB_TOKEN)
  const hasPassword = !!(envVars.VITE_ADMIN_PASSWORD || envVars.ADMIN_PASSWORD)
  
  console.log('Required variables check:')
  console.log(`  Owner: ${hasOwner ? '✅' : '❌'}`)
  console.log(`  Repo: ${hasRepo ? '✅' : '❌'}`)
  console.log(`  Token: ${hasToken ? '✅' : '❌'}`)
  console.log(`  Password: ${hasPassword ? '✅' : '❌'}`)
  
  // Check environment
  console.log('Environment info:')
  console.log(`  MODE: ${import.meta.env.MODE}`)
  console.log(`  DEV: ${import.meta.env.DEV}`)
  console.log(`  PROD: ${import.meta.env.PROD}`)
  console.log(`  BASE_URL: ${import.meta.env.BASE_URL}`)
  
  // Check if it's Cloudflare Pages
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown'
  const isCloudflare = hostname.includes('pages.dev') || hostname.includes('workers.dev') || hostname.includes('cloudflarepages.app')
  console.log(`  Hostname: ${hostname}`)
  console.log(`  Is Cloudflare Pages: ${isCloudflare}`)
  
  return {
    hasOwner,
    hasRepo,
    hasToken,
    hasPassword,
    isCloudflare,
    envVars
  }
}

export const getEffectiveConfig = () => {
  checkEnvironmentVariables()
  
  // Try to get owner and repo from various sources
  const owner = import.meta.env.VITE_REPO_OWNER || 
                import.meta.env.REPO_OWNER || 
                import.meta.env.VITE_GITHUB_OWNER || 
                import.meta.env.GITHUB_OWNER || 
                'linyuxuanlin'
  
  const repo = import.meta.env.VITE_REPO_NAME || 
               import.meta.env.REPO_NAME || 
               import.meta.env.VITE_GITHUB_REPO || 
               import.meta.env.GITHUB_REPO || 
               'sparklog-notes'
  
  const token = import.meta.env.VITE_GITHUB_TOKEN || 
                import.meta.env.GITHUB_TOKEN || 
                null
  
  const password = import.meta.env.VITE_ADMIN_PASSWORD || 
                   import.meta.env.ADMIN_PASSWORD || 
                   null
  
  console.log('Effective configuration:')
  console.log(`  Owner: ${owner}`)
  console.log(`  Repo: ${repo}`)
  console.log(`  Token: ${token ? '***' : 'None'}`)
  console.log(`  Password: ${password ? '***' : 'None'}`)
  
  return {
    owner,
    repo,
    token,
    password,
    hasValidConfig: !!(owner && repo)
  }
} 