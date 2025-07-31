import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Plus, Settings, BookOpen } from 'lucide-react'
import { useGitHub } from '@/hooks/useGitHub'

const Sidebar: React.FC = () => {
  const location = useLocation()
  const { hasManagePermission } = useGitHub()

  const menuItems = [
    { icon: BookOpen, label: '所有笔记', path: '/notes' },
    ...(hasManagePermission() ? [{ icon: Plus, label: '新建笔记', path: '/note/new' }] : []),
    { icon: Settings, label: '设置', path: '/settings' },
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <Link to="/" className="block">
          <h1 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">SparkLog</h1>
          <p className="text-sm text-gray-500">妙想笔记</p>
        </Link>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
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