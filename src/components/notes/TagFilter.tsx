import React, { useState } from 'react'
import { Tag, X, Plus } from 'lucide-react'

interface TagFilterProps {
  availableTags: string[]
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
}

const TagFilter: React.FC<TagFilterProps> = ({
  availableTags,
  selectedTags,
  onTagsChange
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag))
    } else {
      onTagsChange([...selectedTags, tag])
    }
  }

  const clearAllTags = () => {
    onTagsChange([])
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-3 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
      >
        <Tag className="w-4 h-4 mr-2" />
        按标签筛选
        {selectedTags.length > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
            {selectedTags.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* 下拉菜单 */}
          <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  选择标签
                </h3>
                {selectedTags.length > 0 && (
                  <button
                    onClick={clearAllTags}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    清除所有
                  </button>
                )}
              </div>

              <div className="max-h-40 overflow-y-auto">
                {availableTags.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                    暂无标签
                  </p>
                ) : (
                  <div className="space-y-1">
                    {availableTags.map((tag) => (
                      <label
                        key={tag}
                        className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          onChange={() => handleTagToggle(tag)}
                          className="mr-2 rounded border-gray-300 dark:border-gray-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {tag}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default TagFilter