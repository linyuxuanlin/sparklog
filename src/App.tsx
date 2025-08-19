import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import NotesPage from '@/pages/NotesPage'
import WanderPage from '@/pages/WanderPage'
import SettingsPage from '@/pages/SettingsPage'
import { useGitHub } from '@/hooks/useGitHub'

function App() {
  const { isLoading } = useGitHub()

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">检查GitHub连接状态...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* 首页直接显示所有笔记页面 */}
          <Route index element={<NotesPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="wander" element={<WanderPage />} />
          <Route path="wander/:noteId" element={<WanderPage />} />

          <Route path="note/:noteId" element={<NotesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App 