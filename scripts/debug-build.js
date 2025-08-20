#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔍 Cloudflare Pages 构建环境诊断')
console.log('=====================================')
console.log('')

// 检查 Node.js 版本
console.log('📦 Node.js 环境:')
console.log(`  版本: ${process.version}`)
console.log(`  平台: ${process.platform}`)
console.log(`  架构: ${process.arch}`)
console.log('')

// 检查当前工作目录
console.log('📁 工作目录:')
console.log(`  当前目录: ${process.cwd()}`)
console.log(`  脚本目录: ${__dirname}`)
console.log('')

// 检查环境变量
console.log('🔧 环境变量:')
console.log(`  NODE_ENV: ${process.env.NODE_ENV || '未设置'}`)
console.log(`  BUILD_VERSION: ${process.env.BUILD_VERSION || '未设置'}`)
console.log(`  CF_PAGES_URL: ${process.env.CF_PAGES_URL || '未设置'}`)
console.log(`  CF_PAGES_BRANCH: ${process.env.CF_PAGES_BRANCH || '未设置'}`)
console.log(`  CF_PAGES_COMMIT_SHA: ${process.env.CF_PAGES_COMMIT_SHA || '未设置'}`)
console.log('')

// 检查 R2 环境变量
console.log('☁️ R2 环境变量:')
console.log(`  VITE_R2_ACCOUNT_ID: ${process.env.VITE_R2_ACCOUNT_ID ? '已设置' : '未设置'}`)
console.log(`  VITE_R2_ACCESS_KEY_ID: ${process.env.VITE_R2_ACCESS_KEY_ID ? '已设置' : '未设置'}`)
console.log(`  VITE_R2_SECRET_ACCESS_KEY: ${process.env.VITE_R2_SECRET_ACCESS_KEY ? '已设置' : '未设置'}`)
console.log(`  VITE_R2_BUCKET_NAME: ${process.env.VITE_R2_BUCKET_NAME ? '已设置' : '未设置'}`)
console.log('')

// 检查文件系统
console.log('📂 文件系统:')
const projectRoot = path.resolve(__dirname, '..')
console.log(`  项目根目录: ${projectRoot}`)
console.log(`  项目根目录存在: ${fs.existsSync(projectRoot)}`)

const distDir = path.join(projectRoot, 'dist')
console.log(`  dist 目录: ${distDir}`)
console.log(`  dist 目录存在: ${fs.existsSync(distDir)}`)

if (fs.existsSync(distDir)) {
  const distFiles = fs.readdirSync(distDir)
  console.log(`  dist 目录内容: ${distFiles.join(', ')}`)
}
console.log('')

// 检查 package.json
const packageJsonPath = path.join(projectRoot, 'package.json')
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  console.log('📋 package.json:')
  console.log(`  名称: ${packageJson.name}`)
  console.log(`  版本: ${packageJson.version}`)
  console.log(`  类型: ${packageJson.type}`)
  console.log(`  构建脚本: ${packageJson.scripts['build:pages']}`)
} else {
  console.log('❌ package.json 不存在')
}
console.log('')

// 检查构建脚本
const buildScriptPath = path.join(projectRoot, 'scripts', 'build-pages.js')
console.log('📜 构建脚本:')
console.log(`  路径: ${buildScriptPath}`)
console.log(`  存在: ${fs.existsSync(buildScriptPath)}`)

if (fs.existsSync(buildScriptPath)) {
  const stats = fs.statSync(buildScriptPath)
  console.log(`  大小: ${stats.size} 字节`)
  console.log(`  修改时间: ${stats.mtime}`)
}
console.log('')

// 检查 .env 文件
const envPath = path.join(projectRoot, '.env')
console.log('🔐 .env 文件:')
console.log(`  路径: ${envPath}`)
console.log(`  存在: ${fs.existsSync(envPath)}`)

if (fs.existsSync(envPath)) {
  const stats = fs.statSync(envPath)
  console.log(`  大小: ${stats.size} 字节`)
  console.log(`  修改时间: ${stats.mtime}`)
}
console.log('')

console.log('✅ 诊断完成')
console.log('')
console.log('💡 如果 R2 环境变量未设置，请检查 Cloudflare Pages 的环境变量配置')
console.log('💡 如果构建脚本不存在，请检查 Git 提交是否包含最新代码')
