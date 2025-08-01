import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Plus, Settings, BookOpen } from 'lucide-react'
import { useGitHub } from '@/hooks/useGitHub'

const Sidebar: React.FC = () => {
  const location = useLocation()
  const { isLoggedIn } = useGitHub()

  console.log('Sidebar调试:', {
    isLoggedIn: isLoggedIn(),
    menuItems: isLoggedIn() ? '包含新建笔记' : '不包含新建笔记'
  })

  const menuItems = [
    { icon: BookOpen, label: '所有笔记', path: '/notes' },
    { icon: Settings, label: '设置', path: '/settings' },
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <Link to="/" className="block text-center">
          <h1 className="logo-title">SparkLog</h1>
          <p className="logo-subtitle mt-1">妙想笔记</p>
        </Link>
      </div>
      
      {/* 新建笔记按钮置顶 */}
      {isLoggedIn() && (
        <div className="p-4 border-b border-gray-200">
          <Link
            to="/note/new"
            className="btn-neomorphic-primary flex items-center justify-center w-full font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            新建笔记
          </Link>
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