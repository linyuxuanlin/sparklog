# SparkLog 开发指南

## 🛠️ 开发环境搭建

本指南将帮助您搭建 SparkLog 的本地开发环境，并了解如何参与项目开发。

## 📋 环境要求

### 必需软件

- **Node.js**: 18.0.0 或更高版本
- **npm**: 8.0.0 或更高版本（或 yarn/pnpm）
- **Git**: 2.20.0 或更高版本
- **代码编辑器**: VS Code（推荐）或其他现代编辑器

### 推荐工具

- **VS Code 扩展**:
  - TypeScript Importer
  - Tailwind CSS IntelliSense
  - ESLint
  - Prettier
  - GitLens

## 🚀 快速开始

### 1. 克隆项目

```bash
# 克隆主仓库
git clone https://github.com/linyuxuanlin/sparklog.git
cd sparklog

# 添加上游仓库（用于同步更新）
git remote add upstream https://github.com/linyuxuanlin/sparklog.git
```

### 2. 安装依赖

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install

# 或使用 pnpm
pnpm install
```

### 3. 环境配置

创建 `.env.local` 文件（本地开发专用）：

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑 .env.local 文件
```

配置必要的环境变量：

```env
# GitHub 配置
VITE_REPO_OWNER=your-github-username
VITE_REPO_NAME=sparklog-notes
VITE_GITHUB_TOKEN=ghp_your_github_token

# 管理员密码
VITE_ADMIN_PASSWORD=your-admin-password

# Cloudflare R2 配置（开发环境）
VITE_R2_ACCOUNT_ID=your_r2_account_id
VITE_R2_ACCESS_KEY_ID=your_r2_access_key_id
VITE_R2_SECRET_ACCESS_KEY=your_r2_secret_key
VITE_R2_BUCKET_NAME=sparklog-dev-notes

# 静态内容分支（可选）
VITE_STATIC_BRANCH=static-content
```

### 4. 启动开发服务器

```bash
# 启动开发服务器
npm run dev

# 或使用 yarn
yarn dev

# 或使用 pnpm
pnpm dev
```

开发服务器将在 `http://localhost:5173` 启动。

## 🏗️ 项目结构

```
sparklog/
├── src/                          # 源代码目录
│   ├── components/               # React 组件
│   │   ├── __tests__/           # 组件测试
│   │   ├── BuildStatusIndicator.tsx
│   │   ├── Header.tsx
│   │   ├── Layout.tsx
│   │   ├── MarkdownRenderer.tsx
│   │   ├── NoteCard.tsx
│   │   ├── NoteDetailModal.tsx
│   │   ├── Sidebar.tsx
│   │   ├── SparkLogLogo.tsx
│   │   ├── TagFilter.tsx
│   │   └── TagManager.tsx
│   ├── config/                   # 配置文件
│   │   ├── defaultRepo.ts
│   │   └── env.ts
│   ├── hooks/                    # React Hooks
│   │   ├── __tests__/           # Hook 测试
│   │   ├── useGitHub.ts
│   │   ├── useNotes.ts
│   │   ├── useR2Notes.ts        # 新的 R2 核心 Hook
│   │   └── useTheme.ts
│   ├── pages/                    # 页面组件
│   │   ├── NoteEditPage.tsx
│   │   ├── NotesPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── WanderPage.tsx
│   ├── services/                 # 业务服务
│   │   ├── __tests__/           # 服务测试
│   │   ├── encryptionService.ts # 加密服务
│   │   ├── githubService.ts
│   │   ├── noteCacheService.ts  # 缓存服务
│   │   ├── noteOperationsService.ts
│   │   ├── r2StorageService.ts  # R2 存储服务
│   │   └── staticContentService.ts
│   ├── types/                    # TypeScript 类型定义
│   │   └── Note.ts
│   ├── utils/                    # 工具函数
│   │   └── noteUtils.ts
│   ├── App.tsx                   # 主应用组件
│   ├── main.tsx                  # 应用入口
│   └── styles/                   # 样式文件
│       └── index.css
├── .github/                      # GitHub 配置
│   └── workflows/                # GitHub Actions
│       └── build-static-content.yml
├── docs/                         # 文档
├── public/                       # 静态资源
├── scripts/                      # 构建脚本
│   └── build-static-content.js
├── package.json                  # 项目配置
├── tsconfig.json                 # TypeScript 配置
├── vite.config.ts                # Vite 配置
└── tailwind.config.js            # Tailwind CSS 配置
```

