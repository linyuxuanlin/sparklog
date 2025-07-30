import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Github, BookOpen, Globe, Calendar, Tag, Settings, Search } from 'lucide-react'
import { useGitHub } from '@/hooks/useGitHub'

const NotesPage: React.FC = () => {
  const { isConnected, isLoading } = useGitHub()
  const notes = [] // 模拟笔记数据
  const [searchQuery, setSearchQuery] = useState('')

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">检查GitHub连接状态...</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="mb-8">
            <Github className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              尚未连接GitHub
            </h2>
            <p className="text-gray-600 mb-6">
              请先连接GitHub账号才能查看和管理笔记
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4">连接步骤</h3>
            <ol className="text-left space-y-3 text-sm">
              <li className="flex items-start">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</span>
                <span>前往设置页面配置GitHub OAuth应用</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
                <span>授权应用访问你的GitHub仓库</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
                <span>选择或创建笔记存储仓库</span>
              </li>
            </ol>
            
            <div className="mt-6">
              <Link
                to="/settings"
                className="btn-primary inline-flex items-center"
              >
                <Settings className="w-4 h-4 mr-2" />
                前往设置
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">所有笔记</h1>
          <Link
            to="/note/new"
            className="btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            新建笔记
          </Link>
        </div>

        {/* 搜索栏 */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索笔记..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            还没有笔记
          </h2>
          <p className="text-gray-600 mb-6">
            创建你的第一篇笔记开始记录想法
          </p>
          <Link
            to="/note/new"
            className="btn-primary inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            创建第一篇笔记
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">所有笔记</h1>
        <Link
          to="/note/new"
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          新建笔记
        </Link>
      </div>

      {/* 搜索栏 */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="搜索笔记..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {/* 这里会显示笔记列表 */}
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-900 mr-3">
                  示例笔记
                </h3>
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-600">公开</span>
                </div>
              </div>
              <p className="text-gray-600 mb-3">
                这是一个示例笔记的摘要内容...
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>2024-01-15</span>
                </div>
                <div className="flex items-center">
                  <Tag className="w-4 h-4 mr-1" />
                  <span>示例, 笔记</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotesPage 