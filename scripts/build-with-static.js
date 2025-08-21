#!/usr/bin/env node

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔨 SparkLog 智能构建脚本启动...')

// 检查是否在 Cloudflare Pages 环境中
const isCloudflarePages = process.env.CF_PAGES === '1' || process.env.NODE_ENV === 'production'
const hasGitHubConfig = process.env.VITE_GITHUB_TOKEN && process.env.VITE_REPO_OWNER && process.env.VITE_REPO_NAME

// 显示环境信息
console.log('🔍 环境检查:')
console.log('CF_PAGES:', process.env.CF_PAGES)
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('VITE_GITHUB_TOKEN:', process.env.VITE_GITHUB_TOKEN ? '***已设置***' : '未设置')
console.log('VITE_REPO_OWNER:', process.env.VITE_REPO_OWNER || '未设置')
console.log('VITE_REPO_NAME:', process.env.VITE_REPO_NAME || '未设置')
console.log('hasGitHubConfig:', hasGitHubConfig)

try {
  // 1. 构建静态笔记（仅在有GitHub配置时）
  if (hasGitHubConfig) {
    console.log('📝 第一步：构建静态笔记...')
    execSync('tsx src/build/index.ts', { stdio: 'inherit' })
  } else {
    console.log('⚠️ 缺少GitHub配置，跳过静态笔记构建')
    
    if (isCloudflarePages) {
      console.log('📝 Cloudflare Pages 部署提示：')
      console.log('   为启用完整笔记功能，请在 Cloudflare Pages 环境变量中设置：')
      console.log('   - VITE_GITHUB_TOKEN: 你的GitHub令牌')
      console.log('   - VITE_REPO_OWNER: 你的GitHub用户名')
      console.log('   - VITE_REPO_NAME: 你的笔记仓库名')
      console.log('   - VITE_ADMIN_PASSWORD: 管理员密码')
      console.log('   配置后重新部署即可获取完整的笔记内容。')
    }
    
    console.log('ℹ️ 将创建空的静态笔记目录...')
    
    // 创建空的静态笔记目录
    const staticNotesDir = path.resolve(process.cwd(), 'dist/static-notes')
    if (!fs.existsSync(staticNotesDir)) {
      fs.mkdirSync(staticNotesDir, { recursive: true })
    }
    
    // 创建空的索引文件
    const indexFile = path.join(staticNotesDir, 'index.json')
    fs.writeFileSync(indexFile, JSON.stringify({
      notes: [],
      totalCount: 0,
      lastUpdated: new Date().toISOString(),
      message: 'No GitHub configuration found - static notes disabled'
    }, null, 2))
    
    console.log('✅ 已创建空的静态笔记目录')
  }
  
  // 2. 检查静态笔记是否生成
  const staticNotesDir = path.resolve(process.cwd(), 'dist/static-notes')
  if (!fs.existsSync(staticNotesDir) || !fs.existsSync(path.join(staticNotesDir, 'index.json'))) {
    console.log('⚠️ 静态笔记构建失败，跳过后续步骤')
    process.exit(1)
  }
  
  // 3. 备份静态笔记文件
  console.log('💾 第二步：备份静态笔记文件...')
  const backupDir = path.resolve(process.cwd(), '.static-notes-backup')
  if (fs.existsSync(backupDir)) {
    fs.rmSync(backupDir, { recursive: true, force: true })
  }
  fs.cpSync(staticNotesDir, backupDir, { recursive: true })
  console.log('✅ 静态笔记已备份到 .static-notes-backup')
  
  // 4. 构建应用
  console.log('🏗️ 第三步：构建应用...')
  execSync('npm run build', { stdio: 'inherit' })
  
  // 5. 恢复静态笔记文件
  console.log('🔄 第四步：恢复静态笔记文件...')
  console.log('🔍 检查备份目录:', backupDir)
  console.log('🔍 备份目录存在:', fs.existsSync(backupDir))
  
  if (fs.existsSync(backupDir)) {
    console.log('🔍 备份目录内容:', fs.readdirSync(backupDir))
    
    // 清理可能被覆盖的目录
    if (fs.existsSync(staticNotesDir)) {
      console.log('🔍 清理现有静态笔记目录')
      fs.rmSync(staticNotesDir, { recursive: true, force: true })
    }
    
    // 恢复备份
    console.log('🔍 从备份恢复静态笔记...')
    fs.renameSync(backupDir, staticNotesDir)
    console.log('✅ 静态笔记文件已恢复')
  } else {
    console.log('⚠️ 备份目录不存在，无法恢复静态笔记')
  }
  
  // 同步到 public 目录（开发时需要，生产时也需要用于预览）
  console.log('🔄 同步静态笔记到 public 目录...')
  try {
    const publicDir = path.resolve(process.cwd(), 'public/static-notes')
    if (fs.existsSync(publicDir)) {
      fs.rmSync(publicDir, { recursive: true, force: true })
    }
    fs.cpSync(staticNotesDir, publicDir, { recursive: true })
    console.log('✅ 静态笔记已同步到 public 目录')
  } catch (error) {
    console.log('⚠️ 同步到 public 目录失败:', error.message)
  }
  
  console.log('🎉 智能构建完成！')
  console.log('📁 静态笔记位置：dist/static-notes/')
  console.log('📁 开发访问位置：public/static-notes/')
  console.log('🌐 应用构建位置：dist/')
  
} catch (error) {
  console.error('❌ 构建失败:', error.message)
  process.exit(1)
}
