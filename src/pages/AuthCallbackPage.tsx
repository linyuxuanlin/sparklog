import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('正在处理GitHub授权...')

  useEffect(() => {
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
    
    // 模拟OAuth token交换过程
    // 在实际应用中，这里应该调用后端API进行token交换
    setTimeout(async () => {
      try {
        // 模拟获取用户信息
        // 在实际应用中，这里应该用access token调用GitHub API获取用户信息
        const mockUserInfo = {
          login: 'testuser',
          name: 'Test User',
          avatar_url: 'https://github.com/github.png'
        }
        
        // 保存授权码和连接状态
        localStorage.setItem('sparklog_github_auth', JSON.stringify({
          code,
          state,
          accessToken: 'mock_access_token', // 实际应用中应该是真实的access token
          username: mockUserInfo.login,
          connected: true,
          connectedAt: new Date().toISOString()
        }))
        
        setStatus('success')
        setMessage('GitHub连接成功！')
        setTimeout(() => navigate('/settings'), 2000)
      } catch (error) {
        setStatus('error')
        setMessage('连接失败，请重试')
        setTimeout(() => navigate('/settings'), 3000)
      }
    }, 2000)
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