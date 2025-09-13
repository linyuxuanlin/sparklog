"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation, useParams } from '@/lib/router'
import { Plus, BookOpen, Search, AlertCircle, Tag, X } from 'lucide-react'
import { useGitHub } from '@/lib/useGitHub'
import { useNotes } from '@/lib/useNotes'
import NoteCard from '@/components/NoteCard'
import NoteDetailModal from '@/components/NoteDetailModal'
import TagFilter from '@/components/TagFilter'
import { Note } from '../../types/note'
import { showMessage, filterNotes, filterNotesByTags, getAllTags } from '@/lib/note-utils'
import { checkEnvVarsConfigured } from '@/lib/env'

export default function NotesPage() {
  const { isConnected, isLoggedIn } = useGitHub()
  const { notes, isLoadingNotes, loadNotes, loadMoreNotes, deleteNote, hasMoreNotes, loadingProgress, error, isRateLimited } = useNotes()
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams<{ noteId: string }>()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [deletingNote, setDeletingNote] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => { if (params.noteId && notes.length > 0) { const id = decodeURIComponent(params.noteId); const n = notes.find(n => n.name.replace(/\.md$/, '') === id); if (n) { setSelectedNote(n); setIsModalOpen(true); navigate(`/note/${params.noteId}`, { replace: true }) } } }, [params.noteId, notes])

  const handleOpenNote = (note: Note) => { setSelectedNote(note); setIsModalOpen(true); const id = encodeURIComponent(note.name.replace(/\.md$/, '')); navigate(`/note/${id}`) }
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedNote(null); navigate('/') }
  const handleCreateNote = () => {
    if (!isConnected || !isLoggedIn()) { const envConfigured = checkEnvVarsConfigured(); navigate('/settings'); return }
    navigate('/note/new')
  }
  const handleEditNote = (note: Note) => { setIsModalOpen(false); setSelectedNote(null); const timestamp = note.name.replace(/\.md$/, ''); navigate(`/note/edit/${encodeURIComponent(timestamp)}`) }
  const handleTagClick = (tag: string) => { if (!selectedTags.includes(tag)) setSelectedTags([...selectedTags, tag]) }
  const handleDeleteNote = async (note: Note) => { setConfirmingDelete(note.sha) }
  const confirmDelete = async (note: Note) => { setConfirmingDelete(null); setDeletingNote(note.sha); try { await deleteNote(note); showMessage(setMessage, setMessageType, '笔记删除成功', 'success'); setIsModalOpen(false); setSelectedNote(null); navigate('/') } catch (e:any) { showMessage(setMessage, setMessageType, e?.message || '删除失败', 'error') } finally { setDeletingNote(null) } }

  const filteredNotes = useMemo(() => filterNotesByTags(filterNotes(notes, searchQuery), selectedTags), [notes, searchQuery, selectedTags])
  const tags = useMemo(()=> getAllTags(notes), [notes])

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="w-full pl-9 pr-3 h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900" placeholder="搜索..." value={searchQuery} onChange={(e)=> setSearchQuery(e.target.value)}/>
          </div>
          <button onClick={handleCreateNote} className="btn-primary inline-flex items-center justify-center h-10"><Plus className="w-4 h-4" /><span className="hidden sm:inline ml-2">新建</span></button>
        </div>
        <TagFilter availableTags={tags} selectedTags={selectedTags} onTagsChange={setSelectedTags} />
      </div>

      {error ? (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-400 dark:text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{isRateLimited ? 'GitHub API 访问限制' : '加载出错'}</h2>
          <div className="max-w-md mx-auto text-gray-600 dark:text-gray-400 mb-6">{error}</div>
          <div className="space-x-3"><button onClick={()=> loadNotes(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">重试</button></div>
        </div>
      ) : isLoadingNotes ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p className="mt-4 text-gray-600 dark:text-gray-400">加载笔记...</p></div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">还没有笔记</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">创建你的第一篇笔记开始记录想法</p>
          <button onClick={handleCreateNote} className="btn-primary inline-flex items-center justify-center h-10"><Plus className="w-4 h-4" /><span className="hidden sm:inline ml-2">创建第一篇笔记</span></button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4">
            {filteredNotes.map((n, i)=> (
              <NoteCard key={`${n.sha}-${n.path||i}`} note={n} onOpen={handleOpenNote} onTagClick={handleTagClick}/>
            ))}
          </div>
        </div>
      )}

      <NoteDetailModal note={selectedNote} isOpen={isModalOpen} onClose={handleCloseModal} onEdit={handleEditNote} onDelete={handleDeleteNote} onConfirmDelete={confirmDelete} confirmingDeleteId={confirmingDelete} deletingNoteId={deletingNote} />
    </div>
  )
}
