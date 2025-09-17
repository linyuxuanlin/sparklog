// 环境变量配置
// 支持本地开发（.env 文件）和 Cloudflare Pages 环境变量

export interface RepoConfig {
  owner: string
  repo: string
  description: string
}

const getOwnerFromEnv = (): string | undefined => {
  const value = (
    import.meta.env.VITE_REPO_OWNER ||
    import.meta.env.VITE_GITHUB_OWNER ||
    import.meta.env.REPO_OWNER ||
    import.meta.env.GITHUB_OWNER
  )

  return value ? value.trim() : undefined
}

const getNotesRepoFromEnv = (): string | undefined => {
  const value = (
    import.meta.env.VITE_REPO_NOTES ||
    import.meta.env.VITE_REPO_NAME ||
    import.meta.env.VITE_GITHUB_REPO ||
    import.meta.env.REPO_NOTES ||
    import.meta.env.REPO_NAME ||
    import.meta.env.GITHUB_REPO
  )

  return value ? value.trim() : undefined
}

const getDeployRepoFromEnv = (): string | undefined => {
  const value = (
    import.meta.env.VITE_REPO_DEPLOY ||
    import.meta.env.REPO_DEPLOY ||
    import.meta.env.VITE_DEPLOY_REPO_URL ||
    import.meta.env.DEPLOY_REPO_URL
  )

  return value ? value.trim() : undefined
}

const buildGitHubRepoUrl = (owner?: string, repo?: string): string | null => {
  if (owner && repo) {
    return `https://github.com/${owner}/${repo}`
  }
  return null
}

// 检测必要的环境变量是否已配置
export const checkEnvVarsConfigured = (): boolean => {
  const owner = getOwnerFromEnv()
  const notesRepo = getNotesRepoFromEnv()
  const token = import.meta.env.VITE_GITHUB_TOKEN || import.meta.env.GITHUB_TOKEN
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD

  return !!(owner && notesRepo && token && adminPassword)
}

// 从环境变量获取笔记仓库配置
export const getRepoConfigFromEnv = (): RepoConfig | null => {
  const owner = getOwnerFromEnv()
  const notesRepo = getNotesRepoFromEnv()

  if (owner && notesRepo) {
    return {
      owner,
      repo: notesRepo,
      description: 'SparkLog公开笔记仓库'
    }
  }

  return null
}

// 静态仓库不单独配置，默认与当前仓库一致（VITE_REPO_OWNER / VITE_REPO_NOTES）

// 获取 GitHub Access Token（用于未连接用户访问私有仓库）
export const getGitHubToken = (): string | null => {
  return (
    import.meta.env.VITE_GITHUB_TOKEN ||
    import.meta.env.GITHUB_TOKEN ||
    null
  )
}

// 检查是否为开发环境
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development'
}

// 获取当前域名
export const getCurrentDomain = (): string => {
  return window.location.hostname
}

// 获取用于存放静态内容的分支名（默认 main）
export const getStaticBranch = (): string => {
  return (import.meta.env.VITE_STATIC_BRANCH as string) || 'main'
}

// 获取部署仓库链接（用于页面跳转）
export const getDeployRepoUrl = (): string | null => {
  const owner = getOwnerFromEnv()
  const deployRepo = getDeployRepoFromEnv()

  if (deployRepo) {
    const trimmed = deployRepo.trim()
    if (!trimmed) {
      return null
    }

    if (trimmed.includes('://')) {
      return trimmed
    }

    if (trimmed.includes('/')) {
      const [maybeOwner, maybeRepo] = trimmed.split('/', 2)
      const repoPart = maybeRepo?.trim()
      const ownerPart = maybeOwner.trim()

      if (ownerPart && repoPart) {
        return buildGitHubRepoUrl(ownerPart, repoPart)
      }

      if (repoPart && owner) {
        return buildGitHubRepoUrl(owner, repoPart)
      }
    }

    return buildGitHubRepoUrl(owner, trimmed)
  }

  return null
}
