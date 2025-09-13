import fs from 'fs'
import path from 'path'

interface GitHubFile {
  name: string
  path: string
  sha: string
  size: number
  download_url: string
  type: string
}

interface StaticNote {
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
}

interface NotesIndex {
  version: string
  compiledAt: string
  totalNotes: number
  publicNotes: number
  notes: {
    [filename: string]: {
      id: string
      title: string
      contentPreview: string
      createdDate: string
      updatedDate: string
      tags: string[]
      sha: string
      path: string
    }
  }
  lastBuildStats?: {
    compiledNotes: number
    skippedNotes: number
    buildTime: string
  }
}

interface CompileResult {
  skipped: boolean
  reason?: string
  compiled?: boolean
  note?: StaticNote
}

class StaticNotesBuilder {
  private outputDir: string
  private githubToken: string
  private repoOwner: string
  private repoName: string

  constructor() {
    this.outputDir = path.resolve(process.cwd(), 'dist/static-notes')
    
    // 从环境变量获取配置
    this.githubToken = process.env.VITE_GITHUB_TOKEN || process.env.GITHUB_TOKEN || ''
    this.repoOwner = process.env.VITE_REPO_OWNER || process.env.VITE_GITHUB_OWNER || process.env.REPO_OWNER || process.env.GITHUB_OWNER || ''
    this.repoName = process.env.VITE_REPO_NAME || process.env.VITE_GITHUB_REPO || process.env.REPO_NAME || process.env.GITHUB_REPO || ''
    
    console.log('🔍 构建器配置:')
    console.log('   输出目录:', this.outputDir)
    console.log('   GitHub Token:', this.githubToken ? '已设置' : '未设置')
    console.log('   仓库所有者:', this.repoOwner || '未设置')
    console.log('   仓库名称:', this.repoName || '未设置')
  }

  // 检查配置是否完整
  private checkConfig(): void {
    if (!this.githubToken || !this.repoOwner || !this.repoName) {
      throw new Error('GitHub 配置不完整，请检查环境变量设置')
    }
  }

