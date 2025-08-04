// 环境变量配置
// 支持本地开发(.env文件)和Cloudflare Pages环境变量

export interface RepoConfig {
  owner: string
  repo: string
  description: string
}

// 检测环境变量是否已配置
export const checkEnvVarsConfigured = (): boolean => {
  const owner = import.meta.env.VITE_REPO_OWNER || 
                import.meta.env.VITE_GITHUB_OWNER ||
                import.meta.env.REPO_OWNER ||
                import.meta.env.GITHUB_OWNER

  const repo = import.meta.env.VITE_REPO_NAME || 
               import.meta.env.VITE_GITHUB_REPO ||
               import.meta.env.REPO_NAME ||
               import.meta.env.GITHUB_REPO

  const token = import.meta.env.VITE_GITHUB_TOKEN || 
                import.meta.env.GITHUB_TOKEN

  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD

  // 添加调试信息
  console.log('环境变量检查:', {
    owner: owner ? '已设置' : '未设置',
    repo: repo ? '已设置' : '未设置',
    token: token ? '已设置' : '未设置',
    adminPassword: adminPassword ? '已设置' : '未设置',
    env: import.meta.env.MODE,
    isDev: import.meta.env.DEV
  })

  // 检查必要的环境变量是否都已配置
  return !!(owner && repo && token && adminPassword)
}

// 从环境变量获取仓库配置
export const getRepoConfigFromEnv = (): RepoConfig | null => {
  // 支持多种环境变量格式
  const owner = import.meta.env.VITE_REPO_OWNER || 
                import.meta.env.VITE_GITHUB_OWNER ||
                import.meta.env.REPO_OWNER ||
                import.meta.env.GITHUB_OWNER

  const repo = import.meta.env.VITE_REPO_NAME || 
               import.meta.env.VITE_GITHUB_REPO ||
               import.meta.env.REPO_NAME ||
               import.meta.env.GITHUB_REPO

  if (owner && repo) {
    console.log('获取仓库配置成功:', { owner, repo })
    return {
      owner,
      repo,
      description: 'SparkLog公开笔记仓库'
    }
  }

  console.log('获取仓库配置失败:', { owner, repo })
  return null
}

// 获取GitHub Access Token（用于未连接用户访问私有仓库）
export const getGitHubToken = (): string | null => {
  const token = import.meta.env.VITE_GITHUB_TOKEN || 
         import.meta.env.GITHUB_TOKEN || 
         null
  
  console.log('获取GitHub Token:', token ? '已设置' : '未设置')
  return token
}

// 检查是否为开发环境
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development'
}

// 获取当前域名
export const getCurrentDomain = (): string => {
  return window.location.hostname
}

// 检查是否为Cloudflare Pages环境
export const isCloudflarePages = (): boolean => {
  return window.location.hostname.includes('pages.dev') || 
         window.location.hostname.includes('workers.dev') ||
         import.meta.env.MODE === 'production'
} 