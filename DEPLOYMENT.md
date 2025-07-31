# SparkLog 部署指南

## 本地开发

1. 创建 `.env` 文件，填入您的GitHub配置信息：
```bash
# 创建.env文件
touch .env
```

2. 编辑 `.env` 文件，填入您的GitHub配置信息：
```env
# GitHub OAuth应用配置（必需）
VITE_GITHUB_CLIENT_ID=your-github-client-id

# GitHub仓库配置（必需）
VITE_REPO_OWNER=your-github-username
VITE_REPO_NAME=your-notes-repository

# GitHub Access Token（可选，用于访问私有仓库）
VITE_GITHUB_TOKEN=your-github-personal-access-token
```

3. 启动开发服务器：
```bash
npm run dev
```

## Cloudflare Pages 部署

### 1. 构建配置

- **构建命令**: `npm run build`
- **输出目录**: `dist`
- **Node.js 版本**: 18 或更高

### 2. 环境变量配置

在 Cloudflare Pages 控制台中设置以下环境变量：

#### 必需变量
- `VITE_GITHUB_CLIENT_ID`: GitHub OAuth应用的Client ID
- `VITE_REPO_OWNER`: 您的GitHub用户名
- `VITE_REPO_NAME`: 您的笔记仓库名称

#### 可选变量
- `VITE_GITHUB_TOKEN`: GitHub Personal Access Token（用于访问私有仓库）

### 3. 环境变量设置步骤

1. 登录 Cloudflare Dashboard
2. 进入 Pages 项目
3. 点击 "Settings" 标签
4. 在 "Environment variables" 部分添加变量：
   - `VITE_GITHUB_CLIENT_ID` = `your-github-client-id`
   - `VITE_REPO_OWNER` = `your-github-username`
   - `VITE_REPO_NAME` = `your-notes-repository`
   - `VITE_GITHUB_TOKEN` = `your-github-token` (可选)

### 4. 部署文件

确保以下文件存在于项目根目录：
- `wrangler.toml`
- `_headers`
- `_redirects`

### 5. 自定义域名

部署后，您可以将自定义域名指向您的 Cloudflare Pages 应用。

## GitHub OAuth应用配置

### 1. 创建GitHub OAuth应用

1. **访问GitHub开发者设置**
   - 登录GitHub，访问 [GitHub Developer Settings](https://github.com/settings/developers)
   - 点击"OAuth Apps" → "New OAuth App"

2. **填写应用信息**
   ```
   Application name: SparkLog
   Homepage URL: https://your-domain.pages.dev
   Application description: 基于GitHub仓库的静态笔记应用
   Authorization callback URL: https://your-domain.pages.dev/auth/callback
   ```

3. **获取Client ID**
   - 创建完成后，记录下Client ID
   - 将Client ID配置到环境变量`VITE_GITHUB_CLIENT_ID`中

### 2. 仓库配置说明

#### 公开仓库
如果您的笔记仓库是公开的，只需要设置：
- `VITE_GITHUB_CLIENT_ID`
- `VITE_REPO_OWNER`
- `VITE_REPO_NAME`

#### 私有仓库
如果您的笔记仓库是私有的，还需要设置：
- `VITE_GITHUB_TOKEN` (具有 repo 权限的 Personal Access Token)

## 故障排除

### 常见问题

1. **GitHub登录失败**
   - 确保`VITE_GITHUB_CLIENT_ID`已正确配置
   - 检查GitHub OAuth应用的回调URL设置
   - 确认OAuth应用已正确创建

2. **环境变量未生效**
   - 确保变量名以 `VITE_` 开头
   - 重新部署应用

3. **仓库访问失败**
   - 检查仓库名称是否正确
   - 确认仓库权限设置

4. **私有仓库访问失败**
   - 确认 Personal Access Token 具有 repo 权限
   - 检查 Token 是否有效

### 调试模式

在开发环境中，可以在浏览器控制台查看环境变量：
```javascript
console.log('Repo Owner:', import.meta.env.VITE_REPO_OWNER)
console.log('Repo Name:', import.meta.env.VITE_REPO_NAME)
``` 