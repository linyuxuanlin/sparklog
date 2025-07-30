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
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-gray-700">公开笔记</span>
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