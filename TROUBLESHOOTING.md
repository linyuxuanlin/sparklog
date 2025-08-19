# 🚨 SparkLog 故障排除指南

## 快速诊断

### 1. 环境变量检查

```bash
npm run check-config
```

这个命令会检查所有必需的环境变量是否已配置。

### 2. 部署验证

```bash
npm run verify-deployment https://your-domain.pages.dev
```

这个命令会验证你的部署是否成功，包括静态内容、CORS 配置等。

## 常见问题

### ❌ CORS 错误

**错误信息**：
```
Access to fetch at '...' has been blocked by CORS policy
Failed to load resource: net::ERR_FAILED
```

**解决方案**：

1. **确认构建命令**：
   - Cloudflare Pages 构建命令必须是：`npm run build:pages`
   - 不是 `npm run build`

2. **检查环境变量**：
   ```bash
   npm run check-config
   ```

3. **重新部署**：
   - 在 Cloudflare Pages 中手动触发重新构建
   - 或者推送代码变更到 GitHub

### ❌ 笔记无法加载

**症状**：网站显示但没有笔记内容

**解决方案**：

1. **检查 R2 存储桶**：
   - 确认有 `notes/` 目录
   - 确认有 `.md` 文件

2. **检查构建日志**：
   - Cloudflare Pages 控制台 → 构建日志
   - 确认 `build-pages.js` 执行成功

3. **验证静态内容**：
   ```bash
   npm run verify-deployment https://your-domain.pages.dev
   ```

### ❌ 构建失败

**症状**：Cloudflare Pages 构建失败

**解决方案**：

1. **检查环境变量**：
   - 所有 R2 相关变量必须设置
   - 管理员密码必须设置

2. **检查 R2 权限**：
   - 确认 API Token 有读写权限
   - 确认存储桶名称正确

3. **本地测试**：
   ```bash
   npm run build:pages
   ```

### ❌ 网站无法访问

**症状**：部署后网站无法访问

**解决方案**：

1. **检查域名设置**：
   - 确认自定义域名配置正确
   - 检查 DNS 记录

2. **检查构建状态**：
   - Cloudflare Pages 控制台 → 部署状态
   - 确认最新部署成功

3. **检查路由配置**：
   - 确认 `_redirects` 文件存在
   - 确认 SPA 路由配置正确

## 调试步骤

### 步骤 1：环境检查

```bash
# 检查环境变量
npm run check-config

# 检查构建脚本
npm run build:pages
```

### 步骤 2：部署验证

```bash
# 验证部署
npm run verify-deployment https://your-domain.pages.dev
```

### 步骤 3：日志分析

1. **浏览器开发者工具**：
   - 网络面板：查看请求状态
   - 控制台：查看错误信息

2. **Cloudflare Pages 日志**：
   - 构建日志：查看构建过程
   - 函数日志：查看运行时错误

### 步骤 4：配置检查

1. **环境变量**：
   - R2 配置完整
   - 管理员密码设置

2. **构建配置**：
   - 构建命令：`npm run build:pages`
   - 输出目录：`dist`

3. **文件配置**：
   - `_headers`：CORS 策略
   - `_redirects`：路由重定向

## 预防措施

### 1. 定期检查

- 每周运行 `npm run check-config`
- 部署后运行 `npm run verify-deployment`

### 2. 监控构建

- 设置构建通知
- 监控构建成功率

### 3. 备份配置

- 保存环境变量配置
- 备份重要配置文件

## 获取帮助

### 1. 项目文档

- [README.md](README.md)：详细配置说明
- [DEPLOYMENT.md](DEPLOYMENT.md)：部署指南

### 2. 社区支持

- [GitHub Issues](https://github.com/linyuxuanlin/sparklog/issues)
- [GitHub Discussions](https://github.com/linyuxuanlin/sparklog/discussions)

### 3. 相关资源

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)

---

**提示**：如果问题仍然存在，请提供以下信息：
1. 错误信息截图
2. 环境变量配置（隐藏敏感信息）
3. 构建日志
4. 浏览器控制台输出
