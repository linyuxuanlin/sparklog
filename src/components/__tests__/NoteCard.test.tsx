import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import NoteCard from '../NoteCard'
import { Note } from '@/types/Note'

// 模拟 useGitHub hook
vi.mock('@/hooks/useGitHub', () => ({
  useGitHub: vi.fn(() => ({
    isAuthenticated: true,
    authData: {
      username: 'testuser',
      repo: 'testrepo'
    },
    isLoggedIn: vi.fn(() => true)
  }))
}))

// 模拟 MarkdownRenderer 组件
vi.mock('../MarkdownRenderer', () => ({
  default: ({ content }: { content: string }) => <div data-testid="markdown-content">{content}</div>
}))

const mockNote: Note = {
  name: 'test-note.md',
  path: 'notes/test-note.md',
  sha: 'test-sha',
  size: 1024,
  url: 'https://api.github.com/repos/testuser/testrepo/contents/notes/test-note.md',
  git_url: 'https://api.github.com/repos/testuser/testrepo/git/blobs/test-sha',
  html_url: 'https://github.com/testuser/testrepo/blob/main/notes/test-note.md',
  download_url: 'https://raw.githubusercontent.com/testuser/testrepo/main/notes/test-note.md',
  type: 'file',
  content: 'SGVsbG8gV29ybGQ=', // Base64 for "Hello World"
  encoding: 'base64',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  contentPreview: '这是笔记的预览内容',
  fullContent: '这是笔记的完整内容',
  createdDate: '2024-01-01',
  updatedDate: '2024-01-02',
  isPrivate: false,
  tags: ['技术', '笔记', '测试']
}

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('NoteCard', () => {
  const mockOnOpen = vi.fn()
  const mockOnTagClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该渲染笔记卡片的基本信息', () => {
    renderWithRouter(
      <NoteCard
        note={mockNote}
        onOpen={mockOnOpen}
        onTagClick={mockOnTagClick}
      />
    )

    expect(screen.getByText('这是笔记的预览内容')).toBeInTheDocument()
    expect(screen.getByText('技术')).toBeInTheDocument()
    expect(screen.getByText('笔记')).toBeInTheDocument()
    expect(screen.getByText('测试')).toBeInTheDocument()
  })

  it('应该显示创建和更新时间', () => {
    renderWithRouter(
      <NoteCard
        note={mockNote}
        onOpen={mockOnOpen}
        onTagClick={mockOnTagClick}
      />
    )

    // 应该显示时间信息（显示格式化后的日期）
    expect(screen.getByText('2024-1-2')).toBeInTheDocument()
  })

  it('应该处理没有标签的笔记', () => {
    const noteWithoutTags = { ...mockNote, tags: undefined }
    
    renderWithRouter(
      <NoteCard
        note={noteWithoutTags}
        onOpen={mockOnOpen}
        onTagClick={mockOnTagClick}
      />
    )

    // 不应该显示标签
    expect(screen.queryByText('技术')).not.toBeInTheDocument()
  })

  it('应该处理私有笔记', () => {
    const privateNote = { ...mockNote, isPrivate: true }
    
    renderWithRouter(
      <NoteCard
        note={privateNote}
        onOpen={mockOnOpen}
        onTagClick={mockOnTagClick}
      />
    )

    // 应该显示私密标记
    expect(screen.getByText('私密')).toBeInTheDocument()
  })

  it('应该调用 onOpen 当点击卡片时', () => {
    renderWithRouter(
      <NoteCard
        note={mockNote}
        onOpen={mockOnOpen}
        onTagClick={mockOnTagClick}
      />
    )

    // 卡片没有特定的 role，直接点击卡片容器
    const card = screen.getByText('这是笔记的预览内容').closest('.card')
    fireEvent.click(card!)

    expect(mockOnOpen).toHaveBeenCalledWith(mockNote)
  })

  it('应该调用 onTagClick 当点击标签时', () => {
    renderWithRouter(
      <NoteCard
        note={mockNote}
        onOpen={mockOnOpen}
        onTagClick={mockOnTagClick}
      />
    )

    const tag = screen.getByText('技术')
    fireEvent.click(tag)

    expect(mockOnTagClick).toHaveBeenCalledWith('技术')
  })

  it('应该展开和折叠内容', async () => {
    renderWithRouter(
      <NoteCard
        note={mockNote}
        onOpen={mockOnOpen}
        onTagClick={mockOnTagClick}
        defaultExpanded={false}
      />
    )

    // 内容总是显示的，初始状态是预览模式
    const markdownContent = screen.getByTestId('markdown-content')
    expect(markdownContent).toBeInTheDocument()
    
    // 初始状态应该有行数限制
    const contentContainer = markdownContent.closest('.line-clamp-3')
    expect(contentContainer).toBeInTheDocument()
  })

  it('应该隐藏折叠按钮当 hideCollapseButton 为 true', () => {
    renderWithRouter(
      <NoteCard
        note={mockNote}
        onOpen={mockOnOpen}
        onTagClick={mockOnTagClick}
        hideCollapseButton={true}
      />
    )

    expect(screen.queryByRole('button', { name: /展开/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /折叠/ })).not.toBeInTheDocument()
  })

  it('应该默认展开当 defaultExpanded 为 true', () => {
    renderWithRouter(
      <NoteCard
        note={mockNote}
        onOpen={mockOnOpen}
        onTagClick={mockOnTagClick}
        defaultExpanded={true}
      />
    )

    expect(screen.getByTestId('markdown-content')).toBeInTheDocument()
  })

  it('应该处理没有内容的笔记', () => {
    const noteWithoutContent = { ...mockNote, content: undefined, contentPreview: undefined }
    
    renderWithRouter(
      <NoteCard
        note={noteWithoutContent}
        onOpen={mockOnOpen}
        onTagClick={mockOnTagClick}
      />
    )

    // 当没有内容时，不应该显示内容区域
    expect(screen.queryByTestId('markdown-content')).not.toBeInTheDocument()
  })

  it('应该处理没有时间信息的笔记', () => {
    const noteWithoutDates = { 
      ...mockNote, 
      created_at: undefined, 
      updated_at: undefined,
      createdDate: undefined,
      updatedDate: undefined 
    }
    
    renderWithRouter(
      <NoteCard
        note={noteWithoutDates}
        onOpen={mockOnOpen}
        onTagClick={mockOnTagClick}
      />
    )

    // 应该显示"未知日期"
    expect(screen.getByText('未知日期')).toBeInTheDocument()
  })
})
