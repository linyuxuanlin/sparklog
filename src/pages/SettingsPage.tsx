import React, { useState, useEffect } from 'react'
import { Github, Key, Database, ExternalLink, LogOut } from 'lucide-react'
import { useGitHub } from '@/hooks/useGitHub'

const SettingsPage: React.FC = () => {
  const { isConnected, getConfig, disconnect } = useGitHub()
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [appUrl, setAppUrl] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)

  // 加载保存的配置
  useEffect(() => {
    const config = getConfig()
    if (config) {
      setClientId(config.clientId)
      setClientSecret(config.clientSecret)
      setAppUrl(config.appUrl)
    }
  }, [getConfig])

  const handleConnectGitHub = () => {
    if (!clientId || !clientSecret) {
      alert('请先填写GitHub Client ID和Client Secret')
      return
    }
    
    setIsConnecting(true)
    
    // 构建GitHub OAuth URL
    const redirectUri = `${window.location.origin}/auth/callback`
    const scope = 'repo'
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${Date.now()}`
    
    // 保存配置到localStorage
    localStorage.setItem('sparklog_github_config', JSON.stringify({
      clientId,
      clientSecret,
      appUrl
    }))
    
    // 跳转到GitHub授权页面
    window.location.href = githubAuthUrl
  }

  const openGitHubOAuthPage = () => {
    window.open('https://github.com/settings/applications/new', '_blank')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">设置</h1>
        <p className="text-gray-600">配置你的SparkLog应用</p>
      </div>

      <div className="space-y-6">
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Github className="w-6 h-6 text-gray-800 mr-3" />
            <h2 className="text-lg font-semibold">GitHub连接</h2>
          </div>
          
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">配置步骤：</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. 点击下方按钮前往GitHub创建OAuth应用</li>
              <li>2. 设置回调URL为：<code className="bg-blue-100 px-1 rounded">{window.location.origin}/auth/callback</code></li>
              <li>3. 复制Client ID和Client Secret到下方输入框</li>
              <li>4. 点击"连接GitHub"按钮</li>
            </ol>
            <button 
              onClick={openGitHubOAuthPage}
              className="mt-3 inline-flex items-center text-sm text-blue-700 hover:text-blue-900"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              前往GitHub OAuth应用设置
            </button>
          </div>
          
          {isConnected ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-green-800 font-medium">已连接GitHub</span>
                </div>
              </div>
              
              <button 
                onClick={disconnect}
                className="btn-secondary inline-flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                断开连接
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub Client ID
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="输入你的GitHub OAuth Client ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub Client Secret
                </label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="输入你的GitHub OAuth Client Secret"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button 
                onClick={handleConnectGitHub}
                disabled={isConnecting || !clientId || !clientSecret}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? '连接中...' : '连接GitHub'}
              </button>
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Database className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-lg font-semibold">笔记仓库</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择笔记仓库
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>请先连接GitHub</option>
              </select>
            </div>
            
            <button className="btn-secondary">
              创建新仓库
            </button>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Key className="w-6 h-6 text-green-600 mr-3" />
            <h2 className="text-lg font-semibold">应用配置</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                应用URL
              </label>
              <input
                type="url"
                placeholder="https://your-app.pages.dev"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center">
              <input type="checkbox" id="debug" className="mr-2" />
              <label htmlFor="debug" className="text-sm text-gray-700">
                启用调试模式
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage 