<div align="center">
  <img src="public/sparklog-favicon.svg" alt="SparkLog Logo" width="120" height="120">
  
  &nbsp;

  **SparkLog** 是一个基于 Cloudflare R2 存储的优雅免维护想法记录应用，不错过你的每一个奇思妙想。

  [![GitHub License](https://img.shields.io/github/license/linyuxuanlin/sparklog)](LICENSE)
  [![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
  [![Vite](https://img.shields.io/badge/vite-5.0-646CFF)](https://vitejs.dev)
  [![React](https://img.shields.io/badge/react-18.2-61DAFB)](https://reactjs.org)
  
  [演示站点](https://sparklog.wiki-power.com/) · [快速开始](#-快速开始) · [功能特性](#-功能特性) · [详细文档](#-详细文档)
</div>

## 🌟 项目特点

- **纯静态部署**: 基于 React + Vite 构建，你可以把它托管在 Cloudflare Pages、Vercel 等平台，无需服务器。
- **Cloudflare R2 存储**: 笔记源文件存储在 Cloudflare R2 中，提供高可用性和全球分发。
- **双重部署方式**: 支持 Cloudflare 自动部署和本地手动部署，灵活选择。
- **智能缓存机制**: 编辑后立即显示缓存内容，部署完成后自动更新。
- **加密私密笔记**: 私密笔记使用 AES-GCM 加密存储，只有正确的管理员密码才能解密查看。
- **实时编辑**: 无需其他编辑器，只要有网，就可记录你的想法。
- **现代化 UI**: 简洁美观的界面设计，支持亮色 / 暗色自动切换。

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm/yarn/pnpm

请首先配置以下服务：

1. [**配置 Cloudflare R2 存储**](https://dash.cloudflare.com/?to=/:account/r2) 用于存放笔记源文件：
   - 创建一个 R2 存储桶（例如：`sparklog-notes`）
   - 获取 Account ID、Access Key ID 和 Secret Access Key
   
   **详细获取步骤**：
   
   **步骤 1: 获取 Account ID**
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 在右侧边栏找到你的 Account ID（32 位字符）
   
   **步骤 2: 创建 R2 存储桶**
   - 进入 "R2" → "Object Storage"
   - 点击 "Create bucket"
   - 输入存储桶名称（例如：`sparklog-notes`）
   - 选择区域（建议选择离你最近的区域）
   - 点击 "Create bucket"
   
   **步骤 3: 创建 API Token**
   - 进入 "R2" → "Manage R2 API tokens"
   - 点击 "Create User API token"
   - 配置权限：
     - **Permissions**: Object Read & Write
     - **Resources**: 选择你刚创建的存储桶
   - 点击 "Create API token"
   - **重要**: 保存显示的 Access Key ID 和 Secret Access Key

2. [**获取 GitHub 个人访问令牌**](https://github.com/settings/tokens/new?description=SparkLog%20Notes&scopes=repo)（需要 `repo` 权限），  
   获取的令牌格式例如：`ghp_xxxxxxxx`。

> **新架构安全说明**: 
> - 笔记源文件存储在您的 **Cloudflare R2** 存储桶中，提供高可用性
> - 私密笔记使用 **AES-GCM 加密** 存储，确保安全性
> - 支持**双重部署方式**：Cloudflare 自动部署或本地手动构建
> - 支持**实时缓存**，编辑后立即显示，部署完成后自动更新

### 一. 本地开发

```bash
# 克隆项目
git clone https://github.com/linyuxuanlin/sparklog.git
cd sparklog

# 安装依赖
npm install

# 创建环境变量文件
cp .env.example .env  # 复制环境变量模板

# 编辑 .env 文件，配置 GitHub 和 R2 存储信息
# 详细配置说明请参考 .env.example 文件中的注释

# 检查配置（推荐先运行）
npm run check-config

# 生成静态内容（首次运行必需）
npm run build:pages

# 启动开发服务器
npm run dev
```

> **注意**: 本地开发时需要先运行 `npm run build:pages` 生成静态 JSON 文件，否则网站无法正常显示笔记内容。

### 二、部署到 Cloudflare Pages

#### 部署前检查

在部署到 Cloudflare Pages 之前，强烈建议运行以下检查命令，确保代码质量和配置正确：

```bash
# 运行完整的部署前检查
npm run pre-deploy

# 或者分步检查
npm run type-check    # TypeScript 类型检查
npm run lint          # ESLint 代码规范检查
npm run test-build    # 构建测试
```

这些检查将帮助你：
- ✅ 验证 TypeScript 类型正确性
- ✅ 检查代码规范问题
- ✅ 验证构建过程
- ✅ 检查配置文件完整性
- ✅ 确保所有必要的脚本和文件存在

#### 方式一：自动部署（推荐）

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
   - **Build command**: `npm run build:pages`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (留空)

4. **设置环境变量**

| 变量名                      | 说明                         | 示例                          |
| --------------------------- | ---------------------------- | ----------------------------- |
| `VITE_ADMIN_PASSWORD`       | 管理员密码                   | `your-secure-password`        |
| `VITE_R2_ACCOUNT_ID`        | Cloudflare R2 Account ID     | `1234567890abcdef`            |
| `VITE_R2_ACCESS_KEY_ID`     | Cloudflare R2 Access Key ID  | `abc123def456`                |
| `VITE_R2_SECRET_ACCESS_KEY` | Cloudflare R2 Secret Key     | `your-secret-access-key`      |
| `VITE_R2_BUCKET_NAME`       | Cloudflare R2 存储桶名称     | `sparklog-notes`              |
| `VITE_R2_PUBLIC_URL`        | R2 公开访问 URL（可选）      | `https://notes.example.com`   |

5. **部署**
   - 点击"Save and Deploy"
   - 等待构建完成
   - 访问你的部署地址，输入管理员密码
   - 开始记录你的妙想

#### 方式二：手动部署

1. **准备项目**

   - 克隆或下载 SparkLog 项目到本地
   - 确保已配置好环境变量和 R2 存储

2. **本地构建**

   ```bash
   # 运行部署前检查（强烈推荐）
   npm run pre-deploy
   
   # 构建项目
   npm run build:pages
   ```

3. **上传到 Cloudflare Pages**

   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 进入"Pages" → "Create a project"
   - 选择"Upload assets"
   - 上传 `dist` 目录中的所有文件

4. **配置环境变量**

| 变量名                      | 说明                         | 示例                          |
| --------------------------- | ---------------------------- | ----------------------------- |
| `VITE_ADMIN_PASSWORD`       | 管理员密码                   | `your-secure-password`        |
| `VITE_R2_ACCOUNT_ID`        | Cloudflare R2 Account ID     | `1234567890abcdef`            |
| `VITE_R2_ACCESS_KEY_ID`     | Cloudflare R2 Access Key ID  | `abc123def456`                |
| `VITE_R2_SECRET_ACCESS_KEY` | Cloudflare R2 Secret Key     | `your-secret-access-key`      |
| `VITE_R2_BUCKET_NAME`       | Cloudflare R2 存储桶名称     | `sparklog-notes`              |
| `VITE_R2_PUBLIC_URL`        | R2 公开访问 URL（可选）      | `https://notes.example.com`   |

5. **部署完成**
   - 等待部署完成
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
- **⚡ 极速加载**: 静态 JSON 文件提供毫秒级加载速度
- **🤖 自动部署**: Cloudflare Pages 自动构建和部署，无需手动操作
- **🔧 手动部署**: 本地构建和手动上传，完全控制部署时机
- **🛡️ 安全隔离**: 公开/私密内容物理分离，确保数据安全
- **📈 零 API 限制**: 完全避免 GitHub API 调用限制问题

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

### 新架构工作原理

SparkLog 采用了创新的 **R2 + 静态编译 + 智能缓存** 三层架构：

#### 📝 笔记编辑流程
1. **编辑笔记**: 在网站上编辑并保存笔记
2. **加密处理**: 私密笔记使用 AES-GCM 算法加密
3. **R2 存储**: 笔记源文件上传到 Cloudflare R2 存储桶
4. **立即缓存**: 编辑后的内容立即缓存并显示，提供即时反馈
5. **触发构建**: 自动触发 Cloudflare Pages 构建或手动本地构建

#### 🔧 静态编译流程
1. **获取源文件**: 构建时从 R2 存储桶获取所有笔记
2. **内容编译**: 将 Markdown 文件编译为静态 JSON 文件
3. **文件分离**: 生成 `public-notes.json`(公开)和 `all-notes.json`(完整)
4. **自动部署**: Cloudflare Pages 自动部署或手动上传到 Cloudflare Pages
5. **缓存更新**: 部署完成后，静态内容自动覆盖缓存

#### ⚡ 用户访问体验
- **首次访问**: 从 Cloudflare Pages 加载静态 JSON 文件，毫秒级响应
- **编辑后**: 立即显示缓存内容，同时显示构建状态
- **自动部署**: Cloudflare Pages 自动构建和部署，无需手动操作
- **手动部署**: 本地重新构建并上传到 Cloudflare Pages
- **私密笔记**: 前端使用管理员密码实时解密显示

## 🚨 常见问题解决

### CORS 错误问题

如果你在 Cloudflare Pages 部署后遇到以下错误：

```
Access to fetch at '...' has been blocked by CORS policy
Failed to load resource: net::ERR_FAILED
```

**解决方案**：

1. **确保构建命令正确**：
   - 在 Cloudflare Pages 中设置构建命令为：`npm run build:pages`
   - 不是 `npm run build`，这很重要！

2. **检查环境变量**：
   - 确保所有 R2 环境变量都已正确设置
   - 特别是 `VITE_R2_PUBLIC_URL` 如果配置了的话

3. **验证静态内容生成**：
   - 构建完成后，检查 `dist` 目录是否包含：
     - `public-notes.json`
     - `all-notes.json` 
     - `build-info.json`

4. **清除浏览器缓存**：
   - 强制刷新页面或清除浏览器缓存
   - 检查浏览器开发者工具的网络面板

5. **检查 Cloudflare Pages 设置**：
   - 确保 `_headers` 和 `_redirects` 文件正确配置
   - 这些文件控制 CORS 策略和路由重定向

### 笔记无法加载

如果网站显示但没有笔记内容：

1. **检查 R2 存储桶**：
   - 确认存储桶中有 `notes/` 目录
   - 确认目录中有 `.md` 文件

2. **检查构建日志**：
   - 在 Cloudflare Pages 控制台查看构建日志
   - 确认 `build-pages.js` 脚本执行成功

3. **手动触发构建**：
   - 在 Cloudflare Pages 中手动触发重新构建
   - 或者推送一个小的代码变更到 GitHub

### 部署验证

部署完成后，可以使用验证脚本检查是否成功：

```bash
# 验证部署（替换为你的实际 URL）
npm run verify-deployment https://your-domain.pages.dev

# 或者直接运行
node scripts/verify-deployment.js https://your-domain.pages.dev
```

验证脚本会检查：
- 静态内容文件是否可访问
- CORS 配置是否正确
- 缓存策略是否生效

## ⚙️ 环境变量配置

### 环境变量模板

项目提供了 `.env.example` 文件作为环境变量配置模板：

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入实际配置值
```

### 必需的环境变量

| 变量名                      | 说明                         | 示例                          |
| --------------------------- | ---------------------------- | ----------------------------- |

| `VITE_ADMIN_PASSWORD`      | 管理员密码                   | `your-secure-password`        |
| `VITE_R2_ACCOUNT_ID`       | Cloudflare R2 Account ID     | `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` |
| `VITE_R2_ACCESS_KEY_ID`    | R2 Access Key ID             | `AKIAIOSFODNN7EXAMPLE`        |
| `VITE_R2_SECRET_ACCESS_KEY`| R2 Secret Access Key         | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `VITE_R2_BUCKET_NAME`      | R2 存储桶名称                | `sparklog-notes`              |

### 可选的环境变量

| 变量名                      | 说明                         | 默认值                        |
| --------------------------- | ---------------------------- | ----------------------------- |
| `VITE_R2_PUBLIC_URL`       | R2 存储桶公共访问 URL        | 自动生成                     |
| `VITE_STATIC_BRANCH`       | 静态内容分支名称             | `static-content`              |
| `VITE_APP_TITLE`           | 应用标题                     | `SparkLog`                    |
| `VITE_APP_DESCRIPTION`     | 应用描述                     | `优雅免维护的想法记录应用`     |
| `VITE_DEFAULT_THEME`       | 默认主题                     | `auto`                        |

### 配置验证

运行配置检查命令验证环境变量配置：

```bash
npm run check-config
```

## 🔧 故障排除

### R2 存储配置问题

如果遇到 R2 相关错误：

1. **检查 R2 环境变量**：
   - 确认 `VITE_R2_ACCOUNT_ID` 是否正确
   - 确认 `VITE_R2_ACCESS_KEY_ID` 和 `VITE_R2_SECRET_ACCESS_KEY` 是否有效
   - 确认 `VITE_R2_BUCKET_NAME` 存储桶是否存在

2. **检查 R2 权限**：
   - 确保 Access Key 有对应存储桶的读写权限
   - 检查 R2 存储桶的 CORS 配置（如果需要）

### 加密功能问题

- **私密笔记无法解密**: 检查管理员密码是否正确
- **加密失败**: 确保浏览器支持 Web Crypto API
- **解密内容显示异常**: 可能是加密数据损坏，请检查 R2 存储完整性

### 自动部署问题

如果遇到自动部署问题：

1. 检查 GitHub 仓库设置：
   - 确认 Cloudflare Pages 已连接 GitHub 仓库
   - 验证构建命令设置为 `npm run build:pages`
   - 检查环境变量是否正确配置

2. 检查构建日志：
   - 在 Cloudflare Pages 控制台查看构建日志
   - 确认 `build-pages.js` 脚本执行成功
   - 验证 R2 存储桶可访问

### 手动部署问题

如果遇到手动部署问题：

1. 检查本地构建：
   - 运行 `npm run pre-deploy` 进行完整检查
   - 确保 `npm run build:pages` 成功执行
   - 验证 `dist` 目录包含所有必要文件

2. 检查 Cloudflare Pages 设置：
   - 确认环境变量正确配置
   - 验证上传的文件完整性

### 缓存和内容更新问题

- **编辑后内容不更新**: 检查 R2 上传是否成功，查看浏览器开发者工具
- **自动部署延迟**: 检查 Cloudflare Pages 构建状态和日志
- **手动部署延迟**: 本地重新构建并上传到 Cloudflare Pages
- **缓存内容异常**: 清除浏览器缓存或使用隐私模式测试

### 本地开发问题

- **R2 存储未启用**: 检查环境变量配置，确保所有 R2 相关变量都已设置
- **笔记不显示**: 确保运行了 `npm run build:pages`
- **构建失败**: 检查 R2 连接状态和存储桶权限

## 📚 详细文档

- **[部署指南](./docs/DEPLOYMENT.md)** - 详细的部署说明和故障排除
- **[架构原理](./docs/ARCHITECTURE.md)** - 技术架构和设计原理
- **[开发指南](./docs/DEVELOPMENT.md)** - 开发环境搭建和贡献指南
- **[配置指南](./docs/CONFIGURATION.md)** - 环境变量和服务配置详解

## 📄 许可证

MIT License
