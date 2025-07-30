<<<<<<< Updated upstream
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import NotesPage from './pages/NotesPage'
import './App.css'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="auth" element={<AuthPage />} />
          <Route path="notes" element={<NotesPage />} />
=======
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import HomePage from '@/pages/HomePage'
import NoteEditPage from '@/pages/NoteEditPage'
import SettingsPage from '@/pages/SettingsPage'
import AuthCallbackPage from '@/pages/AuthCallbackPage'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="note/new" element={<NoteEditPage />} />
          <Route path="note/:id" element={<NoteEditPage />} />
          <Route path="settings" element={<SettingsPage />} />
>>>>>>> Stashed changes
        </Route>
      </Routes>
    </div>
  )
}

export default App 