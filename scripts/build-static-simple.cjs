#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// 添加 fetch polyfill 支持
if (!globalThis.fetch) {
  try {
    globalThis.fetch = require('node-fetch')
  } catch (e) {
    console.log('⚠️ node-fetch 未安装，使用内置 fetch API')
  }
}

// 简单的内容解析函数
function parseNoteContent(content, filename) {
  let title = filename.replace('.md', '')
  let contentPreview = ''
  let isPrivate = false
  let tags = []
  let createdDate = null
  let updatedDate = null

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
            tags = value.split(',').map(tag => tag.trim()).filter(Boolean)
            break
          case 'private':
            isPrivate = value.toLowerCase() === 'true'
            break
          case 'created':
          case 'created_at':
            createdDate = value
            break
          case 'updated':
          case 'updated_at':
            updatedDate = value
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
    createdDate,
    updatedDate
  }
}

// 主函数
async function main() {
  console.log('🔨 SparkLog 简化静态笔记构建脚本启动...')

  // 检查环境变量
  const owner = process.env.VITE_REPO_OWNER || process.env.VITE_GITHUB_OWNER || process.env.REPO_OWNER || process.env.GITHUB_OWNER
  const repo = process.env.VITE_REPO_NAME || process.env.VITE_GITHUB_REPO || process.env.REPO_NAME || process.env.GITHUB_REPO
  const token = process.env.VITE_GITHUB_TOKEN || process.env.GITHUB_TOKEN

  // 如果没有环境变量，使用测试模式
  const isTestMode = !owner || !repo || !token

  if (isTestMode) {
    console.log('🧪 测试模式：使用模拟配置')
    console.log('注意：这是测试模式，将生成示例静态笔记')
  } else {
    console.log('✅ 环境变量配置正确')
    console.log(`仓库: ${owner}/${repo}`)
  }

  // 创建输出目录
  const outputDir = path.resolve(process.cwd(), 'dist/static-notes')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // 生成静态笔记
  console.log('📝 生成静态笔记...')

  let notes = []

  if (isTestMode) {
    // 测试模式：生成示例笔记
    notes = [
      {
        name: 'welcome-to-sparklog.md',
        title: '欢迎使用 SparkLog',
        contentPreview: 'SparkLog 是一个现代化的笔记管理平台，支持 Markdown 格式和智能标签管理...',
        content: `# 欢迎使用 SparkLog

SparkLog 是一个现代化的笔记管理平台，支持 Markdown 格式和智能标签管理。

## 主要特性

- 📝 Markdown 支持
- 🏷️ 智能标签系统
- 🔒 私有笔记保护
- 📱 响应式设计
- 🚀 静态化优化

## 开始使用

1. 创建新笔记
2. 添加标签
3. 组织内容
4. 享受高效的笔记管理

---
created: 2024-01-01
tags: [介绍, 指南, 新手指南]
private: false`,
        tags: ['介绍', '指南', '新手指南'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        isPrivate: false
      },
      {
        name: 'markdown-guide.md',
        title: 'Markdown 使用指南',
        contentPreview: '学习如何使用 Markdown 语法来创建格式丰富的笔记内容...',
        content: `# Markdown 使用指南

学习如何使用 Markdown 语法来创建格式丰富的笔记内容。

## 基础语法

### 标题
使用 # 符号创建标题：
\`\`\`
# 一级标题
## 二级标题
### 三级标题
\`\`\`

### 列表
- 无序列表使用 - 或 *
- 有序列表使用数字

### 链接和图片
[链接文本](URL)
![图片描述](图片URL)

### 代码
\`行内代码\`
\`\`\`javascript
// 代码块
console.log('Hello World');
\`\`\`

---
created: 2024-01-02
tags: [教程, Markdown, 语法]
private: false`,
        tags: ['教程', 'Markdown', '语法'],
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        isPrivate: false
      },
      {
        name: 'productivity-tips.md',
        title: '提高生产力的笔记技巧',
        contentPreview: '分享一些实用的笔记技巧，帮助你更高效地管理和组织知识...',
        content: `# 提高生产力的笔记技巧

分享一些实用的笔记技巧，帮助你更高效地管理和组织知识。

## 组织原则

### 1. 标签系统
- 使用一致的标签命名
- 避免过多标签
- 定期整理和合并

### 2. 内容结构
- 使用清晰的标题层级
- 保持段落简洁
- 添加摘要和总结

### 3. 定期回顾
- 每周回顾笔记
- 更新过时信息
- 删除无用内容

## 工具推荐

- 📱 移动端同步
- 🔍 全文搜索
- 📊 标签统计
- 🔗 笔记关联

---
created: 2024-01-03
tags: [技巧, 生产力, 组织]
private: false`,
        tags: ['技巧', '生产力', '组织'],
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
        isPrivate: false
      }
    ]
  } else {
    // 生产模式：从 GitHub API 获取真实笔记
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

      // 获取每个文件的内容
      const notesPromises = markdownFiles.slice(0, 50).map(async (file) => { // 限制最多50个文件
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
          
          return {
            name: file.name,
            title: parsed.title,
            contentPreview: parsed.contentPreview,
            content: content,
            tags: parsed.tags,
            created_at: parsed.createdDate || file.created_at || new Date().toISOString(),
            updated_at: parsed.updatedDate || file.updated_at || new Date().toISOString(),
            isPrivate: parsed.isPrivate
          }
        } catch (error) {
          console.log(`❌ 处理文件 ${file.name} 失败:`, error.message)
          return null
        }
      })

      const noteResults = await Promise.all(notesPromises)
      notes = noteResults.filter(note => note !== null && !note.isPrivate) // 过滤掉私有笔记和失败的请求
      
      console.log(`✅ 成功处理 ${notes.length} 个公开笔记`)

    } catch (error) {
      console.log(`❌ 获取 GitHub 笔记失败: ${error.message}`)
      console.log('🔄 回退到测试模式...')
      
      // 回退到测试数据
      notes = [
        {
          name: 'fallback-note.md',
          title: '静态笔记构建失败',
          contentPreview: '由于 GitHub API 访问失败，这是一个回退笔记...',
          content: `# 静态笔记构建失败

由于 GitHub API 访问失败，当前显示的是回退内容。

## 可能的原因

1. GitHub Token 权限不足
2. 仓库不存在或无权访问
3. API 速率限制
4. 网络连接问题

## 解决方案

请检查 Cloudflare Pages 的环境变量配置。`,
          tags: ['错误', '回退'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          isPrivate: false
        }
      ]
    }
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
    buildMode: isTestMode ? 'test' : 'production'
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
  console.log(`🔧 构建模式: ${isTestMode ? '测试模式' : '生产模式'}`)
  console.log('🎉 构建完成！')
}

// 运行主函数
main().catch(error => {
  console.error('❌ 构建失败:', error)
  process.exit(1)
})