#!/usr/bin/env node

console.log('🔍 SparkLog 环境变量诊断工具')
console.log('================================')

console.log('\n📋 运行环境信息:')
console.log(`Node.js 版本: ${process.version}`)
console.log(`平台: ${process.platform}`)
console.log(`工作目录: ${process.cwd()}`)

console.log('\n🌍 关键环境变量:')
console.log(`CF_PAGES: ${process.env.CF_PAGES}`)
console.log(`NODE_ENV: ${process.env.NODE_ENV}`)

console.log('\n🔑 GitHub 配置环境变量:')
const githubVars = [
  'VITE_GITHUB_TOKEN',
  'GITHUB_TOKEN', 
  'VITE_REPO_OWNER',
  'VITE_GITHUB_OWNER',
  'REPO_OWNER',
  'GITHUB_OWNER',
  'VITE_REPO_NAME',
  'VITE_GITHUB_REPO',
  'REPO_NAME', 
  'GITHUB_REPO',
  'VITE_ADMIN_PASSWORD'
]

githubVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    // 对于敏感信息只显示前几个字符
    if (varName.includes('TOKEN') || varName.includes('PASSWORD')) {
      console.log(`${varName}: ${value.substring(0, 8)}...***`)
    } else {
      console.log(`${varName}: ${value}`)
    }
  } else {
    console.log(`${varName}: 未设置`)
  }
})

console.log('\n🔍 配置完整性检查:')

// 检查 GitHub Token
const githubToken = process.env.VITE_GITHUB_TOKEN || process.env.GITHUB_TOKEN
console.log(`GitHub Token: ${githubToken ? '✅ 已设置' : '❌ 未设置'}`)

// 检查仓库所有者
const repoOwner = process.env.VITE_REPO_OWNER || 
                  process.env.VITE_GITHUB_OWNER ||
                  process.env.REPO_OWNER ||
                  process.env.GITHUB_OWNER
console.log(`仓库所有者: ${repoOwner ? `✅ ${repoOwner}` : '❌ 未设置'}`)

// 检查仓库名称
const repoName = process.env.VITE_REPO_NAME || 
                 process.env.VITE_GITHUB_REPO ||
                 process.env.REPO_NAME ||
                 process.env.GITHUB_REPO
console.log(`仓库名称: ${repoName ? `✅ ${repoName}` : '❌ 未设置'}`)

// 检查管理员密码
const adminPassword = process.env.VITE_ADMIN_PASSWORD
console.log(`管理员密码: ${adminPassword ? '✅ 已设置' : '❌ 未设置'}`)

// 总体配置状态
const hasGitHubConfig = !!(githubToken && repoOwner && repoName)
const hasAdminPassword = !!adminPassword
const isFullyConfigured = hasGitHubConfig && hasAdminPassword

console.log('\n📊 配置状态总结:')
console.log(`GitHub 配置: ${hasGitHubConfig ? '✅ 完整' : '❌ 不完整'}`)
console.log(`管理员配置: ${hasAdminPassword ? '✅ 完整' : '❌ 不完整'}`)
console.log(`整体配置: ${isFullyConfigured ? '✅ 完整' : '❌ 不完整'}`)

if (!isFullyConfigured) {
  console.log('\n⚠️ 配置建议:')
  if (!hasGitHubConfig) {
    console.log('- 请在 Cloudflare Pages 环境变量中设置 GitHub 相关配置')
    console.log('  * VITE_GITHUB_TOKEN: GitHub 个人访问令牌')
    console.log('  * VITE_REPO_OWNER: GitHub 用户名')
    console.log('  * VITE_REPO_NAME: 笔记仓库名称')
  }
  if (!hasAdminPassword) {
    console.log('- 请在 Cloudflare Pages 环境变量中设置 VITE_ADMIN_PASSWORD')
  }
}

console.log('\n🔧 下一步操作:')
if (process.env.CF_PAGES === '1') {
  console.log('当前在 Cloudflare Pages 环境中')
  if (isFullyConfigured) {
    console.log('✅ 配置完整，可以尝试构建静态笔记')
  } else {
    console.log('⚠️ 配置不完整，将跳过静态笔记构建，使用运行时加载')
  }
} else {
  console.log('当前在本地开发环境中')
  console.log('请确保 .env 文件包含必要的配置项')
}

console.log('\n================================')