## 🔧 开发工具

### 1. 代码质量工具

```bash
# ESLint 检查
npm run lint

# ESLint 自动修复
npm run lint:fix

# TypeScript 类型检查
npm run type-check

# 代码格式化
npm run format
```

### 2. 测试工具

```bash
# 运行所有测试
npm test

# 运行测试并监听文件变化
npm run test:watch

# 运行测试覆盖率报告
npm run test:coverage

# 运行特定测试文件
npm test -- src/services/__tests__/encryptionService.test.ts
```

### 3. 构建工具

```bash
# 开发构建
npm run build:dev

# 生产构建
npm run build

# 预览生产构建
npm run preview

# 构建静态内容
npm run build:static
```

## 🧪 测试指南

### 1. 测试框架

- **Vitest**: 单元测试框架
- **React Testing Library**: React 组件测试
- **MSW**: API 模拟

### 2. 测试结构

```typescript
// 示例：服务测试
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EncryptionService } from '../encryptionService'

describe('EncryptionService', () => {
  let service: EncryptionService

  beforeEach(() => {
    service = EncryptionService.getInstance()
  })

  it('应该是单例模式', () => {
    const instance1 = EncryptionService.getInstance()
    const instance2 = EncryptionService.getInstance()
    expect(instance1).toBe(instance2)
  })

  it('应该能加密和解密内容', async () => {
    const content = '测试内容'
    const password = 'test-password'
    
    const encrypted = await service.encrypt(content, password)
    expect(encrypted).not.toBe(content)
    
    const decrypted = await service.decrypt(encrypted, password)
    expect(decrypted).toBe(content)
  })
})
```

### 3. 测试最佳实践

- **测试命名**: 使用描述性的测试名称
- **测试隔离**: 每个测试应该独立运行
- **模拟外部依赖**: 使用 vi.mock() 模拟外部服务
- **测试覆盖率**: 目标至少 80% 的代码覆盖率

## 🔄 开发流程

### 1. 功能开发

```bash
# 创建功能分支
git checkout -b feature/new-feature

# 开发功能
# ... 编写代码 ...

# 运行测试
npm test

# 代码检查
npm run lint

# 提交代码
git add .
git commit -m "feat: 添加新功能"

# 推送到远程
git push origin feature/new-feature
```

### 2. 代码审查

1. **创建 Pull Request**
2. **填写 PR 模板**
3. **等待代码审查**
4. **根据反馈修改代码**
5. **合并到主分支**

### 3. 发布流程

```bash
# 切换到主分支
git checkout main

# 拉取最新代码
git pull upstream main

# 创建发布标签
git tag v1.0.0
git push origin v1.0.0

# 推送到上游
git push upstream main
git push upstream v1.0.0
```

## 🏗️ 架构开发

### 1. 添加新服务

```typescript
// src/services/newService.ts
export class NewService {
  private static instance: NewService

  private constructor() {}

  static getInstance(): NewService {
    if (!NewService.instance) {
      NewService.instance = new NewService()
    }
    return NewService.instance
  }

  // 实现服务方法
  async doSomething(): Promise<void> {
    // 实现逻辑
  }
}
```

### 2. 添加新 Hook

```typescript
// src/hooks/useNewFeature.ts
import { useState, useEffect } from 'react'

export function useNewFeature() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Hook 逻辑
  }, [])

  return { data, loading }
}
```

### 3. 添加新组件

```typescript
// src/components/NewComponent.tsx
import React from 'react'

interface NewComponentProps {
  title: string
  children?: React.ReactNode
}

export function NewComponent({ title, children }: NewComponentProps) {
  return (
    <div className="new-component">
      <h2>{title}</h2>
      {children}
    </div>
  )
}
```

