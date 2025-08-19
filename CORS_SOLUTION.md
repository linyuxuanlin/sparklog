# 🚀 SparkLog CORS 问题解决方案

## ❌ 问题描述

当 SparkLog 应用直接访问 Cloudflare R2 存储时，会遇到以下 CORS 错误：

```
Access to fetch at 'https://xxx.r2.cloudflarestorage.com/xxx' from origin 'https://your-domain.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ✅ 解决方案概览

我们提供了 **3 种解决方案**，完全在 GitHub 代码仓库中实现，无需在 Cloudflare 上操作：

1. **🎯 推荐方案：GitHub Pages 404.html 代理**
2. **🔧 GitHub Actions 工作流代理**
3. **📱 前端直接访问（可能遇到 CORS）**

---

## 🎯 方案 1：GitHub Pages 404.html 代理（推荐）

### 优点
- ✅ 完全在 GitHub 中实现
- ✅ 无需额外服务
- ✅ 易于部署和维护
- ✅ 支持所有 R2 操作

### 实现步骤

1. **部署 404.html 页面**
   ```bash
   # 文件已创建在 public/404.html
   # 部署到 GitHub Pages 时会自动生效
   ```

2. **配置环境变量**
   ```bash
   # 在 .env 文件中添加
   VITE_R2_PROXY_URL=https://your-username.github.io/your-repo/404.html
   ```

3. **使用方式**
   - 应用会自动检测代理配置
   - 优先使用代理，回退到直接访问
   - 支持文件列表、获取、上传、删除等操作

### 工作原理
- 404.html 页面作为 R2 操作的代理端点
- 在浏览器中直接执行 R2 API 调用
- 避免了跨域问题
- 支持加密私密文件

---

## 🔧 方案 2：GitHub Actions 工作流代理

### 优点
- ✅ 完全在 GitHub 中实现
- ✅ 支持复杂的 R2 操作
- ✅ 可以集成到 CI/CD 流程

### 实现步骤

1. **工作流已创建**
   - 文件：`.github/workflows/r2-proxy.yml`
   - 支持手动触发和定时执行

2. **手动触发操作**
   - 进入 GitHub Actions 页面
   - 选择 "R2 存储代理" 工作流
   - 点击 "Run workflow"
   - 选择操作类型和参数

3. **支持的操作**
   - `list`: 列出文件
   - `get`: 获取文件内容
   - `put`: 上传文件
   - `delete`: 删除文件

### 工作原理
- 使用 AWS SDK 在 GitHub Actions 中操作 R2
- 支持文件加密
- 返回 JSON 格式的结果

---

## 📱 方案 3：前端直接访问（不推荐）

### 缺点
- ❌ 会遇到 CORS 问题
- ❌ 需要复杂的 AWS 签名
- ❌ 安全性较低

### 使用场景
- 仅用于开发测试
- 临时解决方案
- 学习 AWS S3 兼容 API

---

## 🛠️ 技术实现细节

### R2Service 智能路由

```typescript
private getEndpoint(): string {
  // 检查是否有代理配置
  const proxyUrl = import.meta.env.VITE_R2_PROXY_URL
  if (proxyUrl) {
    return proxyUrl  // 使用代理
  }
  
  // 回退到直接 R2 访问
  return `https://${this.config.accountId}.r2.cloudflarestorage.com`
}
```

### 自动适配响应格式

```typescript
if (this.isUsingProxy()) {
  // 代理返回 JSON 格式
  const data = await response.json()
  files = data.objects?.map(/* ... */) || []
} else {
  // 直接访问 R2 时解析 XML
  const data = await response.text()
  const xmlDoc = parser.parseFromString(data, 'text/xml')
  // ... XML 解析逻辑
}
```

---

## 📋 配置清单

### 必需环境变量
```bash
# R2 存储配置
VITE_R2_ACCOUNT_ID=your-account-id
VITE_R2_ACCESS_KEY_ID=your-access-key
VITE_R2_SECRET_ACCESS_KEY=your-secret-key
VITE_R2_BUCKET_NAME=your-bucket-name

# 管理员配置
VITE_ADMIN_PASSWORD=your-admin-password
VITE_GITHUB_TOKEN=your-github-token
```

### 可选环境变量
```bash
# R2 代理配置（推荐设置）
VITE_R2_PROXY_URL=https://your-domain.com/404.html

# 应用配置
VITE_APP_TITLE=SparkLog
VITE_APP_DESCRIPTION=优雅免维护的想法记录应用
VITE_DEFAULT_THEME=auto
```

---

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/your-username/sparklog.git
cd sparklog
```

### 2. 配置环境变量
```bash
cp env.example .env
# 编辑 .env 文件，填入你的配置
```

### 3. 部署 404.html 代理
```bash
# 推送到 GitHub，GitHub Pages 会自动部署
git add .
git commit -m "添加 R2 代理解决方案"
git push origin main
```

### 4. 测试配置
```bash
npm run check-config
npm run test:run
```

---

## 🔍 故障排除

### 常见问题

1. **CORS 错误仍然存在**
   - 检查 `VITE_R2_PROXY_URL` 是否正确设置
   - 确认 404.html 页面已正确部署
   - 检查浏览器控制台是否有其他错误

2. **代理页面无法访问**
   - 确认 GitHub Pages 已启用
   - 检查仓库设置中的 Pages 配置
   - 等待部署完成（可能需要几分钟）

3. **R2 操作失败**
   - 检查 R2 配置是否正确
   - 确认 API 密钥有足够权限
   - 查看 GitHub Actions 日志

### 调试技巧

1. **启用详细日志**
   ```typescript
   console.log('使用代理:', this.isUsingProxy())
   console.log('端点:', this.getEndpoint())
   ```

2. **检查网络请求**
   - 打开浏览器开发者工具
   - 查看 Network 标签页
   - 确认请求是否发送到正确的端点

3. **测试代理端点**
   - 直接访问 404.html 页面
   - 使用页面上的测试功能
   - 检查控制台输出

---

## 📚 更多资源

- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [AWS S3 兼容 API](https://docs.aws.amazon.com/AmazonS3/latest/API/)
- [GitHub Pages 部署](https://pages.github.com/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

---

## 🤝 贡献

如果你有其他解决 CORS 问题的好方法，欢迎提交 Issue 或 Pull Request！

---

**🎉 现在你可以完全在 GitHub 中解决 CORS 问题，无需在 Cloudflare 上配置任何内容！**
