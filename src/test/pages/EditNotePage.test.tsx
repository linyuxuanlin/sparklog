import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import EditNotePage from '@/pages/EditNotePage'
import { useGitHub } from '@/hooks/useGitHub'
import { useNotes } from '@/hooks/useNotes'
import { R2Service } from '@/services/r2Service'
import { StaticContentService } from '@/services/staticContentService'

// Mock dependencies
vi.mock('@/hooks/useGitHub')
vi.mock('@/hooks/useNotes')
vi.mock('@/services/r2Service')
vi.mock('@/services/staticContentService')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ noteId: 'test-note-id' }),
    useNavigate: () => vi.fn()
  }
})

const mockUseGitHub = vi.mocked(useGitHub)
const mockUseNotes = vi.mocked(useNotes)
const mockR2Service = vi.mocked(R2Service)
const mockStaticContentService = vi.mocked(StaticContentService)

// Mock note data
const mockNote = {
  name: 'test-note.md',
  path: 'notes/test-note.md',
  sha: 'test-sha',
  size: 100,
  url: '',
  git_url: '',
  html_url: '',
  download_url: '',
  type: 'file',
  contentPreview: 'Test content preview',
  fullContent: '---\ncreated_at: "2023-01-01T00:00:00.000Z"\nupdated_at: "2023-01-01T00:00:00.000Z"\nprivate: false\ntags: [test, example]\n---\n\nTest note content',
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
  isPrivate: false,
  tags: ['test', 'example']
}

describe('EditNotePage', () => {
  const mockLoadNotes = vi.fn()
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

    // Mock useNotes
    mockUseNotes.mockReturnValue({
      notes: [mockNote],
      isLoadingNotes: false,
      loadNotes: mockLoadNotes,
      loadMoreNotes: vi.fn(),
      deleteNote: vi.fn(),
      hasMoreNotes: false,
      loadingProgress: { current: 0, total: 0 },
      isPreloading: false,
      preloadedNotes: [],
      error: null,
      isRateLimited: false,
      buildStatus: { isBuilding: false },
      forceRefreshStatic: vi.fn()
    })

    // Mock R2Service
    const mockR2ServiceInstance = {
      saveFile: mockSaveFile,
      getFileContent: vi.fn().mockResolvedValue('Test file content')
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

  const renderEditNotePage = () => {
    return render(
      <BrowserRouter>
        <EditNotePage />
      </BrowserRouter>
    )
  }

  it('renders loading state initially', () => {
    renderEditNotePage()
    expect(screen.getByText('加载笔记中...')).toBeInTheDocument()
  })

  it('renders edit form when note is loaded', async () => {
    renderEditNotePage()
    
    await waitFor(() => {
      expect(screen.getByText('编辑笔记: test-note')).toBeInTheDocument()
    })

    expect(screen.getByLabelText('内容')).toBeInTheDocument()
    expect(screen.getByLabelText('标签')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '私密笔记' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument()
  })

  it('loads note content and parses front matter correctly', async () => {
    renderEditNotePage()
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test note content')).toBeInTheDocument()
    })

    // Check tags are loaded
    expect(screen.getByText('test')).toBeInTheDocument()
    expect(screen.getByText('example')).toBeInTheDocument()
    
    // Check privacy setting is loaded
    const privateCheckbox = screen.getByRole('checkbox', { name: '私密笔记' })
    expect(privateCheckbox).not.toBeChecked()
  })

  it('allows adding and removing tags', async () => {
    renderEditNotePage()
    
    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument()
    })

    // Add a new tag
    const tagInput = screen.getByPlaceholderText('添加标签')
    const addButton = screen.getByRole('button', { name: '添加' })
    
    fireEvent.change(tagInput, { target: { value: 'newtag' } })
    fireEvent.click(addButton)
    
    expect(screen.getByText('newtag')).toBeInTheDocument()
    
    // Remove an existing tag
    const removeButton = screen.getAllByRole('button').find(btn => 
      btn.getAttribute('aria-label') || btn.textContent?.includes('×')
    )
    if (removeButton) {
      fireEvent.click(removeButton)
    }
  })

  it('toggles privacy setting', async () => {
    renderEditNotePage()
    
    await waitFor(() => {
      const privateCheckbox = screen.getByRole('checkbox', { name: '私密笔记' })
      expect(privateCheckbox).not.toBeChecked()
      
      fireEvent.click(privateCheckbox)
      expect(privateCheckbox).toBeChecked()
    })
  })

  it('saves note with updated content', async () => {
    renderEditNotePage()
    
    await waitFor(() => {
      const contentTextarea = screen.getByLabelText('内容')
      fireEvent.change(contentTextarea, { target: { value: 'Updated content' } })
    })

    const saveButton = screen.getByRole('button', { name: '保存' })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockSaveFile).toHaveBeenCalledWith(
        'notes/test-note.md',
        expect.stringContaining('Updated content'),
        false
      )
      expect(mockUpdateNoteInCache).toHaveBeenCalled()
      expect(mockTriggerBuild).toHaveBeenCalled()
    })
  })

  it('displays success message after saving', async () => {
    renderEditNotePage()
    
    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: '保存' })
      fireEvent.click(saveButton)
    })

    await waitFor(() => {
      expect(screen.getByText('笔记保存成功！')).toBeInTheDocument()
    })
  })

  it('handles save errors gracefully', async () => {
    mockSaveFile.mockRejectedValue(new Error('Save failed'))
    
    renderEditNotePage()
    
    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: '保存' })
      fireEvent.click(saveButton)
    })

    await waitFor(() => {
      expect(screen.getByText(/保存失败/)).toBeInTheDocument()
    })
  })

  it('redirects unauthorized users to settings', async () => {
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

    renderEditNotePage()
    
    await waitFor(() => {
      expect(screen.getByText('需要登录才能编辑笔记')).toBeInTheDocument()
    })
  })

  it('shows error when note is not found', async () => {
    mockUseNotes.mockReturnValue({
      notes: [],
      isLoadingNotes: false,
      loadNotes: mockLoadNotes,
      loadMoreNotes: vi.fn(),
      deleteNote: vi.fn(),
      hasMoreNotes: false,
      loadingProgress: { current: 0, total: 0 },
      isPreloading: false,
      preloadedNotes: [],
      error: null,
      isRateLimited: false,
      buildStatus: { isBuilding: false },
      forceRefreshStatic: vi.fn()
    })

    renderEditNotePage()
    
    await waitFor(() => {
      expect(screen.getByText('未找到指定的笔记')).toBeInTheDocument()
    })
  })
})