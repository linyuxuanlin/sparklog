import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('正在处理GitHub授权...')

  useEffect(() => {
    const handleOAuth = async () => {
      const code = searchParams.get('code')
      const error = searchParams.get('error')
      const state = searchParams.get('state')

    if (error) {
      setStatus('error')
      setMessage('授权失败：' + error)
      setTimeout(() => navigate('/settings'), 3000)
      return
    }

    if (!code) {
      setStatus('error')
      setMessage('未收到授权码')
      setTimeout(() => navigate('/settings'), 3000)
      return
    }

    // 获取保存的GitHub配置
    const savedConfig = localStorage.getItem('sparklog_github_config')
    if (!savedConfig) {
      setStatus('error')
      setMessage('未找到GitHub配置，请重新设置')
      setTimeout(() => navigate('/settings'), 3000)
      return
    }

    // const config = JSON.parse(savedConfig) // 暂时注释，实际应用中会用到
    
    // 实现真实的OAuth token交换
    try {
      const config = JSON.parse(savedConfig)
      
      // 调用GitHub API进行token交换
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code: code,
          redirect_uri: `${window.location.origin}/auth/callback`
        })
      })
      
      if (!tokenResponse.ok) {
        throw new Error('Token交换失败')
      }
      
      const tokenData = await tokenResponse.json()
      
      if (tokenData.error) {
        throw new Error(`OAuth错误: ${tokenData.error_description || tokenData.error}`)
      }
      
      const accessToken = tokenData.access_token
      
      // 使用access token获取用户信息
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })
      
      if (!userResponse.ok) {
        throw new Error('获取用户信息失败')
      }
      
      const userInfo = await userResponse.json()
      
      // 保存真实的授权信息
      localStorage.setItem('sparklog_github_auth', JSON.stringify({
        code,
        state,
        accessToken: accessToken,
        username: userInfo.login,
        userInfo: userInfo,
        connected: true,
        connectedAt: new Date().toISOString()
      }))
      
      setStatus('success')
      setMessage('GitHub连接成功！')
      setTimeout(() => navigate('/settings'), 2000)
          } catch (error) {
        console.error('OAuth错误:', error)
        setStatus('error')
        setMessage(`连接失败: ${error instanceof Error ? error.message : '请重试'}`)
        setTimeout(() => navigate('/settings'), 3000)
      }
    }
    
    handleOAuth()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">处理中</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">连接成功</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">连接失败</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthCallbackPage 