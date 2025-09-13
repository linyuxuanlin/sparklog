"use client"
import React, { useState } from 'react'
import { Lock, Settings, ExternalLink, LogOut, LogIn } from 'lucide-react'
import { useGitHub } from '@/lib/useGitHub'
import { getDefaultRepoConfig } from '@/lib/defaultRepo'

export default function SettingsPage() {
  const { isConnected, disconnect, authenticate } = useGitHub()
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success'|'error'|''>('')
  const [password, setPassword] = useState('')
  const [showLoginForm, setShowLoginForm] = useState(false)
  const showMessage = (text: string, type:'success'|'error') => { setMessage(text); setMessageType(type); setTimeout(()=>{ setMessage(''); setMessageType('') }, 5000) }
  const handleLogout = () => { disconnect(); showMessage('已退出管理员模式', 'success') }
  const handleLogin = () => { if (!password.trim()) { showMessage('请输入管理员密码', 'error'); return } if (authenticate(password)) { showMessage('登录成功！您现在拥有管理员权限', 'success'); setPassword(''); setShowLoginForm(false) } else { showMessage('密码错误，请重试', 'error'); setPassword('') } }
  const defaultConfig = getDefaultRepoConfig()

  const envVars = {
    REPO_OWNER: process.env.NEXT_PUBLIC_REPO_OWNER,
    REPO_NAME: process.env.NEXT_PUBLIC_REPO_NAME,
    GITHUB_TOKEN: process.env.NEXT_PUBLIC_GITHUB_TOKEN ? '已设置' : '未设置',
    ADMIN_PASSWORD: process.env.NEXT_PUBLIC_ADMIN_PASSWORD ? '已设置' : '未设置'
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8"><h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">设置</h1><p className="text-gray-600 dark:text-gray-400">管理您的SparkLog应用配置</p></div>
      {message && (<div className={`mb-6 p-4 rounded-lg ${messageType==='success' ? 'bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700' : 'bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700'}`}>{message}</div>)}
      <div className="grid gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4"><Settings className="w-6 h-6 text-gray-700 dark:text-gray-300 mr-3" /><h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">当前环境</h2></div>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex justify-between"><span>GitHub 仓库</span><span className="font-mono text-blue-800 dark:text-blue-200">{defaultConfig ? `${defaultConfig.owner}/${defaultConfig.repo}` : '未配置'}</span></div>
            <div className="flex justify-between"><span>NEXT_PUBLIC_REPO_OWNER</span><span className={envVars.REPO_OWNER ? 'text-green-600' : 'text-red-600'}>{envVars.REPO_OWNER ? '已配置' : '未配置'}</span></div>
            <div className="flex justify-between"><span>NEXT_PUBLIC_REPO_NAME</span><span className={envVars.REPO_NAME ? 'text-green-600' : 'text-red-600'}>{envVars.REPO_NAME ? '已配置' : '未配置'}</span></div>
            <div className="flex justify-between"><span>NEXT_PUBLIC_GITHUB_TOKEN</span><span className={envVars.GITHUB_TOKEN === '已设置' ? 'text-green-600' : 'text-red-600'}>{envVars.GITHUB_TOKEN}</span></div>
            <div className="flex justify-between"><span>NEXT_PUBLIC_ADMIN_PASSWORD</span><span className={envVars.ADMIN_PASSWORD === '已设置' ? 'text-green-600' : 'text-red-600'}>{envVars.ADMIN_PASSWORD}</span></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-4"><h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">管理员</h2></div>
          {isConnected ? (
            <div className="space-y-3">
              <div className="text-green-700 dark:text-green-200">已以管理员身份登录</div>
              <button onClick={handleLogout} className="flex items-center px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"><LogOut className="w-4 h-4 mr-2"/>退出</button>
            </div>
          ) : (
            <div className="space-y-4">
              {showLoginForm ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">管理员密码</label>
                    <input type="password" id="password" value={password} onChange={(e)=> setPassword(e.target.value)} onKeyDown={(e)=> e.key==='Enter' && handleLogin()} placeholder="请输入管理员密码" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" />
                  </div>
                  <div className="flex space-x-3">
                    <button onClick={handleLogin} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"><LogIn className="w-4 h-4 mr-2" />登录</button>
                    <button onClick={()=> setShowLoginForm(false)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors">取消</button>
                  </div>
                </div>
              ) : (
                <button onClick={()=> setShowLoginForm(true)} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"><LogIn className="w-4 h-4 mr-2" />管理员登录</button>
              )}
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">帮助与支持</h2>
          <div className="space-y-3">
            <a href="https://github.com/linyuxuanlin/sparklog" target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"><ExternalLink className="w-4 h-4 mr-2" />项目主页</a>
            <a href="https://github.com/linyuxuanlin/sparklog/issues" target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"><ExternalLink className="w-4 h-4 mr-2" />问题反馈</a>
          </div>
        </div>
      </div>
    </div>
  )
}

