import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Plus, Settings, BookOpen, X, AlertCircle } from 'lucide-react'
import { useGitHub } from '@/hooks/useGitHub'

interface SidebarProps {
  onClose?: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isLoggedIn, isConnected } = useGitHub()
  const [showConfigModal, setShowConfigModal] = useState(false)

  console.log('Sidebar调试:', {
    isLoggedIn: isLoggedIn(),
    isConnected,
    menuItems: isLoggedIn() ? '包含新建笔记' : '不包含新建笔记'
  })

  // 处理创建笔记点击
  const handleCreateNote = () => {
    // 检查GitHub连接状态和登录状态
    if (!isConnected || !isLoggedIn()) {
      setShowConfigModal(true)
      return
    }
    
    // 如果已连接且已登录，直接跳转到创建笔记页面
    navigate('/note/new')
    if (onClose) {
      onClose()
    }
  }

  const menuItems = [
    { icon: BookOpen, label: '所有笔记', path: '/' },
    { icon: Settings, label: '设置', path: '/settings' },
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* 移动端关闭按钮 */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
        <div className="text-center flex-1">
          <h1 className="logo-title">SparkLog</h1>
          <p className="logo-subtitle">妙想笔记</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* 桌面端Logo */}
      <div className="hidden lg:block p-6 border-b border-gray-200">
        <Link to="/" className="block text-center">
          <h1 className="logo-title">SparkLog</h1>
          <p className="logo-subtitle">妙想笔记</p>
        </Link>
      </div>
      
      {/* 新建笔记按钮置顶 */}
      {isLoggedIn() && (
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={handleCreateNote}
            className="btn-neomorphic-primary flex items-center justify-center w-full font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            新建笔记
          </button>
        </div>
      )}

      {/* 配置环境提示模态框 */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-orange-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">需要配置环境变量</h3>
            </div>
            <p className="text-gray-600 mb-6">
              在创建笔记之前，您需要先配置环境变量。请在配置后前往设置页面查看是否生效。
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowConfigModal(false)
                  navigate('/settings')
                  if (onClose) {
                    onClose()
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Settings className="w-4 h-4 mr-2" />
                前往设置
              </button>
            </div>
          </div>
        </div>
      )}
      
      <nav className="flex-1 p-4">
        <ul className="space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors font-semibold ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={onClose}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

export default Sidebar 