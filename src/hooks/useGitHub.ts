import { useState, useEffect, useCallback } from 'react'

interface AdminAuth {
  isAuthenticated: boolean
  authenticatedAt: string
}

export const useGitHub = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(0)

  // 检查管理员身份验证状态
  const checkAuthStatus = useCallback(() => {
    const auth = localStorage.getItem('sparklog_admin_auth')
    
    if (auth) {
      try {
        const authData: AdminAuth = JSON.parse(auth)
        setIsConnected(authData.isAuthenticated)
        setIsOwner(authData.isAuthenticated) // 如果通过密码验证，就是所有者
      } catch (error) {
        console.error('解析认证数据失败:', error)
        // 如果解析失败，清除无效数据
        localStorage.removeItem('sparklog_admin_auth')
        setIsConnected(false)
        setIsOwner(false)
      }
    } else {
      setIsConnected(false)
      setIsOwner(false)
    }
  }, [])

  useEffect(() => {
    checkAuthStatus()
    setIsLoading(false)
  }, [checkAuthStatus, forceUpdate]) // 添加 forceUpdate 依赖

  // 监听 localStorage 变化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sparklog_admin_auth') {
        checkAuthStatus()
      }
    }

    // 监听其他标签页的 localStorage 变化
    window.addEventListener('storage', handleStorageChange)
    
    // 监听当前页面的 localStorage 变化（通过自定义事件）
    const handleCustomStorageChange = () => {
      checkAuthStatus()
    }
    
    window.addEventListener('sparklog_auth_change', handleCustomStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('sparklog_auth_change', handleCustomStorageChange)
    }
  }, [checkAuthStatus])

  const authenticate = useCallback((password: string) => {
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD
    
    if (password === adminPassword) {
      const authData: AdminAuth = {
        isAuthenticated: true,
        authenticatedAt: new Date().toISOString()
      }
      localStorage.setItem('sparklog_admin_auth', JSON.stringify(authData))
      setIsConnected(true)
      setIsOwner(true)
      
      // 触发自定义事件，通知其他组件权限状态已更新
      window.dispatchEvent(new CustomEvent('sparklog_auth_change'))
      
      console.log('认证成功')
      return true
    }
    return false
  }, [])

  // 获取GitHub Token（用于API调用）
  const getGitHubToken = useCallback(() => {
    // 如果是管理员且已认证，返回环境变量中的Token
    if (isConnected && isOwner) {
      const token = import.meta.env.VITE_GITHUB_TOKEN
      return token || null
    }
    return null
  }, [isConnected, isOwner])

  const disconnect = useCallback(() => {
    localStorage.removeItem('sparklog_admin_auth')
    setIsConnected(false)
    setIsOwner(false)
    
    // 触发自定义事件，通知其他组件权限状态已更新
    window.dispatchEvent(new CustomEvent('sparklog_auth_change'))
    
    console.log('已断开连接')
  }, [])

  // 检查是否有管理权限（已认证的管理员）
  const hasManagePermission = useCallback(() => {
    return isConnected && isOwner
  }, [isConnected, isOwner])

  // 检查是否已登录
  const isLoggedIn = useCallback(() => {
    return isConnected
  }, [isConnected])

  // 强制刷新权限状态
  const refreshAuthStatus = useCallback(() => {
    setForceUpdate(prev => prev + 1)
  }, [])

  return {
    isConnected,
    isLoading,
    isOwner,
    hasManagePermission,
    isLoggedIn,
    authenticate,
    disconnect,
    getGitHubToken,
    refreshAuthStatus
  }
} 