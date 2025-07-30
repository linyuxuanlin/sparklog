import { Github } from 'lucide-react'

const AuthPage = () => {
  const handleGitHubAuth = () => {
    // TODO: 实现 GitHub OAuth 认证
    console.log('GitHub OAuth 认证')
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          连接 GitHub
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          授权 SparkLog 访问你的 GitHub 仓库，开始创建笔记
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Github className="h-16 w-16 text-gray-600 dark:text-gray-400" />
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            GitHub 授权
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            点击下方按钮授权 SparkLog 访问你的 GitHub 仓库。
            我们只会请求访问私有仓库的权限，用于存储你的笔记数据。
          </p>

          <button
            onClick={handleGitHubAuth}
            className="btn btn-primary w-full"
          >
            <Github className="h-5 w-5 mr-2" />
            使用 GitHub 登录
          </button>

          <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            <p>授权后，你可以：</p>
            <ul className="mt-2 space-y-1 text-left">
              <li>• 选择现有私有仓库存储笔记</li>
              <li>• 创建新的私有仓库</li>
              <li>• 管理笔记的公开/私密设置</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage 