#!/usr/bin/env node

/**
 * Cloudflare Pages 环境变量诊断工具
 * 用于检查环境变量配置是否正确
 */

console.log('🔍 Cloudflare Pages 环境变量诊断工具')
console.log('=' .repeat(50))

// 1. 基本环境信息
console.log('\n📋 基本环境信息:')
console.log('Node.js 版本:', process.version)
console.log('平台:', process.platform)
console.log('架构:', process.arch)
console.log('当前工作目录:', process.cwd())

// 2. Cloudflare Pages 环境检查
console.log('\n☁️ Cloudflare Pages 环境检查:')
console.log('CF_PAGES:', process.env.CF_PAGES || '未设置')
console.log('NODE_ENV:', process.env.NODE_ENV || '未设置')
console.log('是否为 Cloudflare Pages 环境:', (process.env.CF_PAGES === '1') ? '是' : '否')

// 3. 检查所有 VITE_ 前缀的环境变量
console.log('\n🔧 VITE_ 环境变量检查:')
const viteVars = Object.keys(process.env).filter(key => key.startsWith('VITE_'))
if (viteVars.length === 0) {
  console.log('❌ 未找到任何 VITE_ 环境变量')
  console.log('💡 这可能是问题所在！')
} else {
  console.log(`✅ 找到 ${viteVars.length} 个 VITE_ 环境变量:`)
  viteVars.forEach(key => {
    const value = process.env[key]
    if (key.includes('TOKEN') || key.includes('PASSWORD')) {
      console.log(`   ${key}: ${value ? '***已设置***' : '未设置'}`)
    } else {
      console.log(`   ${key}: ${value || '未设置'}`)
    }
  })
}

// 4. 检查所需的环境变量
console.log('\n🎯 必需环境变量检查:')
const requiredVars = [
  'VITE_GITHUB_TOKEN',
  'VITE_REPO_OWNER', 
  'VITE_REPO_NAME',
  'VITE_ADMIN_PASSWORD'
]

let allConfigured = true
requiredVars.forEach(key => {
  const value = process.env[key]
  const configured = !!value
  allConfigured = allConfigured && configured
  
  if (key.includes('TOKEN') || key.includes('PASSWORD')) {
    console.log(`   ${configured ? '✅' : '❌'} ${key}: ${value ? '***已设置***' : '未设置'}`)
  } else {
    console.log(`   ${configured ? '✅' : '❌'} ${key}: ${value || '未设置'}`)
  }
})

// 5. 检查替代环境变量
console.log('\n🔄 替代环境变量检查:')
const alternatives = [
  'GITHUB_TOKEN',
  'REPO_OWNER',
  'REPO_NAME', 
  'GITHUB_OWNER',
  'GITHUB_REPO'
]

const foundAlternatives = alternatives.filter(key => process.env[key])
if (foundAlternatives.length > 0) {
  console.log('🔍 发现以下替代环境变量:')
  foundAlternatives.forEach(key => {
    const value = process.env[key]
    if (key.includes('TOKEN')) {
      console.log(`   ${key}: ${value ? '***已设置***' : '未设置'}`)
    } else {
      console.log(`   ${key}: ${value || '未设置'}`)
    }
  })
} else {
  console.log('❌ 未找到任何替代环境变量')
}

// 6. 总结和建议
console.log('\n📊 诊断结果:')
if (allConfigured) {
  console.log('✅ 所有必需环境变量已正确配置')
  console.log('✅ 静态笔记构建应该能正常工作')
} else {
  console.log('❌ 存在环境变量配置问题')
  
  if (process.env.CF_PAGES === '1') {
    console.log('\n💡 Cloudflare Pages 环境变量配置建议:')
    console.log('1. 登录 Cloudflare Dashboard')
    console.log('2. 进入 Pages -> 你的项目 -> Settings -> Environment variables')
    console.log('3. 确保设置了以下变量（Production 和 Preview 环境都要设置）:')
    requiredVars.forEach(key => {
      if (!process.env[key]) {
        console.log(`   - ${key}`)
      }
    })
    console.log('4. 保存后重新触发部署')
    console.log('5. 注意：环境变量名称必须完全匹配，区分大小写')
  } else {
    console.log('\n💡 本地开发环境建议:')
    console.log('1. 检查 .env 文件是否存在')
    console.log('2. 确保 .env 文件包含所有必需变量')
    console.log('3. 变量名必须以 VITE_ 开头')
  }
}

console.log('\n' + '='.repeat(50))
console.log('🔍 诊断完成')