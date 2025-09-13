"use client"
import React, { useMemo, useState } from 'react'
import { useLocation } from '@/lib/router'
import Header from './Header'
import Sidebar from './Sidebar'
import NotesPage from './pages/NotesPage'
import WanderPage from './pages/WanderPage'
import NoteEditPage from './pages/NoteEditPage'
import SettingsPage from './pages/SettingsPage'

export default function AppShell() {
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const view = useMemo(() => {
    if (pathname === '/' || pathname === '/notes') return <NotesPage />
    if (pathname.startsWith('/wander')) return <WanderPage />
    if (pathname === '/note/new' || pathname.startsWith('/note/edit')) return <NoteEditPage />
    if (pathname.startsWith('/note/')) return <NotesPage />
    if (pathname === '/settings') return <SettingsPage />
    return <NotesPage />
  }, [pathname])

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900 overflow-x-hidden min-h-screen">
      {sidebarOpen && (<div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />)}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="flex-1 flex flex-col lg:ml-0 min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 overflow-y-auto overflow-x-hidden min-w-0 scrollbar-hide">
          {view}
        </main>
      </div>
    </div>
  )
}

