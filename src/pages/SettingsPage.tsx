import React, { useState } from 'react'
import { Github, BookOpen, Settings, ExternalLink, LogOut, LogIn } from 'lucide-react'
import { useGitHub } from '@/hooks/useGitHub'
import { getDefaultRepoConfig } from '@/config/defaultRepo'

const SettingsPage: React.FC = () => {
  const { isConnected, disconnect } = useGitHub()
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')

  // 显示消息提示
  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => {
      setMessage('')
      setMessageType('')
    }, 5000)
  }

  const handleLogout = () => {
    disconnect()
    showMessage('已断开GitHub连接', 'success')
  }

  const handleLogin = () => {
    // 重定向到GitHub OAuth授权页面
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
    const redirectUri = `${window.location.origin}/auth/callback`
    const scope = 'repo'
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`
    
    window.location.href = authUrl
  }

  const defaultConfig = getDefaultRepoConfig()

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">设置</h1>
        <p className="text-gray-600">管理您的SparkLog应用配置</p>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          messageType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="grid gap-6">
        {/* 欢迎信息 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <BookOpen className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">欢迎使用 SparkLog</h2>
          </div>
          
          <div className="space-y-4 text-gray-600">
            <p>
              SparkLog 是一个基于GitHub仓库的静态笔记应用，支持公开笔记分享和私密笔记保护。
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">当前配置</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>GitHub仓库:</span>
                  <span className="font-mono text-blue-800">
                    {defaultConfig ? `${defaultConfig.owner}/${defaultConfig.repo}` : '未配置'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>连接状态:</span>
                  <span className={isConnected ? 'text-green-600' : 'text-gray-600'}>
                    {isConnected ? '已连接' : '未连接'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GitHub连接状态 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Github className="w-6 h-6 text-gray-700 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">GitHub 连接</h2>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {isConnected ? '已连接' : '未连接'}
            </div>
          </div>

          {isConnected ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                您已连接到GitHub，可以创建、编辑和删除笔记，以及查看私密笔记。
              </p>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                断开连接
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                连接GitHub以获得完整功能，包括创建、编辑、删除笔记和查看私密笔记。
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">功能说明</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• 未连接用户：只能查看公开笔记</li>
                  <li>• 已连接用户：可以管理所有笔记（公开和私密）</li>
                  <li>• 私密笔记：只有连接用户才能查看和管理</li>
                </ul>
              </div>
              <button
                onClick={handleLogin}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <LogIn className="w-4 h-4 mr-2" />
                使用GitHub登录
              </button>
            </div>
          )}
        </div>

        {/* 功能说明 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Settings className="w-6 h-6 text-gray-700 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">功能特性</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">公开笔记</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 任何人都可以查看</li>
                <li>• 适合分享知识和文章</li>
                <li>• 无需登录即可访问</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">私密笔记</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 只有连接用户可访问</li>
                <li>• 适合个人日记和私密内容</li>
                <li>• 需要GitHub登录</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 帮助链接 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">帮助与支持</h2>
          
          <div className="space-y-3">
            <a
              href="https://github.com/your-username/sparklog"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              项目主页
            </a>
            
            <a
              href="https://github.com/your-username/sparklog/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              问题反馈
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage 