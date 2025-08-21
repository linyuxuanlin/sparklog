#!/usr/bin/env node

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔨 SparkLog 智能构建脚本启动...')

// 环境检测
function detectEnvironment() {
  const isCloudflarePages = process.env.CF_PAGES === '1'
  const isProduction = process.env.NODE_ENV === 'production'
  
  // 支持多种环境变量格式，适配 Cloudflare Pages
  const githubToken = process.env.VITE_GITHUB_TOKEN || 
                      process.env.GITHUB_TOKEN
  const repoOwner = process.env.VITE_REPO_OWNER || 
                    process.env.VITE_GITHUB_OWNER ||
                    process.env.REPO_OWNER ||
                    process.env.GITHUB_OWNER
  const repoName = process.env.VITE_REPO_NAME || 
                   process.env.VITE_GITHUB_REPO ||
                   process.env.REPO_NAME ||
                   process.env.GITHUB_REPO
  
  const hasGitHubConfig = !!(githubToken && repoOwner && repoName)
  
  console.log('🔍 环境检测:')
  console.log(`   Cloudflare Pages: ${isCloudflarePages}`)
  console.log(`   生产环境: ${isProduction}`)
  console.log(`   GitHub配置完整: ${hasGitHubConfig}`)
  console.log('🔍 环境变量详情:')
  console.log(`   GitHub Token: ${githubToken ? '已设置' : '未设置'}`)
  console.log(`   仓库所有者: ${repoOwner || '未设置'}`)
  console.log(`   仓库名称: ${repoName || '未设置'}`)
  
  return { isCloudflarePages, isProduction, hasGitHubConfig }
}

// 执行静态笔记构建
function buildStaticNotes() {
  console.log('📝 第一步：构建静态笔记...')
  
  const { isCloudflarePages, hasGitHubConfig } = detectEnvironment()
  
  // 在Cloudflare Pages环境中且缺少GitHub配置时，跳过构建
  if (isCloudflarePages && !hasGitHubConfig) {
    console.log('☁️ Cloudflare Pages环境：GitHub配置不完整，跳过静态笔记构建')
    console.log('🔍 执行环境变量诊断...')
    
    // 执行环境变量诊断
    try {
      execSync('node scripts/env-check.js', { stdio: 'inherit' })
    } catch (error) {
      console.log('⚠️ 环境变量诊断失败:', error.message)
    }
    
    createEmptyStaticNotes()
    return
  }
  
  try {
    // 使用绝对路径执行tsx命令
    const buildScriptPath = path.resolve(process.cwd(), 'src/build/index.ts')
    console.log(`🔍 构建脚本路径: ${buildScriptPath}`)
    
    // 检查文件是否存在
    if (!fs.existsSync(buildScriptPath)) {
      throw new Error(`构建脚本不存在: ${buildScriptPath}`)
    }
    
    // 使用npx tsx执行，确保在容器环境中能正确解析
    const command = `npx tsx "${buildScriptPath}"`
    console.log(`🔍 执行命令: ${command}`)
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env }
    })
    
  } catch (error) {
    console.error('❌ 静态笔记构建失败:', error.message)
    
    // 在Cloudflare Pages环境中，如果构建失败则创建空目录
    if (isCloudflarePages) {
      console.log('☁️ Cloudflare Pages环境：创建空静态笔记目录作为降级处理')
      createEmptyStaticNotes()
    } else {
      throw error
    }
  }
}

// 创建空的静态笔记目录
function createEmptyStaticNotes() {
  try {
    const staticNotesDir = path.resolve(process.cwd(), 'dist/static-notes')
    
    // 确保目录存在
    fs.mkdirSync(staticNotesDir, { recursive: true })
    
    // 创建空的index.json文件
    const emptyIndex = {
      notes: [],
      totalCount: 0,
      lastUpdated: new Date().toISOString(),
      buildInfo: {
        environment: 'cloudflare-pages',
        message: '静态笔记构建已跳过，应用将在运行时动态加载笔记'
      }
    }
    
    fs.writeFileSync(
      path.join(staticNotesDir, 'index.json'),
      JSON.stringify(emptyIndex, null, 2)
    )
    
    console.log('✅ 已创建空的静态笔记目录')
    
  } catch (error) {
    console.error('❌ 创建空静态笔记目录失败:', error.message)
    throw error
  }
}
  
try {
  // 1. 构建静态笔记
  buildStaticNotes()
  
  // 2. 检查静态笔记是否生成
  const staticNotesDir = path.resolve(process.cwd(), 'dist/static-notes')
  if (!fs.existsSync(staticNotesDir)) {
    console.log('⚠️ 静态笔记目录不存在，创建空目录')
    createEmptyStaticNotes()
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
  
  const { isCloudflarePages } = detectEnvironment()
  
  // 在Cloudflare Pages环境中，尝试优雅降级
  if (isCloudflarePages) {
    console.log('☁️ Cloudflare Pages环境：尝试降级构建...')
    
    try {
      // 确保静态笔记目录存在
      createEmptyStaticNotes()
      
      // 只构建应用，跳过静态笔记
      console.log('🏗️ 降级模式：只构建应用...')
      execSync('npm run build', { stdio: 'inherit' })
      
      console.log('🎉 降级构建完成！')
      console.log('📁 应用构建位置：dist/')
      console.log('⚠️ 注意：静态笔记功能将在运行时动态加载')
      
    } catch (fallbackError) {
      console.error('❌ 降级构建也失败了:', fallbackError.message)
      console.log('\n🔍 调试信息:')
      console.log('   工作目录:', process.cwd())
      console.log('   Node版本:', process.version)
      console.log('   环境变量检查:')
      console.log('   - CF_PAGES:', process.env.CF_PAGES)
      console.log('   - NODE_ENV:', process.env.NODE_ENV)
      console.log('   - VITE_GITHUB_TOKEN:', process.env.VITE_GITHUB_TOKEN ? '已设置' : '未设置')
      process.exit(1)
    }
  } else {
    // 本地环境直接失败
    process.exit(1)
  }
}
