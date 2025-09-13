"use client"
import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('light')
  const [isLoading, setIsLoading] = useState(true)

  const applyTheme = (t: Theme) => {
    const root = document.documentElement
    if (t === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }

  useEffect(() => {
    const saved = localStorage.getItem('sparklog_theme') as Theme | null
    const sys: Theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const t = saved || sys
    setTheme(t)
    applyTheme(t)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('sparklog_theme')) {
        const t: Theme = e.matches ? 'dark' : 'light'
        setTheme(t); applyTheme(t)
      }
    }
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [])

  const toggleTheme = () => {
    const t: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(t); applyTheme(t)
    localStorage.setItem('sparklog_theme', t)
  }

  return { theme, toggleTheme, isLoading }
}

