import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Shuffle, Settings, X } from 'lucide-react'
import SparkLogLogo from '@/components/ui/SparkLogLogo'

interface SidebarProps {
  onClose: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const pathname = usePathname()

  const menuItems = [
    { icon: Home, label: '所有笔记', href: '/' },
    { icon: Shuffle, label: '漫游', href: '/wander' },
    { icon: Settings, label: '设置', href: '/settings' },
  ]

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* 头部 */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <SparkLogLogo size={32} className="text-blue-600 dark:text-blue-400 mr-3" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            SparkLog
          </h1>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 p-6">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* 底部信息 */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          基于GitHub仓库的静态笔记应用
        </p>
      </div>
    </div>
  )
}

export default Sidebar