  // 从 GitHub 获取笔记文件列表
  private async fetchNotesFromGitHub(): Promise<GitHubFile[]> {
    const apiUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/notes`
    
    console.log('🔍 正在获取 GitHub 笔记列表...')
    console.log('   API URL:', apiUrl)
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `token ${this.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SparkLog-Static-Builder'
      }
    })

    if (!response.ok) {
      throw new Error(`GitHub API 请求失败: ${response.status} ${response.statusText}`)
    }

    const files = await response.json() as GitHubFile[]
    console.log(`📝 找到 ${files.length} 个文件`)
    
    return files.filter(file => file.type === 'file' && file.name.endsWith('.md'))
  }

  // 获取单个笔记内容
  private async fetchNoteContent(file: GitHubFile): Promise<string> {
    if (!file.download_url) {
      throw new Error(`文件 ${file.name} 没有下载链接`)
    }

    const response = await fetch(file.download_url)
    if (!response.ok) {
      throw new Error(`下载文件 ${file.name} 失败: ${response.status}`)
    }

    return await response.text()
  }

  // 解析笔记内容和元数据
  private parseNoteContent(content: string, filename: string): {
    title: string
    contentPreview: string
    createdDate: string
    updatedDate: string
    isPrivate: boolean
    tags: string[]
  } {
    const lines = content.split('\n')
    let title = filename.replace('.md', '')
    let isPrivate = false
    let tags: string[] = []
    let contentStart = 0

    // 解析前几行寻找元数据
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i].trim()
      
      if (line.startsWith('# ')) {
        title = line.substring(2).trim()
        contentStart = Math.max(contentStart, i + 1)
      } else if (line.toLowerCase().includes('private:') || line.toLowerCase().includes('私密:')) {
        isPrivate = line.toLowerCase().includes('true') || line.toLowerCase().includes('是')
        contentStart = Math.max(contentStart, i + 1)
      } else if (line.toLowerCase().includes('tags:') || line.toLowerCase().includes('标签:')) {
        const tagMatch = line.match(/(?:tags?|标签):\s*(.+)/i)
        if (tagMatch) {
          tags = tagMatch[1].split(/[,，\s]+/).map(tag => tag.trim()).filter(Boolean)
        }
        contentStart = Math.max(contentStart, i + 1)
      }
    }

    // 生成内容预览（前200字符）
    const mainContent = lines.slice(contentStart).join('\n').trim()
    const contentPreview = mainContent.substring(0, 200) + (mainContent.length > 200 ? '...' : '')

    const now = new Date().toISOString()

    return {
      title,
      contentPreview,
      createdDate: now,
      updatedDate: now,
      isPrivate,
      tags
    }
  }

  // 构建单个静态笔记
  private async buildStaticNote(file: GitHubFile): Promise<CompileResult> {
    try {
      console.log(`📝 处理笔记: ${file.name}`)
      
      const content = await this.fetchNoteContent(file)
      const parsed = this.parseNoteContent(content, file.name)

      // 跳过私密笔记
      if (parsed.isPrivate) {
        console.log(`🔒 跳过私密笔记: ${file.name}`)
        return { skipped: true, reason: '私密笔记' }
      }

      const staticNote: StaticNote = {
        id: file.sha,
        title: parsed.title,
        content: content,
        contentPreview: parsed.contentPreview,
        createdDate: parsed.createdDate,
        updatedDate: parsed.updatedDate,
        isPrivate: parsed.isPrivate,
        tags: parsed.tags,
        filename: file.name,
        compiledAt: new Date().toISOString(),
        sha: file.sha,
        path: file.path
      }

      // 保存单个笔记文件
      const noteFilePath = path.join(this.outputDir, `${file.name}.json`)
      const existingNote = fs.existsSync(noteFilePath) ? JSON.parse(fs.readFileSync(noteFilePath, 'utf-8')) as StaticNote : null

      if (existingNote && existingNote.sha === staticNote.sha) {
        console.log(`🔄 笔记 ${file.name} 未变化，跳过编译。`)
        return { skipped: true, reason: '未变化' }
      }

      fs.writeFileSync(noteFilePath, JSON.stringify(staticNote, null, 2))
      
      console.log(`✅ 已生成静态笔记: ${file.name}`)
      return { skipped: false, compiled: true, note: staticNote }

    } catch (error) {
      console.error(`❌ 处理笔记 ${file.name} 失败:`, error)
      return { skipped: false, reason: `编译失败: ${error instanceof Error ? error.message : String(error)}` }
    }
  }

  // 生成笔记索引
  private generateNotesIndex(notes: StaticNote[]): NotesIndex {
    const notesMap: NotesIndex['notes'] = {}
    
    notes.forEach(note => {
      notesMap[note.filename] = {
        id: note.id,
        title: note.title,
        contentPreview: note.contentPreview,
        createdDate: note.createdDate,
        updatedDate: note.updatedDate,
        tags: note.tags,
        sha: note.sha,
        path: note.path
      }
    })

    return {
      version: '1.0.0',
      compiledAt: new Date().toISOString(),
      totalNotes: notes.length,
      publicNotes: notes.length, // 只包含公开笔记
      notes: notesMap
    }
  }

  // 主构建方法
  async build(): Promise<void> {
    try {
      console.log('🔍 检查构建配置...')
      this.checkConfig()

      console.log('📁 准备输出目录...')
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true })
      }

      console.log('📥 获取 GitHub 笔记列表...')
      const files = await this.fetchNotesFromGitHub()

      console.log('🏗️ 开始构建静态笔记...')
      const staticNotes: StaticNote[] = []
      let compiledCount = 0
      let skippedCount = 0
      const startTime = Date.now()

      for (const file of files) {
        const compileResult = await this.buildStaticNote(file)
        if (compileResult.compiled) {
          staticNotes.push(compileResult.note!)
          compiledCount++
        } else if (compileResult.skipped) {
          skippedCount++
        }
      }

      const endTime = Date.now()
      const buildTime = (endTime - startTime) / 1000 + 's'

      console.log('📋 生成笔记索引...')
      const notesIndex = this.generateNotesIndex(staticNotes)
      notesIndex.lastBuildStats = {
        compiledNotes: compiledCount,
        skippedNotes: skippedCount,
        buildTime: buildTime
      }
      const indexPath = path.join(this.outputDir, 'index.json')
      fs.writeFileSync(indexPath, JSON.stringify(notesIndex, null, 2))

      console.log('🎉 静态笔记构建完成！')
      console.log(`📊 统计信息:`)
      console.log(`   总文件数: ${files.length}`)
      console.log(`   公开笔记: ${staticNotes.length}`)
      console.log(`   输出目录: ${this.outputDir}`)
      console.log(`   编译时间: ${buildTime}`)
      console.log(`   编译笔记: ${compiledCount}`)
      console.log(`   跳过笔记: ${skippedCount}`)

    } catch (error) {
      console.error('❌ 静态笔记构建失败:', error)
      throw error
    }
  }
}

export const staticNotesBuilder = new StaticNotesBuilder()