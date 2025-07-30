import React from 'react'
import { useParams } from 'react-router-dom'

const NoteEditPage: React.FC = () => {
  const { id } = useParams()
  const isNewNote = id === 'new'

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isNewNote ? '创建新笔记' : '编辑笔记'}
        </h1>
      </div>

      <div className="card p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标题
            </label>
            <input
              type="text"
              placeholder="输入笔记标题..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              内容
            </label>
            <textarea
              placeholder="开始编写你的笔记..."
              rows={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    defaultChecked={false}
                  />
                  <div className="w-5 h-5 bg-gray-200 border-2 border-gray-300 rounded-md peer-checked:bg-blue-600 peer-checked:border-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2 transition-colors group-hover:bg-gray-100 peer-checked:group-hover:bg-blue-700">
                    <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                  设为私密笔记
                </span>
              </label>
            </div>

            <div className="flex space-x-3">
              <button className="btn-secondary">取消</button>
              <button className="btn-primary">保存笔记</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NoteEditPage 