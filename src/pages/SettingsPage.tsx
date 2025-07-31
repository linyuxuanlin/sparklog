import React, { useState, useEffect } from 'react'
import { Github, Key, Database, ExternalLink, LogOut, Plus, BookOpen } from 'lucide-react'
import { useGitHub } from '@/hooks/useGitHub'

const SettingsPage: React.FC = () => {
  const { isConnected, getConfig, disconnect } = useGitHub()
  const [personalToken, setPersonalToken] = useState('')
  const [appUrl, setAppUrl] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [selectedRepo, setSelectedRepo] = useState('')
  const [repositories, setRepositories] = useState<string[]>([])
  const [isLoadingRepos, setIsLoadingRepos] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const [showCreateRepo, setShowCreateRepo] = useState(false)
  const [newRepoName, setNewRepoName] = useState('')
  const [newRepoPrivate, setNewRepoPrivate] = useState(true)
  const [isCreatingRepo, setIsCreatingRepo] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')

  // 加载保存的配置
  useEffect(() => {
    const config = getConfig()
    if (config) {
      setPersonalToken(config.personalToken || '')
      setAppUrl(config.appUrl)
    } else {
      // 预填当前URL
      setAppUrl(window.location.origin)
    }
  }, [getConfig])

  const openGitHubTokenPage = () => {
    window.open('https://github.com/settings/tokens/new', '_blank')
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

  const handleConnectGitHub = async () => {
    if (!personalToken) {
      showMessage('请先填写GitHub Personal Access Token', 'error')
      return
    }
    
    setIsConnecting(true)
    
    try {
      // 验证token有效性
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${personalToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Personal Access Token无效')
      }
      
      const userInfo = await response.json()
      
      // 保存配置
      localStorage.setItem('sparklog_github_config', JSON.stringify({
        personalToken,
        appUrl
      }))
      
      // 保存认证信息
      localStorage.setItem('sparklog_github_auth', JSON.stringify({
        accessToken: personalToken,
        username: userInfo.login,
        userInfo: userInfo,
        connected: true,
        connectedAt: new Date().toISOString()
      }))
      
      showMessage('GitHub连接成功！', 'success')
    } catch (error) {
      console.error('连接失败:', error)
      showMessage(`连接失败: ${error instanceof Error ? error.message : '请重试'}`, 'error')
    } finally {
      setIsConnecting(false)
    }
  }

  // 加载用户真实GitHub仓库
  const loadRepositories = async () => {
    if (!isConnected) return
    
    setIsLoadingRepos(true)
    
    try {
      // 获取授权信息
      const auth = localStorage.getItem('sparklog_github_auth')
      if (!auth) {
        throw new Error('未找到授权信息')
      }
      
      const authData = JSON.parse(auth)
      
      // 调试信息
      console.log('GitHub认证信息:', {
        hasAccessToken: !!authData.accessToken,
        username: authData.username,
        connected: authData.connected
      })
      
      // 调用GitHub API获取用户仓库
      const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
        headers: {
          'Authorization': `token ${authData.accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('GitHub API错误详情:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        })
        throw new Error(`GitHub API错误: ${response.status} - ${errorData.message || response.statusText}`)
      }
      
      const repos = await response.json()
      const repoNames = repos.map((repo: any) => repo.name)
      
      setRepositories(repoNames)
      setIsLoadingRepos(false)
      showMessage(`成功加载 ${repoNames.length} 个仓库`, 'success')
    } catch (error) {
      console.error('加载仓库失败:', error)
      showMessage(`加载仓库失败: ${error instanceof Error ? error.message : '请重试'}`, 'error')
      setIsLoadingRepos(false)
    }
  }

  // 显示创建仓库表单
  const showCreateRepositoryForm = () => {
    setShowCreateRepo(true)
    setNewRepoName('')
    setNewRepoPrivate(true)
  }

  // 取消创建仓库
  const cancelCreateRepository = () => {
    setShowCreateRepo(false)
    setNewRepoName('')
    setNewRepoPrivate(true)
  }

  // 创建新仓库
  const createNewRepository = async () => {
    if (!newRepoName.trim()) {
      showMessage('请输入仓库名称', 'error')
      return
    }
    
    const trimmedName = newRepoName.trim()
    
    // 验证仓库名称格式
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedName)) {
      showMessage('仓库名称只能包含字母、数字、下划线和连字符', 'error')
      return
    }
    
    try {
      setIsCreatingRepo(true)
      
      // 获取授权信息
      const auth = localStorage.getItem('sparklog_github_auth')
      if (!auth) {
        throw new Error('未找到授权信息')
      }
      
      const authData = JSON.parse(auth)
      
      // 调试信息
      if (debugMode) {
        console.log('创建仓库认证信息:', {
          hasAccessToken: !!authData.accessToken,
          username: authData.username,
          repoName: trimmedName,
          isPrivate: newRepoPrivate
        })
      }
      
      // 调用GitHub API创建仓库
      const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${authData.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: trimmedName,
          description: 'SparkLog笔记仓库',
          private: newRepoPrivate,
          auto_init: true
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`创建仓库失败: ${errorData.message || response.statusText}`)
      }
      
      await response.json() // 获取响应但不使用，确保请求完成
      
      // 更新仓库列表
      setRepositories(prev => [...prev, trimmedName])
      setSelectedRepo(trimmedName)
      
      // 保存选择的仓库到localStorage
      localStorage.setItem('sparklog_selected_repo', trimmedName)
      
      // 关闭创建表单
      setShowCreateRepo(false)
      setNewRepoName('')
      setNewRepoPrivate(true)
      
      showMessage(`仓库 "${trimmedName}" 创建成功！`, 'success')
    } catch (error) {
      console.error('创建仓库失败:', error)
      showMessage(`创建仓库失败: ${error instanceof Error ? error.message : '请重试'}`, 'error')
    } finally {
      setIsCreatingRepo(false)
    }
  }

  // 当连接状态改变时加载仓库
  useEffect(() => {
    if (isConnected) {
      loadRepositories()
      
      // 加载保存的仓库选择
      const savedRepo = localStorage.getItem('sparklog_selected_repo')
      if (savedRepo) {
        setSelectedRepo(savedRepo)
      }
    }
  }, [isConnected])

  return (
    <div className="max-w-4xl mx-auto">
      {/* 消息提示 */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          messageType === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded-full mr-3 ${
              messageType === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span>{message}</span>
          </div>
        </div>
      )}
      
      {/* 欢迎内容 - 只在未连接时显示 */}
      {!isConnected && (
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              欢迎使用 SparkLog
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              一个基于GitHub仓库的静态笔记应用
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center mb-4">
                <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold">笔记管理</h3>
              </div>
              <p className="text-gray-600">
                创建、编辑和管理你的笔记，支持Markdown格式和多媒体内容。
              </p>
            </div>

            <div className="card p-6">
              <div className="flex items-center mb-4">
                <Github className="w-8 h-8 text-gray-800 mr-3" />
                <h3 className="text-lg font-semibold">GitHub存储</h3>
              </div>
              <p className="text-gray-600">
                所有数据安全存储在GitHub私有仓库中，完全自主可控。
              </p>
            </div>

            <div className="card p-6">
              <div className="flex items-center mb-4">
                <Plus className="w-8 h-8 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold">权限控制</h3>
              </div>
              <p className="text-gray-600">
                支持公开和私密笔记设置，灵活控制内容访问权限。
              </p>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">快速开始</h2>
            <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto">
              <ol className="text-left space-y-3">
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">1</span>
                  <span>在下方配置你的GitHub Personal Access Token</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">2</span>
                  <span>选择或创建一个私有仓库用于存储笔记</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">3</span>
                  <span>开始创建你的第一篇笔记！</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

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
            <h3 className="text-sm font-medium text-blue-900 mb-2">Personal Access Token配置步骤：</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. 点击下方按钮前往GitHub创建Personal Access Token</li>
              <li>2. 选择权限：repo（完整控制私有仓库）</li>
              <li>3. 复制生成的token到下方输入框</li>
              <li>4. 点击"连接GitHub"按钮</li>
            </ol>
            <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
              <p className="text-sm text-green-800">
                <strong>优势：</strong>无需服务器端支持，直接使用GitHub API，无CORS限制
              </p>
            </div>
            <button 
              onClick={openGitHubTokenPage}
              className="mt-3 inline-flex items-center text-sm text-blue-700 hover:text-blue-900"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              前往GitHub Personal Access Token设置
            </button>
          </div>
          
          {isConnected ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-green-800 font-medium">已连接GitHub</span>
                </div>
                <p className="text-sm text-green-700">
                  GitHub连接成功！现在请选择或创建一个笔记仓库来开始使用。
                </p>
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
                  GitHub Personal Access Token
                </label>
                <input
                  type="password"
                  value={personalToken}
                  onChange={(e) => setPersonalToken(e.target.value)}
                  placeholder="输入你的GitHub Personal Access Token"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  请确保token具有repo权限（完整控制私有仓库）
                </p>
              </div>
              
              <button 
                onClick={handleConnectGitHub}
                disabled={isConnecting || !personalToken}
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
          
          {!isConnected ? (
            <div className="text-center py-6">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">请先连接GitHub以管理笔记仓库</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择笔记仓库
                </label>
                {isLoadingRepos ? (
                  <div className="flex items-center space-x-2 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>加载仓库中...</span>
                  </div>
                ) : (
                  <select 
                    value={selectedRepo}
                    onChange={(e) => {
                      const repo = e.target.value
                      setSelectedRepo(repo)
                      if (repo) {
                        localStorage.setItem('sparklog_selected_repo', repo)
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">选择仓库...</option>
                    {repositories.map(repo => (
                      <option key={repo} value={repo}>{repo}</option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={showCreateRepositoryForm}
                  className="btn-secondary inline-flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  创建新仓库
                </button>
                <button 
                  onClick={loadRepositories}
                  className="btn-secondary inline-flex items-center"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  刷新仓库
                </button>
                
                {debugMode && (
                  <button 
                    onClick={() => {
                      const auth = localStorage.getItem('sparklog_github_auth')
                      if (auth) {
                        const authData = JSON.parse(auth)
                        console.log('当前认证状态:', authData)
                        alert(`认证状态:\n- 有Token: ${!!authData.accessToken}\n- 用户名: ${authData.username}\n- 连接状态: ${authData.connected}`)
                      } else {
                        alert('未找到认证信息')
                      }
                    }}
                    className="btn-secondary inline-flex items-center"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    检查认证
                  </button>
                )}
              </div>

              {/* 创建仓库表单 */}
              {showCreateRepo && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">创建新仓库</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        仓库名称
                      </label>
                      <input
                        type="text"
                        value={newRepoName}
                        onChange={(e) => setNewRepoName(e.target.value)}
                        placeholder="输入仓库名称..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        只能包含字母、数字、下划线和连字符
                      </p>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="repo-private"
                        checked={newRepoPrivate}
                        onChange={(e) => setNewRepoPrivate(e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor="repo-private" className="text-sm text-gray-700">
                        私有仓库
                      </label>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={createNewRepository}
                        disabled={isCreatingRepo || !newRepoName.trim()}
                        className="btn-primary text-sm px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCreatingRepo ? '创建中...' : '创建仓库'}
                      </button>
                      <button
                        onClick={cancelCreateRepository}
                        disabled={isCreatingRepo}
                        className="btn-secondary text-sm px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              )}
             
              {selectedRepo && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-green-800">
                      已选择仓库：<strong>{selectedRepo}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
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
                value={appUrl}
                onChange={(e) => setAppUrl(e.target.value)}
                placeholder="https://your-app.pages.dev"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                这是你的SparkLog应用的完整URL地址。部署后请更新为你的实际域名。
              </p>
            </div>
            
            <div className="flex items-start">
              <input 
                type="checkbox" 
                id="debug" 
                checked={debugMode}
                onChange={(e) => setDebugMode(e.target.checked)}
                className="mr-2 mt-1" 
              />
              <div>
                <label htmlFor="debug" className="text-sm text-gray-700 font-medium">
                  启用调试模式
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  启用后会在控制台显示详细的调试信息，包括API调用、状态变化等。仅在开发或故障排除时使用。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage 