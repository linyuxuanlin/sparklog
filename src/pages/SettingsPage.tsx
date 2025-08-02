import React, { useState } from 'react'
import { Lock, Settings, ExternalLink, LogOut, LogIn, Shield } from 'lucide-react'
import { useGitHub } from '@/hooks/useGitHub'
import { getDefaultRepoConfig } from '@/config/defaultRepo'

const SettingsPage: React.FC = () => {
  const { isConnected, disconnect, authenticate } = useGitHub()
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [password, setPassword] = useState('')
  const [showLoginForm, setShowLoginForm] = useState(false)

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
    showMessage('已退出管理员模式', 'success')
  }

  const handleLogin = () => {
    if (!password.trim()) {
      showMessage('请输入管理员密码', 'error')
      return
    }

    if (authenticate(password)) {
      showMessage('登录成功！您现在拥有管理员权限', 'success')
      setPassword('')
      setShowLoginForm(false)
    } else {
      showMessage('密码错误，请重试', 'error')
      setPassword('')
    }
  }

  const defaultConfig = getDefaultRepoConfig()

  // 环境变量检查
  const envVars = {
    VITE_REPO_OWNER: import.meta.env.VITE_REPO_OWNER,
    VITE_REPO_NAME: import.meta.env.VITE_REPO_NAME,
    VITE_GITHUB_TOKEN: import.meta.env.VITE_GITHUB_TOKEN ? '已设置' : '未设置',
    VITE_ADMIN_PASSWORD: import.meta.env.VITE_ADMIN_PASSWORD ? '已设置' : '未设置'
  }

  // 调试信息
  console.log('环境变量调试信息:', {
    VITE_REPO_OWNER: import.meta.env.VITE_REPO_OWNER,
    VITE_REPO_NAME: import.meta.env.VITE_REPO_NAME,
    VITE_GITHUB_TOKEN: import.meta.env.VITE_GITHUB_TOKEN ? '已设置' : '未设置',
    VITE_ADMIN_PASSWORD: import.meta.env.VITE_ADMIN_PASSWORD ? '已设置' : '未设置',
    defaultConfig: getDefaultRepoConfig()
  })

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">设置</h1>
        <p className="text-gray-600 dark:text-gray-400">管理您的SparkLog应用配置</p>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          messageType === 'success' ? 'bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700' : 
          'bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="grid gap-6">
        {/* 欢迎信息 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">欢迎使用 SparkLog</h2>
          </div>
          
          <div className="space-y-4 text-gray-600 dark:text-gray-300">
            <p>
              SparkLog 是一个基于GitHub仓库的静态笔记应用，支持公开笔记分享和私密笔记保护。
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">当前配置</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>GitHub仓库:</span>
                  <span className="font-mono text-blue-800 dark:text-blue-200">
                    {defaultConfig ? `${defaultConfig.owner}/${defaultConfig.repo}` : '未配置'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>管理员状态:</span>
                  <span className={isConnected ? 'text-green-600' : 'text-gray-600'}>
                    {isConnected ? '已登录' : '未登录'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>环境变量:</span>
                  <span className={envVars.VITE_REPO_OWNER && envVars.VITE_REPO_NAME ? 'text-green-600' : 'text-red-600'}>
                    {envVars.VITE_REPO_OWNER && envVars.VITE_REPO_NAME ? '已配置' : '未配置'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>GitHub Token:</span>
                  <span className={envVars.VITE_GITHUB_TOKEN === '已设置' ? 'text-green-600' : 'text-red-600'}>
                    {envVars.VITE_GITHUB_TOKEN}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>管理员密码:</span>
                  <span className={envVars.VITE_ADMIN_PASSWORD === '已设置' ? 'text-green-600' : 'text-red-600'}>
                    {envVars.VITE_ADMIN_PASSWORD}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>本地认证:</span>
                  <span className={localStorage.getItem('sparklog_admin_auth') ? 'text-green-600' : 'text-red-600'}>
                    {localStorage.getItem('sparklog_admin_auth') ? '已保存' : '未保存'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 管理员身份验证 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Lock className="w-6 h-6 text-gray-700 dark:text-gray-300 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">管理员身份验证</h2>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isConnected 
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}>
              {isConnected ? '已登录' : '未登录'}
            </div>
          </div>

          {isConnected ? (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                您已登录为管理员，可以创建、编辑和删除笔记，以及查看私密笔记。
              </p>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                退出管理员模式
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                输入管理员密码以获得完整功能，包括创建、编辑、删除笔记和查看私密笔记。
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                  <li>• 普通用户：只能查看公开笔记</li>
                  <li>• 管理员：可以管理所有笔记（公开和私密）</li>
                </ul>
              </div>
              
              {showLoginForm ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      管理员密码
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                      placeholder="请输入管理员密码"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleLogin}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      登录
                    </button>
                    <button
                      onClick={() => setShowLoginForm(false)}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginForm(true)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  管理员登录
                </button>
              )}
            </div>
          )}
        </div>

        {/* 功能说明 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <Settings className="w-6 h-6 text-gray-700 dark:text-gray-300 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">功能特性</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">公开笔记</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• 任何人都可以查看</li>
                <li>• 适合分享知识和文章</li>
                <li>• 无需登录即可访问</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">私密笔记</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• 只有管理员可访问</li>
                <li>• 适合个人日记和私密内容</li>
                <li>• 需要管理员密码登录</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 帮助链接 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">帮助与支持</h2>
          
          <div className="space-y-3">
            <a
              href="https://github.com/linyuxuanlin/sparklog"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              项目主页
            </a>
            
            <a
              href="https://github.com/linyuxuanlin/sparklog/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
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