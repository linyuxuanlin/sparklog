// 环境变量配置
// 支持本地开发(.env文件)和Cloudflare Pages环境变量

export interface RepoConfig {
  owner: string
  repo: string
  description: string
}

export interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  publicUrl?: string
}

// 检测环境变量是否已配置（R2 架构）
export const checkEnvVarsConfigured = (): boolean => {
  const r2Config = getR2Config()
  const adminPassword = getAdminPassword()
  const githubToken = getGitHubToken()

  // 检查必要的环境变量是否都已配置
  // R2 配置是必须的，管理员密码是必须的，GitHub Token 用于静态内容分支管理
  return !!(r2Config && adminPassword && githubToken)
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

// 获取管理员密码
export const getAdminPassword = (): string | null => {
  return import.meta.env.VITE_ADMIN_PASSWORD || null
}

// 获取 R2 存储配置
export const getR2Config = (): R2Config | null => {
  const accountId = import.meta.env.VITE_R2_ACCOUNT_ID
  const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID
  const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY
  const bucketName = import.meta.env.VITE_R2_BUCKET_NAME
  const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL

  if (accountId && accessKeyId && secretAccessKey && bucketName) {
    return {
      accountId,
      accessKeyId,
      secretAccessKey,
      bucketName,
      publicUrl
    }
  }

  return null
}

// 获取静态内容分支名称
export const getStaticBranch = (): string => {
  return import.meta.env.VITE_STATIC_BRANCH || 'static-content'
}

// 获取应用标题
export const getAppTitle = (): string => {
  return import.meta.env.VITE_APP_TITLE || 'SparkLog'
}

// 获取应用描述
export const getAppDescription = (): string => {
  return import.meta.env.VITE_APP_DESCRIPTION || '优雅免维护的想法记录应用'
}

// 获取默认主题
export const getDefaultTheme = (): string => {
  return import.meta.env.VITE_DEFAULT_THEME || 'auto'
}

// 检查是否为开发环境
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development'
}

// 获取当前域名
export const getCurrentDomain = (): string => {
  return window.location.hostname
}

// 检查 CORS 代理是否启用
export const isCorsProxyEnabled = (): boolean => {
  return import.meta.env.VITE_ENABLE_CORS_PROXY === 'true'
}

// 获取 CORS 代理 URL
export const getCorsProxyUrl = (): string | null => {
  return import.meta.env.VITE_CORS_PROXY_URL || null
} 