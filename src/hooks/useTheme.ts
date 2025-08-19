import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark'

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('light')
  const [isLoading, setIsLoading] = useState(true)

  // 获取系统主题偏好
  const getSystemTheme = (): Theme => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }

  // 应用主题到DOM
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement
    if (newTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  // 初始化主题
  useEffect(() => {
    // 从localStorage获取保存的主题
    const savedTheme = localStorage.getItem('sparklog_theme') as Theme | null
    
    if (savedTheme) {
      // 如果有保存的主题，使用保存的主题
      setTheme(savedTheme)
      applyTheme(savedTheme)
    } else {
      // 否则使用系统主题
      const systemTheme = getSystemTheme()
      setTheme(systemTheme)
      applyTheme(systemTheme)
    }
    
    setIsLoading(false)
  }, [])

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      // 只有在没有保存用户偏好时才跟随系统主题
      const savedTheme = localStorage.getItem('sparklog_theme')
      if (!savedTheme) {
        const newTheme: Theme = e.matches ? 'dark' : 'light'
        setTheme(newTheme)
        applyTheme(newTheme)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // 切换主题
  const toggleTheme = () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    applyTheme(newTheme)
    
    // 保存用户偏好
    localStorage.setItem('sparklog_theme', newTheme)
  }

  return {
    theme,
    toggleTheme,
    isLoading
  }
} 