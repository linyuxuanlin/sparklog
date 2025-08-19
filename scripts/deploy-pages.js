#!/usr/bin/env node

/**
 * Cloudflare Pages 部署脚本
 * 用于本地测试和部署到 Cloudflare Pages
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 检查必要的工具是否安装
 */
function checkPrerequisites() {
  try {
    // 检查 wrangler 是否安装
    execSync('wrangler --version', { stdio: 'pipe' })
    console.log('✅ Wrangler CLI 已安装')
  } catch (error) {
    console.error('❌ Wrangler CLI 未安装')
    console.log('请运行: npm install -g wrangler')
    process.exit(1)
  }
}

/**
 * 检查环境变量
 */
function checkEnvironmentVariables() {
  const requiredVars = [
    'VITE_R2_ACCOUNT_ID',
    'VITE_R2_ACCESS_KEY_ID',
    'VITE_R2_SECRET_ACCESS_KEY',
    'VITE_R2_BUCKET_NAME'
  ]
  
  const missingVars = requiredVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    console.error('❌ 缺少必要的环境变量:')
    missingVars.forEach(varName => console.error(`  - ${varName}`))
    console.log('\n请检查 .env 文件或设置环境变量')
    process.exit(1)
  }
  
  console.log('✅ 环境变量检查通过')
}

/**
 * 本地构建测试
 */
function localBuild() {
  try {
    console.log('🔨 开始本地构建测试...')
    
    // 运行构建脚本
    execSync('npm run build:pages', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    })
    
    // 检查输出文件
    const distDir = path.join(__dirname, '..', 'dist')
    const requiredFiles = ['public-notes.json', 'all-notes.json', 'build-info.json']
    
    for (const file of requiredFiles) {
      const filePath = path.join(distDir, file)
      if (!fs.existsSync(filePath)) {
        throw new Error(`构建输出文件缺失: ${file}`)
      }
    }
    
    console.log('✅ 本地构建测试通过')
    
  } catch (error) {
    console.error('❌ 本地构建测试失败:', error.message)
    process.exit(1)
  }
}

/**
 * 部署到 Cloudflare Pages
 */
function deployToPages(environment = 'production') {
  try {
    console.log(`🚀 开始部署到 ${environment} 环境...`)
    
    // 使用 wrangler 部署
    const deployCommand = `wrangler pages deploy dist --project-name=sparklog --env=${environment}`
    
    console.log(`执行命令: ${deployCommand}`)
    execSync(deployCommand, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    })
    
    console.log(`✅ 成功部署到 ${environment} 环境`)
    
  } catch (error) {
    console.error(`❌ 部署到 ${environment} 环境失败:`, error.message)
    process.exit(1)
  }
}

/**
 * 预览部署
 */
function previewDeployment() {
  try {
    console.log('👀 启动预览部署...')
    
    // 使用 wrangler 启动预览服务器
    execSync('wrangler pages dev dist --project-name=sparklog', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    })
    
  } catch (error) {
    console.error('❌ 预览部署失败:', error.message)
    process.exit(1)
  }
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
🌐 Cloudflare Pages 部署脚本

用法:
  node scripts/deploy-pages.js [命令]

命令:
  build     本地构建测试
  deploy    部署到生产环境
  staging   部署到测试环境
  preview   启动预览服务器
  help      显示此帮助信息

示例:
  node scripts/deploy-pages.js build
  node scripts/deploy-pages.js deploy
  node scripts/deploy-pages.js staging
  node scripts/deploy-pages.js preview
`)
}

/**
 * 主函数
 */
async function main() {
  const command = process.argv[2] || 'help'
  
  console.log('🚀 Cloudflare Pages 部署工具')
  console.log('========================')
  
  try {
    switch (command) {
      case 'build':
        checkPrerequisites()
        checkEnvironmentVariables()
        localBuild()
        break
        
      case 'deploy':
        checkPrerequisites()
        checkEnvironmentVariables()
        localBuild()
        deployToPages('production')
        break
        
      case 'staging':
        checkPrerequisites()
        checkEnvironmentVariables()
        localBuild()
        deployToPages('staging')
        break
        
      case 'preview':
        checkPrerequisites()
        checkEnvironmentVariables()
        localBuild()
        previewDeployment()
        break
        
      case 'help':
      default:
        showHelp()
        break
    }
  } catch (error) {
    console.error('❌ 执行失败:', error.message)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
