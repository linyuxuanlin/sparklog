"use client"
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from '@/lib/router'
import { Plus, Shuffle, AlertCircle, Tag, X } from 'lucide-react'
import { useGitHub } from '@/lib/useGitHub'
import { useNotes } from '@/lib/useNotes'
import NoteCard from '@/components/NoteCard'
import NoteDetailModal from '@/components/NoteDetailModal'
import { Note } from '../../types'
import { filterNotesByTags } from '@/lib/note-utils'
import { checkEnvVarsConfigured } from '@/lib/env'

export default function WanderPage() {
  const { isConnected, isLoggedIn } = useGitHub()
  const { notes, isLoadingNotes, loadNotes, deleteNote, error, isRateLimited } = useNotes()
  const navigate = useNavigate()
  const params = useParams<{ noteId: string }>()
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deletingNote, setDeletingNote] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)
  const [displayCount, setDisplayCount] = useState(6)

  const shuffleArray = (arr: Note[]) => { const a=[...arr]; for(let i=a.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a }
  const filtered = useMemo(()=> filterNotesByTags(notes, selectedTags), [notes, selectedTags])
  const shuffledNotes = useMemo(()=> shuffleArray(filtered), [filtered])
  const displayedNotes = shuffledNotes.slice(0, displayCount)

  useEffect(() => { if (params.noteId && notes.length > 0) { const id = decodeURIComponent(params.noteId); const n = notes.find(n => n.name.replace(/\.md$/, '') === id); if (n) { setSelectedNote(n); setIsModalOpen(true); navigate(`/wander/${params.noteId}`, { replace: true }) } } }, [params.noteId, notes])

  const handleOpenNote = (note: Note) => { setSelectedNote(note); setIsModalOpen(true); const id = encodeURIComponent(note.name.replace(/\.md$/, '')); navigate(`/wander/${id}`) }
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedNote(null); navigate('/wander') }
  const handleCreateNote = () => { if (!isConnected || !isLoggedIn()) { const env = checkEnvVarsConfigured(); navigate('/settings'); return } navigate('/note/new') }
  const handleEditNote = (note: Note) => { setIsModalOpen(false); setSelectedNote(null); const ts = note.name.replace(/\.md$/, ''); navigate(`/note/edit/${encodeURIComponent(ts)}`) }
  const handleDeleteNote = async (note: Note) => setConfirmingDelete(note.sha)
  const confirmDelete = async (note: Note) => { setConfirmingDelete(null); setDeletingNote(note.sha); try { await deleteNote(note); setIsModalOpen(false); setSelectedNote(null); navigate('/wander') } finally { setDeletingNote(null) } }

  return (
    <div className="max-w-4xl mx-auto">
      {error ? (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-400 dark:text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{isRateLimited ? 'GitHub API 访问限制' : '加载出错'}</h2>
          <div className="max-w-md mx-auto text-gray-600 dark:text-gray-400 mb-6">{error}</div>
          <div className="space-x-3"><button onClick={()=> loadNotes(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">重试</button></div>
        </div>
      ) : isLoadingNotes ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p className="mt-4 text-gray-600 dark:text-gray-400">加载笔记...</p></div>
      ) : displayedNotes.length === 0 ? (
        <div className="text-center py-12">
          <Shuffle className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">还没有笔记</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">创建你的第一篇笔记开始记录想法</p>
          <button onClick={handleCreateNote} className="btn-primary inline-flex items-center justify-center h-10"><Plus className="w-4 h-4" /><span className="hidden sm:inline ml-2">创建第一篇笔记</span></button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4">
            {displayedNotes.map((note, index) => (
              <NoteCard key={`${note.sha}-${note.path || index}`} note={note} onOpen={handleOpenNote} onTagClick={(t)=> setSelectedTags(s=> s.includes(t)? s: [...s, t])} />
            ))}
          </div>
        </div>
      )}
      <NoteDetailModal note={selectedNote} isOpen={isModalOpen} onClose={handleCloseModal} onEdit={handleEditNote} onDelete={handleDeleteNote} onConfirmDelete={confirmDelete} confirmingDeleteId={confirmingDelete} deletingNoteId={deletingNote} />
    </div>
  )
}
