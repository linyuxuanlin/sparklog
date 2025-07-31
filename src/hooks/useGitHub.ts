import { useState, useEffect } from 'react'
import { getDefaultRepoConfig } from '@/config/defaultRepo'

interface GitHubAuth {
  accessToken?: string
  username?: string
  userInfo?: any
  connected: boolean
  connectedAt: string
}

interface GitHubConfig {
  personalToken?: string
  clientId?: string
  clientSecret?: string
  appUrl: string
}

export const useGitHub = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    // 检查GitHub连接状态
    const auth = localStorage.getItem('sparklog_github_auth')
    if (auth) {
      const authData: GitHubAuth = JSON.parse(auth)
      setIsConnected(authData.connected)
      
      // 检查是否为网站所有者
      const defaultConfig = getDefaultRepoConfig()
      if (defaultConfig && authData.username) {
        setIsOwner(authData.username === defaultConfig.owner)
      }
    }
    setIsLoading(false)
  }, [])

  const getConfig = (): GitHubConfig | null => {
    const config = localStorage.getItem('sparklog_github_config')
    return config ? JSON.parse(config) : null
  }

  const disconnect = () => {
    localStorage.removeItem('sparklog_github_auth')
    localStorage.removeItem('sparklog_github_config')
    setIsConnected(false)
    setIsOwner(false)
  }

  // 检查是否有管理权限（连接且是所有者）
  const hasManagePermission = () => {
    return isConnected && isOwner
  }

  // 检查是否已登录GitHub
  const isLoggedIn = () => {
    return isConnected
  }

  return {
    isConnected,
    isLoading,
    isOwner,
    hasManagePermission,
    isLoggedIn,
    getConfig,
    disconnect
  }
} 