#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 SparkLog Cloudflare 部署构建脚本启动...')

async function main() {
  try {
    // 第一步：构建 React 应用
    console.log('📦 第一步：构建 React 应用...')
    execSync('npm run build', { stdio: 'inherit' })
    console.log('✅ React 应用构建完成')

    // 第二步：生成静态笔记（在 dist 目录创建后）
    console.log('📝 第二步：生成静态笔记...')
    execSync('npm run build:static-simple', { stdio: 'inherit' })
    console.log('✅ 静态笔记生成完成')

    // 第三步：验证文件
    const staticNotesDir = path.join(process.cwd(), 'dist/static-notes')
    if (fs.existsSync(staticNotesDir)) {
      const files = fs.readdirSync(staticNotesDir)
      console.log(`📁 静态笔记目录验证：找到 ${files.length} 个文件`)
      console.log('📋 文件列表:', files.slice(0, 5).join(', '), files.length > 5 ? '...' : '')
    } else {
      console.log('❌ 静态笔记目录不存在')
    }

    console.log('🎉 Cloudflare 构建完成！')
    
  } catch (error) {
    console.error('❌ 构建失败:', error.message)
    process.exit(1)
  }
}

main()
