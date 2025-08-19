# SparkLog 部署指南

## 🚀 快速部署

本指南将帮助您快速部署 SparkLog 到 Cloudflare Pages，并配置 Cloudflare R2 存储和 GitHub Actions 自动编译。

## 📋 前置要求

### 1. 必需服务

- **GitHub 账户**: 用于代码托管和 Actions
- **Cloudflare 账户**: 用于 R2 存储和 Pages 部署
- **Node.js 18+**: 本地开发和构建

### 2. 服务配置

#### A. Cloudflare R2 存储配置

1. **登录 Cloudflare Dashboard**
   - 访问 [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
   - 选择您的账户

2. **创建 R2 存储桶**
   - 进入 "R2 Object Storage" → "Manage R2 API tokens"
   - 点击 "Create R2 API Token"
   - 选择 "Custom token" 权限
   - 配置权限：
     ```
     Object Read: ✅
     Object Write: ✅
     Object Delete: ✅
     Bucket List: ✅
     ```
   - 选择存储桶：`sparklog-notes`（或您喜欢的名称）
   - 点击 "Create API Token"

3. **获取配置信息**
   - **Account ID**: 在 Dashboard 右侧显示
   - **Access Key ID**: 从创建的 API Token 中获取
   - **Secret Access Key**: 从创建的 API Token 中获取
   - **Bucket Name**: 您创建的存储桶名称

#### B. GitHub 个人访问令牌

1. **创建访问令牌**
   - 访问 [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
   - 点击 "Generate new token (classic)"
   - 选择权限：
     ```
     repo (Full control of private repositories)
     workflow (Update GitHub Action workflows)
     ```
   - 生成令牌并保存（格式：`ghp_xxxxxxxx`）

## 🏗️ 部署步骤

### 步骤 1: Fork 项目

1. 访问 [SparkLog GitHub 仓库](https://github.com/linyuxuanlin/sparklog)
2. 点击右上角 "Fork" 按钮
3. 选择您的账户作为目标

### 步骤 2: 配置 Cloudflare Pages

1. **登录 Cloudflare Dashboard**
   - 进入 "Pages" → "Create a project"
   - 选择 "Connect to Git"

2. **连接 Git 仓库**
   - 选择您 Fork 的 SparkLog 仓库
   - 点击 "Begin setup"

3. **配置构建设置**
   ```
   Project name: sparklog (或您喜欢的名称)
   Production branch: main
   Framework preset: None
   Build command: npm run build
   Build output directory: dist
   Root directory: / (留空)
   ```

4. **设置环境变量**
   
   在 "Environment variables" 部分添加以下变量：

   | 变量名 | 说明 | 示例值 |
   |--------|------|--------|
   | `VITE_REPO_OWNER` | GitHub 用户名或组织名 | `your-username` |
   | `VITE_REPO_NAME` | 笔记仓库名称 | `sparklog-notes` |
   | `VITE_GITHUB_TOKEN` | GitHub 个人访问令牌 | `ghp_xxxxxxxx` |
   | `VITE_ADMIN_PASSWORD` | 管理员密码 | `your-secure-password` |
   | `VITE_R2_ACCOUNT_ID` | Cloudflare R2 Account ID | `1234567890abcdef` |
   | `VITE_R2_ACCESS_KEY_ID` | Cloudflare R2 Access Key ID | `abc123def456` |
   | `VITE_R2_SECRET_ACCESS_KEY` | Cloudflare R2 Secret Key | `your-secret-key` |
   | `VITE_R2_BUCKET_NAME` | Cloudflare R2 存储桶名称 | `sparklog-notes` |
   | `VITE_R2_PUBLIC_URL` | R2 公开访问 URL（可选） | `https://notes.example.com` |
   | `VITE_STATIC_BRANCH` | 静态内容分支名称（可选） | `static-content` |

5. **部署项目**
   - 点击 "Save and Deploy"
   - 等待构建完成

### 步骤 3: 配置 GitHub Actions 权限

**重要**: 为了让自动编译功能正常工作，需要配置仓库权限：

1. **进入仓库设置**
   - 访问您 Fork 的仓库
   - 点击 "Settings" 标签

2. **配置 Actions 权限**
   - 左侧菜单选择 "Actions" → "General"
   - 在 "Workflow permissions" 部分选择：
     ```
     ✅ Read and write permissions
     ✅ Allow GitHub Actions to create and approve pull requests
     ```
   - 点击 "Save" 保存设置

3. **配置 R2 Secrets**
   - 左侧菜单选择 "Secrets and variables" → "Actions"
   - 点击 "New repository secret"
   - 添加以下 secrets：
     ```
     R2_ACCOUNT_ID: 您的 R2 Account ID
     R2_ACCESS_KEY_ID: 您的 R2 Access Key ID
     R2_SECRET_ACCESS_KEY: 您的 R2 Secret Key
     R2_BUCKET_NAME: 您的 R2 存储桶名称
     ```

### 步骤 4: 验证部署

1. **访问部署地址**
   - 构建完成后，访问您的 Cloudflare Pages 地址
   - 格式：`https://your-project-name.pages.dev`

2. **输入管理员密码**
   - 在登录页面输入您设置的管理员密码
   - 点击 "登录"

3. **测试功能**
   - 创建一条测试笔记
   - 检查是否显示构建状态
   - 验证笔记是否正确保存

## 🔧 高级配置

### 1. 自定义域名

1. **在 Cloudflare Pages 中配置**
   - 进入项目设置 → "Custom domains"
   - 点击 "Set up a custom domain"
   - 输入您的域名（如：`notes.yourdomain.com`）

2. **DNS 配置**
   - 在您的 DNS 提供商处添加 CNAME 记录
   - 指向：`your-project-name.pages.dev`

### 2. 环境特定配置

您可以为不同环境设置不同的配置：

1. **开发环境**
   ```
   VITE_REPO_OWNER=your-username
   VITE_REPO_NAME=sparklog-dev
   VITE_R2_BUCKET_NAME=sparklog-dev-notes
   ```

2. **生产环境**
   ```
   VITE_REPO_OWNER=your-username
   VITE_REPO_NAME=sparklog-prod
   VITE_R2_BUCKET_NAME=sparklog-prod-notes
   ```

### 3. 安全配置

1. **管理员密码**
   - 使用强密码（至少 12 位）
   - 包含大小写字母、数字和特殊字符
   - 定期更换

2. **GitHub Token 安全**
   - 设置合适的过期时间
   - 只授予必要权限
   - 定期轮换

3. **R2 访问控制**
   - 使用最小权限原则
   - 定期审查访问权限
   - 监控异常访问

## 🚨 故障排除

### 1. 构建失败

**问题**: Cloudflare Pages 构建失败

**解决方案**:
```bash
# 本地测试构建
npm run build

# 检查依赖
npm install

# 检查 Node.js 版本
node --version  # 应该是 18+
```

### 2. R2 连接失败

**问题**: 无法连接到 Cloudflare R2

**检查项**:
- 确认 R2 环境变量正确
- 验证 R2 API Token 权限
- 检查存储桶名称是否正确
- 确认网络连接正常

**调试方法**:
```javascript
// 在浏览器控制台检查环境变量
console.log('R2 Config:', {
  accountId: import.meta.env.VITE_R2_ACCOUNT_ID,
  bucketName: import.meta.env.VITE_R2_BUCKET_NAME,
  // 不要打印 secret key
})
```

### 3. GitHub Actions 权限错误

**问题**: `Permission denied` 或 `403` 错误

**解决方案**:
1. 检查仓库 Actions 权限设置
2. 确认 GitHub Token 有足够权限
3. 验证 R2 Secrets 配置正确

### 4. 静态内容不更新

**问题**: 编辑笔记后内容不更新

**检查项**:
1. 查看 GitHub Actions 是否正常运行
2. 检查 `static-content` 分支是否存在
3. 验证构建脚本是否成功执行
4. 检查浏览器缓存

### 5. 加密功能异常

**问题**: 私密笔记无法正常加密/解密

**检查项**:
1. 确认管理员密码正确
2. 检查浏览器是否支持 Web Crypto API
3. 验证加密数据完整性

## 📊 监控和维护

### 1. 构建状态监控

- 定期检查 GitHub Actions 运行状态
- 监控构建时间和成功率
- 查看构建日志中的错误信息

### 2. 性能监控

- 监控页面加载时间
- 检查缓存命中率
- 观察 R2 存储使用情况

### 3. 安全监控

- 定期检查访问日志
- 监控异常登录尝试
- 更新依赖包版本

### 4. 备份策略

- 定期备份 R2 存储桶数据
- 保存重要的环境变量配置
- 记录部署配置变更

## 🔄 更新和维护

### 1. 代码更新

```bash
# 拉取最新代码
git pull origin main

# 安装依赖
npm install

# 测试构建
npm run build

# 推送到您的仓库
git push origin main
```

### 2. 依赖更新

```bash
# 检查过时依赖
npm outdated

# 更新依赖
npm update

# 更新到最新版本
npm install package-name@latest
```

### 3. 环境变量更新

1. 在 Cloudflare Pages 中更新环境变量
2. 重新部署项目
3. 验证新配置是否生效

## 📚 相关资源

- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [React 官方文档](https://react.dev/)
- [Vite 官方文档](https://vitejs.dev/)

## 🆘 获取帮助

如果您遇到问题：

1. **检查本文档**的故障排除部分
2. **查看 GitHub Issues**中是否有类似问题
3. **提交新的 Issue**描述您的问题
4. **联系维护者**获取技术支持

---

**注意**: 本部署指南基于 SparkLog 的最新架构。如果您使用的是旧版本，请先升级到最新版本。 