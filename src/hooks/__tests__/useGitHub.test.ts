import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGitHub } from '../useGitHub'

// 模拟环境变量
vi.mock('@/config/env', () => ({
  getAdminPassword: () => 'admin123',
  getGitHubToken: () => 'github-token',
}))

// 模拟 GitHubService
vi.mock('@/services/githubService', () => ({
  GitHubService: {
    getInstance: vi.fn(() => ({
      setAuthData: vi.fn(),
      clearCache: vi.fn(),
    })),
  },
}))

describe('useGitHub', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // 清除 localStorage 模拟
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })

    // 模拟环境变量
    vi.stubEnv('VITE_ADMIN_PASSWORD', 'admin123')
    vi.stubEnv('VITE_GITHUB_TOKEN', 'github-token')
  })

  it('应该初始化状态', () => {
    const { result } = renderHook(() => useGitHub())

    expect(result.current.isConnected).toBe(false)
    expect(result.current.isLoggedIn()).toBe(false)
    expect(result.current.isLoading).toBe(false) // 初始化后 isLoading 应该是 false
    expect(result.current.isOwner).toBe(false)
  })

  it('应该从 localStorage 加载认证状态', () => {
    // 模拟 localStorage 中有认证数据
    const mockAuthData = {
      isAuthenticated: true,
      authenticatedAt: '2023-01-01T00:00:00.000Z',
    }
    
    const localStorageMock = {
      getItem: vi.fn((key) => {
        if (key === 'sparklog_admin_auth') {
          return JSON.stringify(mockAuthData)
        }
        return null
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    }
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })

    const { result } = renderHook(() => useGitHub())

    expect(result.current.isConnected).toBe(true)
    expect(result.current.isLoggedIn()).toBe(true)
    expect(result.current.isOwner).toBe(true)
    // token 来自环境变量，所以应该是 'github-token'
    expect(result.current.getGitHubToken()).toBe('github-token')
  })

  it('应该处理认证', () => {
    const { result } = renderHook(() => useGitHub())

    act(() => {
      const success = result.current.authenticate('admin123')
      expect(success).toBe(true)
    })

    expect(result.current.isConnected).toBe(true)
    expect(result.current.isOwner).toBe(true)
    expect(result.current.isLoggedIn()).toBe(true)
  })

  it('应该处理认证失败', () => {
    const { result } = renderHook(() => useGitHub())

    const success = result.current.authenticate('wrong-password')

    expect(success).toBe(false)
    expect(result.current.isConnected).toBe(false)
    expect(result.current.isOwner).toBe(false)
    expect(result.current.isLoggedIn()).toBe(false)
  })

  it('应该处理断开连接', () => {
    const { result } = renderHook(() => useGitHub())

    // 先认证
    act(() => {
      result.current.authenticate('admin123')
    })
    expect(result.current.isConnected).toBe(true)

    // 然后断开连接
    act(() => {
      result.current.disconnect()
    })

    expect(result.current.isConnected).toBe(false)
    expect(result.current.isOwner).toBe(false)
    expect(result.current.isLoggedIn()).toBe(false)
  })

  it('应该检查管理权限', () => {
    const { result } = renderHook(() => useGitHub())

    // 初始状态没有权限
    expect(result.current.hasManagePermission()).toBe(false)

    // 认证后有权限
    act(() => {
      result.current.authenticate('admin123')
    })
    expect(result.current.hasManagePermission()).toBe(true)

    // 断开连接后没有权限
    act(() => {
      result.current.disconnect()
    })
    expect(result.current.hasManagePermission()).toBe(false)
  })

  it('应该在没有认证时返回 null token', () => {
    const { result } = renderHook(() => useGitHub())

    expect(result.current.getGitHubToken()).toBeNull()
  })

  it('应该在认证后返回正确的 token', () => {
    const { result } = renderHook(() => useGitHub())

    act(() => {
      result.current.authenticate('admin123')
    })

    expect(result.current.getGitHubToken()).toBe('github-token')
  })

  it('应该在断开连接后返回 null token', () => {
    const { result } = renderHook(() => useGitHub())

    // 先认证
    act(() => {
      result.current.authenticate('admin123')
    })
    expect(result.current.getGitHubToken()).toBe('github-token')

    // 然后断开连接
    act(() => {
      result.current.disconnect()
    })
    expect(result.current.getGitHubToken()).toBeNull()
  })

  it('应该处理无效的 localStorage 数据', () => {
    const localStorageMock = {
      getItem: vi.fn(() => 'invalid-json'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    }
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })

    // 应该抛出 SyntaxError，因为 useGitHub 会尝试解析无效的 JSON
    expect(() => {
      renderHook(() => useGitHub())
    }).toThrow(SyntaxError)
  })

  it('应该处理空环境变量', () => {
    // 清除环境变量模拟
    vi.unstubAllEnvs()

    const { result } = renderHook(() => useGitHub())

    act(() => {
      result.current.authenticate('admin123')
    })

    // 即使认证成功，没有 token 也应该返回 null
    expect(result.current.getGitHubToken()).toBeNull()
  })
})
