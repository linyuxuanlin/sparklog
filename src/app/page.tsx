'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, BookOpen, Search, Settings, AlertCircle, Lock, Tag, X } from 'lucide-react'
import { useNotesStore, useAuthStore } from '@/lib/store'
import { checkEnvVarsConfigured } from '@/lib/config'
import NoteCard from '@/components/notes/NoteCard'
import TagFilter from '@/components/notes/TagFilter'
import { filterNotes, filterNotesByTags, getAllTags } from '@/lib/utils'
import { Note } from '@/types'

export default function NotesPage() {
  const router = useRouter()
  const { 
    notes, 
    isLoading, 
    error, 
    searchQuery, 
    selectedTags, 
    setSearchQuery, 
    setSelectedTags 
  } = useNotesStore()
  const { isLoggedIn } = useAuthStore()
  
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [configModalType, setConfigModalType] = useState<'env' | 'password'>('env')

  // 处理创建笔记点击
  const handleCreateNote = () => {
    if (!isLoggedIn) {
      const envConfigured = checkEnvVarsConfigured()
      
      if (!envConfigured) {
        setConfigModalType('env')
        setShowConfigModal(true)
      } else {
        setConfigModalType('password')
        setShowConfigModal(true)
      }
      return
    }
    
    router.push('/notes/new')
  }

  // 处理标签点击
  const handleTagClick = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  // 处理打开笔记
  const handleOpenNote = (note: Note) => {
    const noteId = encodeURIComponent(note.name.replace(/\.md$/, ''))
    router.push(`/notes/${noteId}`)
  }

  // 过滤笔记
  let filteredNotes = filterNotes(notes, searchQuery)
  filteredNotes = filterNotesByTags(filteredNotes, selectedTags)

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载笔记中...</p>
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
                      router.push('/settings')
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    前往设置
                  </button>
                </div>
              </>
            ) : (
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
                      router.push('/settings')
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
            
            <TagFilter
              availableTags={getAllTags(notes)}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />
          </div>
          
          <button
            onClick={handleCreateNote}
            className="inline-flex items-center justify-center h-10 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">新建笔记</span>
          </button>
        </div>
        
        {/* 已选标签显示和筛选结果统计 */}
        {(selectedTags.length > 0 || searchQuery) && (
          <div className="space-y-2">
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
            加载出错
          </h2>
          <div className="max-w-md mx-auto text-gray-600 dark:text-gray-400 mb-6">
            <p className="mb-4">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            重试
          </button>
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
            className="inline-flex items-center justify-center h-10 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
        </div>
      )}
    </div>
  )
}
