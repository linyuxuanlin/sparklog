# SparkLog - Next.js 重构版

<div align="center">
  
**SparkLog** 是一个优雅免维护的想法记录应用，基于 Next.js 重构，提供更好的性能和开发体验。

[![Next.js](https://img.shields.io/badge/Next.js-15.x-000000)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

</div>

## 🌟 项目特点

- **Next.js 14+**: 基于最新的 App Router，支持 SSR/SSG
- **现代化架构**: TypeScript + Zustand 状态管理 + SWR 数据获取
- **GitHub 仓库存储**: 所有笔记数据存储在 GitHub 仓库中，永远不会丢失
- **无后端依赖**: 直接使用 GitHub API，无需维护服务器和数据库
- **权限控制**: 支持笔记公开/私密设置
- **实时编辑**: 支持 Markdown 格式的笔记编辑
- **智能搜索**: 快速搜索笔记标题、内容和标签
- **标签系统**: 智能标签管理，支持筛选和搜索
- **响应式设计**: 支持桌面和移动设备
- **暗色主题**: 自动检测系统主题偏好
- **单元测试**: 完整的测试覆盖

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm/yarn/pnpm

### 1. 准备 GitHub 仓库

首先 [**创建一个 GitHub 私有仓库**](https://github.com/new?name=sparklog-notes&private=true) 用于笔记文件的存放。

然后 [**获取 GitHub 个人访问令牌**](https://github.com/settings/tokens/new?description=SparkLog%20Notes&scopes=repo)（需要`repo`权限），  
获取的令牌格式例如：`ghp_xxxxxxxx`。

### 2. 本地开发

```bash
# 克隆项目
git clone <your-repo-url>
cd sparklog

# 安装依赖
npm install

# 创建环境变量文件
cp .env.example .env.local

# 编辑 .env.local 文件，配置以下环境变量：
SPARKLOG_REPO_OWNER=你的GitHub用户名
SPARKLOG_REPO_NAME=笔记仓库名
SPARKLOG_GITHUB_TOKEN=你的GitHub令牌
SPARKLOG_ADMIN_PASSWORD=管理员密码

# 启动开发服务器
npm run dev
```

### 3. 部署到 Vercel

1. **连接 Vercel**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 "New Project"
   - 导入你的 GitHub 仓库

2. **配置环境变量**
   在 Vercel 项目设置中添加以下环境变量：
   
   | 变量名 | 说明 | 示例 |
   | --- | --- | --- |
   | `SPARKLOG_REPO_OWNER` | GitHub 用户名 | `linyuxuanlin` |
   | `SPARKLOG_REPO_NAME` | 笔记仓库名 | `sparklog-notes` |
   | `SPARKLOG_GITHUB_TOKEN` | GitHub 令牌 | `ghp_xxxxxxxx` |
   | `SPARKLOG_ADMIN_PASSWORD` | 管理员密码 | `your-password` |

3. **部署**
   - 点击 "Deploy"
   - 等待构建完成
   - 访问你的部署地址

## 📁 项目结构

```
sparklog/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── auth/          # 认证 API
│   │   │   └── notes/         # 笔记 API
│   │   ├── settings/          # 设置页面
│   │   ├── globals.css        # 全局样式
│   │   ├── layout.tsx         # 根布局
│   │   └── page.tsx           # 首页
│   ├── components/            # React 组件
│   │   ├── layout/            # 布局组件
│   │   ├── notes/             # 笔记相关组件
│   │   └── ui/                # UI 组件
│   ├── lib/                   # 工具库
│   │   ├── store.ts           # Zustand 状态管理
│   │   ├── github.ts          # GitHub API 服务
│   │   ├── config.ts          # 配置管理
│   │   └── utils.ts           # 工具函数
│   ├── types/                 # TypeScript 类型定义
│   └── tests/                 # 单元测试
├── jest.config.js             # Jest 配置
├── jest.setup.js              # Jest 设置
├── tailwind.config.js         # Tailwind CSS 配置
└── tsconfig.json              # TypeScript 配置
```

## 🎯 功能特性

### 笔记管理
- ✅ 创建、编辑、删除笔记
- ✅ Markdown 格式支持
- ✅ 实时预览
- ✅ 标签系统
- ✅ 公开/私密笔记

### 搜索和筛选
- ✅ 全文搜索（标题、内容、标签）
- ✅ 标签筛选
- ✅ 实时搜索结果

### 用户体验
- ✅ 响应式设计
- ✅ 暗色主题支持
- ✅ 快捷键支持
- ✅ 加载状态指示

### 技术特性
- ✅ Server-Side Rendering (SSR)
- ✅ API Routes
- ✅ 客户端缓存
- ✅ 类型安全
- ✅ 单元测试

## 🧪 测试

```bash
# 运行测试
npm test

# 监听模式运行测试
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage
```

## 🛠️ 开发

```bash
# 启动开发服务器
npm run dev

# 类型检查
npm run type-check

# 代码检查
npm run lint

# 修复代码格式
npm run lint:fix

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 📄 许可证

MIT License

## 🔄 从旧版本迁移

如果你正在使用基于 Vite 的旧版本 SparkLog，可以按照以下步骤迁移：

1. **备份数据**: 确保你的 GitHub 仓库中的笔记数据是最新的
2. **部署新版本**: 按照上述步骤部署 Next.js 版本
3. **配置环境变量**: 使用相同的 GitHub 仓库配置
4. **测试功能**: 确认所有功能正常工作后停用旧版本

## 🤝 贡献

欢迎提交 Pull Request 或 Issue！

## 📞 支持

如果你遇到问题或有建议，请：

1. 查看 [Issues](https://github.com/linyuxuanlin/sparklog/issues) 页面
2. 创建新的 Issue 描述问题
3. 或者直接提交 Pull Request

---

<div align="center">
  Made with ❤️ by SparkLog Team
</div>
