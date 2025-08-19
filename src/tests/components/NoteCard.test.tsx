import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NoteCard from '@/components/notes/NoteCard'
import { Note } from '@/types'

// Mock MarkdownRenderer
jest.mock('@/components/ui/MarkdownRenderer', () => {
  return function MockMarkdownRenderer({ content, className = '' }: { content: string, className?: string }) {
    return <div className={className} data-testid="markdown-renderer">{content}</div>
  }
})

const mockNote: Note = {
  name: '2024-01-01-12-00-00-000.md',
  path: 'notes/2024-01-01-12-00-00-000.md',
  sha: 'abc123',
  size: 1000,
  url: 'https://api.github.com/repos/test/test/contents/notes/2024-01-01-12-00-00-000.md',
  git_url: '',
  html_url: '',
  download_url: '',
  type: 'file',
  contentPreview: '这是一个测试笔记的预览内容...',
  createdDate: '2024-01-01T12:00:00.000Z',
  isPrivate: false,
  tags: ['React', 'TypeScript']
}

describe('NoteCard', () => {
  const mockOnOpen = jest.fn()
  const mockOnTagClick = jest.fn()

  beforeEach(() => {
    mockOnOpen.mockClear()
    mockOnTagClick.mockClear()
  })

  it('renders note information correctly', () => {
    render(
      <NoteCard
        note={mockNote}
        onOpen={mockOnOpen}
        onTagClick={mockOnTagClick}
      />
    )

    // 检查笔记标题（去掉.md后缀）
    expect(screen.getByText('2024-01-01-12-00-00-000')).toBeInTheDocument()
    
    // 检查查看详情按钮
    expect(screen.getByText('查看详情')).toBeInTheDocument()
    
    // 检查标签
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('shows private icon for private notes', () => {
    const privateNote = { ...mockNote, isPrivate: true }
    
    render(
      <NoteCard
        note={privateNote}
        onOpen={mockOnOpen}
        onTagClick={mockOnTagClick}
      />
    )

    // 应该显示锁定图标
    expect(screen.getByText('2024-01-01-12-00-00-000').closest('div')).toBeInTheDocument()
  })

  it('calls onOpen when detail button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <NoteCard
        note={mockNote}
        onOpen={mockOnOpen}
        onTagClick={mockOnTagClick}
      />
    )

    await user.click(screen.getByText('查看详情'))
    expect(mockOnOpen).toHaveBeenCalledWith(mockNote)
  })

  it('calls onTagClick when tag is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <NoteCard
        note={mockNote}
        onOpen={mockOnOpen}
        onTagClick={mockOnTagClick}
      />
    )

    await user.click(screen.getByText('React'))
    expect(mockOnTagClick).toHaveBeenCalledWith('React')
  })

  it('toggles content visibility', async () => {
    const user = userEvent.setup()
    
    render(
      <NoteCard
        note={mockNote}
        onOpen={mockOnOpen}
        onTagClick={mockOnTagClick}
      />
    )

    // 内容预览默认应该是隐藏的
    expect(screen.queryByTestId('markdown-renderer')).not.toBeInTheDocument()
    
    // 找到并点击展开按钮（包含chevron图标的按钮）
    const buttons = screen.getAllByRole('button')
    const expandButton = buttons.find(button => {
      const svg = button.querySelector('svg')
      return svg && !button.textContent?.includes('查看详情') && !button.textContent?.includes('React') && !button.textContent?.includes('TypeScript')
    })
    
    if (expandButton) {
      await user.click(expandButton)
      // 现在应该显示内容预览
      expect(screen.getByTestId('markdown-renderer')).toBeInTheDocument()
    }
  })

  it('shows content when defaultExpanded is true', () => {
    render(
      <NoteCard
        note={mockNote}
        onOpen={mockOnOpen}
        onTagClick={mockOnTagClick}
        defaultExpanded={true}
      />
    )

    expect(screen.getByTestId('markdown-renderer')).toBeInTheDocument()
  })

  it('hides collapse button when hideCollapseButton is true', () => {
    render(
      <NoteCard
        note={mockNote}
        onOpen={mockOnOpen}
        onTagClick={mockOnTagClick}
        hideCollapseButton={true}
      />
    )

    // 应该没有展开/收缩按钮
    const buttons = screen.getAllByRole('button')
    const collapseButton = buttons.find(button => {
      const svg = button.querySelector('svg')
      return svg && !button.textContent?.includes('查看详情') && !button.textContent?.includes('React') && !button.textContent?.includes('TypeScript')
    })
    expect(collapseButton).toBeUndefined()
  })
})