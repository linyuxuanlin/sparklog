# SparkLog 部署指南

## Cloudflare Pages 部署

### 1. 准备部署
确保以下文件存在于项目根目录：
- `_headers` - 设置MIME类型
- `_redirects` - 处理SPA路由
- `wrangler.toml` - Cloudflare配置

### 2. Cloudflare Pages 设置
在Cloudflare Pages中配置：
- **Framework preset**: None
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/`

**重要**：
- wrangler.toml文件只包含`pages_build_output_dir = "dist"`
- 构建命令在Cloudflare Pages界面中设置，或者通过`.cloudflare/pages.json`配置
- 确保Cloudflare Pages界面中设置：
  - **Build command**: `npm run build`
  - **Build output directory**: `dist`

### 3. 环境变量（可选）
如果需要GitHub OAuth功能，添加以下环境变量：
```
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_GITHUB_CLIENT_SECRET=your_github_client_secret
VITE_APP_URL=https://your-project-name.pages.dev
```

### 4. 部署步骤
1. 推送代码到GitHub
2. 在Cloudflare Pages中连接GitHub仓库
3. 配置构建设置
4. 点击"Deploy site"

### 5. 故障排除
如果遇到MIME类型错误：
1. 确保`_headers`文件正确配置
2. 检查构建输出是否包含正确的文件
3. 清除Cloudflare缓存
4. 重新部署

## 本地测试
```bash
npm install
npm run build
npm run preview
```

访问 `http://localhost:4173` 查看构建结果。 