// 环境变量配置
// 支持本地开发(.env文件)和Cloudflare Pages环境变量

export interface RepoConfig {
  owner: string
  repo: string
  description: string
}

// 调试：打印环境变量状态（仅在开发模式下）
if (import.meta.env.DEV) {
  console.log('🔍 环境变量调试信息:')
  console.log('VITE_GITHUB_TOKEN:', import.meta.env.VITE_GITHUB_TOKEN ? '已设置' : '未设置')
  console.log('VITE_REPO_OWNER:', import.meta.env.VITE_REPO_OWNER)
  console.log('VITE_REPO_NAME:', import.meta.env.VITE_REPO_NAME)
  console.log('VITE_ADMIN_PASSWORD:', import.meta.env.VITE_ADMIN_PASSWORD ? '已设置' : '未设置')
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

  const result = !!(owner && repo && token && adminPassword)
  
  // 在生产环境中也显示配置状态，便于调试
  if (!result) {
    console.warn('⚠️ 环境变量配置不完整:')
    console.warn('Owner:', owner ? '✅' : '❌')
    console.warn('Repo:', repo ? '✅' : '❌')
    console.warn('Token:', token ? '✅' : '❌')
    console.warn('Admin Password:', adminPassword ? '✅' : '❌')
  }
  
  return result
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
    return {
      owner,
      repo,
      description: 'SparkLog公开笔记仓库'
    }
  }

  return null
}

// 获取GitHub Access Token（用于未连接用户访问私有仓库）
export const getGitHubToken = (): string | null => {
  return import.meta.env.VITE_GITHUB_TOKEN || 
         import.meta.env.GITHUB_TOKEN || 
         null
}

// 检查是否为开发环境
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development'
}

// 获取当前域名
export const getCurrentDomain = (): string => {
  return window.location.hostname
} 