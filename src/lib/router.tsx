"use client"
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type LocationState = any

interface LocationLike {
  pathname: string
  state?: LocationState
}

const RouterCtx = createContext<{
  location: LocationLike
  navigate: (to: string, opts?: { replace?: boolean; state?: LocationState }) => void
} | null>(null)

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loc, setLoc] = useState<LocationLike>({ pathname: typeof window !== 'undefined' ? window.location.pathname : '/' })

  useEffect(() => {
    const onPop = () => setLoc({ pathname: window.location.pathname, state: history.state })
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((to: string, opts?: { replace?: boolean; state?: LocationState }) => {
    if (opts?.replace) history.replaceState(opts?.state ?? null, '', to)
    else history.pushState(opts?.state ?? null, '', to)
    setLoc({ pathname: window.location.pathname, state: history.state })
  }, [])

  const value = useMemo(() => ({ location: loc, navigate }), [loc, navigate])
  return <RouterCtx.Provider value={value}>{children}</RouterCtx.Provider>
}

export const useNavigate = () => {
  const ctx = useContext(RouterCtx)
  if (!ctx) throw new Error('useNavigate must be used within RouterProvider')
  return ctx.navigate
}

export const useLocation = () => {
  const ctx = useContext(RouterCtx)
  if (!ctx) throw new Error('useLocation must be used within RouterProvider')
  return ctx.location
}

export const Link: React.FC<React.PropsWithChildren<{ to: string; className?: string; onClick?: () => void }>> = ({ to, children, className, onClick }) => {
  const navigate = useNavigate()
  return (
    <a href={to} className={className} onClick={(e) => { e.preventDefault(); onClick?.(); navigate(to) }}>{children}</a>
  )
}

export const useParams = <T extends Record<string, string>>() => {
  const { pathname } = useLocation()
  // Supported patterns used in the app
  const match = (pattern: RegExp): string[] | null => {
    const m = pathname.match(pattern)
    return m ? m.slice(1) : null
  }
  // Return a best-effort mapping for routes we use
  let params: Record<string, string> = {}
  const m1 = match(/^\/wander\/(.+)\/?$/)
  if (m1) params['noteId'] = decodeURIComponent(m1[0])
  const m2 = match(/^\/note\/edit\/(.+)\/?$/)
  if (m2) params['title'] = decodeURIComponent(m2[0])
  const m3 = match(/^\/note\/(.+)\/?$/)
  if (m3) params['noteId'] = decodeURIComponent(m3[0])
  return params as T
}

