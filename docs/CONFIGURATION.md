# SparkLog 配置指南

## 📋 概述

本指南详细说明 SparkLog 的所有配置选项，包括环境变量、服务配置、安全设置等。

## 🔧 环境变量配置

### 必需环境变量

以下环境变量是 SparkLog 正常运行所必需的：

#### 1. GitHub 配置

| 变量名 | 说明 | 示例值 | 获取方式 |
|--------|------|--------|----------|
| `VITE_REPO_OWNER` | GitHub 用户名或组织名 | `linyuxuanlin` | GitHub 个人资料页面 |
| `VITE_REPO_NAME` | 笔记仓库名称 | `sparklog-notes` | 自定义仓库名称 |
| `VITE_GITHUB_TOKEN` | GitHub 个人访问令牌 | `ghp_xxxxxxxx` | [GitHub Settings → Tokens](https://github.com/settings/tokens) |

#### 2. 管理员配置

| 变量名 | 说明 | 示例值 | 安全要求 |
|--------|------|--------|----------|
| `VITE_ADMIN_PASSWORD` | 管理员密码 | `your-secure-password` | 至少 12 位，包含大小写字母、数字和特殊字符 |

#### 3. Cloudflare R2 配置

| 变量名 | 说明 | 示例值 | 获取方式 |
|--------|------|--------|----------|
| `VITE_R2_ACCOUNT_ID` | Cloudflare R2 Account ID | `1234567890abcdef` | Cloudflare Dashboard 右侧 |
| `VITE_R2_ACCESS_KEY_ID` | R2 Access Key ID | `abc123def456` | R2 API Token 创建页面 |
| `VITE_R2_SECRET_ACCESS_KEY` | R2 Secret Access Key | `your-secret-key` | R2 API Token 创建页面 |
| `VITE_R2_BUCKET_NAME` | R2 存储桶名称 | `sparklog-notes` | 自定义存储桶名称 |

### 可选环境变量

以下环境变量是可选的，用于高级配置：

#### 1. R2 高级配置

| 变量名 | 说明 | 示例值 | 默认值 |
|--------|------|--------|--------|
| `VITE_R2_PUBLIC_URL` | R2 公开访问 URL | `https://notes.example.com` | 无 |
| `VITE_R2_ENDPOINT` | 自定义 R2 端点 | `https://custom.r2.example.com` | Cloudflare 默认端点 |

#### 2. 静态内容配置

| 变量名 | 说明 | 示例值 | 默认值 |
|--------|------|--------|--------|
| `VITE_STATIC_BRANCH` | 静态内容分支名称 | `static-content` | `static-content` |
| `VITE_STATIC_FALLBACK_BRANCH` | 回退分支名称 | `main` | `main` |

#### 3. 应用配置

| 变量名 | 说明 | 示例值 | 默认值 |
|--------|------|--------|--------|
| `VITE_APP_TITLE` | 应用标题 | `我的笔记` | `SparkLog` |
| `VITE_APP_DESCRIPTION` | 应用描述 | `个人知识管理工具` | `优雅免维护的想法记录应用` |
| `VITE_DEFAULT_THEME` | 默认主题 | `dark` | `auto` |

#### 4. 功能开关

| 变量名 | 说明 | 示例值 | 默认值 |
|--------|------|--------|--------|
| `VITE_ENABLE_ENCRYPTION` | 启用加密功能 | `true` | `true` |
| `VITE_ENABLE_CACHE` | 启用缓存功能 | `true` | `true` |
| `VITE_ENABLE_BUILD_STATUS` | 启用构建状态显示 | `true` | `true` |

## 🏗️ 服务配置

### 1. R2 存储服务配置

```typescript
// src/config/env.ts
export interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  publicUrl?: string
  endpoint?: string
  region?: string
}

// 获取 R2 配置
export const getR2ConfigFromEnv = (): R2Config | null => {
  const accountId = import.meta.env.VITE_R2_ACCOUNT_ID
  const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID
  const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY
  const bucketName = import.meta.env.VITE_R2_BUCKET_NAME
  const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL
  const endpoint = import.meta.env.VITE_R2_ENDPOINT
  const region = import.meta.env.VITE_R2_REGION || 'auto'

  if (accountId && accessKeyId && secretAccessKey && bucketName) {
    return {
      accountId,
      accessKeyId,
      secretAccessKey,
      bucketName,
      publicUrl,
      endpoint,
      region
    }
  }

  return null
}
```

### 2. 静态内容配置

```typescript
// src/config/env.ts
export interface StaticContentConfig {
  staticBranch: string
  fallbackBranch: string
  cacheDuration: number
  retryAttempts: number
}

export function getStaticContentConfigFromEnv(): StaticContentConfig {
  const staticBranch = import.meta.env.VITE_STATIC_BRANCH || 'static-content'
  const fallbackBranch = import.meta.env.VITE_STATIC_FALLBACK_BRANCH || 'main'
  const cacheDuration = parseInt(import.meta.env.VITE_CACHE_DURATION || '300000') // 5分钟
  const retryAttempts = parseInt(import.meta.env.VITE_RETRY_ATTEMPTS || '3')

  return {
    staticBranch,
    fallbackBranch,
    cacheDuration,
    retryAttempts
  }
}
```

### 3. 应用配置

```typescript
// src/config/env.ts
export interface AppConfig {
  title: string
  description: string
  defaultTheme: 'light' | 'dark' | 'auto'
  enableEncryption: boolean
  enableCache: boolean
  enableBuildStatus: boolean
}

export function getAppConfigFromEnv(): AppConfig {
  return {
    title: import.meta.env.VITE_APP_TITLE || 'SparkLog',
    description: import.meta.env.VITE_APP_DESCRIPTION || '优雅免维护的想法记录应用',
    defaultTheme: (import.meta.env.VITE_DEFAULT_THEME as 'light' | 'dark' | 'auto') || 'auto',
    enableEncryption: import.meta.env.VITE_ENABLE_ENCRYPTION !== 'false',
    enableCache: import.meta.env.VITE_ENABLE_CACHE !== 'false',
    enableBuildStatus: import.meta.env.VITE_ENABLE_BUILD_STATUS !== 'false'
  }
}
```

## 🔐 安全配置

### 1. 加密配置

```typescript
// src/services/encryptionService.ts
export interface EncryptionConfig {
  algorithm: string
  keyLength: number
  ivLength: number
  saltLength: number
  iterations: number
}

export const DEFAULT_ENCRYPTION_CONFIG: EncryptionConfig = {
  algorithm: 'AES-GCM',
  keyLength: 256,
  ivLength: 12,
  saltLength: 16,
  iterations: 100000
}
```

### 2. 认证配置

```typescript
// src/hooks/useGitHub.ts
export interface AuthConfig {
  sessionTimeout: number
  maxLoginAttempts: number
  lockoutDuration: number
  requireReauth: boolean
}

export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  sessionTimeout: 24 * 60 * 60 * 1000, // 24小时
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15分钟
  requireReauth: false
}
```

### 3. 缓存配置

```typescript
// src/services/noteCacheService.ts
export interface CacheConfig {
  maxSize: number
  ttl: number
  cleanupInterval: number
  enablePersistent: boolean
}

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 100, // 最大缓存条目数
  ttl: 5 * 60 * 1000, // 5分钟
  cleanupInterval: 60 * 1000, // 1分钟清理一次
  enablePersistent: false // 是否启用持久化缓存
}
```

## 🌍 环境特定配置

### 1. 开发环境配置

创建 `.env.development` 文件：

```env
# 开发环境配置
NODE_ENV=development
VITE_APP_ENV=development

# 开发环境 R2 配置
VITE_R2_BUCKET_NAME=sparklog-dev-notes
VITE_R2_PUBLIC_URL=http://localhost:3000

# 开发环境功能开关
VITE_ENABLE_DEBUG=true
VITE_ENABLE_MOCK=true
VITE_ENABLE_HOT_RELOAD=true

# 开发环境缓存配置
VITE_CACHE_DURATION=60000
VITE_RETRY_ATTEMPTS=1
```

### 2. 测试环境配置

创建 `.env.test` 文件：

```env
# 测试环境配置
NODE_ENV=test
VITE_APP_ENV=test

# 测试环境 R2 配置
VITE_R2_BUCKET_NAME=sparklog-test-notes

# 测试环境功能开关
VITE_ENABLE_ENCRYPTION=false
VITE_ENABLE_CACHE=false
VITE_ENABLE_BUILD_STATUS=false

# 测试环境超时配置
VITE_REQUEST_TIMEOUT=5000
VITE_TEST_TIMEOUT=10000
```

### 3. 生产环境配置

创建 `.env.production` 文件：

```env
# 生产环境配置
NODE_ENV=production
VITE_APP_ENV=production

# 生产环境 R2 配置
VITE_R2_BUCKET_NAME=sparklog-prod-notes
VITE_R2_PUBLIC_URL=https://notes.yourdomain.com

# 生产环境功能开关
VITE_ENABLE_DEBUG=false
VITE_ENABLE_MOCK=false

# 生产环境性能配置
VITE_CACHE_DURATION=300000
VITE_RETRY_ATTEMPTS=3
VITE_REQUEST_TIMEOUT=30000
```

## 🔄 动态配置

### 1. 运行时配置更新

```typescript
// src/config/dynamicConfig.ts
export class DynamicConfig {
  private static instance: DynamicConfig
  private config: Map<string, any> = new Map()

  static getInstance(): DynamicConfig {
    if (!DynamicConfig.instance) {
      DynamicConfig.instance = new DynamicConfig()
    }
    return DynamicConfig.instance
  }

  // 设置配置值
  set(key: string, value: any): void {
    this.config.set(key, value)
  }

  // 获取配置值
  get<T>(key: string, defaultValue?: T): T | undefined {
    return this.config.get(key) ?? defaultValue
  }

  // 更新多个配置
  update(config: Record<string, any>): void {
    Object.entries(config).forEach(([key, value]) => {
      this.config.set(key, value)
    })
  }

  // 清除配置
  clear(): void {
    this.config.clear()
  }
}
```

### 2. 配置验证

```typescript
// src/config/validator.ts
export interface ConfigValidationRule {
  key: string
  required: boolean
  type: 'string' | 'number' | 'boolean' | 'array'
  validator?: (value: any) => boolean
  defaultValue?: any
}

export class ConfigValidator {
  private rules: ConfigValidationRule[] = []

  // 添加验证规则
  addRule(rule: ConfigValidationRule): void {
    this.rules.push(rule)
  }

  // 验证配置
  validate(config: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    this.rules.forEach(rule => {
      const value = config[rule.key]

      // 检查必需字段
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`配置项 ${rule.key} 是必需的`)
        return
      }

      // 检查类型
      if (value !== undefined && value !== null) {
        const actualType = Array.isArray(value) ? 'array' : typeof value
        if (actualType !== rule.type) {
          errors.push(`配置项 ${rule.key} 类型错误，期望 ${rule.type}，实际 ${actualType}`)
        }
      }

      // 自定义验证
      if (rule.validator && value !== undefined && value !== null) {
        if (!rule.validator(value)) {
          errors.push(`配置项 ${rule.key} 验证失败`)
        }
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }
}
```

## 📊 配置监控

### 1. 配置变更监听

```typescript
// src/config/monitor.ts
export class ConfigMonitor {
  private listeners: Map<string, Set<(value: any) => void>> = new Map()

  // 监听配置变更
  watch(key: string, callback: (value: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }

    this.listeners.get(key)!.add(callback)

    // 返回取消监听的函数
    return () => {
      this.listeners.get(key)?.delete(callback)
    }
  }

  // 通知配置变更
  notify(key: string, value: any): void {
    this.listeners.get(key)?.forEach(callback => {
      try {
        callback(value)
      } catch (error) {
        console.error(`配置监听器执行失败:`, error)
      }
    })
  }

  // 获取所有监听器
  getListeners(): Map<string, Set<(value: any) => void>> {
    return new Map(this.listeners)
  }
}
```

### 2. 配置健康检查

```typescript
// src/config/health.ts
export interface ConfigHealthStatus {
  status: 'healthy' | 'warning' | 'error'
  checks: Array<{
    name: string
    status: 'pass' | 'warn' | 'fail'
    message: string
    details?: any
  }>
  timestamp: string
}

export class ConfigHealthChecker {
  // 检查配置健康状态
  async checkHealth(): Promise<ConfigHealthStatus> {
    const checks: ConfigHealthStatus['checks'] = []

    // 检查必需配置
    const requiredConfigs = [
      'VITE_REPO_OWNER',
      'VITE_REPO_NAME',
      'VITE_GITHUB_TOKEN',
      'VITE_ADMIN_PASSWORD',
      'VITE_R2_ACCOUNT_ID',
      'VITE_R2_ACCESS_KEY_ID',
      'VITE_R2_SECRET_ACCESS_KEY',
      'VITE_R2_BUCKET_NAME'
    ]

    requiredConfigs.forEach(key => {
      const value = import.meta.env[key]
      if (value) {
        checks.push({
          name: key,
          status: 'pass',
          message: '配置正常'
        })
      } else {
        checks.push({
          name: key,
          status: 'fail',
          message: '配置缺失'
        })
      }
    })

    // 检查 R2 连接
    try {
      const r2Config = getR2ConfigFromEnv()
      if (r2Config) {
        // 尝试连接 R2
        const r2Service = R2StorageService.getInstance()
        await r2Service.initialize(r2Config)
        const isConnected = await r2Service.testConnection()
        
        checks.push({
          name: 'R2 连接',
          status: isConnected ? 'pass' : 'fail',
          message: isConnected ? '连接正常' : '连接失败'
        })
      }
    } catch (error) {
      checks.push({
        name: 'R2 连接',
        status: 'fail',
        message: '连接异常',
        details: error.message
      })
    }

    // 确定整体状态
    const hasFailures = checks.some(check => check.status === 'fail')
    const hasWarnings = checks.some(check => check.status === 'warn')
    
    let status: ConfigHealthStatus['status'] = 'healthy'
    if (hasFailures) {
      status = 'error'
    } else if (hasWarnings) {
      status = 'warning'
    }

    return {
      status,
      checks,
      timestamp: new Date().toISOString()
    }
  }
}
```

## 🚨 故障排除

### 1. 常见配置问题

#### 问题：R2 连接失败

**症状**: 无法上传或下载笔记

**检查项**:
1. 确认 R2 环境变量正确
2. 验证 R2 API Token 权限
3. 检查存储桶名称是否正确
4. 确认网络连接正常

**解决方案**:
```bash
# 检查环境变量
echo $VITE_R2_ACCOUNT_ID
echo $VITE_R2_BUCKET_NAME

# 测试 R2 连接
npm run test:r2-connection
```

#### 问题：GitHub Actions 权限错误

**症状**: `Permission denied` 或 `403` 错误

**检查项**:
1. 确认 GitHub Token 有足够权限
2. 检查仓库 Actions 权限设置
3. 验证 R2 Secrets 配置

**解决方案**:
```bash
# 检查 GitHub Token 权限
curl -H "Authorization: token $VITE_GITHUB_TOKEN" \
     https://api.github.com/user

# 检查仓库权限
curl -H "Authorization: token $VITE_GITHUB_TOKEN" \
     https://api.github.com/repos/$VITE_REPO_OWNER/$VITE_REPO_NAME
```

#### 问题：加密功能异常

**症状**: 私密笔记无法正常加密/解密

**检查项**:
1. 确认管理员密码正确
2. 检查浏览器是否支持 Web Crypto API
3. 验证加密配置

**解决方案**:
```javascript
// 检查 Web Crypto API 支持
if (window.crypto && window.crypto.subtle) {
  console.log('Web Crypto API 支持正常')
} else {
  console.error('浏览器不支持 Web Crypto API')
}

// 检查加密配置
console.log('加密配置:', {
  algorithm: 'AES-GCM',
  keyLength: 256,
  enableEncryption: import.meta.env.VITE_ENABLE_ENCRYPTION
})
```

### 2. 配置调试工具

```typescript
// src/utils/configDebug.ts
export class ConfigDebugger {
  // 打印所有环境变量
  static printAllEnvVars(): void {
    console.group('🔧 SparkLog 环境变量配置')
    
    Object.keys(import.meta.env)
      .filter(key => key.startsWith('VITE_'))
      .forEach(key => {
        const value = import.meta.env[key]
        const maskedValue = this.maskSensitiveValue(key, value)
        console.log(`${key}: ${maskedValue}`)
      })
    
    console.groupEnd()
  }

  // 检查配置完整性
  static checkConfigCompleteness(): void {
    console.group('🔍 配置完整性检查')
    
    const requiredConfigs = [
      'VITE_REPO_OWNER',
      'VITE_REPO_NAME',
      'VITE_GITHUB_TOKEN',
      'VITE_ADMIN_PASSWORD',
      'VITE_R2_ACCOUNT_ID',
      'VITE_R2_ACCESS_KEY_ID',
      'VITE_R2_SECRET_ACCESS_KEY',
      'VITE_R2_BUCKET_NAME'
    ]

    const missingConfigs = requiredConfigs.filter(
      key => !import.meta.env[key]
    )

    if (missingConfigs.length === 0) {
      console.log('✅ 所有必需配置都已设置')
    } else {
      console.error('❌ 缺失的配置:', missingConfigs)
    }

    console.groupEnd()
  }

  // 测试服务连接
  static async testServiceConnections(): Promise<void> {
    console.group('🔗 服务连接测试')
    
    try {
      // 测试 R2 连接
      const r2Config = getR2ConfigFromEnv()
      if (r2Config) {
        console.log('测试 R2 连接...')
        const r2Service = R2StorageService.getInstance()
        await r2Service.initialize(r2Config)
        const isConnected = await r2Service.testConnection()
        console.log(`R2 连接: ${isConnected ? '✅ 成功' : '❌ 失败'}`)
      }
    } catch (error) {
      console.error('R2 连接测试失败:', error)
    }

    console.groupEnd()
  }

  // 掩码敏感信息
  private static maskSensitiveValue(key: string, value: string): string {
    if (key.includes('TOKEN') || key.includes('SECRET') || key.includes('PASSWORD')) {
      return value ? `${value.substring(0, 4)}****${value.substring(value.length - 4)}` : '未设置'
    }
    return value || '未设置'
  }
}

// 使用示例
if (import.meta.env.DEV) {
  ConfigDebugger.printAllEnvVars()
  ConfigDebugger.checkConfigCompleteness()
  ConfigDebugger.testServiceConnections()
}
```

## 📚 相关资源

- [Vite 环境变量文档](https://vitejs.dev/guide/env-and-mode.html)
- [Cloudflare R2 配置指南](https://developers.cloudflare.com/r2/)
- [GitHub API 权限说明](https://docs.github.com/en/rest/overview/permissions-required-for-github-apps)
- [Web Crypto API 文档](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

---

**注意**: 本配置指南基于 SparkLog 的最新架构。如果您使用的是旧版本，请先升级到最新版本。
