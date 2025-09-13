# 静态笔记构建器

这个目录包含了 SparkLog 的静态笔记构建脚本，用于在构建时预编译所有公开笔记。

## 🎯 功能说明

### 主要特性
- **构建时编译**: 在 `npm run build` 时自动编译所有笔记
- **静态文件生成**: 生成优化的 JSON 文件到 `dist/static-notes/` 目录
- **CDN 加速**: 利用 Cloudflare Pages 的 CDN 直接访问静态内容
- **零运行时配置**: 用户无需任何额外设置

### 工作流程
1. 构建脚本调用 GitHub API 获取所有笔记
2. 解析笔记内容，提取元数据和标签
3. 只处理公开笔记（`isPrivate: false`）
4. 生成笔记索引文件和单个笔记文件
5. 输出到 `dist/static-notes/` 目录

## 🚀 使用方法

### 开发环境
```bash
# 只构建静态笔记
npm run build:static-notes

# 完整构建（先构建静态笔记，再构建应用）
npm run build:full
```

### 生产环境
```bash
# 标准构建流程会自动包含静态笔记构建
npm run build
```

## 📁 输出结构

```
dist/
├── static-notes/
│   ├── index.json          # 笔记索引文件
│   ├── note1.md.json       # 单个笔记的静态内容
│   ├── note2.md.json
│   └── ...
└── ...                     # 其他构建产物
```

### 索引文件格式
```json
{
  "version": "1.0.0",
  "compiledAt": "2024-01-01T00:00:00.000Z",
  "totalNotes": 10,
  "publicNotes": 8,
  "notes": {
    "note1.md": {
      "id": "sha123...",
      "title": "笔记标题",
      "contentPreview": "内容预览...",
      "createdDate": "2024-01-01T00:00:00.000Z",
      "updatedDate": "2024-01-01T00:00:00.000Z",
      "tags": ["标签1", "标签2"],
      "sha": "sha123...",
      "path": "notes/note1.md"
    }
  }
}
```

## ⚙️ 配置要求

### 环境变量
- `VITE_REPO_OWNER`: GitHub 用户名或组织名
- `VITE_REPO_NAME`: 笔记仓库名称
- `VITE_GITHUB_TOKEN`: GitHub 个人访问令牌

### 依赖项
- `tsx`: 用于运行 TypeScript 构建脚本
- `fs`, `path`: Node.js 内置模块

## 🔧 故障排除

### 常见问题

1. **GitHub API 限制**
   - 脚本已内置延迟机制避免触发限制
   - 如果遇到限制，请稍后重试

2. **权限问题**
   - 确保 GitHub Token 有 `repo` 权限
   - 检查仓库是否为私有且 Token 有访问权限

3. **构建失败**
   - 检查环境变量配置
   - 查看控制台错误信息
   - 确认网络连接正常

### 调试模式
```bash
# 启用详细日志
DEBUG=* npm run build:static-notes
```

## 📈 性能优化

### 构建优化
- 批量处理文件，减少 API 调用
- 内置延迟避免触发 GitHub API 限制
- 只处理公开笔记，减少不必要的工作

### 运行时优化
- 生成笔记索引，支持快速查找
- 静态文件支持 CDN 缓存
- 浏览器端内存缓存减少重复请求

## 🔄 更新策略

### 自动更新
- 每次 `git push` 触发重新构建
- 自动重新编译所有笔记
- 保持静态内容与源码同步

### 手动更新
```bash
# 强制重新构建静态笔记
npm run build:static-notes
```

## 📚 相关文档

- [主项目 README](../../README.md)
- [静态化部署指南](../../docs/STATIC_DEPLOYMENT.md)
- [架构文档](../../docs/ARCHITECTURE.md)
