#!/usr/bin/env node

/**
 * 构建测试脚本
 * 验证构建过程是否正常，包括 TypeScript 编译检查
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

console.log('🚀 开始构建测试...\n')

// 检查必要的文件和目录
function checkPrerequisites() {
  console.log('📋 检查前置条件...')
  
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'wrangler.toml'
  ]
  
  const requiredDirs = [
    'src',
    'dist'
  ]
  
  let allGood = true
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      console.log(`  ✅ ${file}`)
    } else {
      console.log(`  ❌ ${file} - 文件不存在`)
      allGood = false
    }
  }
  
  for (const dir of requiredDirs) {
    if (fs.existsSync(dir)) {
      console.log(`  ✅ ${dir}/`)
    } else {
      console.log(`  ❌ ${dir}/ - 目录不存在`)
      allGood = false
    }
  }
  
  if (!allGood) {
    console.log('\n❌ 前置条件检查失败，请确保所有必要文件都存在')
    process.exit(1)
  }
  
  console.log('  ✅ 所有前置条件满足\n')
}

// 运行 TypeScript 类型检查
function runTypeCheck() {
  console.log('🔍 运行 TypeScript 类型检查...')
  
  try {
    execSync('npx tsc --noEmit', { 
      stdio: 'inherit',
      cwd: process.cwd()
    })
    console.log('  ✅ TypeScript 类型检查通过\n')
  } catch (error) {
    console.log('  ❌ TypeScript 类型检查失败')
    console.log('  请修复所有类型错误后重试\n')
    process.exit(1)
  }
}

// 运行 ESLint 检查
function runLint() {
  console.log('🧹 运行 ESLint 检查...')
  
  try {
    execSync('npm run lint', { 
      stdio: 'inherit',
      cwd: process.cwd()
    })
    console.log('  ✅ ESLint 检查通过\n')
  } catch (error) {
    console.log('  ❌ ESLint 检查失败')
    console.log('  请修复所有代码规范问题后重试\n')
    process.exit(1)
  }
}

// 运行构建测试
function runBuildTest() {
  console.log('🏗️  运行构建测试...')
  
  try {
    // 清理之前的构建
    if (fs.existsSync('dist')) {
      console.log('  🗑️  清理之前的构建文件...')
      // 使用跨平台的删除命令
      if (process.platform === 'win32') {
        execSync('Remove-Item -Recurse -Force dist', { stdio: 'inherit', shell: 'powershell' })
      } else {
        execSync('rm -rf dist', { stdio: 'inherit' })
      }
    }
    
    // 运行构建命令
    console.log('  🔨 执行构建命令...')
    execSync('npm run build:pages', { 
      stdio: 'inherit',
      cwd: process.cwd()
    })
    
    // 检查构建输出
    console.log('  📁 检查构建输出...')
    const distFiles = fs.readdirSync('dist')
    
    const requiredBuildFiles = [
      'index.html',
      'public-notes.json',
      'all-notes.json',
      'build-info.json'
    ]
    
    let buildSuccess = true
    for (const file of requiredBuildFiles) {
      if (distFiles.includes(file)) {
        console.log(`    ✅ ${file}`)
      } else {
        console.log(`    ❌ ${file} - 构建输出中缺失`)
        buildSuccess = false
      }
    }
    
    if (buildSuccess) {
      console.log('  ✅ 构建测试通过\n')
    } else {
      console.log('  ❌ 构建测试失败，某些必要文件缺失\n')
      process.exit(1)
    }
    
  } catch (error) {
    console.log('  ❌ 构建测试失败')
    console.log('  构建过程中出现错误，请检查构建日志\n')
    process.exit(1)
  }
}

// 验证 wrangler.toml 配置
function validateWranglerConfig() {
  console.log('⚙️  验证 wrangler.toml 配置...')
  
  try {
    const wranglerConfig = fs.readFileSync('wrangler.toml', 'utf8')
    
    // 检查必要的配置项
    const requiredConfigs = [
      'pages_build_output_dir = "dist"',
      'command = "npm run test-env && npm run build:pages"'
    ]
    
    let configValid = true
    for (const config of requiredConfigs) {
      if (wranglerConfig.includes(config)) {
        console.log(`  ✅ ${config}`)
      } else {
        console.log(`  ❌ ${config} - 配置缺失`)
        configValid = false
      }
    }
    
    if (configValid) {
      console.log('  ✅ wrangler.toml 配置验证通过\n')
    } else {
      console.log('  ❌ wrangler.toml 配置验证失败\n')
      process.exit(1)
    }
    
  } catch (error) {
    console.log('  ❌ 无法读取 wrangler.toml 文件')
    process.exit(1)
  }
}

// 主函数
async function main() {
  try {
    checkPrerequisites()
    runTypeCheck()
    runLint()
    validateWranglerConfig()
    runBuildTest()
    
    console.log('🎉 所有测试通过！构建过程正常，可以安全部署到 Cloudflare Pages')
    
  } catch (error) {
    console.error('❌ 测试过程中出现未预期的错误:', error.message)
    process.exit(1)
  }
}

// 运行主函数
main().catch(error => {
  console.error('❌ 脚本执行失败:', error)
  process.exit(1)
})
