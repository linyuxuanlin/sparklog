#!/usr/bin/env node

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔄 SparkLog 静态笔记同步脚本启动...')

try {
  const distDir = path.resolve(process.cwd(), 'dist/static-notes')
  const publicDir = path.resolve(process.cwd(), 'public/static-notes')
  
  // 检查源目录是否存在
  if (!fs.existsSync(distDir)) {
    console.log('⚠️ 源目录不存在，跳过同步:', distDir)
    process.exit(0)
  }
  
  // 清理目标目录
  if (fs.existsSync(publicDir)) {
    console.log('🧹 清理目标目录:', publicDir)
    fs.rmSync(publicDir, { recursive: true, force: true })
  }
  
  // 复制文件
  console.log('📋 同步静态笔记文件...')
  fs.cpSync(distDir, publicDir, { recursive: true })
  
  // 统计文件数量
  const files = fs.readdirSync(publicDir)
  const jsonFiles = files.filter(file => file.endsWith('.json'))
  
  console.log('✅ 同步完成！')
  console.log(`📊 同步文件数量: ${jsonFiles.length}`)
  console.log(`📁 目标目录: ${publicDir}`)
  
} catch (error) {
  console.error('❌ 同步失败:', error.message)
  process.exit(1)
}
