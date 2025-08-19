#!/usr/bin/env node

/**
 * SparkLog 配置检查脚本
 * 检查环境变量配置的完整性和正确性
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 必需的环境变量
const REQUIRED_ENV_VARS = [
  'VITE_REPO_OWNER',
  'VITE_REPO_NAME',
  'VITE_GITHUB_TOKEN',
  'VITE_ADMIN_PASSWORD',
  'VITE_R2_ACCOUNT_ID',
  'VITE_R2_ACCESS_KEY_ID',
  'VITE_R2_SECRET_ACCESS_KEY',
  'VITE_R2_BUCKET_NAME'
]

// 可选的环境变量
const OPTIONAL_ENV_VARS = [
  'VITE_R2_PUBLIC_URL',
  'VITE_STATIC_BRANCH',
  'VITE_APP_TITLE',
  'VITE_APP_DESCRIPTION',
  'VITE_DEFAULT_THEME'
]

// 环境变量验证规则
const VALIDATION_RULES = {
  'VITE_GITHUB_TOKEN': {
    pattern: /^ghp_[a-zA-Z0-9]{36}$/,
    message: 'GitHub Token 格式不正确，应该以 ghp_ 开头，长度为 40 个字符'
  },
  'VITE_ADMIN_PASSWORD': {
    minLength: 12,
    message: '管理员密码至少需要 12 个字符'
  },
  'VITE_R2_ACCOUNT_ID': {
    pattern: /^[a-f0-9]{32}$/,
    message: 'R2 Account ID 应该是 32 位十六进制字符串'
  },
  'VITE_R2_ACCESS_KEY_ID': {
    minLength: 20,
    message: 'R2 Access Key ID 至少需要 20 个字符'
  },
  'VITE_R2_SECRET_ACCESS_KEY': {
    minLength: 20,
    message: 'R2 Secret Access Key 至少需要 20 个字符'
  }
}

class ConfigChecker {
  constructor() {
    this.envVars = {}
    this.errors = []
    this.warnings = []
  }

  // 加载环境变量
  async loadEnvVars() {
    try {
      // 尝试加载 .env 文件
      const envFiles = ['.env', '.env.local', '.env.development']
      
      for (const file of envFiles) {
        try {
          const envPath = path.join(__dirname, '..', file)
          const content = await fs.readFile(envPath, 'utf-8')
          
          content.split('\n').forEach(line => {
            const trimmed = line.trim()
            if (trimmed && !trimmed.startsWith('#')) {
              const [key, ...valueParts] = trimmed.split('=')
              if (key && valueParts.length > 0) {
                this.envVars[key] = valueParts.join('=').replace(/^["']|["']$/g, '')
              }
            }
          })
          
          console.log(`✅ 已加载 ${file} 文件`)
        } catch (error) {
          if (error.code !== 'ENOENT') {
            console.warn(`⚠️  读取 ${file} 文件失败:`, error.message)
          }
        }
      }

      // 加载系统环境变量
      Object.keys(process.env).forEach(key => {
        if (key.startsWith('VITE_')) {
          this.envVars[key] = process.env[key]
        }
      })

    } catch (error) {
      console.error('❌ 加载环境变量失败:', error.message)
    }
  }

  // 检查必需的环境变量
  checkRequiredVars() {
    console.log('\n🔍 检查必需的环境变量...')
    
    REQUIRED_ENV_VARS.forEach(key => {
      const value = this.envVars[key]
      
      if (!value) {
        this.errors.push(`❌ ${key}: 未设置`)
        return
      }

      // 应用验证规则
      const rule = VALIDATION_RULES[key]
      if (rule) {
        if (rule.pattern && !rule.pattern.test(value)) {
          this.errors.push(`❌ ${key}: ${rule.message}`)
        } else if (rule.minLength && value.length < rule.minLength) {
          this.errors.push(`❌ ${key}: ${rule.message}`)
        } else {
          console.log(`✅ ${key}: 已设置`)
        }
      } else {
        console.log(`✅ ${key}: 已设置`)
      }
    })
  }

  // 检查可选的环境变量
  checkOptionalVars() {
    console.log('\n🔍 检查可选的环境变量...')
    
    OPTIONAL_ENV_VARS.forEach(key => {
      const value = this.envVars[key]
      
      if (value) {
        console.log(`✅ ${key}: ${value}`)
      } else {
        console.log(`⚪ ${key}: 未设置 (可选)`)
      }
    })
  }

  // 检查 R2 配置完整性
  checkR2Config() {
    console.log('\n🔍 检查 R2 配置...')
    
    const r2Vars = [
      'VITE_R2_ACCOUNT_ID',
      'VITE_R2_ACCESS_KEY_ID',
      'VITE_R2_SECRET_ACCESS_KEY',
      'VITE_R2_BUCKET_NAME'
    ]
    
    const missingR2Vars = r2Vars.filter(key => !this.envVars[key])
    
    if (missingR2Vars.length === 0) {
      console.log('✅ R2 配置完整')
      
      // 检查 R2 端点配置
      const endpoint = this.envVars['VITE_R2_ENDPOINT']
      if (endpoint) {
        console.log(`✅ 自定义 R2 端点: ${endpoint}`)
      } else {
        console.log('✅ 使用默认 R2 端点')
      }
    } else {
      this.warnings.push(`⚠️  R2 配置不完整，缺失: ${missingR2Vars.join(', ')}`)
    }
  }

  // 检查 GitHub 配置
  checkGitHubConfig() {
    console.log('\n🔍 检查 GitHub 配置...')
    
    const githubVars = [
      'VITE_REPO_OWNER',
      'VITE_REPO_NAME',
      'VITE_GITHUB_TOKEN'
    ]
    
    const missingGitHubVars = githubVars.filter(key => !this.envVars[key])
    
    if (missingGitHubVars.length === 0) {
      console.log('✅ GitHub 配置完整')
      
      // 检查仓库信息
      const owner = this.envVars['VITE_REPO_OWNER']
      const repo = this.envVars['VITE_REPO_NAME']
      console.log(`✅ 目标仓库: ${owner}/${repo}`)
    } else {
      this.warnings.push(`⚠️  GitHub 配置不完整，缺失: ${missingGitHubVars.join(', ')}`)
    }
  }

  // 检查安全配置
  checkSecurityConfig() {
    console.log('\n🔍 检查安全配置...')
    
    const adminPassword = this.envVars['VITE_ADMIN_PASSWORD']
    
    if (adminPassword) {
      if (adminPassword.length >= 12) {
        console.log('✅ 管理员密码长度符合要求')
      } else {
        this.warnings.push('⚠️  管理员密码长度不足，建议至少 12 个字符')
      }
      
      // 检查密码复杂度
      const hasUpperCase = /[A-Z]/.test(adminPassword)
      const hasLowerCase = /[a-z]/.test(adminPassword)
      const hasNumbers = /\d/.test(adminPassword)
      const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(adminPassword)
      
      if (hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars) {
        console.log('✅ 管理员密码复杂度符合要求')
      } else {
        this.warnings.push('⚠️  建议管理员密码包含大小写字母、数字和特殊字符')
      }
    }
  }

  // 生成配置建议
  generateRecommendations() {
    console.log('\n💡 配置建议:')
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('🎉 您的配置看起来很好！可以开始使用 SparkLog 了。')
      return
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ 需要修复的问题:')
      this.errors.forEach(error => console.log(`  ${error}`))
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  建议改进的地方:')
      this.warnings.forEach(warning => console.log(`  ${warning}`))
    }
    
    console.log('\n📚 更多配置信息请参考:')
    console.log('  - 配置指南: ./docs/CONFIGURATION.md')
    console.log('  - 部署指南: ./docs/DEPLOYMENT.md')
    console.log('  - 架构原理: ./docs/ARCHITECTURE.md')
  }

  // 生成环境变量模板
  async generateEnvTemplate() {
    console.log('\n📝 生成环境变量模板...')
    
    const template = `# SparkLog 环境变量配置
# 复制此文件为 .env 并填入实际值

# GitHub 仓库配置
VITE_REPO_OWNER=${this.envVars['VITE_REPO_OWNER'] || 'your-github-username'}
VITE_REPO_NAME=${this.envVars['VITE_REPO_NAME'] || 'sparklog-notes'}
VITE_GITHUB_TOKEN=${this.envVars['VITE_GITHUB_TOKEN'] || 'ghp_your_github_token_here'}

# 管理员密码
VITE_ADMIN_PASSWORD=${this.envVars['VITE_ADMIN_PASSWORD'] || 'your-secure-admin-password'}

# Cloudflare R2 存储配置
VITE_R2_ACCOUNT_ID=${this.envVars['VITE_R2_ACCOUNT_ID'] || 'your_r2_account_id'}
VITE_R2_ACCESS_KEY_ID=${this.envVars['VITE_R2_ACCESS_KEY_ID'] || 'your_r2_access_key_id'}
VITE_R2_SECRET_ACCESS_KEY=${this.envVars['VITE_R2_SECRET_ACCESS_KEY'] || 'your_r2_secret_access_key'}
VITE_R2_BUCKET_NAME=${this.envVars['VITE_R2_BUCKET_NAME'] || 'sparklog-notes'}
VITE_R2_PUBLIC_URL=${this.envVars['VITE_R2_PUBLIC_URL'] || 'https://your-notes.example.com'}

# 静态内容分支配置（可选）
VITE_STATIC_BRANCH=${this.envVars['VITE_STATIC_BRANCH'] || 'static-content'}

# 应用配置（可选）
VITE_APP_TITLE=${this.envVars['VITE_APP_TITLE'] || 'SparkLog'}
VITE_APP_DESCRIPTION=${this.envVars['VITE_APP_DESCRIPTION'] || '优雅免维护的想法记录应用'}
VITE_DEFAULT_THEME=${this.envVars['VITE_DEFAULT_THEME'] || 'auto'}

# 开发环境配置
NODE_ENV=development
`
    
    try {
      const templatePath = path.join(__dirname, '..', '.env.template')
      await fs.writeFile(templatePath, template)
      console.log(`✅ 环境变量模板已生成: .env.template`)
    } catch (error) {
      console.error('❌ 生成模板失败:', error.message)
    }
  }

  // 运行所有检查
  async run() {
    console.log('🚀 SparkLog 配置检查工具')
    console.log('=' * 50)
    
    await this.loadEnvVars()
    
    this.checkRequiredVars()
    this.checkOptionalVars()
    this.checkR2Config()
    this.checkGitHubConfig()
    this.checkSecurityConfig()
    
    this.generateRecommendations()
    await this.generateEnvTemplate()
    
    console.log('\n' + '=' * 50)
    
    if (this.errors.length === 0) {
      console.log('🎉 配置检查完成！')
      process.exit(0)
    } else {
      console.log('❌ 配置检查完成，发现问题需要修复。')
      process.exit(1)
    }
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new ConfigChecker()
  checker.run().catch(error => {
    console.error('❌ 配置检查失败:', error)
    process.exit(1)
  })
}

export { ConfigChecker }
