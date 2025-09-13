<div align="center">
  <img src="/sparklog-favicon.svg" alt="SparkLog Logo" width="120" height="120">
  
  # SparkLog 妙想笔记（Next.js 重构版）
  
  完全静态、无后端。基于 GitHub 笔记仓库与静态 JSON 加速，前端草稿合并，编辑即刻可见。
  
  Cloudflare Pages 部署 · 提供 Vercel 说明
</div>

## 特性

- 零后端：仅前端 + GitHub API（可选）
- 静态加速：优先读取 `/static-notes/index.json` 与按需单篇 JSON
- 草稿合并：新建/更新/删除即刻可见，刷新后以已编译静态覆盖
- 私密/公开：frontmatter `private: true` 不生成静态 JSON
- 标签与搜索：本地快速过滤
- 响应式 UI：Tailwind CSS
- i18n：简洁可拆卸（见 `src/lib/i18n/`）

## 架构概览

```
┌───────────┐   ┌─────────────────┐   ┌──────────────────────┐
│  前端 SPA │◄►│ GitHub 笔记仓库 │◄►│ 站点仓库/public 静态 │
│ Next.js   │   │  notes/*.md     │   │ static-notes/*.json  │
└───────────┘   └─────────────────┘   └──────────────────────┘
         ▲                ▲                         
         │ 草稿合并       │ 编辑 (API)              │ 刷新读取静态
```

数据流：
- 浏览：静态索引 → 合并草稿（本地）→ 渲染
- 写入：GitHub API 推送（前台）→ 外部流水线编译静态 → 下次刷新自动替换

> 本重构保持“完全静态无后端”。如果需要更安全的 Token 隐藏，可改用 Next Route Handlers（放弃纯静态），不在本方案内。

## 目录结构

```
app/                 # Next App Router（单页CSR）
src/
  components/        # UI 组件与页面
  lib/               # 服务、Hook、工具、i18n、路由
  types/
public/
  static-notes/      # 预编译索引与单篇JSON（由笔记仓库流水线产出）
_redirects           # Cloudflare Pages 单页路由回退
_headers             # 静态资源 headers
```

## 开发

```bash
pnpm i # 或 npm i / yarn
pnpm dev
```

## 构建与部署（Cloudflare Pages）

- 构建命令：`next build && next export`
- 输出目录：`out`
- 将 `_redirects` 放到构建产物根（本仓库已在根目录）
- 环境变量（客户端可见）：
  - `NEXT_PUBLIC_REPO_OWNER`：GitHub 用户/组织
  - `NEXT_PUBLIC_REPO_NAME`：笔记仓库名
  - `NEXT_PUBLIC_GITHUB_TOKEN`：GitHub Token（仅 content:write 等最小权限）
  - `NEXT_PUBLIC_ADMIN_PASSWORD`：管理员密码

安全提示：纯静态方案中，`NEXT_PUBLIC_GITHUB_TOKEN` 会暴露给客户端。请仅用于自用、最小权限、周期轮换。若无法接受，请改用有后端代理的安全方案。

## Vercel 部署

- Import Repo → 设置以上 `NEXT_PUBLIC_*` 环境变量（Build Command 同上）
- 输出目录使用 `out`

## 笔记仓库与静态编译

将你的“笔记仓库”（私有）配置 GitHub Actions，在笔记变更后编译 `notes/*.md` 为站点仓库 `public/static-notes/*.json` 与 `index.json` 并推送（可参考你原始仓库中的 `sparklog-notes` 工作流与脚本）。

Frontmatter 约定：

```yaml
---
created_at: "2024-01-15"
updated_at: "2024-01-16"
private: false
tags: [技术, Web开发]
---
```

## 环境变量与 .env

- 已移除 repo 中的敏感 Token。请使用 `.env.local`（不会进 Git）或在平台上配置环境变量。
- 参考 `.env.example`。

## 测试（Jest）

```bash
pnpm test
```

## 可选改进

见 `docs/IMPROVEMENTS.md`，不改变现有 UI/布局/文案的前提下的建议。

