/**
 * 笔记操作服务
 * 负责笔记的创建、编辑、删除操作
 * 新架构：先存储到 Cloudflare R2，然后触发 GitHub Actions 编译静态内容
 */

import { getDefaultRepoConfig, getDefaultGitHubToken } from '@/config/defaultRepo'
import { formatTagsForFrontMatter } from '@/utils/noteUtils'
import { R2StorageService, R2Config } from './r2StorageService'
import { EncryptionService } from './encryptionService'
import { NoteCacheService } from './noteCacheService'
import { Note } from '@/types/Note'

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
  private r2Service: R2StorageService
  private encryptionService: EncryptionService
  private cacheService: NoteCacheService

  private constructor() {
    this.r2Service = R2StorageService.getInstance()
    this.encryptionService = EncryptionService.getInstance()
    this.cacheService = NoteCacheService.getInstance()
  }

  static getInstance(): NoteOperationsService {
    if (!NoteOperationsService.instance) {
      NoteOperationsService.instance = new NoteOperationsService()
    }
    return NoteOperationsService.instance
  }

  /**
   * 初始化 R2 存储配置
   */
  initializeR2Storage(config: R2Config): void {
    this.r2Service.initialize(config)
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
  async createNote(noteData: NoteData, adminToken?: string, adminPassword?: string): Promise<NoteOperationResult> {
    try {
      // 创建文件名（使用时间戳）
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').replace('Z', '')
      const fileName = `${timestamp}.md`
      const r2Key = `notes/${fileName}`
      
      // 创建笔记内容
      const currentTime = new Date().toISOString()
      let noteContent = `---
created_at: ${currentTime}
updated_at: ${currentTime}
private: ${noteData.isPrivate}
tags: ${formatTagsForFrontMatter(noteData.tags)}
---

${noteData.content.trim()}
`

      // 如果是私密笔记且提供了管理员密码，进行加密
      if (noteData.isPrivate && adminPassword) {
        const encryptResult = await this.encryptionService.encrypt(noteContent, adminPassword)
        if (encryptResult.success && encryptResult.data) {
          noteContent = this.encryptionService.markAsEncrypted(encryptResult.data)
        } else {
          throw new Error('笔记加密失败: ' + encryptResult.error)
        }
      }

      // 上传到 R2 存储
      const uploadResult = await this.r2Service.uploadNote(r2Key, noteContent)
      if (!uploadResult.success) {
        throw new Error('上传到 R2 失败: ' + uploadResult.message)
      }

      // 创建临时笔记对象用于缓存
      const tempNote: Note = {
        name: fileName,
        path: r2Key,
        sha: this.generateTempSha(fileName, noteContent),
        size: noteContent.length,
        url: uploadResult.url || '',
        git_url: '',
        html_url: '',
        download_url: '',
        type: 'file',
        content: noteData.content,
        fullContent: noteData.content,
        contentPreview: noteData.content.substring(0, 200) + (noteData.content.length > 200 ? '...' : ''),
        created_at: currentTime,
        updated_at: currentTime,
        createdDate: currentTime,
        updatedDate: currentTime,
        isPrivate: noteData.isPrivate,
        tags: noteData.tags
      }

      // 缓存笔记以便立即显示
      this.cacheService.cacheNote(tempNote)

      // 触发 GitHub Actions 编译
      await this.triggerStaticBuild(adminToken)
      
      return {
        success: true,
        message: '笔记创建成功！内容已保存到 R2 存储，正在编译静态内容...',
        data: {
          fileName,
          filePath: r2Key,
          sha: tempNote.sha,
          r2Key,
          cached: true
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
    originalNote: Note,
    noteData: NoteData, 
    adminToken?: string,
    adminPassword?: string
  ): Promise<NoteOperationResult> {
    try {
      // 创建更新后的笔记内容
      const currentTime = new Date().toISOString()
      const createdAt = originalNote.createdDate || originalNote.created_at || currentTime
      
      let noteContent = `---
created_at: ${createdAt}
updated_at: ${currentTime}
private: ${noteData.isPrivate}
tags: ${formatTagsForFrontMatter(noteData.tags)}
---

${noteData.content.trim()}
`

      // 如果是私密笔记且提供了管理员密码，进行加密
      if (noteData.isPrivate && adminPassword) {
        const encryptResult = await this.encryptionService.encrypt(noteContent, adminPassword)
        if (encryptResult.success && encryptResult.data) {
          noteContent = this.encryptionService.markAsEncrypted(encryptResult.data)
        } else {
          throw new Error('笔记加密失败: ' + encryptResult.error)
        }
      }

      // 确定 R2 键（从路径或名称推导）
      const r2Key = originalNote.path.startsWith('notes/') ? originalNote.path : `notes/${originalNote.name}`

      // 上传到 R2 存储
      const uploadResult = await this.r2Service.uploadNote(r2Key, noteContent)
      if (!uploadResult.success) {
        throw new Error('上传到 R2 失败: ' + uploadResult.message)
      }

      // 创建更新后的笔记对象用于缓存
      const updatedNote: Note = {
        ...originalNote,
        content: noteData.content,
        fullContent: noteData.content,
        contentPreview: noteData.content.substring(0, 200) + (noteData.content.length > 200 ? '...' : ''),
        updated_at: currentTime,
        updatedDate: currentTime,
        isPrivate: noteData.isPrivate,
        tags: noteData.tags,
        size: noteContent.length
      }

      // 缓存更新后的笔记以便立即显示
      this.cacheService.cacheNote(updatedNote, originalNote)

      // 触发 GitHub Actions 编译
      await this.triggerStaticBuild(adminToken)
      
      return {
        success: true,
        message: '笔记更新成功！内容已保存到 R2 存储，正在编译静态内容...',
        data: {
          filePath: r2Key,
          sha: updatedNote.sha,
          r2Key,
          cached: true
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
    note: Note, 
    adminToken?: string
  ): Promise<NoteOperationResult> {
    try {
      // 确定 R2 键
      const r2Key = note.path.startsWith('notes/') ? note.path : `notes/${note.name}`

      // 从 R2 存储删除
      const deleteResult = await this.r2Service.deleteNote(r2Key)
      if (!deleteResult.success) {
        console.warn('R2 删除失败，但继续处理:', deleteResult.message)
      }

      // 从缓存中移除
      this.cacheService.removeCachedNoteByNote(note)

      // 触发 GitHub Actions 编译
      await this.triggerStaticBuild(adminToken)
      
      return {
        success: true,
        message: '笔记删除成功！内容已从 R2 存储删除，正在更新静态内容...'
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
   * 生成临时 SHA（用于缓存笔记）
   */
  private generateTempSha(fileName: string, content: string): string {
    const data = fileName + content + Date.now()
    // 简单的哈希函数，实际项目中可以使用更复杂的算法
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为 32 位整数
    }
    return Math.abs(hash).toString(36).padStart(8, '0')
  }

  /**
   * 触发静态内容构建
   */
  private async triggerStaticBuild(adminToken?: string): Promise<void> {
    try {
      const authData = this.getAuthData(adminToken)
      
      // 触发 GitHub Actions 工作流
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
            source: 'r2_storage',
            force_rebuild: 'true'
          }
        })
      })

      if (!response.ok) {
        console.warn('触发静态构建失败:', response.status, response.statusText)
      } else {
        console.log('已触发静态内容构建')
      }
    } catch (error) {
      console.warn('触发静态构建异常:', error)
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
