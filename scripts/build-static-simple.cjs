#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

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

// 生成测试笔记
console.log('📝 生成静态笔记...')

const testNotes = [
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

// 生成索引文件
const notesIndex = {
  notes: testNotes.map(note => ({
    name: note.name,
    title: note.title,
    contentPreview: note.contentPreview,
    tags: note.tags,
    created_at: note.created_at,
    updated_at: note.updated_at,
    isPrivate: note.isPrivate,
    isStatic: true
  })),
  totalCount: testNotes.length,
  generatedAt: new Date().toISOString(),
  buildMode: isTestMode ? 'test' : 'production'
}

// 写入索引文件
fs.writeFileSync(
  path.join(outputDir, 'index.json'),
  JSON.stringify(notesIndex, null, 2)
)

// 写入各个笔记文件
testNotes.forEach(note => {
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

console.log(`✅ 成功生成 ${testNotes.length} 个静态笔记`)
console.log(`📁 输出目录: ${outputDir}`)
console.log(`🔧 构建模式: ${isTestMode ? '测试模式' : '生产模式'}`)
console.log('🎉 构建完成！')
