import React, { useState } from 'react'
import { Lock, Settings, ExternalLink, LogOut, LogIn, Database, Server, Shield, ChevronDown, ChevronRight } from 'lucide-react'
import { useGitHub } from '@/hooks/useGitHub'
import { 
  getR2Config, 
  getAdminPassword, 
  getGitHubToken, 
  getStaticBranch, 
  getAppTitle, 
  getAppDescription, 
  getDefaultTheme,
  isCorsProxyEnabled,
  getCorsProxyUrl
} from '@/config/env'
import SparkLogLogo from '@/components/SparkLogLogo'

const SettingsPage: React.FC = () => {
  const { isConnected, disconnect, authenticate } = useGitHub()
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [password, setPassword] = useState('')
  const [showLoginForm, setShowLoginForm] = useState(false)
  
  // 折叠状态管理
  const [collapsedSections, setCollapsedSections] = useState({
    r2: false,
    admin: false,
    app: false
  })

  // 切换折叠状态
  const toggleSection = (section: 'r2' | 'admin' | 'app') => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

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

  // 获取配置状态
  const r2Config = getR2Config()
  const adminPassword = getAdminPassword()
  const githubToken = getGitHubToken()
  const staticBranch = getStaticBranch()
  const appTitle = getAppTitle()
  const appDescription = getAppDescription()
  const defaultTheme = getDefaultTheme()
  const corsProxyEnabled = isCorsProxyEnabled()
  const corsProxyUrl = getCorsProxyUrl()

  // 环境变量检查
  const envVars = {
    // R2 存储配置
    r2: {
      accountId: !!r2Config?.accountId,
      accessKeyId: !!r2Config?.accessKeyId,
      secretAccessKey: !!r2Config?.secretAccessKey,
      bucketName: !!r2Config?.bucketName,
      publicUrl: !!r2Config?.publicUrl,
      configured: !!r2Config
    },
    // 管理员配置
    adminPassword: !!adminPassword,
    githubToken: !!githubToken,
    // 应用配置
    staticBranch: staticBranch !== 'static-content', // 如果不是默认值说明已配置
    appTitle: appTitle !== 'SparkLog', // 如果不是默认值说明已配置
    appDescription: appDescription !== '优雅免维护的想法记录应用', // 如果不是默认值说明已配置
    defaultTheme: defaultTheme !== 'auto', // 如果不是默认值说明已配置
    // CORS 代理配置
    corsProxy: corsProxyEnabled,
    corsProxyUrl: !!corsProxyUrl
  }

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
            <SparkLogLogo size={24} className="text-blue-600 dark:text-blue-400 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">欢迎使用 SparkLog</h2>
          </div>
          
          <div className="space-y-4 text-gray-600 dark:text-gray-300">
            <p>
              SparkLog 是一个基于 Cloudflare R2 存储的静态笔记应用，支持公开笔记分享和私密笔记保护。
            </p>
            
            {/* 环境变量配置状态 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-lg">环境变量配置状态</h3>
              </div>
              
              <div className="space-y-4">
                {/* R2 存储配置 */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg">
                  <button
                    onClick={() => toggleSection('r2')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center">
                      <Database className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">Cloudflare R2 存储</h4>
                      <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                        envVars.r2.configured 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}>
                        {envVars.r2.configured ? '已配置' : '未配置'}
                      </span>
                    </div>
                    {collapsedSections.r2 ? (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  {!collapsedSections.r2 && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-600 pt-4">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Account ID</span>
                        <span className={`text-sm font-medium ${envVars.r2.accountId ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {envVars.r2.accountId ? '✓ 已配置' : '✗ 未配置'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Access Key ID</span>
                        <span className={`text-sm font-medium ${envVars.r2.accessKeyId ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {envVars.r2.accessKeyId ? '✓ 已配置' : '✗ 未配置'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Secret Access Key</span>
                        <span className={`text-sm font-medium ${envVars.r2.secretAccessKey ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {envVars.r2.secretAccessKey ? '✓ 已配置' : '✗ 未配置'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Bucket Name</span>
                        <span className={`text-sm font-medium ${envVars.r2.bucketName ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {envVars.r2.bucketName ? '✓ 已配置' : '✗ 未配置'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Public URL（可选）</span>
                        <span className={`text-sm font-medium ${envVars.r2.publicUrl ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {envVars.r2.publicUrl ? '✓ 已配置' : '- 未设置'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 管理员配置 */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg">
                  <button
                    onClick={() => toggleSection('admin')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 mr-2" />
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">管理员配置</h4>
                    </div>
                    {collapsedSections.admin ? (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  {!collapsedSections.admin && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-600 pt-4">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">管理员密码</span>
                        <span className={`text-sm font-medium ${envVars.adminPassword ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {envVars.adminPassword ? '✓ 已设置' : '✗ 未设置'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">GitHub Token</span>
                        <span className={`text-sm font-medium ${envVars.githubToken ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {envVars.githubToken ? '✓ 已设置' : '✗ 未设置'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 应用配置 */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg">
                  <button
                    onClick={() => toggleSection('app')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center">
                      <Server className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">应用配置</h4>
                    </div>
                    {collapsedSections.app ? (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  {!collapsedSections.app && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-600 pt-4">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">应用标题</span>
                        <span className="text-sm font-mono text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                          {appTitle}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">静态分支</span>
                        <span className="text-sm font-mono text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                          {staticBranch}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">默认主题</span>
                        <span className="text-sm font-mono text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                          {defaultTheme}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">自定义描述</span>
                        <span className={`text-sm font-medium ${envVars.appDescription ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {envVars.appDescription ? '✓ 已设置' : '- 使用默认'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">CORS 代理模式</span>
                        <span className={`text-sm font-medium ${envVars.corsProxy ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {envVars.corsProxy ? '✓ 已启用' : '- 未启用'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">代理服务 URL</span>
                        <span className={`text-sm font-medium ${envVars.corsProxyUrl ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {envVars.corsProxyUrl ? '✓ 已配置' : '- 未配置'}
                        </span>
                      </div>
                    </div>
                  )}
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
                <li>• AES-GCM 加密存储</li>
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