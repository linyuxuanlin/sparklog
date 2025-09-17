import { getRepoConfigFromEnv, getGitHubToken, isDevelopment } from './env'

// 默认的公开笔记仓库配置
// 这些配置用于未连接GitHub的用户查看公开笔记
export const DEFAULT_REPO_CONFIG = {
  owner: 'your-username', // 需要替换为实际的GitHub用户名
  repo: 'your-notes-repo', // 需要替换为实际的公开仓库名
  description: 'SparkLog公开笔记仓库'
}

// 获取默认仓库配置
export const getDefaultRepoConfig = () => {
  // 优先使用环境变量配置
  const envConfig = getRepoConfigFromEnv()
  if (envConfig) {
    return envConfig
  }

  // 开发环境使用默认配置
  if (isDevelopment()) {
    return DEFAULT_REPO_CONFIG
  }

  // 生产环境如果没有配置环境变量，返回null
  return null
}

// 获取GitHub Token（用于访问私有仓库）
export const getDefaultGitHubToken = () => {
  return getGitHubToken()
} 

// 获取静态部署仓库配置（public/static-notes 所在仓库）
export const getStaticRepoConfig = () => {
  // 静态仓库即当前部署/默认仓库（使用 VITE_REPO_OWNER / VITE_REPO_NOTES）
  return getDefaultRepoConfig()
}
