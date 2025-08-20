import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import TagFilter from '../TagFilter'

// 模拟 useGitHub hook
vi.mock('@/hooks/useGitHub', () => ({
  default: () => ({
    isLoggedIn: vi.fn(() => true),
  }),
}))

describe('TagFilter', () => {
  const mockTags = ['tag1', 'tag2', 'tag3', 'tag4']
  const mockSelectedTags = ['tag1', 'tag3']
  const mockOnTagsChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该渲染标签过滤器', () => {
    render(
      <TagFilter
        availableTags={mockTags}
        selectedTags={mockSelectedTags}
        onTagsChange={mockOnTagsChange}
      />
    )

    // 检查过滤器按钮是否存在
    expect(screen.getByRole('button', { name: /按标签筛选/i })).toBeInTheDocument()
    
    // 检查选中的标签数量
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('应该显示选中的标签数量', () => {
    render(
      <TagFilter
        availableTags={mockTags}
        selectedTags={mockSelectedTags}
        onTagsChange={mockOnTagsChange}
      />
    )

    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('应该在没有选中标签时不显示数量', () => {
    render(
      <TagFilter
        availableTags={mockTags}
        selectedTags={[]}
        onTagsChange={mockOnTagsChange}
      />
    )

    // 当没有选中标签时，不应该显示数量
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('应该打开下拉菜单并显示所有可用标签', async () => {
    render(
      <TagFilter
        availableTags={mockTags}
        selectedTags={mockSelectedTags}
        onTagsChange={mockOnTagsChange}
      />
    )

    // 点击过滤器按钮打开下拉菜单
    const filterButton = screen.getByRole('button', { name: /按标签筛选/i })
    fireEvent.click(filterButton)

    // 等待下拉菜单出现并检查所有标签
    for (const tag of mockTags) {
      expect(screen.getByText(tag)).toBeInTheDocument()
    }
  })

  it('应该正确标记选中的标签', async () => {
    render(
      <TagFilter
        availableTags={mockTags}
        selectedTags={mockSelectedTags}
        onTagsChange={mockOnTagsChange}
      />
    )

    // 打开下拉菜单
    const filterButton = screen.getByRole('button', { name: /按标签筛选/i })
    fireEvent.click(filterButton)

    // 检查选中的标签样式
    const selectedTag1 = screen.getByText('tag1')
    const selectedTag3 = screen.getByText('tag3')
    
    expect(selectedTag1.closest('button')).toHaveClass('bg-blue-100', 'text-blue-800')
    expect(selectedTag3.closest('button')).toHaveClass('bg-blue-100', 'text-blue-800')

    // 检查未选中的标签样式
    const unselectedTag2 = screen.getByText('tag2')
    const unselectedTag4 = screen.getByText('tag4')
    
    expect(unselectedTag2.closest('button')).toHaveClass('text-gray-700')
    expect(unselectedTag4.closest('button')).toHaveClass('text-gray-700')
  })

  it('应该处理标签选择', async () => {
    render(
      <TagFilter
        availableTags={mockTags}
        selectedTags={mockSelectedTags}
        onTagsChange={mockOnTagsChange}
      />
    )

    // 打开下拉菜单
    const filterButton = screen.getByRole('button', { name: /按标签筛选/i })
    fireEvent.click(filterButton)

    // 点击未选中的标签
    const tag2 = screen.getByText('tag2')
    fireEvent.click(tag2)

    // 检查回调被调用，添加新标签
    expect(mockOnTagsChange).toHaveBeenCalledWith([...mockSelectedTags, 'tag2'])
  })

  it('应该处理标签取消选择', async () => {
    render(
      <TagFilter
        availableTags={mockTags}
        selectedTags={mockSelectedTags}
        onTagsChange={mockOnTagsChange}
      />
    )

    // 打开下拉菜单
    const filterButton = screen.getByRole('button', { name: /按标签筛选/i })
    fireEvent.click(filterButton)

    // 点击已选中的标签
    const tag1 = screen.getByText('tag1')
    fireEvent.click(tag1)

    // 检查回调被调用，移除标签
    expect(mockOnTagsChange).toHaveBeenCalledWith(['tag3'])
  })

  it('应该在没有可用标签时显示空状态', () => {
    render(
      <TagFilter
        availableTags={[]}
        selectedTags={[]}
        onTagsChange={mockOnTagsChange}
      />
    )

    // 当没有可用标签时，组件应该返回 null
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('应该处理标签搜索', async () => {
    render(
      <TagFilter
        availableTags={mockTags}
        selectedTags={mockSelectedTags}
        onTagsChange={mockOnTagsChange}
      />
    )

    // 打开下拉菜单
    const filterButton = screen.getByRole('button', { name: /按标签筛选/i })
    fireEvent.click(filterButton)

    // 检查标签数量显示
    expect(screen.getByText(/选择标签 \(4\)/)).toBeInTheDocument()
  })

  it('应该处理点击外部关闭下拉菜单', async () => {
    render(
      <TagFilter
        availableTags={mockTags}
        selectedTags={mockSelectedTags}
        onTagsChange={mockOnTagsChange}
      />
    )

    // 打开下拉菜单
    const filterButton = screen.getByRole('button', { name: /按标签筛选/i })
    fireEvent.click(filterButton)

    // 验证下拉菜单已打开
    expect(screen.getByText('tag1')).toBeInTheDocument()

    // 点击外部区域
    fireEvent.mouseDown(document.body)

    // 验证下拉菜单已关闭
    expect(screen.queryByText('tag1')).not.toBeInTheDocument()
  })

  it('应该正确处理多个标签的快速切换', async () => {
    render(
      <TagFilter
        availableTags={mockTags}
        selectedTags={[]}
        onTagsChange={mockOnTagsChange}
      />
    )

    // 打开下拉菜单
    const filterButton = screen.getByRole('button', { name: /按标签筛选/i })
    fireEvent.click(filterButton)

    // 快速选择多个标签
    const tag1 = screen.getByText('tag1')
    const tag2 = screen.getByText('tag2')
    const tag3 = screen.getByText('tag3')

    fireEvent.click(tag1)
    fireEvent.click(tag2)
    fireEvent.click(tag3)

    // 验证回调被正确调用
    expect(mockOnTagsChange).toHaveBeenCalledTimes(3)
    // 每次点击都是基于初始的空数组，所以每次都只添加一个标签
    expect(mockOnTagsChange).toHaveBeenNthCalledWith(1, ['tag1'])
    expect(mockOnTagsChange).toHaveBeenNthCalledWith(2, ['tag2'])
    expect(mockOnTagsChange).toHaveBeenNthCalledWith(3, ['tag3'])
  })
})
