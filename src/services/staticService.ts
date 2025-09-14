import { parseNoteContent, decodeBase64Content } from '@/utils/noteUtils'
import { DraftService } from './draftService'
import { Note } from '@/types/Note'
import { getStaticBranch } from '@/config/env'

interface StaticNoteData {
  id: string
  title: string
  content: string
  contentPreview: string
  createdDate: string
  updatedDate: string
  isPrivate: boolean
  tags: string[]
  filename: string
  compiledAt: string
  sha: string
  path: string
  // GitHub 元数据
  url?: string
  git_url?: string
  html_url?: string
  download_url?: string
}

interface StaticIndexData {
  version: string
  compiledAt: string
  totalNotes: number
  publicNotes: number
  notes: Record<string, Omit<StaticNoteData, 'content'>>
}

export class StaticService {
  private static instance: StaticService

  private constructor() {}

  static getInstance(): StaticService {
    if (!StaticService.instance) {
      StaticService.instance = new StaticService()
    }
    return StaticService.instance
  }

  /**
   * 编译单个笔记为静态 JSON 文件
   */
  async compileSingleNote(
    noteFile: any,
    noteContent: string,
    authData: { username: string; repo: string; accessToken: string }
  ): Promise<void> {
    try {
      const parsed = parseNoteContent(noteContent, noteFile.name)
      
      // 跳过私密笔记的静态编译
      if (parsed.isPrivate) {
        console.log(`跳过私密笔记的静态编译: ${noteFile.name}`)
        return
      }

      const staticNoteData: StaticNoteData = {
        id: noteFile.sha,
        title: noteFile.name.replace(/\.md$/, ''),
        content: noteContent,
        contentPreview: parsed.contentPreview,
        createdDate: parsed.createdDate || noteFile.created_at,
        updatedDate: parsed.updatedDate || noteFile.updated_at,
        isPrivate: parsed.isPrivate,
        tags: parsed.tags,
        filename: noteFile.name,
        compiledAt: new Date().toISOString(),
        sha: noteFile.sha,
        path: noteFile.path,
        // GitHub 元数据
        url: noteFile.url,
        git_url: noteFile.git_url,
        html_url: noteFile.html_url,
        download_url: noteFile.download_url
      }

      // 保存到 public/static-notes/
      const staticFileName = `${noteFile.name}.json`
      await this.saveStaticFile(staticFileName, staticNoteData, authData)
      
      console.log(`静态文件编译完成: ${staticFileName}`)
    } catch (error) {
      console.error(`编译静态文件失败: ${noteFile.name}`, error)
    }
  }

  /**
   * 编译所有公开笔记并更新索引文件
   */
  async compileAllNotes(
    markdownFiles: any[],
    batchContent: Record<string, any>,
    authData: { username: string; repo: string; accessToken: string }
  ): Promise<void> {
    try {
      const staticNotes: Record<string, Omit<StaticNoteData, 'content'>> = {}
      let publicNotesCount = 0

      // 编译每个公开笔记
      for (const file of markdownFiles) {
        const contentData = batchContent[file.path]
        if (!contentData) continue

        const content = decodeBase64Content(contentData.content)
        const parsed = parseNoteContent(content, file.name)

        // 跳过私密笔记
        if (parsed.isPrivate) {
          continue
        }

        const staticNoteData: StaticNoteData = {
          id: file.sha,
          title: file.name.replace(/\.md$/, ''),
          content: content,
          contentPreview: parsed.contentPreview,
          createdDate: parsed.createdDate || file.created_at,
          updatedDate: parsed.updatedDate || file.updated_at,
          isPrivate: parsed.isPrivate,
          tags: parsed.tags,
          filename: file.name,
          compiledAt: new Date().toISOString(),
          sha: file.sha,
          path: file.path,
          // GitHub 元数据
          url: file.url,
          git_url: file.git_url,
          html_url: file.html_url,
          download_url: file.download_url
        }

        // 保存单个笔记文件
        const staticFileName = `${file.name}.json`
        await this.saveStaticFile(staticFileName, staticNoteData, authData)

        // 添加到索引（不包含content）
        // eslint-disable-next-line no-unused-vars
        const { content: _, ...noteWithoutContent } = staticNoteData
        staticNotes[file.name] = noteWithoutContent
        publicNotesCount++
      }

      // 创建索引文件
      const indexData: StaticIndexData = {
        version: '1.0.0',
        compiledAt: new Date().toISOString(),
        totalNotes: markdownFiles.length,
        publicNotes: publicNotesCount,
        notes: staticNotes
      }

      await this.saveStaticFile('index.json', indexData, authData)
      
      console.log(`静态编译完成: 总共 ${markdownFiles.length} 个笔记，公开 ${publicNotesCount} 个`)
    } catch (error) {
      console.error('编译所有笔记失败:', error)
      throw error
    }
  }

