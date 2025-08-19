import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  checkEnvVarsConfigured,
  getRepoConfigFromEnv,
  getAdminPassword,
  getR2Config,
  getStaticBranch,
  getAppTitle,
  getAppDescription,
  getDefaultTheme,
  isDevelopment,
  getCurrentDomain
} from '@/config/env'

describe('Environment Configuration', () => {
  const originalEnv = { ...import.meta.env }

  beforeEach(() => {
    // 清空所有环境变量
    Object.keys(import.meta.env).forEach(key => {
      delete (import.meta.env as any)[key]
    })
  })

  afterEach(() => {
    // 恢复原始环境变量
    Object.keys(originalEnv).forEach(key => {
      (import.meta.env as any)[key] = (originalEnv as any)[key]
    })
  })

  describe('checkEnvVarsConfigured', () => {
    it('should return true when all required env vars are set for R2 architecture', () => {
      // 设置 R2 架构的必要环境变量
      ;(import.meta.env as any).VITE_R2_ACCOUNT_ID = 'test-account-id'
      ;(import.meta.env as any).VITE_R2_ACCESS_KEY_ID = 'test-access-key'
      ;(import.meta.env as any).VITE_R2_SECRET_ACCESS_KEY = 'test-secret-key'
      ;(import.meta.env as any).VITE_R2_BUCKET_NAME = 'test-bucket'
      ;(import.meta.env as any).VITE_ADMIN_PASSWORD = 'test-password'

      const result = checkEnvVarsConfigured()
      expect(result).toBe(true)
    })

    it('should return false when R2 config is missing', () => {
      // 只设置部分环境变量，缺少 R2 配置
      ;(import.meta.env as any).VITE_ADMIN_PASSWORD = 'test-password'

      const result = checkEnvVarsConfigured()
      expect(result).toBe(false)
    })

    it('should return false when admin password is missing', () => {
      // 设置 R2 配置但缺少管理员密码
      ;(import.meta.env as any).VITE_R2_ACCOUNT_ID = 'test-account-id'
      ;(import.meta.env as any).VITE_R2_ACCESS_KEY_ID = 'test-access-key'
      ;(import.meta.env as any).VITE_R2_SECRET_ACCESS_KEY = 'test-secret-key'
      ;(import.meta.env as any).VITE_R2_BUCKET_NAME = 'test-bucket'
      // 缺少 VITE_ADMIN_PASSWORD

      const result = checkEnvVarsConfigured()
      expect(result).toBe(false)
    })


  })

  describe('getRepoConfigFromEnv', () => {
    it('should return repo config when env vars are set', () => {
      ;(import.meta.env as any).VITE_REPO_OWNER = 'test-owner'
      ;(import.meta.env as any).VITE_REPO_NAME = 'test-repo'

      const result = getRepoConfigFromEnv()
      
      expect(result).toEqual({
        owner: 'test-owner',
        repo: 'test-repo',
        description: 'SparkLog公开笔记仓库'
      })
    })

    it('should support alternative env var names', () => {
      ;(import.meta.env as any).VITE_GITHUB_OWNER = 'test-owner'
      ;(import.meta.env as any).VITE_GITHUB_REPO = 'test-repo'

      const result = getRepoConfigFromEnv()
      
      expect(result).toEqual({
        owner: 'test-owner',
        repo: 'test-repo',
        description: 'SparkLog公开笔记仓库'
      })
    })

    it('should return null when env vars are missing', () => {
      // 不设置任何环境变量

      const result = getRepoConfigFromEnv()
      expect(result).toBeNull()
    })
  })



  describe('getAdminPassword', () => {
    it('should return admin password from env', () => {
      ;(import.meta.env as any).VITE_ADMIN_PASSWORD = 'secure-password-123'

      const result = getAdminPassword()
      expect(result).toBe('secure-password-123')
    })

    it('should return null when password is missing', () => {
      // 不设置任何环境变量

      const result = getAdminPassword()
      expect(result).toBeNull()
    })
  })

  describe('getR2Config', () => {
    it('should return R2 config when all required env vars are set', () => {
      ;(import.meta.env as any).VITE_R2_ACCOUNT_ID = 'test-account-id'
      ;(import.meta.env as any).VITE_R2_ACCESS_KEY_ID = 'test-access-key'
      ;(import.meta.env as any).VITE_R2_SECRET_ACCESS_KEY = 'test-secret-key'
      ;(import.meta.env as any).VITE_R2_BUCKET_NAME = 'test-bucket'
      ;(import.meta.env as any).VITE_R2_PUBLIC_URL = 'https://test.example.com'

      const result = getR2Config()
      
      expect(result).toEqual({
        accountId: 'test-account-id',
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        bucketName: 'test-bucket',
        publicUrl: 'https://test.example.com'
      })
    })

    it('should return R2 config without public URL when optional env var is missing', () => {
      ;(import.meta.env as any).VITE_R2_ACCOUNT_ID = 'test-account-id'
      ;(import.meta.env as any).VITE_R2_ACCESS_KEY_ID = 'test-access-key'
      ;(import.meta.env as any).VITE_R2_SECRET_ACCESS_KEY = 'test-secret-key'
      ;(import.meta.env as any).VITE_R2_BUCKET_NAME = 'test-bucket'
      // 缺少 VITE_R2_PUBLIC_URL

      const result = getR2Config()
      
      expect(result).not.toBeNull()
      if (result) {
        expect(result).toEqual({
          accountId: 'test-account-id',
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
          bucketName: 'test-bucket'
        })
        expect(result.publicUrl).toBeUndefined()
      }
    })

    it('should return null when any required R2 env var is missing', () => {
      ;(import.meta.env as any).VITE_R2_ACCOUNT_ID = 'test-account-id'
      ;(import.meta.env as any).VITE_R2_ACCESS_KEY_ID = 'test-access-key'
      // 缺少 VITE_R2_SECRET_ACCESS_KEY 和 VITE_R2_BUCKET_NAME

      const result = getR2Config()
      expect(result).toBeNull()
    })
  })

  describe('getStaticBranch', () => {
    it('should return static branch from env', () => {
      ;(import.meta.env as any).VITE_STATIC_BRANCH = 'custom-branch'

      const result = getStaticBranch()
      expect(result).toBe('custom-branch')
    })

    it('should return default value when env var is missing', () => {
      // 不设置任何环境变量

      const result = getStaticBranch()
      expect(result).toBe('static-content')
    })
  })

  describe('getAppTitle', () => {
    it('should return app title from env', () => {
      ;(import.meta.env as any).VITE_APP_TITLE = 'Custom App Title'

      const result = getAppTitle()
      expect(result).toBe('Custom App Title')
    })

    it('should return default value when env var is missing', () => {
      // 不设置任何环境变量

      const result = getAppTitle()
      expect(result).toBe('SparkLog')
    })
  })

  describe('getAppDescription', () => {
    it('should return app description from env', () => {
      ;(import.meta.env as any).VITE_APP_DESCRIPTION = 'Custom app description'

      const result = getAppDescription()
      expect(result).toBe('Custom app description')
    })

    it('should return default value when env var is missing', () => {
      // 不设置任何环境变量

      const result = getAppDescription()
      expect(result).toBe('优雅免维护的想法记录应用')
    })
  })

  describe('getDefaultTheme', () => {
    it('should return default theme from env', () => {
      ;(import.meta.env as any).VITE_DEFAULT_THEME = 'dark'

      const result = getDefaultTheme()
      expect(result).toBe('dark')
    })

    it('should return default value when env var is missing', () => {
      // 不设置任何环境变量

      const result = getDefaultTheme()
      expect(result).toBe('auto')
    })
  })

  describe('isDevelopment', () => {
    it('should return true in development mode', () => {
      ;(import.meta.env as any).DEV = true

      const result = isDevelopment()
      expect(result).toBe(true)
    })

    it('should return true when mode is development', () => {
      ;(import.meta.env as any).MODE = 'development'

      const result = isDevelopment()
      expect(result).toBe(true)
    })

    it('should return false in production mode', () => {
      ;(import.meta.env as any).DEV = false
      ;(import.meta.env as any).MODE = 'production'

      const result = isDevelopment()
      expect(result).toBe(false)
    })
  })

  describe('getCurrentDomain', () => {
    it('should return current hostname', () => {
      // 使用全局的 window mock
      const result = getCurrentDomain()
      expect(result).toBe('example.com')
    })
  })
})
