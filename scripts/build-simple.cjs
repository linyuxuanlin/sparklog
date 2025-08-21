#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 SparkLog 生产构建脚本启动...')

// 添加 fetch polyfill 支持
if (!globalThis.fetch) {
  try {
    globalThis.fetch = require('node-fetch')
  } catch (e) {
    console.log('⚠️ node-fetch 未安装，使用内置 fetch API')
  }
}

// 从文件名解析日期
function parseDateFromFilename(filename) {
  // 支持多种文件名格式：
  // 1. 2024-08-05-13-30-58.md
  // 2. 2024-08-05.md
  // 3. 2024-08-05-13-30.md
  // 4. 2024-08-05-13-30-45-123.md
  
  // 使用简单的字符串分割方法
  const parts = filename.replace('.md', '').split('-')
  
  if (parts.length >= 3) {
    const year = parseInt(parts[0])
    const month = parseInt(parts[1]) - 1 // JavaScript 月份从 0 开始
    const day = parseInt(parts[2])
    
    // 检查是否有时间部分
    let hour = 0, minute = 0, second = 0, millisecond = 0
    
    if (parts.length >= 5) {
      hour = parseInt(parts[3]) || 0
      minute = parseInt(parts[4]) || 0
    }
    
    if (parts.length >= 6) {
      second = parseInt(parts[5]) || 0
    }
    
    if (parts.length >= 7) {
      millisecond = parseInt(parts[6]) || 0
    }
    
    try {
      const date = new Date(year, month, day, hour, minute, second, millisecond)
      if (!isNaN(date.getTime())) {
        return date.toISOString()
      }
    } catch (e) {
      console.log(`⚠️ 解析日期失败: ${filename}`)
    }
  }
  
  // 如果无法从文件名解析，返回当前时间
  return new Date().toISOString()
}

// 简单的内容解析函数
function parseNoteContent(content, filename) {
  let title = filename.replace('.md', '')
  let contentPreview = ''
  let isPrivate = false
  let tags = []
  
  // 从文件名解析日期
  const filenameDate = parseDateFromFilename(filename)
  
  // 解析 frontmatter
  if (content.startsWith('---')) {
    const endIndex = content.indexOf('---', 3)
    if (endIndex > 0) {
      const frontmatter = content.substring(3, endIndex)
      const frontmatterLines = frontmatter.split('\n')
      
      for (const line of frontmatterLines) {
        const [key, ...valueParts] = line.split(':')
        const value = valueParts.join(':').trim()
        
        switch (key?.trim()) {
          case 'title':
            title = value
            break
          case 'tags':
            // 处理数组格式的标签: [tag1, tag2, tag3]
            if (value.startsWith('[') && value.endsWith(']')) {
              const tagString = value.slice(1, -1)
              tags = tagString.split(',').map(tag => tag.trim()).filter(Boolean)
            } else {
              tags = value.split(',').map(tag => tag.trim()).filter(Boolean)
            }
            break
          case 'private':
            isPrivate = value.toLowerCase() === 'true'
            break
        }
      }
    }
  }

  // 生成内容预览
  const contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---\n/, '')
  contentPreview = contentWithoutFrontmatter.substring(0, 200).replace(/\n/g, ' ').trim()

  return {
    title,
    contentPreview,
    isPrivate,
    tags,
    createdDate: filenameDate, // 使用文件名解析的日期
    updatedDate: filenameDate  // 使用文件名解析的日期
  }
}