  /**
   * 删除静态文件
   */
  async deleteStaticNote(
    filename: string,
    authData: { username: string; repo: string; accessToken: string }
  ): Promise<void> {
    try {
      // 确保文件名格式正确：去掉.md后缀，再加上.md.json
      const baseFileName = filename.replace(/\.md$/, '')
      const staticFileName = `${baseFileName}.md.json`
      await this.deleteStaticFile(staticFileName, authData)
      console.log(`静态文件删除完成: ${staticFileName}`)
    } catch (error) {
      console.error(`删除静态文件失败: ${filename}`, error)
    }
  }

  /**
   * 保存静态文件到 GitHub 仓库
   */
  private async saveStaticFile(
    filename: string,
    data: any,
    authData: { username: string; repo: string; accessToken: string }
  ): Promise<void> {
    const filePath = `public/static-notes/${filename}`
    const content = JSON.stringify(data, null, 2)
    const encodedContent = btoa(unescape(encodeURIComponent(content)))

    try {
      // 先检查文件是否存在
      let sha = ''
      try {
        const existingResponse = await fetch(
          `https://api.github.com/repos/${authData.username}/${authData.repo}/contents/${filePath}?ref=${getStaticBranch()}`,
          {
            headers: {
              'Authorization': `token ${authData.accessToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        )

        if (existingResponse && existingResponse.ok) {
          const existingData = await existingResponse.json()
          sha = existingData.sha
        }
      } catch (error) {
        // 文件不存在，继续创建
      }

      // 保存或更新文件
      const requestBody: any = {
        message: `更新静态文件: ${filename}`,
        content: encodedContent,
        branch: getStaticBranch()
      }

      if (sha) {
        requestBody.sha = sha
      }

      const response = await fetch(
        `https://api.github.com/repos/${authData.username}/${authData.repo}/contents/${filePath}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${authData.accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      )

      if (!response) {
        throw new Error('网络请求失败')
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`保存静态文件失败: ${errorData.message || response.statusText}`)
      }
    } catch (error) {
      console.error(`保存静态文件失败: ${filename}`, error)
      throw error
    }
  }

  /**
   * 删除静态文件
   */
  private async deleteStaticFile(
    filename: string,
    authData: { username: string; repo: string; accessToken: string }
  ): Promise<void> {
    const filePath = `public/static-notes/${filename}`

    try {
      // 获取文件信息以获得 SHA
      const response = await fetch(
        `https://api.github.com/repos/${authData.username}/${authData.repo}/contents/${filePath}?ref=${getStaticBranch()}`,
        {
          headers: {
            'Authorization': `token ${authData.accessToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      )

      if (!response) {
        throw new Error('网络请求失败')
      }

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`静态文件不存在: ${filename}`)
          return
        }
        throw new Error(`获取文件信息失败: ${response.statusText}`)
      }

      const fileData = await response.json()

      // 删除文件
      const deleteResponse = await fetch(
        `https://api.github.com/repos/${authData.username}/${authData.repo}/contents/${filePath}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `token ${authData.accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `删除静态文件: ${filename}`,
            sha: fileData.sha,
            branch: getStaticBranch()
          })
        }
      )

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json()
        throw new Error(`删除静态文件失败: ${errorData.message || deleteResponse.statusText}`)
      }
    } catch (error) {
      console.error(`删除静态文件失败: ${filename}`, error)
      throw error
    }
  }

  /**
   * 获取静态笔记数据（用于浏览）
   */
  async getStaticNote(filename: string): Promise<StaticNoteData | null> {
    try {
      // 检查环境
      if (typeof window === 'undefined' || typeof fetch === 'undefined') {
        console.log('静态文件加载需要浏览器环境')
        return null
      }

      const staticFileName = `${filename}.md.json`
      const response = await fetch(`/static-notes/${staticFileName}`)
      
      if (!response.ok) {
        console.log(`静态笔记文件不存在: ${staticFileName} (${response.status})`)
        return null
      }

      // 检查响应类型是否为JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.warn(`静态笔记响应不是JSON格式: ${staticFileName}, Content-Type: ${contentType}`)
        return null
      }

      return await response.json()
    } catch (error) {
      console.error(`获取静态笔记失败: ${filename}`, error)
      return null
    }
  }

