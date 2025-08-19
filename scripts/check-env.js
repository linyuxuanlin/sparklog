#!/usr/bin/env node

/**
 * 环境变量检查脚本
 * 帮助诊断 Cloudflare Pages 配置问题
 */

import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 检查环境变量
function checkEnvironmentVariables() {
  console.log('🔍 环境变量检查开始...\n')
  
  const requiredVars = [
    'VITE_R2_ACCOUNT_ID',
    'VITE_R2_ACCESS_KEY_ID', 
    'VITE_R2_SECRET_ACCESS_KEY',
    'VITE_R2_BUCKET_NAME',
    'VITE_ADMIN_PASSWORD'
  ]
  
  const optionalVars = [
    'VITE_R2_PUBLIC_URL',
    'VITE_ENABLE_CORS_PROXY',
    'VITE_CORS_PROXY_URL'
  ]
  
  let allRequiredConfigured = true
  
  console.log('📋 必需环境变量:')
  requiredVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      console.log(`  ✅ ${varName}: ${value.substring(0, 8)}...`)
    } else {
      console.log(`  ❌ ${varName}: 未配置`)
      allRequiredConfigured = false
    }
  })
  
  console.log('\n📋 可选环境变量:')
  optionalVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      console.log(`  ✅ ${varName}: ${value}`)
    } else {
      console.log(`  ⚠️  ${varName}: 未配置`)
    }
  })
  
  console.log('\n🔧 环境信息:')
  console.log(`  Node.js 版本: ${process.version}`)
  console.log(`  操作系统: ${process.platform}`)
  console.log(`  环境: ${process.env.NODE_ENV || 'development'}`)
  console.log(`  工作目录: ${process.cwd()}`)
  
  // 检查构建脚本
  console.log('\n📁 构建脚本检查:')
  const buildScriptPath = path.join(__dirname, '..', 'package.json')
  try {
    const packageJson = JSON.parse(require('fs').readFileSync(buildScriptPath, 'utf8'))
    const scripts = packageJson.scripts || {}
    
    if (scripts['build:pages']) {
      console.log('  ✅ build:pages 脚本已配置')
    } else {
      console.log('  ❌ build:pages 脚本未找到')
    }
    
    if (scripts['pre-build']) {
      console.log('  ✅ pre-build 脚本已配置')
    } else {
      console.log('  ❌ pre-build 脚本未找到')
    }
  } catch (error) {
    console.log('  ❌ 无法读取 package.json')
  }
  
  // 检查配置文件
  console.log('\n📁 配置文件检查:')
  const configFiles = [
    'wrangler.toml',
    'public/_headers',
    'public/_redirects',
    'scripts/build-pages.js'
  ]
  
  configFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file)
    try {
      require('fs').accessSync(filePath)
      console.log(`  ✅ ${file} 存在`)
    } catch (error) {
      console.log(`  ❌ ${file} 不存在`)
    }
  })
  
  // 总结
  console.log('\n📊 检查结果:')
  if (allRequiredConfigured) {
    console.log('  🎉 所有必需环境变量已配置！')
    console.log('  💡 建议: 运行 npm run build:pages 测试构建')
  } else {
    console.log('  ❌ 部分必需环境变量未配置')
    console.log('  💡 建议: 在 Cloudflare Pages 中设置缺失的环境变量')
  }
  
  // 提供解决建议
  if (!allRequiredConfigured) {
    console.log('\n🚨 配置问题解决建议:')
    console.log('1. 登录 Cloudflare Dashboard')
    console.log('2. 进入 Pages → 你的项目 → Settings → Environment variables')
    console.log('3. 添加缺失的环境变量')
    console.log('4. 重新部署项目')
    
    console.log('\n📚 详细配置说明请参考 README.md')
  }
  
  console.log('\n🔗 相关链接:')
  console.log('  - Cloudflare R2: https://dash.cloudflare.com/?to=/:account/r2')
  console.log('  - Cloudflare Pages: https://dash.cloudflare.com/?to=/:account/pages')
  console.log('  - 项目文档: https://github.com/linyuxuanlin/sparklog#readme')
}

// 主函数
function main() {
  try {
    checkEnvironmentVariables()
  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error.message)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { checkEnvironmentVariables }
