import { NextRequest, NextResponse } from 'next/server'
import { getDefaultRepoConfig, getDefaultGitHubToken } from '@/lib/config'
import { GitHubService } from '@/lib/github'
import { parseNoteContent, decodeBase64Content } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isLoggedIn = searchParams.get('auth') === 'true'
    
    // 获取默认仓库配置
    const defaultConfig = getDefaultRepoConfig()
    if (!defaultConfig) {
      return NextResponse.json({ error: '未配置默认仓库' }, { status: 500 })
    }

    // 设置认证信息
    const authData = {
      username: defaultConfig.owner,
      repo: defaultConfig.repo,
      accessToken: getDefaultGitHubToken()
    }

    // 初始化GitHub服务
    const githubService = GitHubService.getInstance()
    githubService.setAuthData(authData)

    // 获取所有markdown文件列表
    const markdownFiles = await githubService.getNotesFiles()
    
    // 批量获取笔记内容（限制数量以提高性能）
    const limitedFiles = markdownFiles.slice(0, 20) // 只获取前20篇笔记
    const notes = []

    for (const file of limitedFiles) {
      try {
        const contentData = await githubService.getNoteContent(file)
        if (contentData) {
          const content = decodeBase64Content(contentData.content)
          const parsed = parseNoteContent(content, file.name)
          
          const note = {
            ...file,
            contentPreview: parsed.contentPreview,
            fullContent: content,
            createdDate: parsed.createdDate,
            updatedDate: parsed.updatedDate,
            isPrivate: parsed.isPrivate,
            tags: parsed.tags,
            created_at: parsed.createdDate || file.created_at,
            updated_at: parsed.updatedDate || file.updated_at
          }

          // 过滤私密笔记（如果用户未登录）
          if (!isLoggedIn && parsed.isPrivate) {
            continue
          }

          notes.push(note)
        }
      } catch (error) {
        console.error(`处理笔记失败: ${file.name}`, error)
        // 继续处理其他笔记
      }
    }

    return NextResponse.json({
      notes,
      hasMore: markdownFiles.length > 20,
      total: markdownFiles.length
    })

  } catch (error) {
    console.error('获取笔记列表失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    
    if (errorMessage.includes('API rate limit')) {
      return NextResponse.json(
        { error: 'GitHub API 访问限制，请稍后重试' },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { error: `获取笔记失败: ${errorMessage}` },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, tags = [], isPrivate = false } = body

    if (!title || !content) {
      return NextResponse.json({ error: '标题和内容不能为空' }, { status: 400 })
    }

    // 获取默认仓库配置
    const defaultConfig = getDefaultRepoConfig()
    if (!defaultConfig) {
      return NextResponse.json({ error: '未配置默认仓库' }, { status: 500 })
    }

    // 设置认证信息
    const authData = {
      username: defaultConfig.owner,
      repo: defaultConfig.repo,
      accessToken: getDefaultGitHubToken()
    }

    // 创建笔记内容
    const timestamp = new Date().toISOString()
    const fileName = `${timestamp.replace(/[:.]/g, '-').replace('T', '-').replace('Z', '')}.md`
    const filePath = `notes/${fileName}`
    
    const noteContent = `---
created_at: ${timestamp}
updated_at: ${timestamp}
private: ${isPrivate}
tags: [${tags.join(', ')}]
---

${content.trim()}
`

    // 调用GitHub API创建文件
    const apiUrl = `https://api.github.com/repos/${authData.username}/${authData.repo}/contents/${filePath}`
    
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${authData.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `创建笔记: ${fileName}`,
        content: btoa(unescape(encodeURIComponent(noteContent))),
        branch: 'main'
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`创建笔记失败: ${errorData.message || response.statusText}`)
    }

    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      note: {
        name: fileName,
        path: filePath,
        sha: result.content.sha,
        url: result.content.url
      }
    })

  } catch (error) {
    console.error('创建笔记失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    return NextResponse.json(
      { error: `创建笔记失败: ${errorMessage}` },
      { status: 500 }
    )
  }
}