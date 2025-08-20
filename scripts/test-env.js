#!/usr/bin/env node

/**
 * 测试环境变量和网络连接的脚本
 */

// 加载环境变量
import 'dotenv/config'

console.log('🧪 环境测试开始...')
console.log('时间:', new Date().toISOString())
console.log('Node.js版本:', process.version)
console.log('平台:', process.platform)
console.log('工作目录:', process.cwd())
console.log('')

// 测试环境变量
console.log('🔍 环境变量测试:')
const envVars = [
  'VITE_R2_ACCOUNT_ID',
  'VITE_R2_ACCESS_KEY_ID', 
  'VITE_R2_SECRET_ACCESS_KEY',
  'VITE_R2_BUCKET_NAME',
  'NODE_ENV',
  'BUILD_VERSION'
]

envVars.forEach(varName => {
  const value = process.env[varName]
  console.log(`  ${varName}:`, value ? '已设置' : '未设置')
})

console.log('')

// 测试网络连接
console.log('🌐 网络连接测试:')
const accountId = process.env.VITE_R2_ACCOUNT_ID

if (accountId) {
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`
  console.log(`测试端点: ${endpoint}`)
  
  // 简单的DNS解析测试
  import('dns').then(dns => {
    const { URL } = require('url')
    const parsedUrl = new URL(endpoint)
    
    dns.lookup(parsedUrl.hostname, (err, address) => {
      if (err) {
        console.log('❌ DNS解析失败:', err.message)
      } else {
        console.log('✅ DNS解析成功:', address)
      }
    })
  }).catch(err => {
    console.log('⚠️ DNS模块不可用:', err.message)
  })
} else {
  console.log('❌ 无法测试网络连接：VITE_R2_ACCOUNT_ID未设置')
}

console.log('')
console.log('🎯 测试完成')