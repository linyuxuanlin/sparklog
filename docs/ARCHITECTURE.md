# SparkLog 技术架构文档

## 🏗️ 整体架构

SparkLog采用纯前端架构，所有数据存储在GitHub仓库中，通过GitHub API进行数据操作。

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   用户浏览器     │    │   Cloudflare    │    │   GitHub API    │
│                 │    │     Pages       │    │                 │
│  React App      │◄──►│   静态托管      │◄──►│   仓库存储      │
│  (SPA)          │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 数据存储架构

### GitHub仓库结构
```
sparklog-repo/
├── notes/                    # 笔记目录
│   ├── public/              # 公开笔记
│   │   ├── note-1.md
│   │   └── note-2.md
│   └── private/             # 私密笔记
│       ├── note-3.md
│       └── note-4.md
├── assets/                   # 资源文件
│   ├── images/              # 图片文件
│   │   ├── img-1.png
│   │   └── img-2.jpg
│   └── attachments/         # 其他附件
├── metadata/                 # 元数据
│   ├── tags.json            # 标签数据
│   ├── settings.json        # 应用设置
│   └── index.json           # 笔记索引
└── README.md                # 仓库说明
```

### 笔记数据结构
```typescript
interface Note {
  id: string;                    // 笔记唯一标识
  title: string;                 // 标题
  content: string;               // Markdown内容
  tags: string[];                // 标签列表
  isPublic: boolean;             // 是否公开
  createdAt: string;             // 创建时间
  updatedAt: string;             // 更新时间
  author: string;                // 作者
  wordCount: number;             // 字数统计
  readTime: number;              // 阅读时间（分钟）
}
```

## 🔐 认证架构

### GitHub OAuth流程
1. **用户点击登录** → 重定向到GitHub OAuth页面
2. **用户授权** → GitHub重定向回应用，携带授权码
3. **获取Token** → 使用授权码换取访问令牌
4. **存储Token** → 将令牌安全存储在localStorage中
5. **API调用** → 使用令牌调用GitHub API

### 权限控制
- **仓库权限**: `repo` (私有仓库访问)
- **Token存储**: 使用localStorage + 加密
- **Token刷新**: 自动处理token过期

## 🔧 核心模块设计

### 1. GitHub服务模块
```typescript
class GitHubService {
  // 认证相关
  authenticate(code: string): Promise<void>
  logout(): void
  isAuthenticated(): boolean
  
  // 仓库操作
  getRepositories(): Promise<Repository[]>
  getRepositoryContent(path: string): Promise<string>
  createFile(path: string, content: string, message: string): Promise<void>
  updateFile(path: string, content: string, message: string, sha: string): Promise<void>
  deleteFile(path: string, message: string, sha: string): Promise<void>
  
  // 文件上传
  uploadImage(file: File): Promise<string>
  uploadAttachment(file: File): Promise<string>
}
```

### 2. 笔记管理模块
```typescript
class NoteService {
  // CRUD操作
  createNote(note: Note): Promise<void>
  updateNote(id: string, note: Partial<Note>): Promise<void>
  deleteNote(id: string): Promise<void>
  getNote(id: string): Promise<Note>
  getNotes(filters?: NoteFilters): Promise<Note[]>
  
  // 搜索功能
  searchNotes(query: string): Promise<Note[]>
  
  // 标签管理
  getTags(): Promise<string[]>
  addTag(tag: string): Promise<void>
  removeTag(tag: string): Promise<void>
}
```

### 3. 状态管理模块
```typescript
interface AppState {
  // 用户状态
  user: User | null
  isAuthenticated: boolean
  
  // 笔记状态
  notes: Note[]
  currentNote: Note | null
  isLoading: boolean
  
  // UI状态
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  
  // 设置
  settings: AppSettings
}
```

## 🎨 UI组件架构

### 组件层次结构
```
App
├── Layout
│   ├── Header
│   ├── Sidebar
│   └── Main
├── Pages
│   ├── HomePage
│   ├── NoteListPage
│   ├── NoteEditPage
│   ├── SettingsPage
│   └── AuthPage
└── Components
    ├── NoteCard
    ├── MarkdownEditor
    ├── TagInput
    ├── ImageUploader
    └── SearchBar
```

### 响应式设计
- **移动端**: 单列布局，侧边栏可收起
- **平板端**: 双列布局，笔记列表和编辑器
- **桌面端**: 三列布局，侧边栏、笔记列表、编辑器

## 📡 API设计

