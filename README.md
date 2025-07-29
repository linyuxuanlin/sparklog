# SparkLog 妙想

一个基于GitHub仓库的静态笔记应用，灵感来源于Memos，但采用完全不同的架构设计。

## 🌟 项目特点

- **纯静态部署**: 可托管在Cloudflare Pages、GitHub Pages等静态托管平台
- **GitHub仓库存储**: 所有笔记数据存储在私有GitHub仓库中
- **实时编辑**: 在网页上直接创建、编辑笔记
- **权限控制**: 支持笔记公开/私密设置
- **多媒体支持**: 支持图片上传，自动创建assets目录
- **现代化UI**: 参考Memos的简洁美观界面设计

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm/yarn/pnpm
- GitHub账号

### 本地开发
```bash
# 克隆项目
git clone https://github.com/your-username/sparklog.git
cd sparklog

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 部署到Cloudflare Pages

#### 准备工作

1. **Fork此仓库**
   - 访问 [SparkLog GitHub仓库](https://github.com/your-username/sparklog)
   - 点击右上角的"Fork"按钮
   - 将仓库Fork到你的GitHub账号下

2. **克隆Fork的仓库**
   ```bash
   # 克隆你Fork的仓库
   git clone https://github.com/your-username/sparklog.git
   cd sparklog
   
   # 添加原仓库作为上游仓库（可选，用于同步更新）
   git remote add upstream https://github.com/original-username/sparklog.git
   ```

3. **配置环境变量**
   - 复制环境变量模板文件
   ```bash
   cp .env.example .env.local
   ```
   - 编辑`.env.local`文件，配置你的GitHub OAuth应用信息

#### 通过GitHub仓库部署

1. **登录Cloudflare Dashboard**
   - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 登录你的Cloudflare账号

2. **创建Pages项目**
   - 在Dashboard中点击"Pages"
   - 点击"Create a project"
   - 选择"Connect to Git"选项

3. **连接GitHub仓库**
   - 选择GitHub作为代码源
   - 授权Cloudflare访问你的GitHub账号
   - 选择你Fork的SparkLog仓库（如`your-username/sparklog`）

4. **配置构建设置**
   ```
   Framework preset: None
   Build command: npm run build
   Build output directory: dist
   Root directory: /
   ```

5. **配置环境变量**
   - 在项目设置中添加以下环境变量：
     ```
     VITE_GITHUB_CLIENT_ID=your_github_client_id
     VITE_GITHUB_CLIENT_SECRET=your_github_client_secret
     VITE_APP_URL=https://your-project-name.pages.dev
     ```

6. **部署完成**
   - 点击"Save and Deploy"
   - 等待构建和部署完成
   - 你的应用将在 `https://your-project-name.pages.dev` 上线

#### 自动部署

- 每次向GitHub仓库推送代码时，Cloudflare Pages会自动重新构建和部署
- 支持预览部署：Pull Request会创建预览版本
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

3. **获取Client ID和Client Secret**
   - 创建完成后，记录下Client ID
   - 点击"Generate a new client secret"生成Client Secret
   - 将这两个值配置到Cloudflare Pages的环境变量中

#### 2. 配置环境变量

在Cloudflare Pages项目设置中添加以下环境变量：

```
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_GITHUB_CLIENT_SECRET=your_github_client_secret
VITE_APP_URL=https://your-project-name.pages.dev
```

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

3. **仓库权限**
   - 私有仓库：只有你能访问和修改
   - 数据安全：所有笔记内容都存储在你的私有仓库中
   - 版本控制：支持Git历史记录和回滚

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

3. **选择仓库**
   - 选择用于存储笔记的GitHub仓库
   - 或创建新的私有仓库

4. **开始使用**
   - 创建你的第一篇笔记
   - 设置笔记为公开或私密
   - 上传图片和附件

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

### 首次使用

1. **访问应用**
   - 打开部署好的SparkLog应用
   - 确保已正确配置GitHub OAuth应用

2. **连接GitHub**
   - 点击"连接GitHub"按钮
   - 跳转到GitHub授权页面
   - 确认授权应用访问你的私有仓库

3. **选择笔记仓库**
   - 从列表中选择现有的私有仓库用于存储笔记
   - 或创建新的私有仓库（如`sparklog-notes`、`my-notes`等）
   - **注意**：这里选择的是存放笔记数据的私有仓库，与部署应用的公开仓库不同

4. **初始化完成**
   - 应用会自动在笔记仓库中创建必要的目录结构
   - 开始创建你的第一篇笔记！

**仓库说明：**
- **部署仓库**：你Fork的SparkLog公开仓库，存放应用代码，用于Cloudflare Pages部署
- **笔记仓库**：私有仓库，存放你的笔记数据，只有你能访问

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

### GitHub OAuth应用配置

1. **应用信息设置**
   - Application name: `SparkLog`
   - Homepage URL: `https://your-project-name.pages.dev`
   - Application description: `基于GitHub仓库的静态笔记应用`
   - Authorization callback URL: `https://your-project-name.pages.dev/auth/callback`

2. **权限设置**
   - 权限范围: `repo` (私有仓库访问)
   - 用户权限: `read:user` (读取用户信息)

3. **安全设置**
   - 确保应用为私有状态
   - 定期轮换Client Secret
   - 监控应用使用情况

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

### 前端技术栈
- **框架**: React 18 + TypeScript
- **样式**: Tailwind CSS + Headless UI
- **状态管理**: Zustand
- **路由**: React Router
- **编辑器**: Monaco Editor / CodeMirror
- **Markdown渲染**: React Markdown
- **图标**: Lucide React

### 核心功能模块
1. **GitHub集成模块**
   - GitHub OAuth认证
   - GitHub API调用
   - 仓库内容读写

2. **笔记管理模块**
   - 笔记CRUD操作
   - Markdown编辑器
   - 标签管理
   - 搜索功能

3. **文件管理模块**
   - 图片上传
   - 文件存储
   - 资源管理

4. **权限控制模块**
   - 公开/私密设置
   - 访问控制

5. **UI组件模块**
   - 响应式设计
   - 主题切换
   - 组件库


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