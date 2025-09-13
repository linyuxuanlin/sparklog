"use client"
import { useCallback, useEffect, useState } from 'react'

interface AdminAuth { isAuthenticated: boolean; authenticatedAt: string }

export const useGitHub = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    const auth = localStorage.getItem('sparklog_admin_auth')
    if (auth) {
      const data: AdminAuth = JSON.parse(auth)
      setIsConnected(data.isAuthenticated)
      setIsOwner(data.isAuthenticated)
    }
    setIsLoading(false)
  }, [])

  const authenticate = useCallback((password: string) => {
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD
    if (password === adminPassword) {
      const data: AdminAuth = { isAuthenticated: true, authenticatedAt: new Date().toISOString() }
      localStorage.setItem('sparklog_admin_auth', JSON.stringify(data))
      setIsConnected(true); setIsOwner(true)
      return true
    }
    return false
  }, [])

  const getGitHubToken = useCallback(() => {
    if (isConnected && isOwner) return process.env.NEXT_PUBLIC_GITHUB_TOKEN || null
    return null
  }, [isConnected, isOwner])

  const disconnect = useCallback(() => {
    localStorage.removeItem('sparklog_admin_auth')
    setIsConnected(false); setIsOwner(false)
  }, [])

  const hasManagePermission = useCallback(() => isConnected && isOwner, [isConnected, isOwner])
  const isLoggedIn = useCallback(() => isConnected, [isConnected])

  return { isConnected, isLoading, isOwner, hasManagePermission, isLoggedIn, authenticate, disconnect, getGitHubToken }
}

