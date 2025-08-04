// 环境变量配置
// 支持本地开发(.env文件)和Cloudflare Pages环境变量

export interface RepoConfig {
  owner: string
  repo: string
  description: string
}

// 获取所有可能的环境变量值
const getAllEnvValues = (key: string): string[] => {
  const values: string[] = []
  
  // 检查所有可能的键名
  const possibleKeys = [
    key,
    `VITE_${key}`,
    key.toUpperCase(),
    `VITE_${key.toUpperCase()}`,
    key.toLowerCase(),
    `VITE_${key.toLowerCase()}`
  ]
  
  // 检查import.meta.env
  possibleKeys.forEach(k => {
    const value = import.meta.env[k]
    if (value && typeof value === 'string') {
      values.push(value)
    }
  })
  
  // 检查window对象（某些情况下环境变量可能在这里）
  if (typeof window !== 'undefined') {
    possibleKeys.forEach(k => {
      const value = (window as any)[k]
      if (value && typeof value === 'string') {
        values.push(value)
      }
    })
  }
  
  // 检查process.env（构建时）
  if (typeof process !== 'undefined' && process.env) {
    possibleKeys.forEach(k => {
      const value = process.env[k]
      if (value && typeof value === 'string') {
        values.push(value)
      }
    })
  }
  
  return [...new Set(values)] // 去重
}

// 检测环境变量是否已配置
export const checkEnvVarsConfigured = (): boolean => {
  console.log('=== 详细环境变量检查 ===')
  
  // 检查所有环境变量
  const ownerValues = getAllEnvValues('REPO_OWNER')
  const repoValues = getAllEnvValues('REPO_NAME')
  const tokenValues = getAllEnvValues('GITHUB_TOKEN')
  const passwordValues = getAllEnvValues('ADMIN_PASSWORD')
  
  // 获取第一个有效值
  const owner = ownerValues[0] || null
  const repo = repoValues[0] || null
  const token = tokenValues[0] || null
  const adminPassword = passwordValues[0] || null
  
  // 详细调试信息
  console.log('环境变量详细检查:', {
    owner: {
      found: ownerValues.length,
      values: ownerValues,
      final: owner
    },
    repo: {
      found: repoValues.length,
      values: repoValues,
      final: repo
    },
    token: {
      found: tokenValues.length,
      values: tokenValues.map(v => v ? '***' : null),
      final: token ? '***' : null
    },
    adminPassword: {
      found: passwordValues.length,
      values: passwordValues.map(v => v ? '***' : null),
      final: adminPassword ? '***' : null
    },
    env: {
      MODE: import.meta.env.MODE,
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD,
      BASE_URL: import.meta.env.BASE_URL
    },
    location: {
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
      href: typeof window !== 'undefined' ? window.location.href : 'unknown'
    }
  })
  
  // 检查是否为Cloudflare Pages环境
  const isCloudflare = isCloudflarePages()
  console.log('是否为Cloudflare Pages:', isCloudflare)
  
  // 在Cloudflare环境中，如果某些变量缺失，尝试使用默认值
  if (isCloudflare) {
    console.log('在Cloudflare Pages环境中，检查默认配置...')
    
    // 如果环境变量未完全配置，但至少有一些配置，可以继续
    const hasBasicConfig = owner && repo
    console.log('基础配置检查:', { hasBasicConfig, owner: !!owner, repo: !!repo })
    
    if (hasBasicConfig) {
      console.log('基础配置存在，允许继续运行')
      return true
    }
  }
  
  // 检查必要的环境变量是否都已配置
  const allConfigured = !!(owner && repo && token && adminPassword)
  console.log('所有环境变量配置状态:', allConfigured)
  
  return allConfigured
}

// 从环境变量获取仓库配置
export const getRepoConfigFromEnv = (): RepoConfig | null => {
  const ownerValues = getAllEnvValues('REPO_OWNER')
  const repoValues = getAllEnvValues('REPO_NAME')
  
  const owner = ownerValues[0] || null
  const repo = repoValues[0] || null

  if (owner && repo) {
    console.log('获取仓库配置成功:', { owner, repo })
    return {
      owner,
      repo,
      description: 'SparkLog公开笔记仓库'
    }
  }

  console.log('获取仓库配置失败:', { 
    owner: owner || '未找到',
    repo: repo || '未找到',
    ownerValues,
    repoValues
  })
  return null
}

// 获取GitHub Access Token（用于未连接用户访问私有仓库）
export const getGitHubToken = (): string | null => {
  const tokenValues = getAllEnvValues('GITHUB_TOKEN')
  const token = tokenValues[0] || null
  
  console.log('获取GitHub Token:', {
    found: tokenValues.length,
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 4)}...` : '无'
  })
  return token
}

// 检查是否为开发环境
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development'
}

// 获取当前域名
export const getCurrentDomain = (): string => {
  return typeof window !== 'undefined' ? window.location.hostname : 'unknown'
}

// 检查是否为Cloudflare Pages环境
export const isCloudflarePages = (): boolean => {
  if (typeof window === 'undefined') return false
  
  const hostname = window.location.hostname
  const isPages = hostname.includes('pages.dev') || 
                  hostname.includes('workers.dev') ||
                  hostname.includes('cloudflarepages.app')
  
  const isProd = import.meta.env.MODE === 'production'
  
  console.log('Cloudflare Pages环境检查:', {
    hostname,
    isPages,
    isProd,
    result: isPages || isProd
  })
  
  return isPages || isProd
}

// 调试所有环境变量
export const debugAllEnvVars = () => {
  console.log('=== 所有环境变量调试 ===')
  
  // 列出所有import.meta.env的键
  const envKeys = Object.keys(import.meta.env)
  console.log('import.meta.env 所有键:', envKeys)
  
  // 检查特定的环境变量
  const specificKeys = [
    'VITE_REPO_OWNER', 'REPO_OWNER', 'GITHUB_OWNER',
    'VITE_REPO_NAME', 'REPO_NAME', 'GITHUB_REPO',
    'VITE_GITHUB_TOKEN', 'GITHUB_TOKEN',
    'VITE_ADMIN_PASSWORD', 'ADMIN_PASSWORD'
  ]
  
  specificKeys.forEach(key => {
    const value = import.meta.env[key]
    console.log(`${key}:`, value ? (key.includes('TOKEN') || key.includes('PASSWORD') ? '***' : value) : 'undefined')
  })
  
  // 检查window对象
  if (typeof window !== 'undefined') {
    console.log('window对象中的环境变量:')
    specificKeys.forEach(key => {
      const value = (window as any)[key]
      if (value) {
        console.log(`window.${key}:`, key.includes('TOKEN') || key.includes('PASSWORD') ? '***' : value)
      }
    })
  }
} 