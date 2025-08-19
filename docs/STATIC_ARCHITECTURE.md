# 静态内容架构说明

## 架构概述

SparkLog 已升级为混合静态架构，结合了静态内容的快速加载和动态编译的灵活性。

### 主要特性

- 🚀 **快速加载**: 静态JSON文件提供极快的内容加载速度
- 🔒 **私密保护**: 登录用户才能访问私密内容
- ⚡ **自动编译**: GitHub Actions自动触发内容编译
- 📱 **实时状态**: 显示内容编译状态和进度
- 🔄 **增量更新**: 只有内容变更时才重新编译

## 架构组件

### 1. 静态内容生成

```
notes/                     # Markdown 源文件
├── 2024-01-01-example.md  # 笔记文件
└── 2024-01-02-private.md  # 私密笔记

scripts/build-static-content.js  # 构建脚本
↓
public/                    # 生成的静态文件
├── public-notes.json      # 公开笔记数据
├── all-notes.json         # 完整笔记数据（含私密）
└── build-info.json        # 构建信息
```

### 2. GitHub Actions 工作流

- **触发条件**: `notes/` 目录文件变更
- **构建过程**: 解析Markdown → 生成JSON → 提交更新
- **部署**: 自动部署到 GitHub Pages 或其他静态托管

### 3. 前端加载逻辑

```typescript
// 未登录用户
GET /public-notes.json → 只显示公开内容

// 已登录用户  
GET /all-notes.json → 显示全部内容（含私密）
```

## 文件结构

### Markdown 笔记格式

```markdown
---
created_at: 2024-01-01T10:00:00Z
updated_at: 2024-01-01T10:00:00Z
private: false
tags: [技术, React]
---

# 笔记标题

笔记内容...
```

### 生成的 JSON 格式

```json
{
  "notes": [
    {
      "name": "2024-01-01-example.md",
      "title": "2024-01-01-example",
      "content": "笔记内容...",
      "contentPreview": "内容预览...",
      "created_at": "2024-01-01T10:00:00Z",
      "updated_at": "2024-01-01T10:00:00Z",
      "isPrivate": false,
      "tags": ["技术", "React"],
      "sha": "abc123...",
      "path": "notes/2024-01-01-example.md"
    }
  ],
  "buildInfo": {
    "buildTime": "2024-01-01T10:05:00Z",
    "totalNotes": 10,
    "publicNotes": 8,
    "privateNotes": 2,
    "tags": ["技术", "React", "生活"]
  }
}
```

## 部署步骤

### 1. 环境变量配置

在 GitHub 仓库的 Settings > Secrets and variables > Actions 中配置：

```bash
# GitHub Token（需要 repo 权限）
GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# 管理员密码
VITE_ADMIN_PASSWORD=your_admin_password

# 仓库配置
VITE_GITHUB_OWNER=your-username
VITE_GITHUB_REPO=your-notes-repo
VITE_GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

### 2. 启用 GitHub Pages

1. 进入仓库 Settings > Pages
2. Source 选择 "GitHub Actions"
3. 工作流会自动部署到 Pages

### 3. 初始化内容

```bash
# 创建 notes 目录
mkdir notes

# 创建示例笔记
cat > notes/2024-01-01-welcome.md << EOF
---
created_at: 2024-01-01T10:00:00Z
updated_at: 2024-01-01T10:00:00Z
private: false
tags: [欢迎, 示例]
---

# 欢迎使用 SparkLog

这是一个示例笔记。
EOF

# 提交到仓库
git add notes/
git commit -m "添加示例笔记"
git push
```

### 4. 手动触发构建

```bash
# 通过 GitHub Actions 手动触发
gh workflow run build-static-content.yml

# 或使用 API
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/your-username/your-repo/actions/workflows/build-static-content.yml/dispatches \
  -d '{"ref":"main","inputs":{"force_rebuild":"true"}}'
```

## 使用说明

### 创建笔记

1. 登录管理员账户
2. 点击"新建笔记"按钮
3. 编写内容，设置标签和私密性
4. 保存后自动触发 GitHub Actions 编译

### 编辑笔记

1. 点击笔记卡片打开详情
2. 点击"编辑"按钮
3. 修改内容后保存
4. 自动触发重新编译

### 删除笔记

1. 在笔记详情中点击"删除"按钮
2. 确认删除操作
3. 自动触发重新编译

### 查看构建状态

页面顶部会显示构建状态指示器：
- 🟢 内容最新
- 🟡 内容稍旧  
- 🔴 构建失败
- 🔄 正在编译

## 性能优化

### 缓存策略

- 静态文件缓存：5分钟
- 构建状态缓存：30秒
- 浏览器缓存：利用ETag和Last-Modified

### 加载优化

- 一次性加载所有静态数据
- 客户端搜索和筛选
- 懒加载图片和附件

### 构建优化

- 增量构建：只有文件变更时才重新编译
- 并行处理：同时处理多个文件
- 错误处理：构建失败时保留上一个版本

## 故障排除

### 构建失败

1. 检查 GitHub Actions 日志
2. 验证 Markdown 文件格式
3. 检查权限和环境变量

### 内容不更新

1. 手动触发工作流
2. 清除浏览器缓存
3. 检查静态文件生成时间

### 私密内容泄露

1. 验证登录状态检查逻辑
2. 确认 public-notes.json 不包含私密内容
3. 检查构建脚本的过滤逻辑

## API 参考

### 静态内容服务

```typescript
// 获取公开笔记
const publicData = await staticService.getPublicNotes()

// 获取完整笔记（需要登录）
const allData = await staticService.getAllNotes(isAuthenticated)

// 获取构建信息
const buildInfo = await staticService.getBuildInfo()

// 检查构建状态
const status = await staticService.getBuildStatus()
```

### 笔记操作服务

```typescript
// 创建笔记
const result = await noteOpsService.createNote(noteData, adminToken)

// 更新笔记
const result = await noteOpsService.updateNote(path, sha, noteData, adminToken)

// 删除笔记
const result = await noteOpsService.deleteNote(path, sha, adminToken)

// 检查工作流状态
const status = await noteOpsService.checkWorkflowStatus(adminToken)
```

## 迁移指南

从旧的动态架构迁移到新的静态架构：

1. **备份数据**: 导出所有笔记内容
2. **更新代码**: 部署新的静态架构代码
3. **配置环境**: 设置环境变量和GitHub Actions
4. **初始构建**: 运行一次完整构建
5. **测试验证**: 确认所有功能正常工作
6. **清理旧代码**: 移除不再需要的动态API调用逻辑

---

这个新架构提供了更好的性能、更强的私密性保护和更灵活的内容管理方式。如有问题，请查看GitHub Actions日志或提交Issue。