  /**
   * 获取静态笔记索引（支持草稿合并）
   */
  async getStaticIndex(): Promise<StaticIndexData | null> {
    try {
      console.log('🔍 开始尝试加载静态索引文件...')
      
      // 检查环境
      if (typeof window === 'undefined' || typeof fetch === 'undefined') {
        console.log('❌ 静态文件加载需要浏览器环境')
        return null
      }

      const indexUrl = '/static-notes/index.json'
      console.log('📂 尝试访问:', indexUrl)
      
      const response = await fetch(indexUrl)
      console.log('📡 响应状态:', response.status, response.statusText)
      
      if (!response.ok) {
        console.log('❌ 静态索引文件访问失败:', response.status)
        return null
      }

      // 检查响应类型是否为JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.warn(`❌ 静态索引响应不是JSON格式, Content-Type: ${contentType}`)
        return null
      }

      const data = await response.json()
      console.log('✅ 静态索引加载成功:', {
        version: data.version,
        compiledAt: data.compiledAt,
        totalNotes: data.totalNotes,
        publicNotes: data.publicNotes
      })
      
      return data
    } catch (error) {
      console.error('❌ 获取静态索引失败:', error)
      return null
    }
  }

  /**
   * 获取混合笔记数据（静态 + 草稿）
   */
  async getMergedNotes(authData?: { username: string; repo: string; accessToken: string }): Promise<Note[]> {
    try {
      console.log('🔄 开始获取混合笔记数据（静态 + 草稿）...')
      
      // 获取静态索引
      const staticIndex = await this.getStaticIndex()
      if (!staticIndex || !staticIndex.notes) {
        console.log('⚠️ 静态索引为空，仅使用草稿数据')
        const draftService = DraftService.getInstance()
        return draftService.getAllDrafts().map(draft => ({ ...draft, isDraft: false }))
      }

      // 转换静态数据为笔记格式
      const staticNotes = Object.values(staticIndex.notes).map((note: any) => {
        const convertedNote = {
          ...note,
          id: note.sha,
          name: note.filename,
          sha: note.sha,
          path: note.path,
          created_at: note.createdDate,
          updated_at: note.updatedDate,
          fullContent: '', // 静态索引不包含完整内容
          type: 'file'
        }
        
        console.log('🔍 静态笔记转换:', {
          filename: note.filename,
          has_html_url: !!note.html_url,
          html_url: note.html_url,
          original_keys: Object.keys(note),
          converted_keys: Object.keys(convertedNote)
        })
        
        return convertedNote
      })

      console.log(`📊 静态笔记数量: ${staticNotes.length}`)

      // 使用草稿服务合并数据，传入认证信息用于删除检查
      const draftService = DraftService.getInstance()
      const mergedNotes = await draftService.mergeWithStaticData(staticNotes, authData)
      
      console.log(`📊 合并后笔记数量: ${mergedNotes.length}`)
      
      return mergedNotes
    } catch (error) {
      console.error('❌ 获取混合笔记数据失败:', error)
      return []
    }
  }
}
