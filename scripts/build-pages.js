#!/usr/bin/env node

/**
 * Cloudflare Pages 构建脚本
 * 从 R2 获取笔记并生成静态内容
 */

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

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error('❌ R2 环境变量未配置')
  process.exit(1)
}

// 初始化 S3 客户端（R2 兼容）
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

/**
 * 从 R2 获取所有笔记文件
 */
async function listNotes() {
  try {
    console.log('📋 正在从 R2 获取笔记列表...')
    
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: 'notes/',
      MaxKeys: 1000,
    })
    
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
    
    await generateStaticContent()
    
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