// 从 GitHub API 获取真实笔记
async function generateRealNotes(owner, repo, token, outputDir) {
  try {
    console.log('🔍 从 GitHub 获取笔记列表...')
    
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/notes`
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SparkLog-Static-Builder'
      }
    })

    if (!response.ok) {
      throw new Error(`GitHub API 请求失败: ${response.status} ${response.statusText}`)
    }

    const files = await response.json()
    const markdownFiles = files.filter(file => 
      file.type === 'file' && 
      file.name.endsWith('.md') && 
      !file.name.startsWith('.')
    )

    console.log(`📁 发现 ${markdownFiles.length} 个 markdown 文件`)

    if (markdownFiles.length === 0) {
      console.log('⚠️ 未找到任何 markdown 笔记文件')
      return
    }

    // 获取每个文件的内容
    const notesPromises = markdownFiles.slice(0, 100).map(async (file) => { // 限制最多100个文件
      try {
        console.log(`🔍 获取文件内容: ${file.name}`)
        
        const contentResponse = await fetch(file.url, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        })

        if (!contentResponse.ok) {
          console.log(`⚠️ 获取文件 ${file.name} 失败: ${contentResponse.status}`)
          return null
        }

        const contentData = await contentResponse.json()
        const content = Buffer.from(contentData.content, 'base64').toString('utf-8')
        
        // 解析笔记内容
        const parsed = parseNoteContent(content, file.name)
        
        // 跳过私有笔记
        if (parsed.isPrivate) {
          console.log(`🔒 跳过私有笔记: ${file.name}`)
          return null
        }
        
        // 显示日期解析信息
        console.log(`📅 文件名: ${file.name} -> 解析日期: ${parsed.createdDate}`)
        
        return {
          name: file.name,
          title: parsed.title,
          contentPreview: parsed.contentPreview,
          content: content,
          tags: parsed.tags,
          created_at: parsed.createdDate, // 使用文件名解析的日期
          updated_at: parsed.updatedDate, // 使用文件名解析的日期
          isPrivate: parsed.isPrivate
        }
      } catch (error) {
        console.log(`❌ 处理文件 ${file.name} 失败:`, error.message)
        return null
      }
    })

    const noteResults = await Promise.all(notesPromises)
    const notes = noteResults.filter(note => note !== null)
    
    console.log(`✅ 成功处理 ${notes.length} 个公开笔记`)

    if (notes.length === 0) {
      console.log('⚠️ 没有找到可用的公开笔记')
      return
    }

    // 生成索引文件
    const notesIndex = {
      notes: notes.map(note => ({
        name: note.name,
        title: note.title,
        contentPreview: note.contentPreview,
        tags: note.tags,
        created_at: note.created_at,
        updated_at: note.updated_at,
        isPrivate: note.isPrivate,
        isStatic: true
      })),
      totalCount: notes.length,
      generatedAt: new Date().toISOString(),
      buildMode: 'production'
    }

    // 写入索引文件
    fs.writeFileSync(
      path.join(outputDir, 'index.json'),
      JSON.stringify(notesIndex, null, 2)
    )

    // 写入各个笔记文件
    notes.forEach(note => {
      const noteData = {
        name: note.name,
        title: note.title,
        contentPreview: note.contentPreview,
        content: note.content,
        tags: note.tags,
        created_at: note.created_at,
        updated_at: note.updated_at,
        isPrivate: note.isPrivate,
        isStatic: true
      }
      
      fs.writeFileSync(
        path.join(outputDir, `${note.name}.json`),
        JSON.stringify(noteData, null, 2)
      )
    })

    console.log(`✅ 成功生成 ${notes.length} 个静态笔记`)
    console.log(`📁 输出目录: ${outputDir}`)
    console.log('🎉 生产模式静态笔记构建完成！')

  } catch (error) {
    console.error(`❌ 获取 GitHub 笔记失败: ${error.message}`)
    
    if (error.message.includes('401 Unauthorized')) {
      console.log(`
🔑 GitHub API 认证失败可能的原因：
1. Token 权限不足 - 确保 Token 有仓库读取权限
2. Token 已过期 - 检查 Token 是否仍然有效
3. 仓库不存在或无权访问 - 确认仓库路径正确
4. Token 格式错误 - 确保 Token 以 'ghp_' 开头

💡 解决方案：
- 在 Cloudflare Pages 环境变量中重新设置有效的 GITHUB_TOKEN
- 确保 Token 具有对 ${owner}/${repo} 仓库的读取权限`)
    } else if (error.message.includes('403')) {
      console.log(`
⚠️ GitHub API 速率限制：
- 当前 API 调用次数可能已达到限制
- 稍后重试或使用具有更高限制的 Token`)
    } else if (error.message.includes('404')) {
      console.log(`
📁 仓库或路径不存在：
- 确认仓库 ${owner}/${repo} 存在
- 确认仓库中有 'notes' 目录
- 确认 Token 有权限访问该仓库`)
    }
    
    throw error
  }
}

// 主函数
async function main() {
  try {
    // 第一步：构建 React 应用
    console.log('📦 构建 React 应用...')
    execSync('npm run build', { stdio: 'inherit' })
    console.log('✅ React 应用构建完成')

    // 第二步：生成静态笔记
    console.log('📝 生成静态笔记...')
    
    // 检查环境变量
    const owner = process.env.VITE_REPO_OWNER || process.env.VITE_GITHUB_OWNER || process.env.REPO_OWNER || process.env.GITHUB_OWNER
    const repo = process.env.VITE_REPO_NAME || process.env.VITE_GITHUB_REPO || process.env.REPO_NAME || process.env.GITHUB_REPO
    const token = process.env.VITE_GITHUB_TOKEN || process.env.GITHUB_TOKEN

    console.log('🔍 检查环境变量...')
    console.log('REPO_OWNER:', owner ? '✅' : '❌')
    console.log('REPO_NAME:', repo ? '✅' : '❌')
    console.log('GITHUB_TOKEN:', token ? '✅' : '❌')

    if (!owner || !repo || !token) {
      console.log(`❌ 缺少必要的环境变量配置
请在 Cloudflare Pages 中设置以下环境变量：
- VITE_REPO_OWNER 或 REPO_OWNER: GitHub 仓库所有者
- VITE_REPO_NAME 或 REPO_NAME: GitHub 仓库名称  
- VITE_GITHUB_TOKEN 或 GITHUB_TOKEN: GitHub 访问令牌

当前状态：
- REPO_OWNER: ${owner ? '已设置' : '未设置'}
- REPO_NAME: ${repo ? '已设置' : '未设置'}
- GITHUB_TOKEN: ${token ? '已设置' : '未设置'}`)
      
      console.log('🔄 在本地环境中，将跳过静态笔记生成')
      console.log('⚠️ 这不会影响 Cloudflare Pages 的部署')
      return
    }

    console.log(`📋 仓库配置: ${owner}/${repo}`)
    
    const outputDir = path.resolve(process.cwd(), 'dist/static-notes')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // 从 GitHub API 获取真实笔记
    await generateRealNotes(owner, repo, token, outputDir)

  } catch (error) {
    console.error('❌ 构建失败:', error.message)
    process.exit(1)
  }
}

// 运行主函数
main().catch(error => {
  console.error('❌ 运行失败:', error)
  process.exit(1)
})
