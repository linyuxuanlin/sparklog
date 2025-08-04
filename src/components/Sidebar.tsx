import React, { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Settings, BookOpen, X } from 'lucide-react'
import { useGitHub } from '@/hooks/useGitHub'

interface SidebarProps {
  onClose: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation()
  const { isConnected, isOwner, isLoading } = useGitHub()

  useEffect(() => {
    console.log('Sidebar debug:', {
      isConnected,
      isOwner,
      isLoading
    })
  }, [isConnected, isOwner, isLoading])

  const menuItems = [
    {
      name: '笔记',
      path: '/',
      icon: BookOpen
    },
    {
      name: '设置',
      path: '/settings',
      icon: Settings
    }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
      <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">菜单</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </div>
  )
}

export default Sidebar 