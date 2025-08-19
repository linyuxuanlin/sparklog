# 架构原理

本文档详细说明SparkLog的技术架构和设计原理。

## 整体架构

SparkLog采用纯前端架构，所有数据存储在GitHub仓库中，通过GitHub API进行数据操作。

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   用户浏览器     │    │   Cloudflare    │    │   GitHub API    │
│                 │    │     Pages       │    │                 │
│  React App      │◄──►│   静态托管      │◄──►│   仓库存储      │
│  (SPA)          │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 架构特点

- **无后端服务**: 完全依赖GitHub API和静态托管
- **数据持久化**: 所有数据存储在GitHub仓库中
- **版本控制**: 利用Git的版本控制功能
- **CDN加速**: 利用Cloudflare的全球CDN网络
- **零维护成本**: 无需维护服务器和数据库

## 前端技术栈

- **框架**: React 18 + TypeScript
- **样式**: Tailwind CSS + Headless UI
- **路由**: React Router DOM
- **Markdown渲染**: React Markdown + Remark GFM
- **图标**: Lucide React
- **构建工具**: Vite

## 数据存储架构

### GitHub仓库结构

```
your-notes-repo/
├── notes/                    # 笔记目录
│   ├── public/              # 公开笔记
│   └── private/             # 私密笔记
├── assets/                   # 资源文件
│   ├── images/              # 图片文件
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
  name: string;                    // 文件名
  path: string;                    // 文件路径
  sha: string;                     // Git SHA
  size: number;                    // 文件大小
  url: string;                     // API URL
  git_url: string;                 // Git URL
  html_url: string;                // HTML URL
  download_url: string;            // 下载URL
  type: string;                    // 文件类型
  content?: string;                // 文件内容
  encoding?: string;               // 编码格式
  created_at?: string;             // 创建时间
  updated_at?: string;             // 更新时间
  contentPreview?: string;         // 内容预览
  fullContent?: string;            // 完整内容
  createdDate?: string;            // 格式化创建时间
  updatedDate?: string;            // 格式化更新时间
  isPrivate?: boolean;             // 是否私密
}
```

## 认证架构

### 管理员密码认证流程

1. **用户点击登录** → 显示密码输入框
2. **输入管理员密码** → 验证密码是否正确
3. **验证成功** → 存储认证状态到localStorage
4. **API调用** → 使用环境变量中的GitHub Token

### 权限控制

- **未认证用户**: 只能查看公开笔记
- **已认证管理员**: 可以创建、编辑、删除所有笔记
- **Token存储**: 使用环境变量中的GitHub Token
- **认证状态**: 使用localStorage存储认证状态

## 核心模块设计

### 1. GitHub服务模块

```typescript
interface GitHubService {
  // 认证相关
  authenticate(password: string): boolean
  disconnect(): void
  isAuthenticated(): boolean
  
  // 权限检查
  hasManagePermission(): boolean
  isLoggedIn(): boolean
  
  // Token获取
  getGitHubToken(): string | null
  
  // 仓库操作
  getRepository(): Promise<Repository>
  createFile(path: string, content: string, message: string): Promise<void>
  updateFile(path: string, content: string, message: string, sha: string): Promise<void>
  deleteFile(path: string, message: string, sha: string): Promise<void>
  getFile(path: string): Promise<FileContent>
  listFiles(path: string): Promise<File[]>
}
```

### 2. 笔记管理模块

```typescript
interface NoteService {
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
  
  // 文件上传
  uploadImage(file: File): Promise<string>
  uploadAttachment(file: File): Promise<string>
}
```

## 技术难点和解决方案

### 1. GitHub API限制

**问题**: API调用频率限制（每小时5000次）

**解决方案**:
- 实现请求缓存和重试机制
- 批量操作减少API调用次数
- 使用ETag和If-None-Match头部优化请求
- 实现指数退避重试策略

### 2. 文件上传大小限制

**问题**: GitHub API文件大小限制（100MB）

**解决方案**:
- 实现文件分片上传
- 使用Git LFS（Large File Storage）
- 客户端图片压缩
- 支持外部存储服务

### 3. 实时同步

**问题**: 静态应用无法实现真正实时同步

**解决方案**:
- 轮询机制 + 用户触发同步
- 使用GitHub Webhooks（需要后端服务）
- 实现离线编辑，重新连接后同步
- 显示同步状态和最后同步时间

### 4. 离线功能

**问题**: 纯静态应用离线功能有限

**解决方案**:
- Service Worker + localStorage缓存
- IndexedDB存储大量数据
- 实现离线编辑队列
- 网络恢复后自动同步

## 性能优化

### 代码分割

```typescript
// 路由级别的代码分割
const NoteEditPage = lazy(() => import('./pages/NoteEditPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
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

## 安全考虑

### 数据安全

- **加密存储**: 敏感数据加密后存储
- **访问控制**: 基于角色的访问控制
- **审计日志**: 记录重要操作日志

### 网络安全

- **HTTPS**: 强制使用HTTPS
- **CSP**: 内容安全策略
- **XSS防护**: 输入验证和输出编码

### 隐私保护

- **数据最小化**: 只收集必要数据
- **用户控制**: 用户可控制数据使用
- **透明性**: 明确告知数据处理方式 