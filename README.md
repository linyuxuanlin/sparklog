# SparkLog 妙想

一个基于GitHub仓库的静态笔记应用，支持公开笔记分享。

## 🌟 项目特点

- **纯静态部署**: 可托管在Cloudflare Pages等静态托管平台
- **GitHub仓库存储**: 所有笔记数据存储在GitHub仓库中
- **实时编辑**: 在网页上直接创建、编辑笔记
- **权限控制**: 支持笔记公开/私密设置
- **公开分享**: 未连接用户也能查看公开笔记
- **现代化UI**: 简洁美观的界面设计

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm/yarn/pnpm

### 本地开发
```bash
# 克隆项目
git clone https://github.com/your-username/sparklog.git
cd sparklog

# 安装依赖
npm install

# 创建环境变量文件
touch .env

# 编辑.env文件，配置GitHub仓库信息
# VITE_REPO_OWNER=your-github-username
# VITE_REPO_NAME=your-notes-repository
# VITE_GITHUB_TOKEN=your-github-token

# 启动开发服务器
npm run dev
```

### 部署到Cloudflare Pages

详细部署指南请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📝 环境变量配置

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `VITE_REPO_OWNER` | GitHub用户名 | ✅ |
| `VITE_REPO_NAME` | 仓库名称 | ✅ |
| `VITE_ADMIN_PASSWORD` | 管理员密码 | ✅ |
| `VITE_GITHUB_TOKEN` | GitHub Token | ❌ |

## 🎯 功能特性

- **公开笔记分享**: 任何人都可以查看公开笔记
- **私密笔记保护**: 只有连接GitHub的用户才能管理私密笔记
- **实时编辑**: 支持Markdown格式的笔记编辑
- **搜索功能**: 快速搜索笔记标题和内容
- **响应式设计**: 支持桌面和移动设备
- 支持回滚：可以快速回滚到之前的版本

### 连接GitHub配置

#### 1. 创建GitHub OAuth应用

