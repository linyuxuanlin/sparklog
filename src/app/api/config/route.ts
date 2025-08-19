import { NextResponse } from 'next/server'
import { getDefaultRepoConfig, getDefaultGitHubToken, getAdminPassword } from '@/lib/config'

export async function GET() {
  try {
    const defaultConfig = getDefaultRepoConfig()
    const hasToken = !!getDefaultGitHubToken()
    const hasPassword = !!getAdminPassword()

    return NextResponse.json({
      repoConfig: defaultConfig ? {
        owner: defaultConfig.owner,
        repo: defaultConfig.repo
      } : null,
      hasToken,
      hasPassword,
      envStatus: {
        SPARKLOG_REPO_OWNER: !!process.env.SPARKLOG_REPO_OWNER,
        SPARKLOG_REPO_NAME: !!process.env.SPARKLOG_REPO_NAME,
        SPARKLOG_GITHUB_TOKEN: !!process.env.SPARKLOG_GITHUB_TOKEN,
        SPARKLOG_ADMIN_PASSWORD: !!process.env.SPARKLOG_ADMIN_PASSWORD
      }
    })
  } catch (error) {
    console.error('获取配置状态失败:', error)
    return NextResponse.json(
      { error: '获取配置状态失败' },
      { status: 500 }
    )
  }
}