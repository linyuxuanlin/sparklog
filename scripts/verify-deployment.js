#!/usr/bin/env node

/**
 * 部署验证脚本
 * 验证 Cloudflare Pages 部署是否成功
 */

// 验证静态内容文件
async function verifyStaticContent(baseUrl) {
  console.log(`🔍 验证静态内容文件: ${baseUrl}\n`)
  
  const files = [
    'public-notes.json',
    'all-notes.json', 
    'build-info.json'
  ]
  
  let allFilesValid = true
  
  for (const file of files) {
    try {
      const url = `${baseUrl}/${file}`
      console.log(`📁 检查文件: ${file}`)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'SparkLog-Verification/1.0'
        }
      })
      
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        const contentLength = response.headers.get('content-length')
        
        console.log(`  ✅ 状态: ${response.status} ${response.statusText}`)
        console.log(`  📊 内容类型: ${contentType}`)
        console.log(`  📏 文件大小: ${contentLength} bytes`)
        
        // 验证 JSON 格式
        try {
          const data = await response.json()
          if (file === 'build-info.json') {
            console.log(`  🏗️  构建时间: ${data.buildTime}`)
            console.log(`  📝 总笔记数: ${data.totalNotes}`)
            console.log(`  🌐 公开笔记: ${data.publicNotes}`)
          } else if (file === 'public-notes.json' || file === 'all-notes.json') {
            console.log(`  📝 笔记数量: ${Array.isArray(data) ? data.length : '无效格式'}`)
          }
        } catch (jsonError) {
          console.log(`  ⚠️  JSON 解析失败: ${jsonError.message}`)
          allFilesValid = false
        }
        
      } else {
        console.log(`  ❌ 状态: ${response.status} ${response.statusText}`)
        allFilesValid = false
      }
      
    } catch (error) {
      console.log(`  ❌ 请求失败: ${error.message}`)
      allFilesValid = false
    }
    
    console.log('')
  }
  
  return allFilesValid
}

// 验证 CORS 配置
async function verifyCorsConfiguration(baseUrl) {
  console.log(`🔍 验证 CORS 配置: ${baseUrl}\n`)
  
  try {
    const url = `${baseUrl}/public-notes.json`
    console.log('📡 测试 CORS 预检请求...')
    
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    })
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
    }
    
    console.log('  📋 CORS 头部:')
    Object.entries(corsHeaders).forEach(([key, value]) => {
      if (value) {
        console.log(`    ✅ ${key}: ${value}`)
      } else {
        console.log(`    ❌ ${key}: 未设置`)
      }
    })
    
    return Object.values(corsHeaders).every(value => value !== null)
    
  } catch (error) {
    console.log(`  ❌ CORS 测试失败: ${error.message}`)
    return false
  }
}

// 验证缓存配置
async function verifyCacheConfiguration(baseUrl) {
  console.log(`🔍 验证缓存配置: ${baseUrl}\n`)
  
  try {
    const url = `${baseUrl}/public-notes.json`
    console.log('📡 测试缓存头部...')
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'SparkLog-Verification/1.0'
      }
    })
    
    const cacheHeaders = {
      'Cache-Control': response.headers.get('Cache-Control'),
      'ETag': response.headers.get('ETag'),
      'Last-Modified': response.headers.get('Last-Modified')
    }
    
    console.log('  📋 缓存头部:')
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      if (value) {
        console.log(`    ✅ ${key}: ${value}`)
      } else {
        console.log(`    ⚠️  ${key}: 未设置`)
      }
    })
    
    return true
    
  } catch (error) {
    console.log(`  ❌ 缓存测试失败: ${error.message}`)
    return false
  }
}

// 主验证函数
async function verifyDeployment(baseUrl) {
  console.log('🚀 SparkLog 部署验证开始...\n')
  console.log(`🌐 目标 URL: ${baseUrl}\n`)
  
  try {
    // 验证静态内容
    const staticContentValid = await verifyStaticContent(baseUrl)
    
    // 验证 CORS 配置
    const corsValid = await verifyCorsConfiguration(baseUrl)
    
    // 验证缓存配置
    const cacheValid = await verifyCacheConfiguration(baseUrl)
    
    // 总结
    console.log('📊 验证结果总结:')
    console.log(`  📁 静态内容: ${staticContentValid ? '✅ 通过' : '❌ 失败'}`)
    console.log(`  🔒 CORS 配置: ${corsValid ? '✅ 通过' : '❌ 失败'}`)
    console.log(`  💾 缓存配置: ${cacheValid ? '✅ 通过' : '⚠️  部分通过'}`)
    
    if (staticContentValid && corsValid) {
      console.log('\n🎉 部署验证成功！你的 SparkLog 应该可以正常工作了。')
      console.log('\n💡 下一步:')
      console.log('  1. 访问你的网站')
      console.log('  2. 输入管理员密码')
      console.log('  3. 开始创建笔记')
    } else {
      console.log('\n❌ 部署验证失败，请检查以下问题:')
      
      if (!staticContentValid) {
        console.log('  - 静态内容文件无法访问')
        console.log('  - 检查 Cloudflare Pages 构建是否成功')
        console.log('  - 确认构建命令为: npm run build:pages')
      }
      
      if (!corsValid) {
        console.log('  - CORS 配置不正确')
        console.log('  - 检查 public/_headers 文件')
        console.log('  - 确认 Cloudflare Pages 设置')
      }
      
      console.log('\n🔧 故障排除建议:')
      console.log('  1. 检查 Cloudflare Pages 构建日志')
      console.log('  2. 确认环境变量配置正确')
      console.log('  3. 重新部署项目')
      console.log('  4. 参考 README.md 中的故障排除部分')
    }
    
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error.message)
    process.exit(1)
  }
}

// 主函数
async function main() {
  const baseUrl = process.argv[2]
  
  if (!baseUrl) {
    console.error('❌ 请提供要验证的 URL')
    console.error('用法: node scripts/verify-deployment.js <your-url>')
    console.error('示例: node scripts/verify-deployment.js https://sparklog.wiki-power.com')
    process.exit(1)
  }
  
  // 确保 URL 格式正确
  let normalizedUrl = baseUrl
  if (!normalizedUrl.startsWith('http')) {
    normalizedUrl = `https://${normalizedUrl}`
  }
  
  // 移除末尾的斜杠
  normalizedUrl = normalizedUrl.replace(/\/$/, '')
  
  await verifyDeployment(normalizedUrl)
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { verifyDeployment }
