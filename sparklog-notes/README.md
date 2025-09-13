# SparkLog 笔记编译配置

用于拷贝到笔记仓库的静态编译配置文件，自动将 Markdown 笔记编译为静态 JSON 文件并推送到 SparkLog 部署仓库。

> **重要提醒**: 此文件夹需要完整拷贝到你的笔记仓库中，不是独立使用的工具。

## 功能特性

- **增量编译**: 仅编译内容发生变化的笔记，提升构建效率
- **私密笔记过滤**: 自动跳过标记为 `private: true` 的笔记
- **内容统计**: 提供详细的编译统计信息（行数、字符数、单词数）
- **自动推送**: 编译完成后自动推送到目标仓库
- **构建优化**: 智能跳过未变化的内容，节省 GitHub Actions 时间

## 文件说明

- `.github/workflows/compile-static.yml` - GitHub Actions 自动化工作流
- `compile-notes.js` - 核心编译脚本，支持增量编译和内容比较

## 使用步骤

### 第一步：拷贝配置文件 ⚠️

**必须操作**: 将整个 `sparklog-notes` 文件夹中的所有文件拷贝到你的**私密笔记仓库根目录**。

拷贝前的笔记仓库结构：
```
your-private-notes-repo/
├── notes/
│   ├── note1.md
│   └── note2.md
└── README.md
```

拷贝后的笔记仓库结构：
```
your-private-notes-repo/
├── .github/
│   └── workflows/
│       └── compile-static.yml    # 从 sparklog-notes 拷贝
├── compile-notes.js              # 从 sparklog-notes 拷贝
├── notes/                        # 你的笔记目录（扁平结构）
│   ├── note1.md
│   └── note2.md
└── README.md
```

### 第二步：配置 GitHub Secrets

在你的**笔记仓库**（不是 SparkLog 部署仓库）设置中添加以下 Secrets：

1. 进入笔记仓库 → Settings → Secrets and variables → Actions
2. 点击 "New repository secret"  
3. 添加以下两个 Secrets：

| Secret 名称 | 说明 | 示例值 |
|------------|------|-------|
| `TARGET_REPO_TOKEN` | GitHub Personal Access Token | `ghp_xxxxxxxxxxxxxxxx` |
| `TARGET_REPO` | SparkLog 部署仓库名称 | `your-username/your-sparklog-repo` |

> **重要**: `TARGET_REPO` 必须设置为你自己的 SparkLog 部署仓库，例如 `alice/my-sparklog`

### 第三步：创建 Personal Access Token

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 选择权限：
   - `repo` (完整仓库访问权限)
   - `workflow` (更新 GitHub Actions 工作流)
4. 复制生成的 token，填入上一步的 `TARGET_REPO_TOKEN` 中

### 第四步：验证配置

工作流将在以下情况自动运行：
- 推送任何内容到笔记仓库的 `main` 分支
- 手动触发（Actions → 选择工作流 → Run workflow）

成功运行后，编译生成的静态文件会自动推送到你配置的 SparkLog 部署仓库。

## 核心机制

### 增量编译算法

1. **内容比较**: 比较 Markdown 源文件与现有 JSON 文件的内容
2. **智能跳过**: 内容未变化的笔记直接跳过，节省编译时间
3. **差异检测**: 显示具体的行数、字符数变化信息
4. **错误恢复**: 静态文件损坏时自动重新生成

### 编译流程

1. **扫描笔记**: 遍历 `notes/` 目录下的所有 `.md` 文件
2. **解析内容**: 
   - 提取 Front Matter 元数据
   - 过滤 `private: true` 的笔记
   - 生成内容预览和统计信息
3. **增量处理**: 
   - 对比文件内容差异
   - 仅编译发生变化的笔记
4. **生成输出**: 
   - 创建独立的 JSON 文件
   - 更新索引文件 `index.json`
5. **自动推送**: 提交变更到目标仓库

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

## 输出文件结构

编译后生成的静态文件存储在 SparkLog 部署仓库的 `public/static-notes/` 目录：

```
your-sparklog-repo/public/static-notes/
├── index.json                    # 索引文件，包含所有公开笔记的元数据
├── {timestamp}.md.json          # 单个笔记的完整内容和元数据
└── 2024-08-05-13-30-58-000.md.json
```

### 索引文件格式 (index.json)

```json
{
  "version": "1.0.0",
  "compiledAt": "2024-08-23T10:30:45.123Z",
  "totalNotes": 15,
  "publicNotes": 12,
  "notes": {
    "note1.md": {
      "id": "note1",
      "title": "笔记标题",
      "contentPreview": "笔记内容预览...",
      "createdDate": "2024-01-15",
      "updatedDate": "2024-01-16",
      "tags": ["技术", "Web开发"],
      "filename": "note1.md",
      "compiledAt": "2024-08-23T10:30:45.123Z"
    }
  },
  "lastBuildStats": {
    "compiledNotes": 3,
    "skippedNotes": 9,
    "buildTime": "2024-08-23T10:30:45.123Z"
  }
}
```

### 笔记文件格式 ({noteId}.json)

```json
{
  "id": "note1",
  "title": "笔记标题",
  "content": "完整的 Markdown 内容...",
  "contentPreview": "内容预览（前200字符）...",
  "createdDate": "2024-01-15",
  "updatedDate": "2024-01-16",
  "isPrivate": false,
  "tags": ["技术", "Web开发"],
  "filename": "note1.md",
  "compiledAt": "2024-08-23T10:30:45.123Z",
  "path": "/path/to/note1.md",
  "contentStats": {
    "lines": 45,
    "characters": 1234,
    "words": 89
  }
}
```

## 故障排除

### 常见问题

1. **Actions 失败**
   - 检查 `TARGET_REPO_TOKEN` 是否正确设置
   - 确认 token 未过期且有足够权限

2. **权限错误**
   - 确保 token 有 `repo` 和 `workflow` 权限
   - 检查目标仓库访问权限

3. **编译错误**
   - 检查 Markdown 文件的 Front Matter 格式
   - 确认 `notes/` 目录存在且包含 `.md` 文件
   - 查看 Actions 日志获取详细错误信息

4. **依赖安装失败**
   - 确认网络连接正常
   - 检查 `js-yaml` 依赖是否正确安装

### 调试技巧

- 查看 GitHub Actions 的详细日志
- 本地运行 `node compile-notes.js` 测试编译过程
- 检查生成的 JSON 文件格式是否正确

### 性能优化

- 增量编译会自动跳过未变化的笔记
- 大量笔记时建议分批处理或使用多个仓库
- 考虑在非高峰时间触发编译

## 许可证

MIT License
