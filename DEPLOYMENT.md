# 🚀 Cloudflare Pages 部署指南

本指南将帮助你将 SparkLog 应用完全迁移到 Cloudflare Pages，实现自动化构建和部署。

## 📋 **前置要求**

### 1. **Cloudflare 账户**
- 注册 [Cloudflare 账户](https://dash.cloudflare.com/sign-up)
- 验证域名所有权

### 2. **安装 Wrangler CLI**
```bash
npm install -g wrangler
```

### 3. **登录 Wrangler**
```bash
wrangler login
```

## 🔧 **配置步骤**

### 1. **环境变量配置**

在 Cloudflare Pages 控制台中设置以下环境变量：

#### **必需的环境变量**
```bash
VITE_R2_ACCOUNT_ID=你的R2账户ID
VITE_R2_ACCESS_KEY_ID=你的R2访问密钥ID
VITE_R2_SECRET_ACCESS_KEY=你的R2秘密访问密钥
VITE_R2_BUCKET_NAME=你的R2存储桶名称
```

#### **可选的环境变量**
```bash
VITE_ENABLE_CORS_PROXY=false
VITE_CORS_PROXY_URL=https://corsproxy.io/?
VITE_ADMIN_PASSWORD=管理员密码
VITE_APP_TITLE=SparkLog
VITE_APP_DESCRIPTION=优雅免维护的想法记录应用
VITE_DEFAULT_THEME=light
```

### 2. **Cloudflare Pages 项目配置**

#### **构建配置**
- **构建命令**: `npm run build:pages`
- **构建输出目录**: `dist`
- **Node.js 版本**: 18.x 或更高

#### **环境配置**
- **生产环境**: `production`
- **测试环境**: `staging` (可选)

### 3. **域名配置**

#### **自定义域名**
- 主域名: `sparklog.wiki-power.com`
- 测试域名: `staging.sparklog.wiki-power.com` (可选)

#### **DNS 记录**
确保以下 DNS 记录指向 Cloudflare：
```
sparklog.wiki-power.com    CNAME    your-project.pages.dev
```

## 🚀 **部署流程**

### 1. **本地测试构建**
```bash
# 测试构建脚本
npm run build:pages

# 或者使用部署脚本
node scripts/deploy-pages.js build
```

### 2. **部署到 Cloudflare Pages**

#### **自动部署**
- 推送代码到 `main` 分支时自动触发生产环境部署
- 推送代码到 `staging` 分支时自动触发测试环境部署

#### **手动部署**
```bash
# 部署到生产环境
npm run deploy:pages

# 部署到测试环境
npm run deploy:staging

# 启动预览服务器
npm run deploy:preview
```

### 3. **部署验证**

部署完成后，检查以下文件是否可访问：
- `https://sparklog.wiki-power.com/public-notes.json`
- `https://sparklog.wiki-power.com/all-notes.json`
- `https://sparklog.wiki-power.com/build-info.json`

## 📁 **文件结构**

```
sparklog/
├── scripts/
│   ├── build-pages.js      # Cloudflare Pages 构建脚本
│   └── deploy-pages.js     # 部署脚本
├── public/
│   ├── _headers            # Cloudflare Pages 响应头配置
│   └── _redirects          # 重定向规则
├── wrangler.toml           # Cloudflare 配置文件
├── package.json            # 包含新的构建脚本
└── DEPLOYMENT.md           # 本部署指南
```

## 🔄 **构建流程**

### 1. **预构建阶段** (`npm run pre-build`)
- 从 R2 存储获取所有笔记文件
- 解析笔记内容和元数据
- 生成静态 JSON 文件

### 2. **构建阶段** (`npm run build`)
- 编译 TypeScript 代码
- 构建 React 应用
- 生成静态资源

### 3. **后构建阶段** (`npm run post-build`)
- 清理临时文件
- 生成构建报告

## 📊 **监控和日志**

### 1. **构建日志**
在 Cloudflare Pages 控制台中查看：
- 构建状态
- 构建日志
- 部署历史

### 2. **应用监控**
- 页面性能指标
- 错误率统计
- 用户访问数据

## 🚨 **故障排除**

### 1. **构建失败**
- 检查环境变量配置
- 验证 R2 存储访问权限
- 查看构建日志错误信息

### 2. **部署失败**
- 确认域名 DNS 配置
- 检查 Cloudflare Pages 项目设置
- 验证构建输出目录

### 3. **运行时错误**
- 检查浏览器控制台错误
- 验证静态内容文件可访问性
- 确认 CORS 配置

## 🔧 **高级配置**

### 1. **自定义构建钩子**
在 `wrangler.toml` 中配置：
```toml
[build.hooks]
pre_build = "npm run pre-build"
post_build = "npm run post-build"
```

### 2. **环境特定配置**
```toml
[env.staging]
name = "sparklog-staging"
route = "staging.sparklog.wiki-power.com/*"

[env.production]
name = "sparklog-prod"
route = "sparklog.wiki-power.com/*"
```

### 3. **缓存策略**
在 `public/_headers` 中配置：
```
# 静态资源长期缓存
*.js
  Cache-Control: public, max-age=31536000, immutable

# 动态内容短期缓存
public-notes.json
  Cache-Control: public, max-age=300
```

## 📈 **性能优化**

### 1. **构建优化**
- 使用 ES 模块
- 启用代码分割
- 压缩静态资源

### 2. **部署优化**
- 启用 Brotli 压缩
- 配置 CDN 缓存
- 使用边缘计算

### 3. **运行时优化**
- 懒加载组件
- 预加载关键资源
- 优化图片加载

## 🔐 **安全配置**

### 1. **安全头**
```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

### 2. **权限策略**
```http
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 3. **CSP 配置**
根据需要配置内容安全策略。

## 📞 **支持**

如果遇到问题：
1. 查看 [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
2. 检查 [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
3. 查看构建日志和错误信息

---

**🎉 恭喜！** 你现在已经成功配置了 Cloudflare Pages 自动化部署！
