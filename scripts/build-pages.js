#!/usr/bin/env node

/**
 * Cloudflare Pages 构建脚本
 * 生成静态内容文件
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🚀 构建脚本开始执行...')
console.log('📁 当前目录:', process.cwd())
console.log('📁 脚本目录:', __dirname)

// 检查是否在 Cloudflare Pages 环境中
const isCloudflarePages = process.env.CF_PAGES === '1'
console.log('🌐 环境检测:', isCloudflarePages ? 'Cloudflare Pages' : '本地环境')

// 环境变量配置
const R2_ACCOUNT_ID = process.env.VITE_R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.VITE_R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.VITE_R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.VITE_R2_BUCKET_NAME

console.log('🔧 环境变量状态:')
console.log('  - R2_ACCOUNT_ID:', R2_ACCOUNT_ID ? '已配置' : '未配置')
console.log('  - R2_ACCESS_KEY_ID:', R2_ACCESS_KEY_ID ? '已配置' : '未配置')
console.log('  - R2_SECRET_ACCESS_KEY:', R2_SECRET_ACCESS_KEY ? '已配置' : '未配置')
console.log('  - R2_BUCKET_NAME:', R2_BUCKET_NAME ? '已配置' : '未配置')

/**
 * 生成空的静态内容文件
 */
function generateEmptyStaticContent() {
  try {
    console.log('📝 开始生成空的静态内容文件...')
    
    // 输出到 public 目录，这样 Vite 构建时会自动复制到 dist
    const outputDir = path.join(__dirname, '..', 'public')
    console.log('📁 输出目录:', outputDir)
    
    if (!fs.existsSync(outputDir)) {
      console.log('📁 创建输出目录...')
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // 生成空的笔记列表
    const emptyNotes = []
    
    const publicNotesPath = path.join(outputDir, 'public-notes.json')
    const allNotesPath = path.join(outputDir, 'all-notes.json')
    const buildInfoPath = path.join(outputDir, 'build-info.json')
    
    console.log('📄 写入 public-notes.json...')
    fs.writeFileSync(publicNotesPath, JSON.stringify(emptyNotes, null, 2))

    console.log('📄 写入 all-notes.json...')
    fs.writeFileSync(allNotesPath, JSON.stringify(emptyNotes, null, 2))

    // 生成构建信息
    const buildInfo = {
      buildTime: new Date().toISOString(),
      totalNotes: 0,
      publicNotes: 0,
      privateNotes: 0,
      source: 'Cloudflare Pages',
      environment: isCloudflarePages ? 'Cloudflare Pages' : 'Local',
      message: '这是 Cloudflare Pages 构建生成的静态内容文件。实际笔记内容需要通过 R2 存储获取。'
    }

    console.log('📄 写入 build-info.json...')
    fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2))

    console.log('✅ 已生成空的静态内容文件')
    console.log('📁 输出文件:')
    console.log('  - public-notes.json')
    console.log('  - all-notes.json')
    console.log('  - build-info.json')
    console.log('💡 注意：这些是空的占位文件，实际笔记内容需要通过 R2 存储获取')
    
    // 验证文件是否创建成功
    console.log('🔍 验证文件创建:')
    console.log('  - public-notes.json:', fs.existsSync(publicNotesPath) ? '✅ 已创建' : '❌ 创建失败')
    console.log('  - all-notes.json:', fs.existsSync(allNotesPath) ? '✅ 已创建' : '❌ 创建失败')
    console.log('  - build-info.json:', fs.existsSync(buildInfoPath) ? '✅ 已创建' : '❌ 创建失败')
    
  } catch (error) {
    console.error('❌ 生成空的静态内容文件失败:', error)
    process.exit(1)
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🌐 Cloudflare Pages 构建开始...')
    
    if (isCloudflarePages) {
      console.log('🏗️  检测到 Cloudflare Pages 环境')
      
      if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
        console.log('⚠️  R2 环境变量在 Cloudflare Pages 构建环境中不可用')
        console.log('📝 生成空的静态内容文件...')
        generateEmptyStaticContent()
      } else {
        console.log('✅ R2 环境变量已配置，但在此环境中跳过 R2 操作')
        console.log('📝 生成空的静态内容文件...')
        generateEmptyStaticContent()
      }
    } else {
      console.log('💻 本地开发环境')
      
      if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
        console.log('⚠️  R2 环境变量未配置，生成空的静态内容文件...')
        generateEmptyStaticContent()
      } else {
        console.log('✅ R2 环境变量已配置')
        console.log('📦 目标存储桶:', R2_BUCKET_NAME)
        console.log('📝 生成空的静态内容文件...')
        generateEmptyStaticContent()
      }
    }
    
    console.log('✅ 构建完成！')
  } catch (error) {
    console.error('❌ 构建失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

// 确保脚本总是执行
main()


