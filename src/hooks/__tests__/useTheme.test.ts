import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTheme } from '../useTheme'

describe('useTheme', () => {
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

    // 模拟 matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('应该初始化主题状态', () => {
    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('light')
    expect(result.current.isLoading).toBe(false) // 初始化后 isLoading 应该是 false
  })

  it('应该从 localStorage 加载主题', () => {
    const localStorageMock = {
      getItem: vi.fn((key) => {
        if (key === 'sparklog_theme') {
          return 'dark'
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

    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('dark')
    expect(result.current.isLoading).toBe(false)
  })

  it('应该处理无效的 localStorage 主题值', () => {
    const localStorageMock = {
      getItem: vi.fn((key) => {
        if (key === 'sparklog_theme') {
          return 'invalid-theme'
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

    const { result } = renderHook(() => useTheme())

    // 组件会直接使用保存的值，即使它是无效的
    expect(result.current.theme).toBe('invalid-theme')
    expect(result.current.isLoading).toBe(false)
  })

  it('应该切换主题', () => {
    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('light')

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe('dark')
  })

  it('应该处理系统主题偏好', () => {
    // 模拟系统偏好深色主题
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    const { result } = renderHook(() => useTheme())

    // 如果没有 localStorage 主题，应该使用系统偏好
    expect(result.current.theme).toBe('dark')
    expect(result.current.isLoading).toBe(false)
  })

  it('应该将主题保存到 localStorage', () => {
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

    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.toggleTheme()
    })

    expect(localStorageMock.setItem).toHaveBeenCalledWith('sparklog_theme', 'dark')
  })

  it('应该处理 localStorage 不可用的情况', () => {
    // 模拟 localStorage 抛出错误
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => {
          throw new Error('localStorage is not available')
        }),
        setItem: vi.fn(() => {
          throw new Error('localStorage is not available')
        }),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      },
      writable: true,
    })

    // 应该抛出错误，因为 useTheme 会尝试访问 localStorage
    expect(() => {
      renderHook(() => useTheme())
    }).toThrow('localStorage is not available')
  })

  it('应该处理 matchMedia 不可用的情况', () => {
    // 模拟 matchMedia 抛出错误
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn(() => {
        throw new Error('matchMedia is not available')
      }),
      writable: true,
    })

    // 应该抛出错误，因为 useTheme 会尝试调用 matchMedia
    expect(() => {
      renderHook(() => useTheme())
    }).toThrow('matchMedia is not available')
  })

  it('应该正确处理主题切换的循环', () => {
    const { result } = renderHook(() => useTheme())

    // 从 light 开始
    expect(result.current.theme).toBe('light')

    // 切换到 dark
    act(() => {
      result.current.toggleTheme()
    })
    expect(result.current.theme).toBe('dark')

    // 再切换到 light
    act(() => {
      result.current.toggleTheme()
    })
    expect(result.current.theme).toBe('light')

    // 再切换到 dark
    act(() => {
      result.current.toggleTheme()
    })
    expect(result.current.theme).toBe('dark')
  })

  it('应该处理空字符串主题值', () => {
    const localStorageMock = {
      getItem: vi.fn((key) => {
        if (key === 'sparklog_theme') {
          return ''
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

    const { result } = renderHook(() => useTheme())

    // 应该回退到默认的 light 主题
    expect(result.current.theme).toBe('light')
    expect(result.current.isLoading).toBe(false)
  })
})
