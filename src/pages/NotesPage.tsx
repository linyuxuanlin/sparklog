import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { Plus, BookOpen, Search, Settings, AlertCircle, Lock, Tag, X } from 'lucide-react'
import { useGitHub } from '@/hooks/useGitHub'
import { useNotes } from '@/hooks/useNotes'
import NoteCard from '@/components/NoteCard'
import NoteDetailModal from '@/components/NoteDetailModal'
import TagFilter from '@/components/TagFilter'
import { Note } from '@/types/Note'
import { showMessage, filterNotes, filterNotesByTags, getAllTags } from '@/utils/noteUtils'
import { checkEnvVarsConfigured } from '@/config/env'

const NotesPage: React.FC = () => {
  const { isLoading, isConnected, hasManagePermission } = useGitHub()
  const { notes, isLoadingNotes, loadNotes, loadMoreNotes, deleteNote, hasMoreNotes, loadingProgress, error, isRateLimited } = useNotes()
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [deletingNote, setDeletingNote] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [configModalType, setConfigModalType] = useState<'env' | 'password'>('env')
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 检查是否需要刷新笔记列表
  useEffect(() => {
    if (location.state?.shouldRefresh) {
      console.log('检测到需要刷新笔记列表')
      loadNotes(true)
      // 清除state，避免重复刷新
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, loadNotes, navigate, location.pathname])

  // 处理URL参数，如果有noteId参数则打开对应的笔记
  useEffect(() => {
    if (params.noteId && notes.length > 0) {
      const noteId = decodeURIComponent(params.noteId)
      const targetNote = notes.find(note => note.name.replace(/\.md$/, '') === noteId)
      if (targetNote) {
        setSelectedNote(targetNote)
        setIsModalOpen(true)
        // 更新URL但不重新加载页面
        navigate(`/note/${params.noteId}`, { replace: true })
      }
    }
  }, [params.noteId, notes, navigate])

  // 处理打开笔记
  const handleOpenNote = (note: Note) => {
    setSelectedNote(note)
    setIsModalOpen(true)
    const noteId = encodeURIComponent(note.name.replace(/\.md$/, ''))
    navigate(`/note/${noteId}`)
  }

  // 处理关闭模态框
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedNote(null)
    navigate('/')
  }



  // 显示消息提示
  const handleShowMessage = (text: string, type: 'success' | 'error') => {
    showMessage(setMessage, setMessageType, text, type)
  }

  // 处理创建笔记点击
  const handleCreateNote = () => {
    // 检查是否有管理权限
    if (!hasManagePermission()) {
      // 检查环境变量是否已配置
      const envConfigured = checkEnvVarsConfigured()
      
      if (!envConfigured) {
        // 环境变量未配置，显示环境变量配置提示
        setConfigModalType('env')
        setShowConfigModal(true)
      } else {
        // 环境变量已配置，显示管理员密码输入提示
        setConfigModalType('password')
        setShowConfigModal(true)
      }
      return
    }
    
    // 如果有管理权限，直接跳转到创建笔记页面
    navigate('/note/new')
  }

  // 编辑笔记
  const handleEditNote = (note: Note) => {
    // 先关闭模态框
    setIsModalOpen(false)
    setSelectedNote(null)
    
    // 然后跳转到编辑页面
    const timestamp = note.name.replace(/\.md$/, '')
    console.log('编辑笔记:', { originalName: note.name, timestamp, encoded: encodeURIComponent(timestamp) })
    navigate(`/note/edit/${encodeURIComponent(timestamp)}`)
  }

  // 处理标签点击
  const handleTagClick = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
    }
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
      
      // 如果当前有模态框打开，关闭它并跳转到首页
      if (isModalOpen) {
        setIsModalOpen(false)
        setSelectedNote(null)
        navigate('/')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '请重试'
      handleShowMessage(`删除失败: ${errorMessage}`, 'error')
    } finally {
      setDeletingNote(null)
    }
  }

  // 过滤笔记
  let filteredNotes = filterNotes(notes, searchQuery)
  filteredNotes = filterNotesByTags(filteredNotes, selectedTags)

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
            {configModalType === 'env' ? (
              // 环境变量配置提示
              <>
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
              </>
            ) : (
              // 管理员密码输入提示
              <>
                <div className="flex items-center mb-4">
                  <Lock className="w-6 h-6 text-blue-500 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">需要输入管理员密码</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                 请输入管理员密码验证，以编辑笔记
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
              </>
            )}
          </div>
        </div>
      )}

      {/* 搜索栏、标签筛选和按钮区域 */}
      <div className="mb-6 space-y-4">
        {/* 搜索栏和标签筛选 */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索笔记..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            
            {/* 标签筛选按钮 */}
            <TagFilter
              availableTags={getAllTags(notes)}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />
          </div>
          
          {/* 新建按钮右对齐 */}
          <button
            onClick={handleCreateNote}
            className="btn-neomorphic-primary inline-flex items-center justify-center h-10 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">新建笔记</span>
          </button>
        </div>
        
        {/* 已选标签显示和筛选结果统计 */}
        {(selectedTags.length > 0 || searchQuery || (searchQuery || selectedTags.length > 0)) && (
          <div className="space-y-2">
            {/* 已选标签显示 */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">已选标签:</span>
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-md"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                    <button
                      onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                      className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 focus:outline-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
                >
                  清除所有
                </button>
              </div>
            )}
            
            {/* 筛选结果统计 */}
            {(searchQuery || selectedTags.length > 0) && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {searchQuery && `搜索: "${searchQuery}"`}
                {searchQuery && selectedTags.length > 0 && " · "}
                {selectedTags.length > 0 && `标签筛选: ${selectedTags.length} 个标签`}
                {" - 找到 "}{filteredNotes.length} 个笔记
              </div>
            )}
          </div>
        )}
      </div>

      {error ? (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-400 dark:text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {isRateLimited ? 'GitHub API 访问限制' : '加载出错'}
          </h2>
          <div className="max-w-md mx-auto text-gray-600 dark:text-gray-400 mb-6">
            <p className="mb-4">{error}</p>
            {isRateLimited}
          </div>
          <div className="space-x-3">
            <button
              onClick={() => loadNotes(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              重试
            </button>
            {!hasManagePermission() && (
              <button
                onClick={() => navigate('/settings')}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                前往登录
              </button>
            )}
          </div>
        </div>
      ) : isLoadingNotes ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">加载笔记中...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {(searchQuery || selectedTags.length > 0) ? '没有找到匹配的笔记' : '还没有笔记'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {(searchQuery || selectedTags.length > 0) ? '尝试调整搜索关键词或标签筛选' : '创建你的第一篇笔记开始记录想法'}
          </p>
                                           <button
              onClick={handleCreateNote}
              className="btn-primary inline-flex items-center justify-center h-10"
            >
                                                           <Plus className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">创建第一篇笔记</span>
            </button>
        </div>
             ) : (
         <div className="space-y-4">
           <div className="grid gap-4">
             {filteredNotes.map((note, index) => (
                             <NoteCard
                key={`${note.sha}-${note.path || index}`}
                note={note}
                onOpen={handleOpenNote}
                onTagClick={handleTagClick}
              />
             ))}
           </div>
           
                       {/* 加载更多按钮 - 只在没有筛选条件时显示 */}
            {hasMoreNotes && selectedTags.length === 0 && !searchQuery && (
              <div className="text-center pt-6">
                <button
                  onClick={loadMoreNotes}
                  disabled={isLoadingNotes}
                  className="btn-neomorphic inline-flex items-center"
                >
                  {isLoadingNotes ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      加载中...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      更多想法
                    </>
                  )}
                </button>
              </div>
            )}
           
           {/* 加载进度显示 */}
           {isLoadingNotes && loadingProgress.total > 0 && (
             <div className="text-center py-4">
               <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                 <div 
                   className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                   style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
                 ></div>
               </div>
               <p className="text-sm text-gray-600 dark:text-gray-400">
                 正在加载笔记... {loadingProgress.current}/{loadingProgress.total}
               </p>
             </div>
           )}
         </div>
       )}
      
      {/* 笔记详情模态框 */}
      <NoteDetailModal
        note={selectedNote}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onEdit={handleEditNote}
        onDelete={handleDeleteNote}
        onConfirmDelete={confirmDelete}
        onCancelDelete={() => setConfirmingDelete(null)}
        confirmingDeleteId={confirmingDelete}
        deletingNoteId={deletingNote}
      />
    </div>
  )
}

export default NotesPage 