import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import NotesPage from '@/pages/NotesPage'
import NoteEditPage from '@/pages/NoteEditPage'
import SettingsPage from '@/pages/SettingsPage'
import { useGitHub } from '@/hooks/useGitHub'

function App() {
  const { isLoading } = useGitHub()

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">检查GitHub连接状态...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* 默认显示所有笔记页面，未连接用户也能看到公开笔记 */}
          <Route index element={<Navigate to="/notes" replace />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="note/new" element={<NoteEditPage />} />
          <Route path="note/edit/:title" element={<NoteEditPage />} />
          <Route path="note/:id" element={<NoteEditPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App 