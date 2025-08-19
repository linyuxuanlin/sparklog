import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TagFilter from '@/components/notes/TagFilter'

describe('TagFilter', () => {
  const mockOnTagsChange = jest.fn()
  const availableTags = ['React', 'TypeScript', 'Next.js', 'JavaScript']
  const selectedTags = ['React', 'TypeScript']

  beforeEach(() => {
    mockOnTagsChange.mockClear()
  })

  it('renders filter button with correct text', () => {
    render(
      <TagFilter
        availableTags={availableTags}
        selectedTags={selectedTags}
        onTagsChange={mockOnTagsChange}
      />
    )

    expect(screen.getByText('按标签筛选')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument() // 选中的标签数量
  })

  it('opens and closes dropdown menu', async () => {
    const user = userEvent.setup()
    
    render(
      <TagFilter
        availableTags={availableTags}
        selectedTags={[]}
        onTagsChange={mockOnTagsChange}
      />
    )

    const button = screen.getByText('按标签筛选')
    
    // 点击打开下拉菜单
    await user.click(button)
    expect(screen.getByText('选择标签')).toBeInTheDocument()
    
    // 点击遮罩层关闭菜单
    const overlay = screen.getByText('选择标签').closest('div')?.previousSibling
    if (overlay) {
      fireEvent.click(overlay as Element)
    }
  })

  it('toggles tag selection', async () => {
    const user = userEvent.setup()
    
    render(
      <TagFilter
        availableTags={availableTags}
        selectedTags={[]}
        onTagsChange={mockOnTagsChange}
      />
    )

    // 打开下拉菜单
    await user.click(screen.getByText('按标签筛选'))
    
    // 选择一个标签
    const reactCheckbox = screen.getByLabelText(/React/)
    await user.click(reactCheckbox)
    
    expect(mockOnTagsChange).toHaveBeenCalledWith(['React'])
  })

  it('clears all selected tags', async () => {
    const user = userEvent.setup()
    
    render(
      <TagFilter
        availableTags={availableTags}
        selectedTags={selectedTags}
        onTagsChange={mockOnTagsChange}
      />
    )

    // 打开下拉菜单
    await user.click(screen.getByText('按标签筛选'))
    
    // 点击清除所有
    await user.click(screen.getByText('清除所有'))
    
    expect(mockOnTagsChange).toHaveBeenCalledWith([])
  })

  it('shows empty state when no tags available', async () => {
    const user = userEvent.setup()
    
    render(
      <TagFilter
        availableTags={[]}
        selectedTags={[]}
        onTagsChange={mockOnTagsChange}
      />
    )

    await user.click(screen.getByText('按标签筛选'))
    expect(screen.getByText('暂无标签')).toBeInTheDocument()
  })
})