1. **访问GitHub开发者设置**
   - 登录GitHub，访问 [GitHub Developer Settings](https://github.com/settings/developers)
   - 点击"OAuth Apps" → "New OAuth App"

2. **填写应用信息**
   ```
   Application name: SparkLog
   Homepage URL: https://your-project-name.pages.dev
   Application description: 基于GitHub仓库的静态笔记应用
   Authorization callback URL: https://your-project-name.pages.dev/auth/callback
   ```

3. **获取Client ID和Client Secret**
   - 创建完成后，记录下Client ID
   - 点击"Generate a new client secret"生成Client Secret
   - 将这两个值配置到Cloudflare Pages的环境变量中

#### 2. 仓库说明

**两个不同的GitHub仓库：**

1. **静态网页仓库**（公开）
   - 用途：存放SparkLog应用的静态网页文件
   - 仓库名：你Fork的SparkLog仓库（如`your-username/sparklog`）
   - 权限：公开仓库，用于Cloudflare Pages部署
   - 内容：React应用代码、构建后的静态文件

2. **笔记数据仓库**（私有）
   - 用途：存放用户的笔记内容和附件
   - 仓库名：`sparklog-notes`、`my-notes`等
   - 权限：私有仓库，只有用户自己可以访问
   - 内容：笔记文件、图片、附件、元数据等



#### 3. 创建笔记存储仓库

1. **创建私有仓库**
   - 在GitHub上创建一个新的私有仓库
   - 仓库名称建议：`sparklog-notes`、`my-notes`、`personal-notes`等
   - **重要**：确保仓库为私有状态，保护你的笔记数据

2. **仓库结构**
   应用会自动在仓库中创建以下结构：
   ```
   sparklog-notes/
   ├── notes/
   │   ├── public/          # 公开笔记
   │   └── private/         # 私密笔记
   ├── assets/
   │   ├── images/          # 图片文件
   │   └── attachments/     # 其他附件
   ├── metadata/
   │   ├── tags.json        # 标签数据
   │   ├── settings.json    # 应用设置
   │   └── index.json       # 笔记索引
   └── README.md            # 仓库说明
   ```

#### 4. 权限说明

- **OAuth权限**: `repo` (私有仓库访问)
- **仓库权限**: 需要私有仓库的读写权限
- **Token存储**: 使用localStorage加密存储，仅在浏览器中保存
- **数据安全**: 所有数据存储在用户自己的GitHub仓库中，完全自主可控

#### 5. 首次使用流程

1. **访问应用**
   - 打开部署好的SparkLog应用
   - 点击"连接GitHub"按钮

2. **授权GitHub**
   - 跳转到GitHub授权页面
   - 确认授权应用访问你的仓库

3. **选择笔记仓库**
   - 从列表中选择现有的私有仓库用于存储笔记
   - 或创建新的私有仓库（如`sparklog-notes`、`my-notes`等）
   - **注意**：这里选择的是存放笔记数据的私有仓库，与部署应用的公开仓库不同

4. **初始化完成**
   - 应用会自动在笔记仓库中创建必要的目录结构
   - 开始创建你的第一篇笔记！



#### 6. 故障排除

**常见问题：**

1. **授权失败**
   - 检查OAuth应用的Client ID和Secret是否正确
   - 确认回调URL设置正确
   - 检查环境变量配置

2. **仓库访问失败**
   - 确认GitHub账号有仓库的读写权限
   - 检查仓库是否为私有仓库
   - 确认OAuth应用有`repo`权限

3. **部署失败**
   - 检查构建是否成功：`npm run build`
   - 确认dist目录存在且包含文件
   - 检查Cloudflare Pages的构建配置

4. **环境变量问题**
   - 确认所有必需的环境变量都已设置
   - 检查变量名是否正确（以VITE_开头）
   - 重新部署应用以应用新的环境变量

## 📖 使用指南

### 创建笔记

1. **新建笔记**
   - 点击"新建笔记"按钮
   - 或使用快捷键 `Ctrl/Cmd + N`

2. **编辑内容**
   - 使用Markdown编辑器编写内容
   - 支持所有标准Markdown语法
   - 实时预览功能

3. **设置属性**
   - **标题**: 为笔记设置一个描述性的标题
   - **标签**: 添加相关标签，便于分类和搜索
   - **权限**: 选择"公开"或"私密"
   - **摘要**: 添加笔记摘要（可选）

4. **保存笔记**
   - 点击"保存"按钮或使用 `Ctrl/Cmd + S`
   - 笔记将自动同步到GitHub仓库
   - 支持自动保存功能

### 管理笔记

1. **查看笔记列表**
   - 在侧边栏查看所有笔记
   - 按创建时间、更新时间或标题排序
   - 支持按标签筛选

2. **搜索笔记**
   - 使用搜索框搜索笔记标题和内容
   - 支持全文搜索功能
   - 搜索结果实时显示

3. **编辑笔记**
   - 点击笔记标题进入编辑模式
   - 支持实时编辑和预览
   - 自动保存更改

4. **删除笔记**
   - 在笔记编辑页面点击"删除"按钮
   - 确认删除操作
   - 笔记将从GitHub仓库中永久删除

### 上传图片和附件

1. **图片上传**
   - 在编辑器中点击图片上传按钮
   - 选择本地图片文件（支持JPG、PNG、GIF、WebP）
   - 图片将自动压缩和优化
   - 上传到仓库的`assets/images/`目录

2. **插入图片**
   - 上传完成后自动插入图片链接
   - 或手动插入：`![描述](图片链接)`
   - 支持拖拽上传功能

3. **附件管理**
   - 支持上传PDF、文档等附件
   - 存储在`assets/attachments/`目录
   - 在笔记中插入附件链接

### 标签管理

1. **创建标签**
   - 在编辑笔记时添加标签
   - 使用逗号分隔多个标签
   - 标签会自动保存到仓库

2. **使用标签**
   - 在侧边栏查看所有标签
   - 点击标签筛选相关笔记
   - 支持标签搜索功能

### 权限控制

1. **公开笔记**
   - 选择"公开"的笔记可以被任何人查看
   - 适合分享知识和技术文章
   - 笔记存储在`notes/public/`目录

2. **私密笔记**
   - 选择"私密"的笔记只有你能访问
   - 适合个人日记和私密内容
   - 笔记存储在`notes/private/`目录

### 数据同步

1. **自动同步**
   - 所有更改会自动同步到GitHub仓库
   - 支持离线编辑，重新连接后同步
   - 显示同步状态和最后同步时间

2. **版本控制**
   - 所有更改都有Git提交记录
   - 可以在GitHub上查看历史版本
   - 支持回滚到之前的版本

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + N` | 新建笔记 |
| `Ctrl/Cmd + S` | 保存笔记 |
| `Ctrl/Cmd + F` | 搜索笔记 |
| `Ctrl/Cmd + K` | 快速打开 |
| `Ctrl/Cmd + B` | 加粗文本 |
| `Ctrl/Cmd + I` | 斜体文本 |
| `Ctrl/Cmd + L` | 插入链接 |
| `Ctrl/Cmd + Shift + I` | 插入图片 |

## 🔧 配置说明

### 开发环境配置

1. **创建环境变量文件**
   ```bash
   # 复制环境变量模板
   cp .env.example .env.local
   ```

2. **配置开发环境变量**
   ```env
   # .env.local
   VITE_GITHUB_CLIENT_ID=your_github_client_id
   VITE_GITHUB_CLIENT_SECRET=your_github_client_secret
   VITE_APP_URL=http://localhost:3000
   VITE_DEBUG=true
   ```

### 生产环境配置

在Cloudflare Pages项目设置中配置以下环境变量：

```env
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_GITHUB_CLIENT_SECRET=your_github_client_secret
VITE_APP_URL=https://your-project-name.pages.dev
VITE_DEBUG=false
```



### 环境变量说明

| 变量名 | 说明 | 必需 | 示例 |
|--------|------|------|------|
| `VITE_GITHUB_CLIENT_ID` | GitHub OAuth应用的Client ID | ✅ | `abc123def456` |
| `VITE_GITHUB_CLIENT_SECRET` | GitHub OAuth应用的Client Secret | ✅ | `xyz789uvw012` |
| `VITE_APP_URL` | 应用的完整URL地址 | ✅ | `https://sparklog.pages.dev` |
| `VITE_DEBUG` | 调试模式开关 | ❌ | `true` (开发) / `false` (生产) |

## 📁 项目结构

```
sparklog/
├── src/
│   ├── components/          # UI组件
│   ├── pages/              # 页面组件
│   ├── hooks/              # 自定义Hooks
│   ├── services/           # API服务
│   ├── stores/             # 状态管理
│   ├── types/              # TypeScript类型
│   ├── utils/              # 工具函数
│   └── styles/             # 样式文件
├── public/                 # 静态资源
├── docs/                   # 文档
└── TODO.md                 # 开发计划
```

## 🏗️ 技术架构

### 整体架构

SparkLog采用纯前端架构，所有数据存储在GitHub仓库中，通过GitHub API进行数据操作。

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   用户浏览器     │    │   Cloudflare    │    │   GitHub API    │
│                 │    │     Pages       │    │                 │
│  React App      │◄──►│   静态托管      │◄──►│   仓库存储      │
│  (SPA)          │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 前端技术栈
- **框架**: React 18 + TypeScript
- **样式**: Tailwind CSS + Headless UI
- **状态管理**: Zustand
- **路由**: React Router
- **编辑器**: Monaco Editor
- **Markdown渲染**: React Markdown
- **图标**: Lucide React

### 数据存储架构

#### GitHub仓库结构
```
sparklog-repo/
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

#### 笔记数据结构
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

### 认证架构

#### GitHub OAuth流程
1. **用户点击登录** → 重定向到GitHub OAuth页面
2. **用户授权** → GitHub重定向回应用，携带授权码
3. **获取Token** → 使用授权码换取访问令牌
4. **存储Token** → 将令牌安全存储在localStorage中
5. **API调用** → 使用令牌调用GitHub API

#### 权限控制
- **仓库权限**: `repo` (私有仓库访问)
- **Token存储**: 使用localStorage + 加密
- **Token刷新**: 自动处理token过期

### 核心模块设计

#### 1. GitHub服务模块
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

#### 2. 笔记管理模块
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

### 技术难点和解决方案

#### 1. GitHub API限制
- **问题**: API调用频率限制
- **解决方案**: 实现请求缓存和重试机制

#### 2. 文件上传大小限制
- **问题**: GitHub API文件大小限制
- **解决方案**: 实现文件分片上传或使用Git LFS

#### 3. 实时同步
- **问题**: 静态应用无法实现真正实时同步
- **解决方案**: 轮询机制 + 用户触发同步

#### 4. 离线功能
- **问题**: 纯静态应用离线功能有限
- **解决方案**: Service Worker + localStorage缓存

### 性能优化

#### 代码分割
```typescript
// 路由级别的代码分割
const NoteEditPage = lazy(() => import('./pages/NoteEditPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

// 组件级别的代码分割
const MarkdownEditor = lazy(() => import('./components/MarkdownEditor'))
```

#### 缓存策略
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

#### 图片优化
- **压缩**: 客户端图片压缩
- **格式转换**: 自动转换为WebP格式
- **懒加载**: 图片懒加载实现
- **CDN**: 利用GitHub的CDN加速


## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发流程
1. Fork项目
2. 创建功能分支
3. 提交代码
4. 创建Pull Request

## 📄 许可证

MIT License

## 🙏 致谢

- 灵感来源于 [Memos](https://github.com/usememos/memos)
- 感谢所有开源项目的贡献者 