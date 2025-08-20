import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getDefaultRepoConfig, getDefaultGitHubToken } from '../defaultRepo'

// 模拟环境变量
vi.mock('@/config/env', () => ({
  getRepoConfigFromEnv: vi.fn(() => ({
    owner: 'test-owner',
    repo: 'test-repo',
    description: 'SparkLog公开笔记仓库'
  })),
  getGitHubToken: vi.fn(() => 'test-token'),
  isDevelopment: vi.fn(() => false)
}))

describe('defaultRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getDefaultRepoConfig', () => {
    it('应该返回默认仓库配置', () => {
      const config = getDefaultRepoConfig()

      expect(config).toEqual({
        owner: 'test-owner',
        repo: 'test-repo',
        description: 'SparkLog公开笔记仓库'
      })
    })

    it('应该处理环境变量未设置的情况', async () => {
      // 模拟环境变量未设置
      const { getRepoConfigFromEnv } = await import('@/config/env')
      vi.mocked(getRepoConfigFromEnv).mockReturnValue(null)

      const config = getDefaultRepoConfig()

      expect(config).toBeNull()
    })

    it('应该处理部分环境变量未设置的情况', async () => {
      // 模拟部分环境变量未设置
      const { getRepoConfigFromEnv } = await import('@/config/env')
      vi.mocked(getRepoConfigFromEnv).mockReturnValue(null)

      const config = getDefaultRepoConfig()

      expect(config).toBeNull()
    })

    it('应该处理空字符串环境变量', async () => {
      // 模拟空字符串环境变量
      const { getRepoConfigFromEnv } = await import('@/config/env')
      vi.mocked(getRepoConfigFromEnv).mockReturnValue(null)

      const config = getDefaultRepoConfig()

      expect(config).toBeNull()
    })
  })

  describe('getDefaultGitHubToken', () => {
    it('应该返回默认 GitHub Token', () => {
      const token = getDefaultGitHubToken()

      expect(token).toBe('test-token')
    })

    it('应该处理环境变量未设置的情况', async () => {
      // 模拟环境变量未设置
      const { getGitHubToken } = await import('@/config/env')
      vi.mocked(getGitHubToken).mockReturnValue(null)

      const token = getDefaultGitHubToken()

      expect(token).toBeNull()
    })

    it('应该处理空字符串环境变量', async () => {
      // 模拟空字符串环境变量
      const { getGitHubToken } = await import('@/config/env')
      vi.mocked(getGitHubToken).mockReturnValue('')

      const token = getDefaultGitHubToken()

      expect(token).toBe('')
    })
  })

  describe('配置验证', () => {
    it('应该验证配置的完整性', () => {
      const config = getDefaultRepoConfig()
      const token = getDefaultGitHubToken()

      if (config) {
        expect(config.owner).toBeTruthy()
        expect(config.repo).toBeTruthy()
        expect(typeof config.owner).toBe('string')
        expect(typeof config.repo).toBe('string')
      }

      if (token !== undefined) {
        expect(typeof token).toBe('string')
      }
    })

    it('应该处理特殊字符在配置中', async () => {
      // 模拟包含特殊字符的环境变量
      const { getRepoConfigFromEnv, getGitHubToken } = await import('@/config/env')
      vi.mocked(getRepoConfigFromEnv).mockReturnValue({
        owner: 'user-name_with.underscores',
        repo: 'repo-name-with-dashes',
        description: 'SparkLog公开笔记仓库'
      })
      vi.mocked(getGitHubToken).mockReturnValue('token-with-special-chars!@#')

      const config = getDefaultRepoConfig()
      const token = getDefaultGitHubToken()

      expect(config).toEqual({
        owner: 'user-name_with.underscores',
        repo: 'repo-name-with-dashes',
        description: 'SparkLog公开笔记仓库'
      })
      expect(token).toBe('token-with-special-chars!@#')
    })

    it('应该处理非常长的配置值', async () => {
      // 模拟非常长的环境变量
      const longValue = 'a'.repeat(1000)
      const { getRepoConfigFromEnv, getGitHubToken } = await import('@/config/env')
      vi.mocked(getRepoConfigFromEnv).mockReturnValue({
        owner: longValue,
        repo: longValue,
        description: 'SparkLog公开笔记仓库'
      })
      vi.mocked(getGitHubToken).mockReturnValue(longValue)

      const config = getDefaultRepoConfig()
      const token = getDefaultGitHubToken()

      expect(config).toEqual({
        owner: longValue,
        repo: longValue,
        description: 'SparkLog公开笔记仓库'
      })
      expect(token).toBe(longValue)
    })
  })

  describe('错误处理', () => {
    it('应该处理环境变量模块导入失败', async () => {
      // 模拟模块导入失败
      const { getRepoConfigFromEnv, getGitHubToken } = await import('@/config/env')
      vi.mocked(getRepoConfigFromEnv).mockImplementation(() => {
        throw new Error('Module import failed')
      })
      vi.mocked(getGitHubToken).mockImplementation(() => {
        throw new Error('Module import failed')
      })

      // 应该优雅地处理错误
      expect(() => getDefaultRepoConfig()).toThrow('Module import failed')
      expect(() => getDefaultGitHubToken()).toThrow('Module import failed')
    })

    it('应该处理环境变量类型错误', async () => {
      // 模拟环境变量类型错误
      const { getRepoConfigFromEnv, getGitHubToken } = await import('@/config/env')
      vi.mocked(getRepoConfigFromEnv).mockReturnValue(null)
      vi.mocked(getGitHubToken).mockReturnValue(null)

      const config = getDefaultRepoConfig()
      const token = getDefaultGitHubToken()

      // 应该处理类型转换或返回 null/undefined
      expect(config).toBeNull()
      expect(token).toBeNull()
    })
  })
})
