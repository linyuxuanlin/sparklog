import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, BookOpen, Search, Loader2, RefreshCw, Settings, AlertCircle } from 'lucide-react'
import { useGitHub } from '@/hooks/useGitHub'
import { useNotes } from '@/hooks/useNotes'
import NoteCard from '@/components/NoteCard'
import { Note } from '@/types/Note'
import { showMessage, filterNotes } from '@/utils/noteUtils'

const NotesPage: React.FC = () => {
  const { isLoading, isConnected, isLoggedIn } = useGitHub()
  const { notes, isLoadingNotes, loadNotes, deleteNote } = useNotes()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [deletingNote, setDeletingNote] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)

  // 检查是否需要刷新笔记列表
  useEffect(() => {
    if (location.state?.shouldRefresh) {
      console.log('检测到需要刷新笔记列表')
      loadNotes()
      // 清除state，避免重复刷新
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, loadNotes, navigate, location.pathname])

  // 显示消息提示
  const handleShowMessage = (text: string, type: 'success' | 'error') => {
    showMessage(setMessage, setMessageType, text, type)
  }

  // 处理创建笔记点击
  const handleCreateNote = () => {
    // 检查GitHub连接状态和登录状态
    if (!isConnected || !isLoggedIn()) {
      setShowConfigModal(true)
      return
    }
    
    // 如果已连接且已登录，直接跳转到创建笔记页面
    navigate('/note/new')
  }

  // 编辑笔记
  const handleEditNote = (note: Note) => {
    const timestamp = note.name.replace(/\.md$/, '')
    navigate(`/note/edit/${encodeURIComponent(timestamp)}`)
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
            ? 'bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700' 
            : 'bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'
        }`}>
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded-full mr-3 ${
              messageType === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span>{message}</span>
          </div>
        </div>
      )}

      {/* 配置环境提示模态框 */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-orange-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">需要配置环境变量</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              在创建笔记之前，您需要先配置环境变量。请在配置后前往设置页面查看是否生效。
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowConfigModal(false)
                  navigate('/settings')
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Settings className="w-4 h-4 mr-2" />
                前往设置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 搜索栏和按钮区域 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索笔记..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          <div className="flex items-center space-x-3">
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
            <button
              onClick={handleCreateNote}
              className="btn-neomorphic-primary inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              新建笔记
            </button>
          </div>
        </div>
        {searchQuery && (
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            搜索: "{searchQuery}" - 找到 {filteredNotes.length} 个笔记
          </div>
        )}
      </div>

      {isLoadingNotes ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">加载笔记中...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {searchQuery ? '没有找到匹配的笔记' : '还没有笔记'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery ? '尝试调整搜索关键词' : '创建你的第一篇笔记开始记录想法'}
          </p>
          <button
            onClick={handleCreateNote}
            className="btn-primary inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            创建第一篇笔记
          </button>
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