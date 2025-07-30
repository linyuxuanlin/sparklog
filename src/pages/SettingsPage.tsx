import React from 'react'
import { Github, Key, Database } from 'lucide-react'

const SettingsPage: React.FC = () => {
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
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Client ID
              </label>
              <input
                type="text"
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
                placeholder="输入你的GitHub OAuth Client Secret"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button className="btn-primary">
              连接GitHub
            </button>
          </div>
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