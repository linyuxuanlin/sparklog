/**
 * 笔记操作服务
 * 负责笔记的创建、编辑、删除操作
 * 在新架构中，这些操作会触发GitHub Actions来重新编译静态内容
 */

import { getDefaultRepoConfig, getDefaultGitHubToken } from '@/config/defaultRepo'
import { encodeBase64Content, formatTagsForFrontMatter } from '@/utils/noteUtils'

export interface NoteData {
  content: string
  isPrivate: boolean
  tags: string[]
}

export interface NoteOperationResult {
  success: boolean
  message: string
  data?: any
}

export class NoteOperationsService {
  private static instance: NoteOperationsService

  private constructor() {}

  static getInstance(): NoteOperationsService {
    if (!NoteOperationsService.instance) {
      NoteOperationsService.instance = new NoteOperationsService()
    }
    return NoteOperationsService.instance
  }

  /**
   * 获取认证信息
   */
  private getAuthData(adminToken?: string) {
    const defaultConfig = getDefaultRepoConfig()
    if (!defaultConfig) {
      throw new Error('未配置默认仓库')
    }

    return {
      username: defaultConfig.owner,
      repo: defaultConfig.repo,
      accessToken: adminToken || getDefaultGitHubToken()
    }
  }

  /**
   * 创建笔记
   */
  async createNote(noteData: NoteData, adminToken?: string): Promise<NoteOperationResult> {
    try {
      const authData = this.getAuthData(adminToken)
      
      // 创建文件名（使用时间戳）
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').replace('Z', '')
      const fileName = `${timestamp}.md`
      const filePath = `notes/${fileName}`
      
      // 创建笔记内容
      const currentTime = new Date().toISOString()
      const noteContent = `---
created_at: ${currentTime}
updated_at: ${currentTime}
private: ${noteData.isPrivate}
tags: ${formatTagsForFrontMatter(noteData.tags)}
---

${noteData.content.trim()}
`

      // 调用GitHub API创建文件
      const response = await fetch(`https://api.github.com/repos/${authData.username}/${authData.repo}/contents/${filePath}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${authData.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `创建笔记: ${timestamp}

🤖 此操作将触发静态内容重新编译
📝 笔记类型: ${noteData.isPrivate ? '私密' : '公开'}
🏷️  标签: ${noteData.tags.join(', ') || '无'}`,
          content: encodeBase64Content(noteContent),
          branch: 'main'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`创建失败: ${errorData.message || response.statusText}`)
      }

      const result = await response.json()
      
      return {
        success: true,
        message: '笔记创建成功！内容正在编译中，请稍等片刻后刷新页面查看。',
        data: {
          fileName,
          filePath,
          sha: result.content?.sha
        }
      }

    } catch (error) {
      console.error('创建笔记失败:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '创建笔记失败，请重试'
      }
    }
  }

  /**
   * 更新笔记
   */
  async updateNote(
    originalPath: string, 
    originalSha: string,
    noteData: NoteData, 
    adminToken?: string,
    originalCreatedAt?: string
  ): Promise<NoteOperationResult> {
    try {
      const authData = this.getAuthData(adminToken)
      
      // 创建更新后的笔记内容
      const currentTime = new Date().toISOString()
      const createdAt = originalCreatedAt || currentTime
      
      const noteContent = `---
created_at: ${createdAt}
updated_at: ${currentTime}
private: ${noteData.isPrivate}
tags: ${formatTagsForFrontMatter(noteData.tags)}
---

${noteData.content.trim()}
`

      // 调用GitHub API更新文件
      const response = await fetch(`https://api.github.com/repos/${authData.username}/${authData.repo}/contents/${originalPath}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${authData.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `更新笔记: ${originalPath}

🤖 此操作将触发静态内容重新编译
📝 笔记类型: ${noteData.isPrivate ? '私密' : '公开'}
🏷️  标签: ${noteData.tags.join(', ') || '无'}`,
          content: encodeBase64Content(noteContent),
          sha: originalSha,
          branch: 'main'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`更新失败: ${errorData.message || response.statusText}`)
      }

      const result = await response.json()
      
      return {
        success: true,
        message: '笔记更新成功！内容正在编译中，请稍等片刻后刷新页面查看。',
        data: {
          filePath: originalPath,
          sha: result.content?.sha
        }
      }

    } catch (error) {
      console.error('更新笔记失败:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '更新笔记失败，请重试'
      }
    }
  }

  /**
   * 删除笔记
   */
  async deleteNote(
    filePath: string, 
    sha: string, 
    adminToken?: string
  ): Promise<NoteOperationResult> {
    try {
      const authData = this.getAuthData(adminToken)
      
      // 调用GitHub API删除文件
      const response = await fetch(`https://api.github.com/repos/${authData.username}/${authData.repo}/contents/${filePath}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `token ${authData.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `删除笔记: ${filePath}

🤖 此操作将触发静态内容重新编译`,
          sha: sha,
          branch: 'main'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`删除失败: ${errorData.message || response.statusText}`)
      }
      
      return {
        success: true,
        message: '笔记删除成功！内容正在编译中，请稍等片刻后刷新页面查看。'
      }

    } catch (error) {
      console.error('删除笔记失败:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '删除笔记失败，请重试'
      }
    }
  }

  /**
   * 检查GitHub Actions工作流状态
   */
  async checkWorkflowStatus(adminToken?: string): Promise<{
    isRunning: boolean
    lastRun?: {
      status: string
      conclusion?: string
      createdAt: string
      updatedAt: string
    }
  }> {
    try {
      const authData = this.getAuthData(adminToken)
      
      // 获取工作流运行状态
      const response = await fetch(`https://api.github.com/repos/${authData.username}/${authData.repo}/actions/workflows/build-static-content.yml/runs?per_page=1`, {
        headers: {
          'Authorization': `token ${authData.accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (!response.ok) {
        throw new Error('无法获取工作流状态')
      }

      const data = await response.json()
      
      if (data.workflow_runs && data.workflow_runs.length > 0) {
        const latestRun = data.workflow_runs[0]
        return {
          isRunning: latestRun.status === 'in_progress' || latestRun.status === 'queued',
          lastRun: {
            status: latestRun.status,
            conclusion: latestRun.conclusion,
            createdAt: latestRun.created_at,
            updatedAt: latestRun.updated_at
          }
        }
      }

      return { isRunning: false }

    } catch (error) {
      console.error('检查工作流状态失败:', error)
      return { isRunning: false }
    }
  }

  /**
   * 手动触发工作流
   */
  async triggerWorkflow(adminToken?: string): Promise<NoteOperationResult> {
    try {
      const authData = this.getAuthData(adminToken)
      
      // 触发工作流
      const response = await fetch(`https://api.github.com/repos/${authData.username}/${authData.repo}/actions/workflows/build-static-content.yml/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${authData.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            force_rebuild: 'true'
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`触发工作流失败: ${errorData.message || response.statusText}`)
      }
      
      return {
        success: true,
        message: '已触发内容重新编译，请稍等片刻后刷新页面查看。'
      }

    } catch (error) {
      console.error('触发工作流失败:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '触发工作流失败，请重试'
      }
    }
  }
}
