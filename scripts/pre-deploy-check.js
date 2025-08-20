#!/usr/bin/env node

/**
 * Cloudflare Pages 部署前检查脚本
 * 确保所有必要的配置和代码都正确，避免部署失败
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

console.log('🚀 Cloudflare Pages 部署前检查开始...\n')

// 检查环境变量配置
function checkEnvironmentVariables() {
  console.log('🔐 检查环境变量配置...')
  
  try {
    // 检查 .env 文件是否存在
    if (fs.existsSync('.env')) {
      console.log('  ✅ .env 文件存在')
      
      // 读取 .env 文件内容
      const envContent = fs.readFileSync('.env', 'utf8')
      
      // 检查必要的环境变量
      const requiredEnvVars = [
        'R2_ACCOUNT_ID',
        'R2_ACCESS_KEY_ID', 
        'R2_SECRET_ACCESS_KEY',
        'R2_BUCKET_NAME'
      ]
      
      let envValid = true
      for (const envVar of requiredEnvVars) {
        if (envContent.includes(envVar)) {
          console.log(`    ✅ ${envVar}`)
        } else {
          console.log(`    ❌ ${envVar} - 环境变量缺失`)
          envValid = false
        }
      }
      
      if (!envValid) {
        console.log('  ⚠️  某些环境变量缺失，但部署可能仍然成功（如果通过 Cloudflare 控制台设置）')
      }
    } else {
      console.log('  ⚠️  .env 文件不存在，环境变量可能通过 Cloudflare 控制台设置')
    }
    
    console.log('')
  } catch (error) {
    console.log('  ❌ 检查环境变量时出错:', error.message)
  }
}

// 检查 wrangler.toml 配置
function checkWranglerConfig() {
  console.log('⚙️  检查 wrangler.toml 配置...')
  
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
      console.log('  ✅ wrangler.toml 配置正确\n')
    } else {
      console.log('  ❌ wrangler.toml 配置有误，请修复后重试\n')
      process.exit(1)
    }
    
  } catch (error) {
    console.log('  ❌ 无法读取 wrangler.toml 文件:', error.message)
    process.exit(1)
  }
}

// 检查 package.json 脚本
function checkPackageScripts() {
  console.log('📦 检查 package.json 脚本...')
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    const scripts = packageJson.scripts || {}
    
    // 检查必要的脚本
    const requiredScripts = [
      'build:pages',
      'pre-build',
      'post-build',
      'test-env'
    ]
    
    let scriptsValid = true
    for (const script of requiredScripts) {
      if (scripts[script]) {
        console.log(`  ✅ ${script}: ${scripts[script]}`)
      } else {
        console.log(`  ❌ ${script} - 脚本缺失`)
        scriptsValid = false
      }
    }
    
    if (scriptsValid) {
      console.log('  ✅ 所有必要的脚本都存在\n')
    } else {
      console.log('  ❌ 某些必要的脚本缺失，请修复后重试\n')
      process.exit(1)
    }
    
  } catch (error) {
    console.log('  ❌ 无法读取 package.json 文件:', error.message)
    process.exit(1)
  }
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

// 检查构建脚本文件
function checkBuildScripts() {
  console.log('📜 检查构建脚本文件...')
  
  const requiredScripts = [
    'scripts/build-pages.js',
    'scripts/test-env.js'
  ]
  
  let scriptsExist = true
  for (const script of requiredScripts) {
    if (fs.existsSync(script)) {
      console.log(`  ✅ ${script}`)
    } else {
      console.log(`  ❌ ${script} - 文件不存在`)
      scriptsExist = false
    }
  }
  
  if (scriptsExist) {
    console.log('  ✅ 所有构建脚本都存在\n')
  } else {
    console.log('  ❌ 某些构建脚本缺失，请修复后重试\n')
    process.exit(1)
  }
}

// 检查源代码文件
function checkSourceFiles() {
  console.log('📁 检查源代码文件...')
  
  const requiredDirs = [
    'src',
    'src/components',
    'src/pages',
    'src/services',
    'src/hooks'
  ]
  
  let dirsExist = true
  for (const dir of requiredDirs) {
    if (fs.existsSync(dir)) {
      console.log(`  ✅ ${dir}/`)
    } else {
      console.log(`  ❌ ${dir}/ - 目录不存在`)
      dirsExist = false
    }
  }
  
  if (dirsExist) {
    console.log('  ✅ 所有必要的源代码目录都存在\n')
  } else {
    console.log('  ❌ 某些源代码目录缺失，请修复后重试\n')
    process.exit(1)
  }
}

// 主函数
async function main() {
  try {
    console.log('🔍 开始部署前检查...\n')
    
    checkEnvironmentVariables()
    checkWranglerConfig()
    checkPackageScripts()
    checkBuildScripts()
    checkSourceFiles()
    runTypeCheck()
    runLint()
    
    console.log('🎉 所有检查通过！')
    console.log('✅ 代码质量检查通过')
    console.log('✅ 配置文件验证通过')
    console.log('✅ 构建脚本检查通过')
    console.log('✅ 环境配置检查通过')
    console.log('\n🚀 可以安全部署到 Cloudflare Pages！')
    
  } catch (error) {
    console.error('❌ 检查过程中出现未预期的错误:', error.message)
    process.exit(1)
  }
}

// 运行主函数
main().catch(error => {
  console.error('❌ 脚本执行失败:', error)
  process.exit(1)
})
