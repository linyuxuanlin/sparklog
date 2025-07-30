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
    
                 // 由于CORS限制，我们需要使用GitHub Apps方式
       // 或者使用服务器端代理，但这里我们先用模拟方式
       try {
         // const config = JSON.parse(savedConfig) // 暂时注释，演示模式下不需要
        
        // 模拟成功的OAuth流程（实际应用中需要服务器端支持）
        // 这里我们创建一个模拟的access token用于演示
        const mockAccessToken = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // 模拟用户信息
        const mockUserInfo = {
          login: 'demo-user',
          id: 12345,
          avatar_url: 'https://github.com/github.png',
          name: 'Demo User',
          email: 'demo@example.com'
        }
        
        // 保存模拟的授权信息
        localStorage.setItem('sparklog_github_auth', JSON.stringify({
          code,
          state,
          accessToken: mockAccessToken,
          username: mockUserInfo.login,
          userInfo: mockUserInfo,
          connected: true,
          connectedAt: new Date().toISOString()
        }))
        
        setStatus('success')
        setMessage('GitHub连接成功！（演示模式）')
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