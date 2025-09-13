"use client"
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from '@/lib/router'
import { Save, Loader2 } from 'lucide-react'
import { useGitHub } from '@/lib/useGitHub'
import { getDefaultRepoConfig, getDefaultGitHubToken } from '@/lib/defaultRepo'
import { formatTagsForFrontMatter, getAllTags } from '@/lib/note-utils'
import { checkEnvVarsConfigured } from '@/lib/env'
import TagManager from '@/components/TagManager'
import { useNotes } from '@/lib/useNotes'

export default function NoteEditPage() {
  const { title } = useParams<{ title?: string }>()
  const navigate = useNavigate()
  const { isConnected, isLoading: isGitHubLoading, isLoggedIn, getGitHubToken } = useGitHub()
  const { notes, createNote, updateNote } = useNotes()
  const isEditMode = !!title
  const [content, setContent] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success'|'error'|''>('')
  const [originalFile, setOriginalFile] = useState<{ path: string; sha: string } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustTextareaSize = useCallback(() => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; const h = Math.min(textareaRef.current.scrollHeight, window.innerHeight*0.6); textareaRef.current.style.height = `${h}px` } }, [])
  useEffect(()=> adjustTextareaSize(), [content])

  const loadExistingNote = useCallback(async (noteTitle: string) => {
    setIsLoading(true)
    try {
      const n = notes.find(n => n.name.replace(/\.md$/, '') === noteTitle)
      if (!n) throw new Error('未找到笔记文件')
      setOriginalFile({ path: n.path, sha: n.sha })
      // Try static single note
      const res = await fetch(`/static-notes/${noteTitle}.md.json`)
      if (res.ok) {
        const data = await res.json(); setContent(data.content || ''); setIsPrivate(!!data.isPrivate); setTags(data.tags || [])
      } else {
        setContent(n.contentPreview || ''); setTags(n.tags || [])
      }
    } finally { setIsLoading(false) }
  }, [notes])

  useEffect(() => { if (isEditMode && title) loadExistingNote(title) }, [isEditMode, title, loadExistingNote])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)
  const handleCancel = () => navigate('/')

  const handleSave = async () => {
    if (!content.trim()) return
    setIsSaving(true)
    try {
      const now = new Date().toISOString()
      const fm = `---\ncreated_at: "${now}"\nupdated_at: "${now}"\nprivate: ${isPrivate ? 'true':'false'}\ntags: ${formatTagsForFrontMatter(tags)}\n---\n\n`
      const finalContent = fm + content
      if (isEditMode && originalFile) {
        const fileName = originalFile.path.split('/').pop() || `${title}.md`
        await updateNote(fileName, finalContent, originalFile.sha)
      } else {
        const id = new Date().toISOString().replace(/[-:.TZ]/g, '-').slice(0, 23)
        await createNote(`${id}.md`, finalContent)
      }
      setMessage('保存成功'); setMessageType('success')
      navigate('/', { state: { shouldRefresh: true } })
    } catch (e:any) {
      setMessage(e?.message || '保存失败'); setMessageType('error')
    } finally { setIsSaving(false) }
  }

  if (isGitHubLoading) {
    return (<div className="max-w-4xl mx-auto"><div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p className="mt-4 text-gray-600 dark:text-gray-400">检查GitHub连接状态...</p></div></div>)
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-6 min-w-0 overflow-x-hidden">
      {message && (<div className={`mb-4 p-4 rounded-lg ${messageType==='success' ? 'bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700' : 'bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700'}`}><div className="flex items-center"><div className={`w-4 h-4 rounded-full mr-3 ${messageType==='success'?'bg-green-500':'bg-red-500'}`}></div><span>{message}</span></div></div>)}
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{isEditMode ? '编辑笔记' : '创建新笔记'}</h1></div>
      <div className="card p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-full min-w-0 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p className="mt-4 text-gray-600 dark:text-gray-400">加载笔记...</p></div>
        ) : (
          <div className="space-y-4 min-w-0 w-full">
            <div className="w-full space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">内容</label>
                <textarea ref={textareaRef} value={content} onChange={handleContentChange} placeholder="开始编写你的笔记..." rows={1} className="py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 font-sans text-base bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 min-h-[300px] max-h-[60vh] resize-none overflow-hidden break-words w-full scrollbar-hide" style={{ boxSizing: 'border-box', wordWrap: 'break-word', paddingLeft: '12px', paddingRight: '12px' }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">标签</label>
                <TagManager tags={tags} onChange={setTags} availableTags={getAllTags(notes)} placeholder="添加标签..." />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full min-w-0">
              <div className="flex items-center space-x-4 flex-shrink-0">
                <label className="flex items-center cursor-pointer"><input type="checkbox" checked={isPrivate} onChange={(e)=> setIsPrivate(e.target.checked)} className="mr-2"/><span className="text-sm text-gray-700 dark:text-gray-300">设为私密笔记</span></label>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                <button onClick={()=> navigate('/')} disabled={isSaving} className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed">取消</button>
                <button onClick={handleSave} disabled={isSaving || isLoading || !content.trim()} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center">{isSaving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />保存中...</>) : (<><Save className="w-4 h-4 mr-2" />保存笔记</>)}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

