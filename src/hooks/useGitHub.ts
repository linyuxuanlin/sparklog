import { useState, useEffect, useCallback } from 'react'

interface AdminAuth {
  isAuthenticated: boolean
  authenticatedAt: string
}

export const useGitHub = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    // Check admin authentication status
    const auth = localStorage.getItem('sparklog_admin_auth')
    console.log('useGitHub debug info:', {
      hasAuth: !!auth,
      authData: auth ? JSON.parse(auth) : null
    })
    
    if (auth) {
      const authData: AdminAuth = JSON.parse(auth)
      setIsConnected(authData.isAuthenticated)
      setIsOwner(authData.isAuthenticated) // If authenticated by password, is owner
    }
    setIsLoading(false)
  }, []) // Remove forceUpdate dependency, only execute once when component mounts

  const authenticate = useCallback((password: string) => {
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD
    console.log('Authentication debug:', {
      inputPassword: password,
      adminPassword: adminPassword,
      isMatch: password === adminPassword
    })
    
    if (password === adminPassword) {
      const authData: AdminAuth = {
        isAuthenticated: true,
        authenticatedAt: new Date().toISOString()
      }
      localStorage.setItem('sparklog_admin_auth', JSON.stringify(authData))
      setIsConnected(true)
      setIsOwner(true)
      console.log('Authentication successful, status updated')
      return true
    }
    return false
  }, [])

  // Get GitHub Token (for API calls)
  const getGitHubToken = useCallback(() => {
    // If admin and authenticated, return Token from environment variables
    if (isConnected && isOwner) {
      const token = import.meta.env.VITE_GITHUB_TOKEN
      console.log('Get GitHub Token:', {
        isConnected,
        isOwner,
        hasToken: !!token
      })
      return token || null
    }
    console.log('Failed to get GitHub Token:', { isConnected, isOwner })
    return null
  }, [isConnected, isOwner])

  const disconnect = useCallback(() => {
    localStorage.removeItem('sparklog_admin_auth')
    setIsConnected(false)
    setIsOwner(false)
    console.log('Disconnected, status updated')
  }, [])

  // Check if has management permissions (authenticated admin)
  const hasManagePermission = useCallback(() => {
    return isConnected && isOwner
  }, [isConnected, isOwner])

  // Check if logged in
  const isLoggedIn = useCallback(() => {
    return isConnected
  }, [isConnected])

  return {
    isConnected,
    isLoading,
    isOwner,
    hasManagePermission,
    isLoggedIn,
    authenticate,
    disconnect,
    getGitHubToken
  }
} 