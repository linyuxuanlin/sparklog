import React, { useState, useEffect, useRef } from 'react'
import { X, Plus, Tag } from 'lucide-react'

interface TagManagerProps {
  tags: string[]
  onChange: (_tags: string[]) => void
  availableTags?: string[]
  placeholder?: string
  className?: string
}

const TagManager: React.FC<TagManagerProps> = ({
  tags,
  onChange,
  availableTags = [],
  placeholder = "添加标签...",
  className = ""
}) => {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // 过滤建议标签
  useEffect(() => {
    if (inputValue.trim() && availableTags.length > 0) {
      const filtered = availableTags.filter(tag => 
        !tags.includes(tag) && 
        tag.toLowerCase().includes(inputValue.toLowerCase())
      )
      setFilteredSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setFilteredSuggestions([])
      setShowSuggestions(false)
    }
  }, [inputValue, availableTags, tags])

  // 点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onChange([...tags, trimmedTag])
    }
    setInputValue('')
    setShowSuggestions(false)
  }

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove))
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredSuggestions.length > 0) {
        addTag(filteredSuggestions[0])
      } else if (inputValue.trim()) {
        addTag(inputValue)
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleInputFocus = () => {
    if (filteredSuggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-wrap items-center gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 min-h-[42px]">
        {/* 已选标签 */}
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-md"
          >
            <Tag className="w-3 h-3 mr-1" />
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 focus:outline-none"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        
        {/* 输入框 */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={handleInputFocus}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        />
        
        {/* 添加按钮 */}
        {inputValue && (
          <button
            type="button"
            onClick={() => addTag(inputValue)}
            className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 focus:outline-none"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 建议标签下拉列表 */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto scrollbar-hide"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => addTag(suggestion)}
              className="w-full px-3 py-2 text-left text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
            >
              <div className="flex items-center">
                <Tag className="w-3 h-3 mr-2 text-gray-500 dark:text-gray-400" />
                {suggestion}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default TagManager