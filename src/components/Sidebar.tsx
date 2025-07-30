<<<<<<< Updated upstream
import { Link, useLocation } from 'react-router-dom'
import { Home, FileText, Settings } from 'lucide-react'

const Sidebar = () => {
  const location = useLocation()
  
  const navigation = [
    { name: '首页', href: '/', icon: Home },
    { name: '笔记', href: '/notes', icon: FileText },
    { name: '设置', href: '/settings', icon: Settings },
  ]
  
  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700">
      <nav className="mt-5 px-2">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    isActive
                      ? 'text-primary-500'
                      : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300'
                  }`}
                />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
=======
import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Plus, Home, Settings, BookOpen } from 'lucide-react'

const Sidebar: React.FC = () => {
  const location = useLocation()

  const menuItems = [
    { icon: Home, label: '首页', path: '/' },
    { icon: Plus, label: '新建笔记', path: '/note/new' },
    { icon: BookOpen, label: '所有笔记', path: '/notes' },
    { icon: Settings, label: '设置', path: '/settings' },
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">SparkLog</h1>
        <p className="text-sm text-gray-500">妙想笔记</p>
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
>>>>>>> Stashed changes
  )
}

export default Sidebar 