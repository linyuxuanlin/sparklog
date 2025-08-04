// 调试工具 - 用于诊断Cloudflare Pages环境中的问题

import { debugAllEnvVars, checkEnvVarsConfigured, isCloudflarePages } from '@/config/env'

export const debugEnvironment = () => {
  console.log('=== 环境调试信息 ===')
  console.log('当前URL:', window.location.href)
  console.log('用户代理:', navigator.userAgent)
  
  // 运行详细的环境变量检查
  debugAllEnvVars()
  
  // 检查环境变量配置状态
  const envConfigured = checkEnvVarsConfigured()
  console.log('环境变量配置状态:', envConfigured)
  
  // 检查是否为Cloudflare Pages环境
  const isCloudflare = isCloudflarePages()
  console.log('是否为Cloudflare Pages:', isCloudflare)
  
  // 检查localStorage
  try {
    const auth = localStorage.getItem('sparklog_admin_auth')
    console.log('localStorage认证状态:', auth ? JSON.parse(auth) : '无')
  } catch (error) {
    console.error('localStorage访问失败:', error)
  }
  
  // 测试网络连接
  testNetworkConnection()
  
  // 如果是Cloudflare Pages环境，运行特殊检查
  if (isCloudflare) {
    debugCloudflareSpecific()
  }
}

export const debugCloudflareSpecific = () => {
  console.log('=== Cloudflare Pages 特殊检查 ===')
  
  // 检查Cloudflare特定的环境变量
  const cfKeys = [
    'CF_PAGES_URL',
    'CF_PAGES_BRANCH',
    'CF_PAGES_COMMIT_SHA',
    'CF_PAGES_ENVIRONMENT',
    'CF_PAGES_PROJECT_NAME'
  ]
  
  cfKeys.forEach(key => {
    const value = (window as any)[key]
    if (value) {
      console.log(`${key}:`, value)
    }
  })
  
  // 检查构建时环境变量
  console.log('构建时环境变量检查:')
  const buildTimeKeys = [
    'VITE_REPO_OWNER',
    'VITE_REPO_NAME', 
    'VITE_GITHUB_TOKEN',
    'VITE_ADMIN_PASSWORD'
  ]
  
  buildTimeKeys.forEach(key => {
    const value = import.meta.env[key]
    console.log(`${key}:`, value ? (key.includes('TOKEN') || key.includes('PASSWORD') ? '***' : value) : 'undefined')
  })
}

export const testNetworkConnection = async () => {
  console.log('=== 网络连接测试 ===')
  
  try {
    // 测试GitHub API连接
    const response = await fetch('https://api.github.com/rate_limit', {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    
    console.log('GitHub API连接测试:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('GitHub API限制信息:', data)
    }
  } catch (error) {
    console.error('GitHub API连接失败:', error)
  }
  
  try {
    // 测试基本网络连接
    const response = await fetch('https://httpbin.org/get')
    console.log('基本网络连接测试:', {
      status: response.status,
      ok: response.ok
    })
  } catch (error) {
    console.error('基本网络连接失败:', error)
  }
}

export const debugGitHubAPI = async (owner: string, repo: string, token?: string) => {
  console.log('=== GitHub API调试 ===')
  
  const headers: any = {
    'Accept': 'application/vnd.github.v3+json'
  }
  
  if (token) {
    headers['Authorization'] = `token ${token}`
  }
  
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/notes`
    console.log('请求URL:', url)
    console.log('请求头:', headers)
    
    const response = await fetch(url, { headers })
    
    console.log('响应状态:', response.status, response.statusText)
    console.log('响应头:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const data = await response.json()
      console.log('响应数据:', data)
    } else {
      const errorData = await response.json().catch(() => ({}))
      console.error('API错误:', errorData)
    }
  } catch (error) {
    console.error('GitHub API请求失败:', error)
  }
}

// 手动触发环境变量重新检查
export const recheckEnvironmentVariables = () => {
  console.log('=== 手动重新检查环境变量 ===')
  
  // 清除可能的缓存
  if (typeof window !== 'undefined') {
    // 尝试重新加载页面来刷新环境变量
    console.log('建议刷新页面以重新加载环境变量')
  }
  
  // 重新运行环境检查
  debugEnvironment()
}

// 在开发环境中自动运行调试
if (import.meta.env.DEV) {
  // 延迟执行，确保应用完全加载
  setTimeout(() => {
    debugEnvironment()
  }, 1000)
}

// 在生产环境中也运行调试（Cloudflare Pages）
if (import.meta.env.PROD) {
  setTimeout(() => {
    debugEnvironment()
  }, 2000)
} 