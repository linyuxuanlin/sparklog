#!/usr/bin/env node

import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🧪 测试 Cloudflare Pages 环境变量缺失的情况')
console.log('===============================================')
console.log('')

// 创建新的环境变量对象，不包含 R2 相关变量
const testEnv = {
  ...process.env,
  CF_PAGES_URL: 'https://test.example.com',
  CF_PAGES_BRANCH: 'main',
  CF_PAGES_COMMIT_SHA: 'test-commit-sha',
  NODE_ENV: 'production',
  BUILD_VERSION: '1.0.0'
}

// 确保 R2 环境变量被清除
delete testEnv.VITE_R2_ACCOUNT_ID
delete testEnv.VITE_R2_ACCESS_KEY_ID
delete testEnv.VITE_R2_SECRET_ACCESS_KEY
delete testEnv.VITE_R2_BUCKET_NAME

console.log('🔧 环境变量设置:')
console.log('  CF_PAGES_URL:', testEnv.CF_PAGES_URL)
console.log('  CF_PAGES_BRANCH:', testEnv.CF_PAGES_BRANCH)
console.log('  CF_PAGES_COMMIT_SHA:', testEnv.CF_PAGES_COMMIT_SHA)
console.log('  VITE_R2_ACCOUNT_ID:', testEnv.VITE_R2_ACCOUNT_ID || '未设置')
console.log('  VITE_R2_ACCESS_KEY_ID:', testEnv.VITE_R2_ACCESS_KEY_ID || '未设置')
console.log('  VITE_R2_SECRET_ACCESS_KEY:', testEnv.VITE_R2_SECRET_ACCESS_KEY || '未设置')
console.log('  VITE_R2_BUCKET_NAME:', testEnv.VITE_R2_BUCKET_NAME || '未设置')
console.log('')

console.log('🚀 运行构建脚本...')
console.log('')

// 运行构建脚本
const buildScriptPath = path.join(__dirname, 'build-pages.js')
const child = spawn('node', [buildScriptPath], {
  stdio: 'inherit',
  env: testEnv
})

child.on('close', (code) => {
  console.log('')
  console.log(`📊 构建脚本退出码: ${code}`)
  
  if (code === 0) {
    console.log('✅ 测试成功：脚本在环境变量缺失时优雅退出')
    console.log('💡 这意味着在 Cloudflare Pages 上构建不会失败')
  } else {
    console.log('❌ 测试失败：脚本在环境变量缺失时异常退出')
    console.log('💡 这可能导致 Cloudflare Pages 构建失败')
  }
})
