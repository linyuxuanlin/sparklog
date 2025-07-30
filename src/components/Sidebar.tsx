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
  )
}

export default Sidebar 