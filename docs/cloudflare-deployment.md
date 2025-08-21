# Cloudflare Pages 部署指南

## 环境变量配置

为了确保 SparkLog 在 Cloudflare Pages 上正常运行，需要正确配置以下环境变量：

### 必需的环境变量

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `VITE_GITHUB_TOKEN` | GitHub 个人访问令牌 | `ghp_xxxxxxxxxxxx` |
| `VITE_REPO_OWNER` | GitHub 用户名 | `linyuxuanlin` |
| `VITE_REPO_NAME` | 笔记仓库名称 | `sparklog-notes` |
| `VITE_ADMIN_PASSWORD` | 管理员密码 | `your-admin-password` |

### 配置步骤

#### 1. 获取 GitHub 个人访问令牌

1. 访问 [GitHub Personal Access Tokens](https://github.com/settings/tokens)
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 设置令牌名称，如 "SparkLog Access"
4. 选择权限：
   - ✅ `repo` (访问私有仓库)
   - ✅ `public_repo` (访问公开仓库)
5. 点击 "Generate token"
6. **重要：复制生成的令牌并妥善保存**

#### 2. 在 Cloudflare Pages 中配置环境变量

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 "Workers & Pages" → 选择你的 SparkLog 项目
3. 进入 "Settings" 标签页
4. 滚动到 "Environment variables" 部分
5. 点击 "Add variable" 添加以下变量：

```
变量名：VITE_GITHUB_TOKEN
值：你的GitHub个人访问令牌
环境：Production 和 Preview

变量名：VITE_REPO_OWNER  
值：你的GitHub用户名
环境：Production 和 Preview

变量名：VITE_REPO_NAME
值：你的笔记仓库名称
环境：Production 和 Preview

变量名：VITE_ADMIN_PASSWORD
值：你设定的管理员密码
环境：Production 和 Preview
```

#### 3. 触发重新部署

1. 返回 "Deployments" 标签页
2. 点击 "Retry deployment" 或推送新的代码提交
3. 等待构建完成

### 验证配置

构建成功后，检查构建日志：

- ✅ 看到 "GitHub配置完整: true"
- ✅ 看到 "静态笔记构建完成"
- ❌ 如果看到 "GitHub配置不完整，跳过静态笔记构建"，说明环境变量配置有问题

### 常见问题排查

#### 问题1：构建日志显示 "GitHub配置完整: undefined"

**原因**：环境变量名称错误或未正确设置

**解决方案**：
1. 检查环境变量名称是否完全正确（区分大小写）
2. 确保所有变量都添加到了 Production 和 Preview 环境
3. 重新部署项目

#### 问题2：静态笔记构建失败

**原因**：GitHub 令牌权限不足或仓库不存在

**解决方案**：
1. 确认 GitHub 令牌有 `repo` 权限
2. 确认仓库名称和用户名正确
3. 确认仓库存在且可访问

#### 问题3：网站无法识别环境变量

**原因**：环境变量未以 `VITE_` 前缀开头

**解决方案**：
- 在 Vite 中，只有以 `VITE_` 开头的环境变量才能在客户端代码中访问
- 确保所有环境变量都使用正确的前缀

### 构建脚本工作原理

SparkLog 的构建脚本 (`build-with-static.js`) 实现了智能降级策略：

1. **完整构建模式**：当环境变量配置完整时
   - 从 GitHub 获取笔记内容
   - 生成静态笔记文件
   - 构建 React 应用
   - 部署包含静态内容的完整版本

2. **降级构建模式**：当环境变量不完整时
   - 跳过静态笔记生成
   - 创建空的静态笔记索引
   - 构建 React 应用
   - 应用在运行时动态加载笔记

### 环境变量安全性

- GitHub 令牌用于读取仓库内容，会在客户端代码中可见
- 建议为 SparkLog 创建专用的 GitHub 令牌，并定期轮换
- 管理员密码仅用于前端验证，请使用强密码

### 调试工具

如果遇到问题，可以使用内置的诊断工具：

```bash
npm run env:check
```

此命令将检查并显示所有环境变量的配置状态。