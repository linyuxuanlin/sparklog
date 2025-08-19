<div align="center">
  <img src="public/sparklog-favicon.svg" alt="SparkLog Logo" width="120" height="120">
  
  &nbsp;

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
- **极速加载**: 用户修改笔记后，GitHub Actions 自动编译为静态，内容呈现无需等待。
- **无后端依赖**: 直接使用 GitHub API，无需维护服务器和数据库。
- **实时编辑**: 无需其他编辑器，只要有网，就可记录你的想法。
- **权限控制**: 支持笔记公开 / 私密设置。
- **快捷分享**: 你可以一键把想法分享给好友。
- **现代化 UI**: 简洁美观的界面设计，支持亮色 / 暗色自动切换。

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm/yarn/pnpm

请首先 [**创建一个 GitHub 私有仓库**](https://github.com/new?name=sparklog-notes&private=true) 用于笔记文件的存放。

然后 [**获取 GitHub 个人访问令牌**](https://github.com/settings/tokens/new?description=SparkLog%20Notes&scopes=repo)（需要`repo`权限），  
获取的令牌格式例如：`ghp_xxxxxxxx`。

### 一. 本地开发

```bash
# 克隆项目
git clone https://github.com/linyuxuanlin/sparklog.git
cd sparklog

# 安装依赖
npm install

# 创建环境变量文件
cp .env.example .env  # 复制环境变量模板

# 编辑.env文件，配置 GitHub 仓库信息

# 生成静态内容（首次运行必需）
npm run build:static

# 启动开发服务器
npm run dev
```

> **注意**: 本地开发时需要先运行 `npm run build:static` 生成静态JSON文件，否则网站无法正常显示笔记内容。

### 二、部署到 Cloudflare Pages

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
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (留空)

4. **设置环境变量**

| 变量名                | 说明                  | 示例                   |
| --------------------- | --------------------- | ---------------------- |
| `VITE_REPO_OWNER`     | GitHub 用户名或组织名 | `linyuxuanlin`         |
| `VITE_REPO_NAME`      | 笔记仓库名称          | `sparklog-notes`       |
| `VITE_GITHUB_TOKEN`   | GitHub 个人访问令牌   | `ghp_xxxxxxxx`         |
| `VITE_ADMIN_PASSWORD` | 管理员密码            | `your-secure-password` |

5. **配置GitHub Actions权限**
   
   **重要**: 为了让自动编译功能正常工作，需要配置仓库权限：
   
   - 进入你Fork的仓库设置页面: `https://github.com/你的用户名/sparklog/settings`
   - 点击左侧菜单 `Actions` → `General`
   - 在 "Workflow permissions" 部分选择:
     ```
     ✅ Read and write permissions
     ✅ Allow GitHub Actions to create and approve pull requests
     ```
   - 点击 "Save" 保存设置

6. **部署**
   - 点击"Save and Deploy"
   - 等待构建完成
   - 访问你的部署地址，输入管理员密码
   - 开始记录你的妙想

## 🎯 功能特性

### 核心功能
- **📝 实时编辑**: 支持 Markdown 格式的笔记编辑，所见即所得
- **🔍 智能搜索**: 快速搜索笔记标题、内容和标签
- **🏷️ 标签系统**: 智能标签管理，支持筛选和搜索
- **🔒 权限控制**: 公开笔记任何人可查看，私密笔记需要管理员验证
- **📱 响应式设计**: 完美适配桌面和移动设备

### 静态架构优势
- **⚡ 极速加载**: 静态JSON文件提供毫秒级加载速度
- **🤖 自动编译**: 笔记变更时GitHub Actions自动重新编译
- **📊 构建状态**: 实时显示内容编译状态和进度
- **🛡️ 安全隔离**: 公开/私密内容物理分离，确保数据安全
- **📈 零API限制**: 完全避免GitHub API调用限制问题

### 使用指南

1. **创建和编辑笔记**
   - 登录后点击"新建笔记"开始创作
   - 支持 Markdown 语法和实时预览
   - 可设置笔记为公开或私密
   - 使用标签管理器添加和管理标签

2. **浏览和搜索**
   - 首页显示所有可访问的笔记（按时间倒序）
   - 使用搜索框进行全文搜索
   - 通过标签筛选精确查找笔记
   - 支持搜索和标签筛选的组合使用

### 工作原理

SparkLog 采用了创新的静态内容架构：

1. **编辑笔记**: 在网站上编辑并保存笔记
2. **API调用**: 网站调用GitHub API将笔记保存到仓库
3. **自动触发**: GitHub检测到`notes/`文件夹变化，自动触发GitHub Actions
4. **内容编译**: 构建脚本将所有Markdown文件编译为静态JSON文件
5. **文件分离**: 生成`public-notes.json`(公开)和`all-notes.json`(完整)
6. **自动部署**: 编译后的内容自动部署到网站
7. **即时访问**: 用户访问时直接加载静态JSON，实现极速加载

## 🔧 故障排除

### GitHub Actions权限错误

如果遇到 `Permission denied` 或 `403` 错误：

1. 检查仓库权限设置：
   - 进入仓库设置: `Settings` → `Actions` → `General`
   - 选择 "Read and write permissions"
   - 勾选 "Allow GitHub Actions to create and approve pull requests"

2. 确认GitHub Actions已启用：
   - 检查 `.github/workflows/` 文件夹是否存在
   - 确认workflow文件语法正确

### 本地开发问题

- **笔记不显示**: 确保运行了 `npm run build:static`
- **构建失败**: 检查 `notes/` 文件夹是否存在，Markdown文件格式是否正确
- **权限错误**: 检查 `.env` 文件中的GitHub token是否有效

## 📚 详细文档

- **[部署指南](./docs/DEPLOYMENT.md)** - 详细的部署说明和故障排除
- **[架构原理](./docs/ARCHITECTURE.md)** - 技术架构和设计原理
- **[开发指南](./docs/DEVELOPMENT.md)** - 开发环境搭建和贡献指南

## 📄 许可证

MIT License
