# SparkLog 静态编译配置

此配置用于自动将 Markdown 笔记编译为静态 JSON 文件，并推送到 SparkLog 托管仓库。

## 文件说明

- `.github/workflows/compile-static.yml` - GitHub Actions 工作流配置
- `compile-notes.js` - 笔记编译脚本

## 部署步骤

### 1. 将文件复制到笔记仓库

将 `sparklog-notes` 文件夹中的所有文件复制到你的**私密笔记仓库根目录**：

```
your-private-notes-repo/
├── .github/
│   └── workflows/
│       └── compile-static.yml
├── compile-notes.js
└── your-notes/
    ├── note1.md
    └── note2.md
```

### 2. 配置 GitHub Secrets

在你的**私密笔记仓库**设置中添加 Secret：

1. 进入仓库 → Settings → Secrets and variables → Actions
2. 点击 "New repository secret"
3. 添加以下 Secret：

```
名称: TARGET_REPO_TOKEN
值: 你的 GitHub Personal Access Token
```

### 3. 创建 Personal Access Token

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 选择权限：
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
4. 复制生成的 token 作为 `TARGET_REPO_TOKEN` 的值

### 4. 触发条件

GitHub Actions 将在以下情况自动运行：
- 推送 `.md` 文件到 `main` 分支
- 手动触发（Repository → Actions → 选择工作流 → Run workflow）

## 工作原理

1. **触发**: 当笔记仓库的 `.md` 文件发生变化时触发
2. **编译**: 
   - 解析 Markdown 文件的 Front Matter
   - 跳过 `private: true` 的笔记
   - 比较文件修改时间，只编译有变化的笔记
3. **生成**: 创建 JSON 格式的静态文件和索引文件
4. **推送**: 将生成的文件推送到 `linyuxuanlin/sparklog` 仓库的 `public/static-notes/` 目录

## Front Matter 格式

```yaml
---
created_at: "2024-01-15"
updated_at: "2024-01-16" 
private: false
tags: [技术, Web开发]
---

# 笔记标题

笔记内容...
```

## 生成的文件结构

```
linyuxuanlin/sparklog/public/static-notes/
├── index.json              # 索引文件
├── note1.md.json          # 笔记1的静态数据
└── note2.md.json          # 笔记2的静态数据
```

## 故障排除

1. **Actions 失败**: 检查 `TARGET_REPO_TOKEN` 是否正确设置
2. **权限错误**: 确保 token 有 `repo` 和 `workflow` 权限
3. **编译错误**: 检查 Markdown 文件的 Front Matter 格式是否正确