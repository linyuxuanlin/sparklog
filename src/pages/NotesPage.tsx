import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, BookOpen, Search, Loader2, RefreshCw } from 'lucide-react'
import { useGitHub } from '@/hooks/useGitHub'
import { useNotes } from '@/hooks/useNotes'
import NoteCard from '@/components/NoteCard'
import { Note } from '@/types/Note'
import { showMessage, filterNotes } from '@/utils/noteUtils'

const NotesPage: React.FC = () => {
  const { isLoading } = useGitHub()
  const { notes, isLoadingNotes, loadNotes, deleteNote } = useNotes()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [deletingNote, setDeletingNote] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)

  // 显示消息提示
  const handleShowMessage = (text: string, type: 'success' | 'error') => {
    showMessage(setMessage, setMessageType, text, type)
  }

  // 编辑笔记
  const handleEditNote = (note: Note) => {
    const title = note.parsedTitle || note.name.replace(/\.md$/, '')
    navigate(`/note/edit/${encodeURIComponent(title)}`)
  }

  // 删除笔记
  const handleDeleteNote = async (note: Note) => {
    setConfirmingDelete(note.sha)
  }

  const confirmDelete = async (note: Note) => {
    setConfirmingDelete(null)
    setDeletingNote(note.sha)
    
    try {
      await deleteNote(note)
      handleShowMessage('笔记删除成功！', 'success')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '请重试'
      handleShowMessage(`删除失败: ${errorMessage}`, 'error')
    } finally {
      setDeletingNote(null)
    }
  }

  // 过滤笔记
  const filteredNotes = filterNotes(notes, searchQuery)

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">检查GitHub连接状态...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 覆盖式消息提示 */}
      {message && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg border ${
          messageType === 'success' 
            ? 'bg-green-50 text-green-800 border-green-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded-full mr-3 ${
              messageType === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span>{message}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">所有笔记</h1>
      </div>

      {/* 搜索栏和刷新按钮 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索笔记..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={loadNotes}
            disabled={isLoadingNotes}
            className="btn-neomorphic inline-flex items-center"
          >
            {isLoadingNotes ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            刷新
          </button>
        </div>
        {searchQuery && (
          <div className="mt-2 text-sm text-gray-500">
            搜索: "{searchQuery}" - 找到 {filteredNotes.length} 个笔记
          </div>
        )}
      </div>

      {isLoadingNotes ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载笔记中...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {searchQuery ? '没有找到匹配的笔记' : '还没有笔记'}
          </h2>
          <p className="text-gray-600 mb-6">
            {searchQuery ? '尝试调整搜索关键词' : '创建你的第一篇笔记开始记录想法'}
          </p>
          <Link
            to="/note/new"
            className="btn-primary inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            创建第一篇笔记
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.sha}
              note={note}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
              onConfirmDelete={confirmDelete}
              onCancelDelete={() => setConfirmingDelete(null)}
              confirmingDeleteId={confirmingDelete}
              deletingNoteId={deletingNote}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default NotesPage 