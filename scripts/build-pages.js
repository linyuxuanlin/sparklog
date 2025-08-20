#!/usr/bin/env node

/**
 * Cloudflare Pages 构建脚本
 * 从 R2 获取笔记并生成静态内容
 */

// 检测是否在 Cloudflare Pages 环境中
const isCloudflarePages = process.env.CF_PAGES_URL || process.env.CF_PAGES_BRANCH || process.env.CF_PAGES_COMMIT_SHA

// 只在本地开发环境中加载 .env 文件
if (!isCloudflarePages) {
  import('dotenv/config')
}

import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 环境变量配置
const R2_ACCOUNT_ID = process.env.VITE_R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.VITE_R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.VITE_R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.VITE_R2_BUCKET_NAME

console.log('🔍 环境变量检查:')
console.log('  VITE_R2_ACCOUNT_ID:', R2_ACCOUNT_ID ? '已设置' : '未设置')
console.log('  VITE_R2_ACCESS_KEY_ID:', R2_ACCESS_KEY_ID ? '已设置' : '未设置')
console.log('  VITE_R2_SECRET_ACCESS_KEY:', R2_SECRET_ACCESS_KEY ? '已设置' : '未设置')
console.log('  VITE_R2_BUCKET_NAME:', R2_BUCKET_NAME ? '已设置' : '未设置')
console.log('  环境:', isCloudflarePages ? 'Cloudflare Pages' : '本地开发')
console.log('')

// 检查环境变量
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  if (isCloudflarePages) {
    console.error('❌ Cloudflare Pages 环境中 R2 环境变量未配置')
    console.error('请在 Cloudflare Pages 控制台中设置以下环境变量:')
    console.error('  - VITE_R2_ACCOUNT_ID')
    console.error('  - VITE_R2_ACCESS_KEY_ID')
    console.error('  - VITE_R2_SECRET_ACCESS_KEY')
    console.error('  - VITE_R2_BUCKET_NAME')
    console.error('')
    console.error('设置步骤:')
    console.error('1. 登录 Cloudflare Dashboard')
    console.error('2. 进入 Pages 项目设置')
    console.error('3. 在 "Environment variables" 部分添加上述变量')
    console.error('4. 重新部署项目')
    console.error('')
    console.error('⚠️  由于环境变量缺失，将跳过静态内容生成')
    console.error('⚠️  网站将无法加载笔记内容')
    
    // 在 Cloudflare Pages 环境中，即使失败也要继续构建
    // 这样可以避免整个构建失败
    process.exit(0)
  } else {
    console.error('❌ R2 环境变量未配置')
    console.error('请确保以下环境变量已设置:')
    console.error('  - VITE_R2_ACCOUNT_ID')
    console.error('  - VITE_R2_ACCESS_KEY_ID')
    console.error('  - VITE_R2_SECRET_ACCESS_KEY')
    console.error('  - VITE_R2_BUCKET_NAME')
    process.exit(1)
  }
}

// 初始化 S3 客户端（R2 兼容）
console.log('🚀 初始化 S3 客户端...')
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})
console.log('✅ S3 客户端初始化完成')

/**
 * 从 R2 获取所有笔记文件
 */
async function listNotes() {
  try {
    console.log('📋 正在从 R2 获取笔记列表...')
    console.log(`🔗 连接端点: https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`)
    console.log(`📦 存储桶: ${R2_BUCKET_NAME}`)
    
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: 'notes/',
      MaxKeys: 1000,
    })
    
    console.log('📡 发送 R2 请求...')
    const response = await s3Client.send(command)
    const files = response.Contents || []
    
    // 过滤出 .md 文件
    const markdownFiles = files.filter(file => 
      file.Key && file.Key.endsWith('.md')
    )
    
    console.log(`✅ 找到 ${markdownFiles.length} 个笔记文件`)
    return markdownFiles
  } catch (error) {
    console.error('❌ 获取笔记列表失败:', error)
    throw error
  }
}

/**
 * 获取文件内容
 */
async function getFileContent(key) {
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
    
    const response = await s3Client.send(command)
    const content = await response.Body.transformToString()
    return content
  } catch (error) {
    console.error(`❌ 获取文件内容失败: ${key}`, error)
    return null
  }
}



/**
 * 解析笔记内容
 */
