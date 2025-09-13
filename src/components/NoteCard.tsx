"use client"
import React, { useMemo } from 'react'
import { Globe, Calendar, Tag } from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer'
import { useGitHub } from '@/lib/useGitHub'
import { Note } from '@/types/note'

const removeFrontMatter = (content: string): string => {
  const lines = content.split('\n')
  let inFM = false, end = -1
  for (let i=0;i<lines.length;i++){
    const l = lines[i].trim()
    if (l==='---' && !inFM){inFM=true; continue}
    if (l==='---' && inFM){end=i; break}
  }
  const contentLines = end>=0? lines.slice(end+1):lines
  return contentLines.join('\n').trim()
}

const formatTimeDisplay = (d?: string) => {
  if (!d) return '未知日期'
  const date = new Date(d); if (isNaN(date.getTime())) return '未知日期'
  const now = new Date()
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yest = new Date(today.getTime() - 86400000)
  if (dateOnly.getTime() === today.getTime()) return '今天'
  if (dateOnly.getTime() === yest.getTime()) return '昨天'
  const diffDays = Math.floor((today.getTime() - dateOnly.getTime())/86400000)
  if (diffDays <= 7) return `${diffDays}天前`
  if (diffDays <= 30) return `${Math.floor(diffDays/7)}周前`
  return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`
}

export default function NoteCard({ note, onOpen, onTagClick }: { note: Note; onOpen: (n: Note)=>void; onTagClick?: (t: string)=>void }) {
  const { isLoggedIn } = useGitHub()
  const displayTime = note.updated_at || note.updatedDate || note.created_at || note.createdDate
  const preview = useMemo(()=> removeFrontMatter(note.content || note.contentPreview || ''), [note])
  return (
    <div className="card p-4 sm:p-6 hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer" onClick={()=>onOpen(note)}>
      {preview && (
        <div className="text-gray-600 dark:text-gray-300 mb-3">
          <div className="line-clamp-3"><MarkdownRenderer content={preview} /></div>
        </div>
      )}
      <div className="flex items-center justify-between mt-0">
        <div className="flex flex-wrap gap-1">
          {note.tags?.map((t, i)=>(
            <span key={i} onClick={(e)=>{e.stopPropagation(); onTagClick?.(t)}} className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-md">
              <Tag className="w-3 h-3 mr-1" />{t}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Calendar className="w-4 h-4" /> {formatTimeDisplay(displayTime)}
          {isLoggedIn() && (
            <>
              {note.isPrivate ? (
                <span className="text-red-600 dark:text-red-400 flex items-center"><Globe className="w-4 h-4 mr-1"/>私密</span>
              ): (
                <span className="text-green-600 dark:text-green-400 flex items-center"><Globe className="w-4 h-4 mr-1"/>公开</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

