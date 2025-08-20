import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import EditNotePage from '@/pages/EditNotePage'
import { useGitHub } from '@/hooks/useGitHub'
import { R2Service } from '@/services/r2Service'
import { StaticContentService } from '@/services/staticContentService'

// Mock dependencies
vi.mock('@/hooks/useGitHub')
vi.mock('@/services/r2Service')
vi.mock('@/services/staticContentService')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({})
  }
})

const mockUseGitHub = vi.mocked(useGitHub)
const mockR2Service = vi.mocked(R2Service)
const mockStaticContentService = vi.mocked(StaticContentService)

describe('EditNotePage (Create Mode)', () => {
  const mockSaveFile = vi.fn()
  const mockUpdateNoteInCache = vi.fn()
  const mockTriggerBuild = vi.fn()

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Mock useGitHub
    mockUseGitHub.mockReturnValue({
      isLoggedIn: () => true,
      isLoading: false,
      isConnected: true,
      isOwner: true,
      hasManagePermission: () => true,
      authenticate: vi.fn(),
      disconnect: vi.fn(),
      getGitHubToken: vi.fn()
    })

    // Mock R2Service
    const mockR2ServiceInstance = {
      saveFile: mockSaveFile
    }
    mockR2Service.getInstance = vi.fn().mockReturnValue(mockR2ServiceInstance)

    // Mock StaticContentService
    const mockStaticContentServiceInstance = {
      updateNoteInCache: mockUpdateNoteInCache,
      triggerBuild: mockTriggerBuild
    }
    mockStaticContentService.getInstance = vi.fn().mockReturnValue(mockStaticContentServiceInstance)

    // Mock successful save
    mockSaveFile.mockResolvedValue({ success: true })
    mockTriggerBuild.mockResolvedValue({ success: true, message: 'Build triggered' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderCreateNotePage = () => {
    return render(
      <BrowserRouter>
        <EditNotePage isCreate={true} />
      </BrowserRouter>
    )
  }

  it('renders create note form for logged in users', () => {
    renderCreateNotePage()
    
    expect(screen.getByText('新建笔记')).toBeInTheDocument()
    expect(screen.getByLabelText('内容')).toBeInTheDocument()
    expect(screen.getByLabelText('标签')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '私密笔记' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '创建笔记' })).toBeInTheDocument()
  })

  it('redirects unauthorized users to settings', () => {
    mockUseGitHub.mockReturnValue({
      isLoggedIn: () => false,
      isLoading: false,
      isConnected: false,
      isOwner: false,
      hasManagePermission: () => false,
      authenticate: vi.fn(),
      disconnect: vi.fn(),
      getGitHubToken: vi.fn()
    })

    renderCreateNotePage()
    
    expect(screen.getByText('需要管理员权限')).toBeInTheDocument()
  })

  it('allows typing content', () => {
    renderCreateNotePage()
    
    const contentTextarea = screen.getByLabelText('内容')
    fireEvent.change(contentTextarea, { target: { value: 'New note content' } })
    
    expect(contentTextarea).toHaveValue('New note content')
  })

  it('allows adding and removing tags', () => {
    renderCreateNotePage()
    
    const tagInput = screen.getByPlaceholderText('添加标签')
    const addButton = screen.getByRole('button', { name: '添加' })
    
    // Add a tag
    fireEvent.change(tagInput, { target: { value: 'testtag' } })
    fireEvent.click(addButton)
    
    expect(screen.getByText('testtag')).toBeInTheDocument()
    expect(tagInput).toHaveValue('')
    
    // Add another tag
    fireEvent.change(tagInput, { target: { value: 'anothertag' } })
    fireEvent.click(addButton)
    
    expect(screen.getByText('anothertag')).toBeInTheDocument()
  })

  it('allows adding tags with Enter key', () => {
    renderCreateNotePage()
    
    const tagInput = screen.getByPlaceholderText('添加标签')
    
    fireEvent.change(tagInput, { target: { value: 'entertag' } })
    fireEvent.keyPress(tagInput, { key: 'Enter', code: 'Enter' })
    
    expect(screen.getByText('entertag')).toBeInTheDocument()
    expect(tagInput).toHaveValue('')
  })

  it('prevents duplicate tags', () => {
    renderCreateNotePage()
    
    const tagInput = screen.getByPlaceholderText('添加标签')
    const addButton = screen.getByRole('button', { name: '添加' })
    
    // Add a tag
    fireEvent.change(tagInput, { target: { value: 'duplicatetag' } })
    fireEvent.click(addButton)
    
    // Try to add the same tag again
    fireEvent.change(tagInput, { target: { value: 'duplicatetag' } })
    fireEvent.click(addButton)
    
    // Should only have one instance
    const tags = screen.getAllByText('duplicatetag')
    expect(tags).toHaveLength(1)
  })

  it('toggles privacy setting', () => {
    renderCreateNotePage()
    
    const privateCheckbox = screen.getByRole('checkbox', { name: '私密笔记' })
    expect(privateCheckbox).not.toBeChecked()
    
    fireEvent.click(privateCheckbox)
    expect(privateCheckbox).toBeChecked()
    
    fireEvent.click(privateCheckbox)
    expect(privateCheckbox).not.toBeChecked()
  })

  it('disables create button when content is empty', () => {
    renderCreateNotePage()
    
    const createButton = screen.getByRole('button', { name: '创建笔记' })
    expect(createButton).toBeDisabled()
    
    const contentTextarea = screen.getByLabelText('内容')
    fireEvent.change(contentTextarea, { target: { value: 'Some content' } })
    
    expect(createButton).not.toBeDisabled()
  })

  it('shows error when trying to create note without content', async () => {
    renderCreateNotePage()
    
    // Add some content first to enable the button
    const contentTextarea = screen.getByLabelText('内容')
    fireEvent.change(contentTextarea, { target: { value: 'temp' } })
    
    // Clear the content
    fireEvent.change(contentTextarea, { target: { value: '   ' } })
    
    const createButton = screen.getByRole('button', { name: '创建笔记' })
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText('笔记内容不能为空')).toBeInTheDocument()
    })
    
    expect(mockSaveFile).not.toHaveBeenCalled()
  })

  it('creates note with correct front matter and content', async () => {
    renderCreateNotePage()
    
    // Fill in content
    const contentTextarea = screen.getByLabelText('内容')
    fireEvent.change(contentTextarea, { target: { value: 'This is my new note content' } })
    
    // Add tags
    const tagInput = screen.getByPlaceholderText('添加标签')
    const addButton = screen.getByRole('button', { name: '添加' })
    
    fireEvent.change(tagInput, { target: { value: 'tag1' } })
    fireEvent.click(addButton)
    fireEvent.change(tagInput, { target: { value: 'tag2' } })
    fireEvent.click(addButton)
    
    // Set as private
    const privateCheckbox = screen.getByRole('checkbox', { name: '私密笔记' })
    fireEvent.click(privateCheckbox)
    
    // Create note
    const createButton = screen.getByRole('button', { name: '创建笔记' })
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(mockSaveFile).toHaveBeenCalledWith(
        expect.stringMatching(/^notes\/.*\.md$/),
        expect.stringContaining('This is my new note content')
      )
    })
    
    // Check that the content includes proper front matter
    const [, content] = mockSaveFile.mock.calls[0]
    expect(content).toContain('---')
    expect(content).toContain('created_at:')
    expect(content).toContain('updated_at:')
    expect(content).toContain('private: true')
    expect(content).toContain('tags: [tag1, tag2]')
    expect(content).toContain('This is my new note content')
  })

  it('triggers cache update and build after successful creation', async () => {
    renderCreateNotePage()
    
    const contentTextarea = screen.getByLabelText('内容')
    fireEvent.change(contentTextarea, { target: { value: 'Test content' } })
    
    const createButton = screen.getByRole('button', { name: '创建笔记' })
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(mockUpdateNoteInCache).toHaveBeenCalled()
      expect(mockTriggerBuild).toHaveBeenCalled()
    })
  })

  it('displays success message after creation', async () => {
    renderCreateNotePage()
    
    const contentTextarea = screen.getByLabelText('内容')
    fireEvent.change(contentTextarea, { target: { value: 'Test content' } })
    
    const createButton = screen.getByRole('button', { name: '创建笔记' })
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText('笔记创建成功！')).toBeInTheDocument()
    })
  })

  it('handles creation errors gracefully', async () => {
    mockSaveFile.mockRejectedValue(new Error('Creation failed'))
    
    renderCreateNotePage()
    
    const contentTextarea = screen.getByLabelText('内容')
    fireEvent.change(contentTextarea, { target: { value: 'Test content' } })
    
    const createButton = screen.getByRole('button', { name: '创建笔记' })
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText(/创建失败/)).toBeInTheDocument()
    })
  })

  it('shows loading state during creation', async () => {
    // Make save take some time
    mockSaveFile.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    renderCreateNotePage()
    
    const contentTextarea = screen.getByLabelText('内容')
    fireEvent.change(contentTextarea, { target: { value: 'Test content' } })
    
    const createButton = screen.getByRole('button', { name: '创建笔记' })
    fireEvent.click(createButton)
    
    expect(screen.getByText('创建中...')).toBeInTheDocument()
    expect(createButton).toBeDisabled()
    
    await waitFor(() => {
      expect(screen.getByText('笔记创建成功！')).toBeInTheDocument()
    })
  })
})