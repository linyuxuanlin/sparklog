import { useState, useEffect } from 'react'

interface GitHubAuth {
  code: string
  state: string
  connected: boolean
  connectedAt: string
}

interface GitHubConfig {
  clientId: string
  clientSecret: string
  appUrl: string
}

export const useGitHub = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 检查GitHub连接状态
    const auth = localStorage.getItem('sparklog_github_auth')
    if (auth) {
      const authData: GitHubAuth = JSON.parse(auth)
      setIsConnected(authData.connected)
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
  }

  return {
    isConnected,
    isLoading,
    getConfig,
    disconnect
  }
} 