### GitHub API封装
```typescript
// 基础API类
class GitHubAPI {
  private baseURL = 'https://api.github.com'
  private token: string
  
  constructor(token: string) {
    this.token = token
  }
  
  private async request(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        ...options?.headers
      },
      ...options
    })
    
    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.status}`)
    }
    
    return response.json()
  }
}
```

### 错误处理
```typescript
class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// 错误处理中间件
const handleAPIError = (error: any) => {
  if (error instanceof APIError) {
    switch (error.code) {
      case 'RATE_LIMIT':
        return 'API调用频率过高，请稍后重试'
      case 'UNAUTHORIZED':
        return '认证失败，请重新登录'
      case 'NOT_FOUND':
        return '资源不存在'
      default:
        return '操作失败，请重试'
    }
  }
  return '未知错误'
}
```

## 🔄 数据同步策略

### 实时同步
由于是静态应用，无法实现真正的实时同步，采用以下策略：

1. **轮询机制**: 定期检查仓库更新
2. **用户触发**: 用户操作时主动同步
3. **离线缓存**: 使用localStorage缓存数据

### 冲突解决
```typescript
interface SyncConflict {
  localVersion: Note
  remoteVersion: Note
  resolution: 'local' | 'remote' | 'manual'
}

class ConflictResolver {
  resolveConflict(conflict: SyncConflict): Promise<Note> {
    // 基于时间戳的自动解决
    if (conflict.localVersion.updatedAt > conflict.remoteVersion.updatedAt) {
      return Promise.resolve(conflict.localVersion)
    } else {
      return Promise.resolve(conflict.remoteVersion)
    }
  }
}
```

## 🚀 性能优化

### 代码分割
```typescript
// 路由级别的代码分割
const NoteEditPage = lazy(() => import('./pages/NoteEditPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

// 组件级别的代码分割
const MarkdownEditor = lazy(() => import('./components/MarkdownEditor'))
```

### 缓存策略
```typescript
class CacheManager {
  private cache = new Map<string, any>()
  
  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key)
    }
    
    const data = await fetcher()
    this.cache.set(key, data)
    return data
  }
}
```

### 图片优化
- **压缩**: 客户端图片压缩
- **格式转换**: 自动转换为WebP格式
- **懒加载**: 图片懒加载实现
- **CDN**: 利用GitHub的CDN加速

## 🔒 安全考虑

### Token安全
```typescript
class TokenManager {
  private encryptToken(token: string): string {
    // 简单的base64编码，生产环境应使用更强的加密
    return btoa(token)
  }
  
  private decryptToken(encryptedToken: string): string {
    return atob(encryptedToken)
  }
  
  saveToken(token: string): void {
    const encrypted = this.encryptToken(token)
    localStorage.setItem('github_token', encrypted)
  }
  
  getToken(): string | null {
    const encrypted = localStorage.getItem('github_token')
    return encrypted ? this.decryptToken(encrypted) : null
  }
}
```

### 输入验证
```typescript
class InputValidator {
  static validateNote(note: Partial<Note>): ValidationResult {
    const errors: string[] = []
    
    if (!note.title?.trim()) {
      errors.push('标题不能为空')
    }
    
    if (note.title && note.title.length > 100) {
      errors.push('标题长度不能超过100字符')
    }
    
    if (note.content && note.content.length > 100000) {
      errors.push('内容长度不能超过100KB')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
```

## 📊 监控和分析

### 错误监控
```typescript
class ErrorTracker {
  static trackError(error: Error, context?: any) {
    console.error('Error:', error, context)
    
    // 生产环境可集成Sentry等错误监控服务
    if (process.env.NODE_ENV === 'production') {
      // 发送错误到监控服务
    }
  }
}
```

### 性能监控
```typescript
class PerformanceMonitor {
  static trackPageLoad() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    console.log('Page Load Time:', navigation.loadEventEnd - navigation.loadEventStart)
  }
  
  static trackAPIResponse(url: string, duration: number) {
    console.log(`API ${url} took ${duration}ms`)
  }
}
```

## 🧪 测试策略

### 单元测试
- 使用Jest + React Testing Library
- 测试核心业务逻辑
- 测试工具函数

### 集成测试
- 测试GitHub API集成
- 测试用户流程
- 测试错误处理

### E2E测试
- 使用Playwright
- 测试完整用户场景
- 测试跨浏览器兼容性

## 📦 部署架构

### 构建流程
```bash
# 开发环境
npm run dev

# 生产构建
npm run build

# 预览构建结果
npm run preview
```

### 部署配置
```yaml
# Cloudflare Pages配置
name: sparklog
build:
  command: npm run build
  output_directory: dist
  environment:
    NODE_VERSION: 18
```

### 环境变量
```env
# 开发环境
VITE_GITHUB_CLIENT_ID=dev_client_id
VITE_APP_URL=http://localhost:5173

# 生产环境
VITE_GITHUB_CLIENT_ID=prod_client_id
VITE_APP_URL=https://sparklog.example.com
``` 