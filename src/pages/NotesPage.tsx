import { Plus, FileText, Search } from 'lucide-react'

const NotesPage = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            我的笔记
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            管理你的所有笔记
          </p>
        </div>
        
        <button className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          新建笔记
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索笔记..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            还没有笔记
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            点击"新建笔记"开始创建你的第一篇笔记
          </p>
          <button className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            创建第一篇笔记
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotesPage 