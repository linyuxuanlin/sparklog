# Cloudflare Pages 部署设置指南

## 修复的部署问题

### 1. wrangler.toml 配置问题
**问题**: Cloudflare Pages不支持`staging`环境和`headers`配置
**解决方案**: 
- 移除了`[env.staging]`配置
- 移除了`[[headers]]`配置
- 只保留`production`和`preview`环境

### 2. 正确的wrangler.toml配置
```toml
name = "sparklog"
compatibility_date = "2025-08-01"
pages_build_output_dir = "dist"

[env.production]
name = "sparklog-prod"

[env.preview]
name = "sparklog-preview"
```

### 3. CORS配置
CORS配置已移至`_headers`文件：
```
/*
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization
```

## 部署步骤

### 1. 确保文件配置正确
- ✅ `wrangler.toml` - 已修复
- ✅ `_headers` - 包含CORS配置
- ✅ `_redirects` - 简化路由配置

### 2. Cloudflare Pages设置
在Cloudflare Pages控制台中：

#### 构建配置
- **构建命令**: `npm run build`
- **输出目录**: `dist`
- **Node.js 版本**: 18 或更高

#### 环境变量
设置以下环境变量：
```
VITE_REPO_OWNER=linyuxuanlin
VITE_REPO_NAME=sparklog-notes
VITE_GITHUB_TOKEN=your-github-token
VITE_ADMIN_PASSWORD=your-admin-password
```

### 3. 部署后验证
1. 打开浏览器开发者工具
2. 查看控制台输出
3. 检查是否有调试信息显示
4. 验证环境变量是否正确加载

## 常见问题解决

### 问题1: 部署失败 - wrangler.toml错误
**解决方案**: 使用修复后的wrangler.toml配置

### 问题2: CORS错误
**解决方案**: CORS配置已在_headers文件中设置

### 问题3: 环境变量未加载
**解决方案**: 
- 确保在Cloudflare Pages控制台中正确设置环境变量
- 重新部署应用
- 清除浏览器缓存

## 调试信息

应用会在生产环境中自动显示调试信息：
- 环境变量加载状态
- GitHub API连接测试
- 网络请求详细信息

如果部署后仍有问题，请查看浏览器控制台的调试输出。 