"use client"
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Note } from '../types/note'
import { useGitHub } from './useGitHub'
import { getDefaultRepoConfig, getDefaultGitHubToken } from './defaultRepo'
import { decodeBase64Content, parseNoteContent } from './note-utils'
import { GitHubService } from './githubService'
import { StaticService } from './staticService'

export const useNotes = () => {
  const { isLoggedIn, getGitHubToken, isLoading } = useGitHub()
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [hasMoreNotes, setHasMoreNotes] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  const [isRateLimited, setIsRateLimited] = useState(false)

  const pageSize = 10
  const isInitialLoadRef = useRef(false)

  const loadNotesFromStatic = useCallback(async (): Promise<boolean> => {
    try {
      const staticService = StaticService.getInstance()
      const merged = await staticService.getMergedNotes()
      if (merged.length > 0) {
        const filtered = merged.filter(n => (isLoggedIn() ? true : !n.isPrivate))
        filtered.sort((a,b) => new Date(b.createdDate || b.created_at || '1970').getTime() - new Date(a.createdDate || a.created_at || '1970').getTime())
        setNotes(filtered.slice(0, pageSize))
        setHasMoreNotes(filtered.length > pageSize)
        setCurrentPage(1)
        return true
      }
      return false
    } catch (e:any) {
      console.error('静态加载失败', e)
      return false
    }
  }, [isLoggedIn])

  const loadNotesFromGitHub = useCallback(async (_page = 1) => {
    setIsLoadingNotes(true); setError(null); setIsRateLimited(false)
    try {
      const cfg = getDefaultRepoConfig(); if (!cfg) throw new Error('未配置默认仓库')
      const auth = { username: cfg.owner, repo: cfg.repo, accessToken: getDefaultGitHubToken() }
      const logged = isLoggedIn(); if (logged) { const t = getGitHubToken(); if (t) auth.accessToken = t }
      const gh = GitHubService.getInstance(); gh.setAuthData(auth)
      const files = await gh.getNotesFiles()
      setLoadingProgress({ current: 0, total: files.length })
      const batch = await gh.getBatchNotesContent(files)
      const parsed = files.map(f => {
        const data = batch[f.path]
        if (!data) return null
        const content = decodeBase64Content(data.content)
        const meta = parseNoteContent(content, f.name)
        return { ...f, contentPreview: meta.contentPreview, createdDate: meta.createdDate || f.created_at, updatedDate: meta.updatedDate || f.updated_at, isPrivate: meta.isPrivate, tags: meta.tags } as Note
      }).filter(Boolean) as Note[]
      const filtered = parsed.filter(n => (isLoggedIn() ? true : !n.isPrivate))
      setNotes(filtered.slice(0, pageSize))
      setHasMoreNotes(filtered.length > pageSize)
      setCurrentPage(1)
    } catch (e: any) {
      setError(e?.message || '加载失败')
      if (String(e?.message || '').includes('rate')) setIsRateLimited(true)
    } finally { setIsLoadingNotes(false); setLoadingProgress({ current: 0, total: 0 }) }
  }, [getGitHubToken, isLoggedIn])

  const loadNotes = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const ok = await loadNotesFromStatic()
      if (ok) return
    }
    await loadNotesFromGitHub(1)
  }, [loadNotesFromStatic, loadNotesFromGitHub])

  const loadMoreNotes = useCallback(async () => {
    setNotes(prev => { setCurrentPage(p => p + 1); const start = (currentPage) * pageSize; return prev.concat([]) })
    // For simplicity, we rely on initial load to bring all data (static or github) and page in memory
  }, [currentPage])

  const createNote = useCallback(async (fileName: string, content: string) => {
    const cfg = getDefaultRepoConfig(); if (!cfg) throw new Error('未配置默认仓库')
    const auth = { username: cfg.owner, repo: cfg.repo, accessToken: getDefaultGitHubToken() }
    const logged = isLoggedIn(); if (logged) { const t = getGitHubToken(); if (t) auth.accessToken = t }
    const gh = GitHubService.getInstance(); gh.setAuthData(auth)
    await gh.createNote(fileName, content, true)
    await loadNotes(true)
    return true
  }, [getGitHubToken, isLoggedIn, loadNotes])

  const updateNote = useCallback(async (fileName: string, content: string, sha: string) => {
    const cfg = getDefaultRepoConfig(); if (!cfg) throw new Error('未配置默认仓库')
    const auth = { username: cfg.owner, repo: cfg.repo, accessToken: getDefaultGitHubToken() }
    const logged = isLoggedIn(); if (logged) { const t = getGitHubToken(); if (t) auth.accessToken = t }
    const gh = GitHubService.getInstance(); gh.setAuthData(auth)
    await gh.updateNote(fileName, content, sha, true)
    await loadNotes(true)
    return true
  }, [getGitHubToken, isLoggedIn, loadNotes])

  const deleteNote = useCallback(async (note: Note) => {
    const cfg = getDefaultRepoConfig(); if (!cfg) throw new Error('未配置默认仓库')
    const auth = { username: cfg.owner, repo: cfg.repo, accessToken: getDefaultGitHubToken() }
    const logged = isLoggedIn(); if (logged) { const t = getGitHubToken(); if (t) auth.accessToken = t }
    const gh = GitHubService.getInstance(); gh.setAuthData(auth)
    await gh.deleteNote(note, true)
    await loadNotes(true)
    return true
  }, [getGitHubToken, isLoggedIn, loadNotes])

  useEffect(() => {
    if (!isLoading && !isInitialLoadRef.current) { isInitialLoadRef.current = true; loadNotes(false) }
  }, [isLoading, loadNotes])

  return { notes, isLoadingNotes, loadNotes, loadMoreNotes, createNote, updateNote, deleteNote, hasMoreNotes, loadingProgress, error, isRateLimited }
}
