"use client"
import React, { useEffect, useState } from 'react'
import { X, Edit, Trash2, Github, Tag, Check } from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer'
import { Note } from '../types/note'
import { StaticService } from '@/lib/staticService'

const removeFrontMatter = (content: string): string => {
  const lines = content.split('\n'); let inFM=false, end=-1
  for (let i=0;i<lines.length;i++){ const l=lines[i].trim(); if (l==='---'&&!inFM){inFM=true; continue} if(l==='---'&&inFM){end=i;break} }
  const contentLines = end>=0? lines.slice(end+1):lines
  return contentLines.join('\n').trim()
}

export default function NoteDetailModal({ note, isOpen, onClose, onEdit, onDelete, onConfirmDelete, confirmingDeleteId, deletingNoteId }: {
  note: Note | null
  isOpen: boolean
  onClose: () => void
  onEdit: (_note: Note) => void
  onDelete: (_note: Note) => void
  onConfirmDelete: (_note: Note) => void
  confirmingDeleteId: string | null
  deletingNoteId: string | null
}) {
  const [fullContent, setFullContent] = useState<string>('')
  const [isLoadingContent, setIsLoadingContent] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!note || !isOpen) { setFullContent(''); return }
      if (note.fullContent || note.content) { setFullContent(note.fullContent || note.content || ''); return }
      setIsLoadingContent(true)
      try {
        const staticService = StaticService.getInstance()
        const staticNote = await staticService.getStaticNote(note.name?.replace(/\.md$/, '') || note.path?.split('/').pop()?.replace(/\.md$/, '') || '')
        if (staticNote) setFullContent(staticNote.content)
        else setFullContent(note.contentPreview || '')
      } catch {
        setFullContent(note.contentPreview || '')
      } finally { setIsLoadingContent(false) }
    }
    load()
  }, [note, isOpen])

  if (!isOpen || !note) return null
  const isConfirming = confirmingDeleteId === note.sha
  const isDeleting = deletingNoteId === note.sha

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl card">
        <div className="flex items-center justify-between p-4">
          <div className="font-semibold">{note.title || note.name}</div>
          <div className="flex items-center gap-2">
            <button onClick={()=> onEdit(note)} className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Edit className="w-5 h-5"/></button>
            <a href={note.html_url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"><Github className="w-5 h-5"/></a>
            {isConfirming ? (
              <button onClick={()=> onConfirmDelete(note)} className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Check className="w-5 h-5"/></button>
            ) : (
              <button onClick={()=> onDelete(note)} disabled={isDeleting} className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"><Trash2 className="w-5 h-5"/></button>
            )}
            <button onClick={onClose} className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5"/></button>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700" />
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {isLoadingContent ? (
            <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div><div className="text-gray-500 dark:text-gray-400">加载笔记内容...</div></div>
          ) : (
            <div className="prose prose-gray dark:prose-invert max-w-none prose-2xl prose-p:my-0">
              <MarkdownRenderer content={removeFrontMatter(fullContent)} />
            </div>
          )}
          {note.tags && note.tags.length>0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                {note.tags.map((t,i)=>(<span key={i} className="inline-flex items-center px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-lg"><Tag className="w-4 h-4 mr-1.5"/>{t}</span>))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