## 🔐 安全开发

### 1. 加密开发

- **算法选择**: 使用 AES-GCM 256位
- **密钥管理**: 不在代码中硬编码密钥
- **随机性**: 使用 crypto.getRandomValues() 生成随机数

### 2. 数据验证

```typescript
// 输入验证示例
function validateNoteData(data: any): NoteData {
  if (!data.title || typeof data.title !== 'string') {
    throw new Error('标题是必需的且必须是字符串')
  }
  
  if (data.content && typeof data.content !== 'string') {
    throw new Error('内容必须是字符串')
  }
  
  return data as NoteData
}
```

### 3. 错误处理

```typescript
// 错误处理示例
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('操作失败:', error)
  
  // 用户友好的错误消息
  if (error instanceof NetworkError) {
    throw new Error('网络连接失败，请检查网络设置')
  }
  
  throw new Error('操作失败，请稍后重试')
}
```

## 📊 性能优化

### 1. 代码分割

```typescript
// 路由级别的代码分割
const NoteEditPage = lazy(() => import('./pages/NoteEditPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
```

### 2. 缓存策略

```typescript
// 缓存服务示例
class CacheService {
  private cache = new Map<string, { data: any, timestamp: number }>()
  private readonly TTL = 5 * 60 * 1000 // 5分钟

  get<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }
}
```

### 3. 懒加载

```typescript
// 图片懒加载
function LazyImage({ src, alt }: { src: string; alt: string }) {
  const [isLoaded, setIsLoaded] = useState(false)
  
  return (
    <img
      src={isLoaded ? src : 'placeholder.jpg'}
      alt={alt}
      onLoad={() => setIsLoaded(true)}
      className={isLoaded ? 'loaded' : 'loading'}
    />
  )
}
```

## 🐛 调试技巧

### 1. 浏览器调试

```typescript
// 开发环境调试
if (import.meta.env.DEV) {
  console.log('调试信息:', { data, config })
  
  // 暴露到全局对象
  ;(window as any).debugData = data
}
```

### 2. 网络调试

```typescript
// API 请求调试
const response = await fetch(url, options)
console.log('API 响应:', {
  status: response.status,
  headers: Object.fromEntries(response.headers.entries()),
  body: await response.clone().text()
})
```

### 3. 状态调试

```typescript
// React 状态调试
useEffect(() => {
  console.log('状态变化:', { state, props })
}, [state, props])
```

## 📚 学习资源

### 1. 核心技术

- [React 官方文档](https://react.dev/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Vite 官方文档](https://vitejs.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/)

### 2. 测试相关

- [Vitest 文档](https://vitest.dev/)
- [React Testing Library 文档](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW 文档](https://mswjs.io/)

### 3. 架构设计

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID 原则](https://en.wikipedia.org/wiki/SOLID)
- [Design Patterns](https://refactoring.guru/design-patterns)

## 🤝 贡献指南

### 1. 贡献类型

- **Bug 修复**: 修复已知问题
- **功能增强**: 添加新功能
- **文档改进**: 完善文档和注释
- **性能优化**: 提升应用性能
- **测试覆盖**: 增加测试用例

### 2. 贡献流程

1. **Fork 项目**
2. **创建功能分支**
3. **开发功能**
4. **运行测试**
5. **代码检查**
6. **提交 PR**
7. **等待审查**
8. **合并代码**

### 3. 代码规范

- **TypeScript**: 严格类型检查
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **Git 提交**: 使用约定式提交

## 🔮 未来规划

### 1. 短期目标

- 完善测试覆盖
- 优化性能
- 改进用户体验
- 修复已知问题

### 2. 中期目标

- 添加更多功能
- 支持多用户
- 移动端优化
- 国际化支持

### 3. 长期目标

- 桌面应用
- 协作功能
- AI 辅助
- 生态系统

---

感谢您对 SparkLog 项目的关注和贡献！如果您有任何问题或建议，请随时联系我们。 