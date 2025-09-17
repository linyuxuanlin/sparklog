<div align="center">
  <img src="public/sparklog-favicon.svg" alt="SparkLog Logo" width="120" height="120">
  
  # SparkLog 妙想
  
  基于 GitHub 的免费个人笔记应用，不错过你的每一个奇思妙想
  
  [![GitHub License](https://img.shields.io/github/license/linyuxuanlin/sparklog)](LICENSE)
  [![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
  [![React](https://img.shields.io/badge/react-18.2-61DAFB)](https://reactjs.org)
  
  [在线演示](https://sparklog.wiki-power.com/) · [快速部署](#-快速部署) · [本地开发](#-本地开发) · [技术文档](./docs/)
</div>

## ✨ 特色功能

- 🌐 **零成本部署** - 基于 GitHub + Cloudflare Pages，完全免费
- 📝 **Web 端编辑** - 网页直接编辑 Markdown 笔记，支持实时预览
- 🔒 **私密保护** - 支持公开/私密笔记，访问权限控制
- ⚡ **极速加载** - 智能静态化，浏览时无需 GitHub API 调用
- 🏷️ **标签管理** - 便捷的标签系统，快速分类和检索
- 📱 **响应式** - 完美适配桌面和手机端
- ☁️ **云端同步** - 数据存储在 GitHub，永不丢失

## 🚀 快速部署

### 1. 准备 GitHub 仓库

1. **创建笔记仓库**: [创建一个 GitHub 私有仓库](https://github.com/new?name=sparklog-notes&private=true)
2. **获取访问令牌**: [生成 Personal Access Token](https://github.com/settings/tokens/new?description=SparkLog%20Notes&scopes=repo)，需要 `repo` 和`workflow` 权限

### 2. 一键部署到 Cloudflare Pages

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://dash.cloudflare.com/pages)

1. Fork 本项目到你的 GitHub 账户
2. 在 Cloudflare Pages 中连接你的 fork 仓库
3. 设置构建参数：
   - **构建命令**: `npm run build`
   - **输出目录**: `dist`
4. 配置环境变量：

| 环境变量              | 说明          | 示例             |
| --------------------- | ------------- | ---------------- |
| `VITE_REPO_OWNER`     | GitHub 用户名 | `linyuxuanlin`   |
| `VITE_REPO_NAME`      | 笔记仓库名    | `sparklog-notes` |
| `VITE_GITHUB_TOKEN`   | GitHub 令牌   | `ghp_xxxxxxxx`   |
| `VITE_ADMIN_PASSWORD` | 管理密码      | `your-password`  |

5. 点击部署，几分钟后即可访问你的专属笔记应用！

### 3. 其他部署平台

<details>
<summary>部署到Vercel</summary>

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. 点击上面的按钮，导入你 fork 的仓库
2. 在环境变量中配置上述 4 个变量
3. 部署完成
</details>

<details>
<summary>部署到Netlify</summary>

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

1. 连接 GitHub 仓库
2. 构建命令: `npm run build`
3. 发布目录: `dist`
4. 在 Site settings -> Environment variables 中配置变量
</details>

## 💻 本地开发

```bash
# 克隆项目
git clone https://github.com/linyuxuanlin/sparklog.git
cd sparklog

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置你的GitHub信息

# 启动开发服务器
npm run dev
```

## 🎯 核心功能

### 📝 笔记管理

- **创建笔记**: 支持 Markdown 格式，实时预览
- **编辑笔记**: Web 端直接编辑，自动同步到 GitHub
- **删除笔记**: 安全删除，支持撤销操作
- **草稿功能**: 本地暂存编辑内容，避免意外丢失

### 🔍 智能检索

- **全文搜索**: 搜索标题、内容和标签
- **标签筛选**: 多标签组合筛选
- **快速导航**: 按时间、标签快速定位

### 🌐 访问控制

- **公开模式**: 任何人都可以浏览公开笔记
- **管理模式**: 输入管理密码后可编辑和查看私密笔记
- **权限分离**: 公开内容和私密内容完全隔离

### ⚡ 性能优化

- **静态化**: 公开笔记自动编译为静态 JSON 文件
- **智能缓存**: 减少 GitHub API 调用，避免速率限制
- **增量加载**: 分页加载，提升大量笔记时的性能

## 🏗️ 技术架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web 前端      │    │  GitHub 仓库    │    │  静态文件缓存   │
│  React + Vite   │◄──►│   Markdown      │◄──►│   JSON 文件     │
│                 │    │   文件存储      │    │   快速加载      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

- **前端**: React 18 + TypeScript + Tailwind CSS
- **构建**: Vite 5 + 现代化工具链
- **存储**: GitHub 仓库作为数据库
- **部署**: 静态部署，支持各大 CDN 平台
- **缓存**: 智能静态化，减少 API 调用

## 📚 文档目录

- **[部署指南](./docs/DEPLOYMENT.md)** - 详细部署步骤和故障排除
- **[开发指南](./docs/DEVELOPMENT.md)** - 本地开发和贡献代码
- **[架构设计](./docs/ARCHITECTURE.md)** - 技术架构和设计原理

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request 来帮助改进 SparkLog！

```bash
# 1. Fork项目
# 2. 创建特性分支
git checkout -b feature/amazing-feature

# 3. 提交更改
git commit -m 'Add some amazing feature'

# 4. 推送分支
git push origin feature/amazing-feature

# 5. 创建Pull Request
```

## 📄 开源协议

本项目基于[MIT 协议](LICENSE)开源，你可以自由使用、修改和分发。

---

<div align="center">
  如果这个项目对你有帮助，请给个⭐Star支持一下！
  <br>
  <a href="https://github.com/linyuxuanlin/sparklog/stargazers">⭐ Star</a> |
  <a href="https://github.com/linyuxuanlin/sparklog/issues">🐛 反馈</a> |
  <a href="https://github.com/linyuxuanlin/sparklog/discussions">💬 讨论</a>
</div>
