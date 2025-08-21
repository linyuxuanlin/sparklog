#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 简单构建脚本启动...')

try {
  // 第一步：构建 React 应用
  console.log('📦 构建 React 应用...')
  execSync('npm run build', { stdio: 'inherit' })
  console.log('✅ React 应用构建完成')

  // 第二步：生成测试静态笔记
  console.log('📝 生成测试静态笔记...')
  
  const outputDir = path.resolve(process.cwd(), 'dist/static-notes')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // 生成测试笔记
  const testNote = {
    name: 'test-note.md',
    title: '测试笔记',
    contentPreview: '这是一个测试静态笔记...',
    content: '# 测试笔记\n\n这是一个测试静态笔记。',
    tags: ['测试'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    isPrivate: false,
    isStatic: true
  }

  // 写入索引文件
  const notesIndex = {
    notes: [testNote],
    totalCount: 1,
    generatedAt: new Date().toISOString(),
    buildMode: 'test'
  }

  fs.writeFileSync(
    path.join(outputDir, 'index.json'),
    JSON.stringify(notesIndex, null, 2)
  )

  // 写入笔记文件
  fs.writeFileSync(
    path.join(outputDir, 'test-note.md.json'),
    JSON.stringify(testNote, null, 2)
  )

  console.log('✅ 测试静态笔记生成完成')
  console.log(`📁 输出目录: ${outputDir}`)

} catch (error) {
  console.error('❌ 构建失败:', error.message)
  process.exit(1)
}
