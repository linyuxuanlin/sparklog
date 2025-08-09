import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Settings, BookOpen, Shuffle } from 'lucide-react'
import { useGitHub } from '@/hooks/useGitHub'

interface SidebarProps {
  onClose?: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation()
  const { isLoggedIn, isConnected } = useGitHub()

  console.log('Sidebar调试:', {
    isLoggedIn: isLoggedIn(),
    isConnected,
    menuItems: '不包含新建笔记'
  })

  const menuItems = [
    { icon: BookOpen, label: '所有笔记', path: '/' },
    { icon: Shuffle, label: '漫游', path: '/wander' },
    { icon: Settings, label: '设置', path: '/settings' },
  ]

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* 移动端Logo */}
      <div className="lg:hidden p-4 border-b border-gray-200 dark:border-gray-700 min-h-[7rem]">
        <Link 
          to="/" 
          onClick={onClose}
          className="block text-center flex flex-col justify-center h-full px-2"
        >
          <h1 className="logo-title">SparkLog</h1>
          <p className="logo-subtitle"> </p>
        </Link>
      </div>
      
      {/* 桌面端Logo */}
      <div className="hidden lg:block p-6 border-b border-gray-200 dark:border-gray-700 min-h-[8rem]">
        <Link to="/" className="block text-center flex flex-col justify-center h-full px-4">
          <h1 className="logo-title">SparkLog</h1>
          <p className="logo-subtitle"> </p>
        </Link>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = item.path === '/' 
              ? location.pathname === '/' || location.pathname === '/notes'
              : location.pathname.startsWith(item.path)
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors font-semibold ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-r-2 border-blue-700 dark:border-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
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