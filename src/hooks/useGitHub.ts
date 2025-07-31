import { useState, useEffect } from 'react'

interface AdminAuth {
  isAuthenticated: boolean
  authenticatedAt: string
}

export const useGitHub = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    // 检查管理员身份验证状态
    const auth = localStorage.getItem('sparklog_admin_auth')
    console.log('useGitHub调试信息:', {
      hasAuth: !!auth,
      authData: auth ? JSON.parse(auth) : null
    })
    
    if (auth) {
      const authData: AdminAuth = JSON.parse(auth)
      setIsConnected(authData.isAuthenticated)
      setIsOwner(authData.isAuthenticated) // 如果通过密码验证，就是所有者
    }
    setIsLoading(false)
  }, [])

  const authenticate = (password: string) => {
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD
    if (password === adminPassword) {
      const authData: AdminAuth = {
        isAuthenticated: true,
        authenticatedAt: new Date().toISOString()
      }
      localStorage.setItem('sparklog_admin_auth', JSON.stringify(authData))
      setIsConnected(true)
      setIsOwner(true)
      return true
    }
    return false
  }

  const disconnect = () => {
    localStorage.removeItem('sparklog_admin_auth')
    setIsConnected(false)
    setIsOwner(false)
  }

  // 检查是否有管理权限（已认证的管理员）
  const hasManagePermission = () => {
    return isConnected && isOwner
  }

  // 检查是否已登录
  const isLoggedIn = () => {
    return isConnected
  }

  return {
    isConnected,
    isLoading,
    isOwner,
    hasManagePermission,
    isLoggedIn,
    authenticate,
    disconnect
  }
} 