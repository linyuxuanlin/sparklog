<div align="center">
  <img src="public/sparklog-favicon.svg" alt="SparkLog Logo" width="120" height="120">
  
  **SparkLog** 是一个优雅免维护的想法记录应用，不错过你的每一个奇思妙想。
  
  [![GitHub License](https://img.shields.io/github/license/linyuxuanlin/sparklog)](LICENSE)
  [![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
  [![Vite](https://img.shields.io/badge/vite-5.0-646CFF)](https://vitejs.dev)
  [![React](https://img.shields.io/badge/react-18.2-61DAFB)](https://reactjs.org)
  
  [演示站点](https://sparklog.wiki-power.com/) · [快速开始](#-快速开始) · [功能特性](#-功能特性) · [详细文档](#-详细文档)
</div>

## 🌟 项目特点

- **纯静态部署**: 基于 React + Vite 构建，你可以把它托管在 Cloudflare Pages、Vercel 等平台，无需服务器。
- **GitHub 仓库存储**: 所有笔记数据存储在 GitHub 仓库中，永远不会丢失。
- **智能静态化**: 支持笔记内容静态化，减少 GitHub API 调用，提升加载速度。
- **无后端依赖**: 直接使用 GitHub API，无需维护服务器和数据库。
- **实时编辑**: 无需其他编辑器，只要有网，就可记录你的想法。
- **权限控制**: 支持笔记公开 / 私密设置。
- **快捷分享**: 你可以一键把想法分享给好友。
- **现代化 UI**: 简洁美观的界面设计，支持亮色 / 暗色自动切换。

## 🚀 快速开始

### 环境要求

- Node.js 18+ 
- npm 8+ (或 yarn/pnpm)
- Git

### 准备工作

1. **创建 GitHub 笔记仓库**
   - 访问 [GitHub](https://github.com/new?name=sparklog-notes&private=true) 创建一个私有仓库
   - 仓库名建议为 `sparklog-notes` 或其他你喜欢的名称
   - 设置为**私有仓库**以保护笔记隐私

2. **获取 GitHub 访问令牌**
   - 访问 [GitHub Token 生成页面](https://github.com/settings/tokens/new?description=SparkLog%20Notes&scopes=repo)
   - 勾选 `repo` 权限（完整仓库访问权限）
   - 生成令牌，格式如：`ghp_xxxxxxxx`
   - **重要**: 妥善保存此令牌，页面关闭后无法再次查看

### 方式一：本地开发

```bash
# 1. 克隆项目
git clone https://github.com/linyuxuanlin/sparklog.git
cd sparklog

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env

# 4. 编辑 .env 文件，填入你的配置信息
# VITE_REPO_OWNER=your-github-username
# VITE_REPO_NAME=sparklog-notes
# VITE_GITHUB_TOKEN=ghp_xxxxxxxx
# VITE_ADMIN_PASSWORD=your-secure-password

# 5. 启动开发服务器
npm run dev
```

项目将在 `http://localhost:3000` 启动。首次访问需要输入管理员密码。

**💡 本地开发提示**: 运行 `npm run build:dev` 可以构建静态笔记并同步到 `public/` 目录，这样本地开发时也能体验静态笔记功能。

### 方式二：部署到 Cloudflare Pages

1. **Fork 项目**

   - 访问 [SparkLog GitHub 仓库](https://github.com/linyuxuanlin/sparklog)
   - 点击右上角"Fork"按钮

2. **连接 Cloudflare Pages**

   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 进入"Pages" → "Create a project"
   - 选择"Connect to Git"
   - 选择你 Fork 的 SparkLog 仓库

3. **配置构建设置**

   - **Framework preset**: None
   - **Build command**: `npm run build:static`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (留空)

4. **设置环境变量**

| 变量名                | 说明                  | 示例                   |
| --------------------- | --------------------- | ---------------------- |
| `VITE_REPO_OWNER`     | GitHub 用户名或组织名 | `linyuxuanlin`         |
| `VITE_REPO_NAME`      | 笔记仓库名称          | `sparklog-notes`       |
| `VITE_GITHUB_TOKEN`   | GitHub 个人访问令牌   | `ghp_xxxxxxxx`         |
| `VITE_ADMIN_PASSWORD` | 管理员密码            | `your-secure-password` |

5. **部署**
   - 点击"Save and Deploy"
   - 等待构建完成（自动构建应用+编译静态笔记）
   - 访问部署地址，输入管理员密码开始使用

**✨ 静态化说明**: 
- `build:static` 命令会同时生成应用和静态笔记文件
- 静态笔记文件位于 `dist/static-notes/` 目录
- Cloudflare Pages 部署时会自动包含静态笔记，提升访问速度

### 使用指南

#### 首次使用

1. **设置管理员密码**: 访问应用后，输入你在环境变量中设置的管理员密码
2. **创建第一篇笔记**: 点击"新建笔记"按钮开始记录想法
3. **管理标签**: 使用标签管理器为笔记添加分类标签
4. **设置权限**: 选择笔记是公开还是私密（私密笔记需要管理员密码查看）

#### 可用脚本命令

```bash
# 开发相关
npm run dev          # 启动开发服务器 (localhost:3000)
npm run build        # 构建生产版本
npm run build:static # 构建+静态化笔记一键完成 (本地和部署通用)
npm run build:dev    # 开发环境构建+静态化
npm run preview      # 预览构建结果

# 测试相关
npm run test         # 运行测试套件
npm run lint         # 代码检查
```

#### 常见问题

**Q: 无法访问 GitHub API？**
- 检查网络连接和 GitHub Token 是否有效
- 确认仓库权限设置（需要 `repo` 权限）
- 查看浏览器控制台错误信息

**Q: 管理员密码无效？**
- 确认环境变量 `VITE_ADMIN_PASSWORD` 设置正确
- 检查变量名拼写（必须以 `VITE_` 开头）
- 重新构建项目：`npm run build`

**Q: 笔记无法保存？**
- 检查 GitHub Token 权限
- 确认目标仓库存在且有写入权限
- 查看网络请求是否成功

## 🎯 功能特性

- **公开笔记分享**: 任何人都可以查看公开笔记
- **私密笔记保护**: 只有通过管理员密码验证的用户才能管理私密笔记
- **实时编辑**: 支持 Markdown 格式的笔记编辑
- **智能搜索**: 快速搜索笔记标题、内容和标签
- **标签系统**: 智能标签管理，支持筛选和搜索
- **响应式设计**: 支持桌面和移动设备
- **版本控制**: 所有更改都有 Git 提交记录

### 管理笔记

1. **查看笔记列表**

   - 在首页查看所有可访问的笔记
   - 按创建时间倒序排列（最新的在前）
   - 支持按标签筛选和搜索功能
   - 分页加载，提升性能体验

2. **搜索和筛选**

   - 使用搜索框进行全文搜索（标题、内容、标签）
   - 使用"按标签筛选"功能精确筛选
   - 支持搜索和标签筛选的组合使用
   - 实时显示筛选结果统计

3. **编辑笔记**

   - 点击笔记卡片打开笔记详情
   - 在详情页面点击"编辑"按钮进入编辑模式
   - 支持 Markdown 实时编辑和标签管理

4. **删除笔记**
   - 在笔记详情页面或编辑页面删除笔记
   - 笔记将从 GitHub 仓库中同步删除

### 上传图片和附件（待更新）

1. **图片上传**

   - 在编辑器中点击图片上传按钮
   - 选择本地图片文件（支持 JPG、PNG、GIF、WebP）
   - 图片将自动压缩和优化
   - 上传到仓库的`assets/images/`目录

2. **插入图片**

   - 上传完成后自动插入图片链接
   - 或手动插入：`![描述](图片链接)`
   - 支持拖拽上传功能

3. **附件管理**
   - 支持上传 PDF、文档等附件
   - 存储在`assets/attachments/`目录
   - 在笔记中插入附件链接

### 标签系统

1. **添加标签**
   - 编辑笔记时使用标签管理器添加标签
   - 支持智能建议和快速输入

2. **筛选和搜索**
   - 使用"按标签筛选"按钮多选筛选
   - 标签内容支持全文搜索
   - 可与关键词搜索组合使用


### 数据同步

1. **自动同步**

   - 所有更改会自动同步到 GitHub 仓库
   - 支持离线编辑，重新连接后同步
   - 显示同步状态和最后同步时间

2. **版本控制**
   - 所有更改都有 Git 提交记录
   - 可以在 GitHub 上查看历史版本
   - 支持回滚到之前的版本

### 智能静态化

1. **混合加载模式**

   - 优先加载静态化的笔记内容，提升访问速度
   - 无静态内容的笔记自动回退到 GitHub API 加载
   - 支持增量编译，只编译新增/修改的笔记

2. **自动编译触发**

   - 新增或修改笔记后自动触发静态编译
   - 私有笔记不参与静态化，保持原有 API 方式
   - 编译完成后用户下次访问即可看到静态内容

3. **性能优化**

   - 减少 GitHub API 调用次数，避免速率限制
   - 静态内容支持浏览器缓存，提升用户体验
   - 智能降级，确保功能可用性

## 📚 详细文档

- **[部署指南](./docs/DEPLOYMENT.md)** - 详细的部署说明和故障排除
- **[静态化部署](./docs/STATIC_DEPLOYMENT.md)** - 笔记静态化功能配置指南
- **[架构原理](./docs/ARCHITECTURE.md)** - 技术架构和设计原理
- **[开发指南](./docs/DEVELOPMENT.md)** - 开发环境搭建和贡献指南

## 📄 许可证

MIT License
