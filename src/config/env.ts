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