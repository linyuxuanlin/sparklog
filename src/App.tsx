import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import NotesPage from '@/pages/NotesPage'
import NoteEditPage from '@/pages/NoteEditPage'
import SettingsPage from '@/pages/SettingsPage'
import { useGitHub } from '@/hooks/useGitHub'
import { checkEnvVarsConfigured } from '@/config/env'
import { useEffect } from 'react'
import { debugEnvironment } from '@/utils/debugUtils'

function App() {
  const { isLoading } = useGitHub()

  // Add environment check
  useEffect(() => {
    console.log('App initialization:', {
      mode: import.meta.env.MODE,
      isDev: import.meta.env.DEV,
      envConfigured: checkEnvVarsConfigured()
    })
    
    // Run debug in Cloudflare Pages environment
    if (!import.meta.env.DEV) {
      debugEnvironment()
    }
  }, [])

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Checking GitHub connection status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Home page directly shows all notes page */}
          <Route index element={<NotesPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="note/new" element={<NoteEditPage />} />
          <Route path="note/edit/:title" element={<NoteEditPage />} />
          <Route path="note/:noteId" element={<NotesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App 