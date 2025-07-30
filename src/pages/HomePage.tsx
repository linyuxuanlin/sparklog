import { Link } from 'react-router-dom'
import { Sparkles, Github, FileText, Shield } from 'lucide-react'

const HomePage = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <Sparkles className="h-16 w-16 text-primary-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          欢迎使用 SparkLog
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          一个基于GitHub仓库的静态笔记应用，灵感来源于Memos
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            to="/auth"
            className="btn btn-primary"
          >
            连接 GitHub
          </Link>
          <a
            href="https://github.com/your-username/sparklog"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            <Github className="h-4 w-4 mr-2" />
            查看源码
          </a>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <FileText className="h-12 w-12 text-primary-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            纯静态部署
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            可托管在Cloudflare Pages、GitHub Pages等静态托管平台
          </p>
        </div>

        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Github className="h-12 w-12 text-primary-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            GitHub仓库存储
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            所有笔记数据存储在私有GitHub仓库中，完全自主可控
          </p>
        </div>

        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            权限控制
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            支持笔记公开/私密设置，保护你的隐私
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          快速开始
        </h2>
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p>1. 点击"连接 GitHub"按钮，授权应用访问你的仓库</p>
          <p>2. 选择现有的私有仓库或创建新的仓库用于存储笔记</p>
          <p>3. 开始创建你的第一篇笔记！</p>
        </div>
      </div>
    </div>
  )
}

export default HomePage 