function parseNoteContent(content, filename) {
  const lines = content.split('\n')
  let inFrontmatter = false
  let frontmatterEndIndex = -1
  let title = filename.replace('.md', '')
  let createdDate = new Date().toISOString()
  let isPrivate = false
  let tags = []
  let contentStart = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    if (line === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true
        contentStart = i + 1
      } else {
        frontmatterEndIndex = i
        break
      }
    } else if (inFrontmatter && line.startsWith('title:')) {
      title = line.replace('title:', '').trim()
    } else if (inFrontmatter && line.startsWith('date:') || line.startsWith('createdDate:')) {
      const dateStr = line.split(':')[1].trim()
      if (dateStr) {
        createdDate = new Date(dateStr).toISOString()
      }
    } else if (inFrontmatter && line.startsWith('private:')) {
      isPrivate = line.split(':')[1].trim() === 'true'
    } else if (inFrontmatter && line.startsWith('tags:')) {
      const tagsStr = line.split(':')[1].trim()
      if (tagsStr) {
        tags = tagsStr.split(',').map(tag => tag.trim())
      }
    }
  }
  
  // 提取内容（跳过 frontmatter）
  const markdownContent = lines.slice(frontmatterEndIndex + 1).join('\n')
  
  // 生成摘要
  const plainText = markdownContent
    .replace(/[#*`]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
  
  const excerpt = plainText.length > 150 
    ? plainText.substring(0, 150) + '...' 
    : plainText
  
  return {
    title,
    content: markdownContent,
    excerpt,
    createdDate,
    isPrivate,
    tags,
  }
}

/**
 * 生成静态内容文件
 */
async function generateStaticContent() {
  try {
    console.log('🚀 开始生成静态内容...')
    
    // 获取所有笔记
    const files = await listNotes()
    
    if (files.length === 0) {
      console.log('⚠️ 没有找到笔记文件')
      // 创建空的静态内容文件
      const emptyNotes = []
      const outputDir = path.join(__dirname, '..', 'dist')
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }
      
      fs.writeFileSync(
        path.join(outputDir, 'public-notes.json'),
        JSON.stringify(emptyNotes, null, 2)
      )
      
      fs.writeFileSync(
        path.join(outputDir, 'all-notes.json'),
        JSON.stringify(emptyNotes, null, 2)
      )
      
      console.log('📝 已创建空的静态内容文件')
      return
    }
    
    const allNotes = []
    const publicNotes = []
    
    // 处理每个文件
    for (const file of files) {
      console.log(`📝 处理文件: ${file.Key}`)
      
      const content = await getFileContent(file.Key)
      if (!content) continue
      
      const parsed = parseNoteContent(content, file.Key.split('/').pop())
      
      const note = {
        id: file.Key.replace('notes/', '').replace('.md', ''),
        filename: file.Key.split('/').pop(),
        title: parsed.title,
        content: parsed.content,
        excerpt: parsed.excerpt,
        createdDate: parsed.createdDate,
        updatedDate: file.LastModified || new Date().toISOString(),
        isPrivate: parsed.isPrivate,
        tags: parsed.tags,
        size: file.Size || 0,
        etag: file.ETag?.replace(/"/g, '') || '',
      }
      
      allNotes.push(note)
      
      if (!note.isPrivate) {
        publicNotes.push(note)
      }
      
      // 添加延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // 按时间排序（新到旧）
    allNotes.sort((a, b) => new Date(b.updatedDate) - new Date(a.updatedDate))
    publicNotes.sort((a, b) => new Date(b.updatedDate) - new Date(a.updatedDate))
    
    console.log(`✅ 成功处理 ${allNotes.length} 个笔记，其中 ${publicNotes.length} 个为公开笔记`)
    
    // 确保输出目录存在
    const outputDir = path.join(__dirname, '..', 'dist')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    // 写入静态内容文件
    fs.writeFileSync(
      path.join(outputDir, 'public-notes.json'),
      JSON.stringify(publicNotes, null, 2)
    )
    
    fs.writeFileSync(
      path.join(outputDir, 'all-notes.json'),
      JSON.stringify(allNotes, null, 2)
    )
    
    // 生成构建信息
    const buildInfo = {
      buildTime: new Date().toISOString(),
      totalNotes: allNotes.length,
      publicNotes: publicNotes.length,
      privateNotes: allNotes.length - publicNotes.length,
      source: 'R2 Storage',
      environment: process.env.NODE_ENV || 'production',
      buildVersion: process.env.BUILD_VERSION || '1.0.0',
    }
    
    fs.writeFileSync(
      path.join(outputDir, 'build-info.json'),
      JSON.stringify(buildInfo, null, 2)
    )
    
    console.log('🎉 静态内容生成完成！')
    console.log('📁 输出文件:')
    console.log('  - public-notes.json')
    console.log('  - all-notes.json')
    console.log('  - build-info.json')
    console.log(`📊 构建统计:`)
    console.log(`  - 总笔记数: ${allNotes.length}`)
    console.log(`  - 公开笔记: ${publicNotes.length}`)
    console.log(`  - 私密笔记: ${allNotes.length - publicNotes.length}`)
    
  } catch (error) {
    console.error('❌ 生成静态内容失败:', error)
    process.exit(1)
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🌐 Cloudflare Pages 构建开始...')
    console.log(`📦 目标存储桶: ${R2_BUCKET_NAME}`)
    console.log(`🔧 环境: ${process.env.NODE_ENV || 'production'}`)
    console.log(`📅 构建时间: ${new Date().toISOString()}`)
    
    await generateStaticContent()
    
    console.log('✅ 构建完成！')
  } catch (error) {
    console.error('❌ 构建失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
// 修复路径比较逻辑，支持 Windows 和 Unix 路径
const scriptUrl = new URL(import.meta.url)
const scriptPath = scriptUrl.pathname.replace(/^\//, '') // 移除开头的斜杠
const argvPath = process.argv[1].replace(/\\/g, '/') // 将反斜杠转换为正斜杠

if (scriptPath === argvPath) {
  main()
}
