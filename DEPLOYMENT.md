# Cloudflare Pages 部署指南

## 🚀 快速部署

### 1. 环境变量配置

在 Cloudflare Pages 中，你需要在项目设置中配置以下环境变量：

#### 必需的环境变量：

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `VITE_R2_ACCOUNT_ID` | Cloudflare R2 账户 ID | `264358695bf65a3cb883dfd59b42fe7f` |
| `VITE_R2_ACCESS_KEY_ID` | R2 访问密钥 ID | `your-access-key-id` |
| `VITE_R2_SECRET_ACCESS_KEY` | R2 秘密访问密钥 | `your-secret-access-key` |
| `VITE_R2_BUCKET_NAME` | R2 存储桶名称 | `sparklog-notes` |

#### 可选的环境变量：

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 环境模式 | `production` |
| `BUILD_VERSION` | 构建版本 | `1.0.0` |

### 2. 配置步骤

1. **登录 Cloudflare Dashboard**
   - 访问 [https://dash.cloudflare.com](https://dash.cloudflare.com)
   - 使用你的 Cloudflare 账户登录

2. **进入 Pages 项目**
   - 在左侧菜单中点击 "Pages"
   - 找到并点击你的 `sparklog` 项目

3. **设置环境变量**
   - 点击 "Settings" 标签页
   - 在左侧菜单中点击 "Environment variables"
   - 点击 "Add variable" 按钮
   - 为每个必需的环境变量添加键值对

4. **环境变量设置示例**
   ```
   变量名: VITE_R2_ACCOUNT_ID
   值: 264358695bf65a3cb883dfd59b42fe7f
   环境: Production
   
   变量名: VITE_R2_ACCESS_KEY_ID
   值: your-access-key-id
   环境: Production
   
   变量名: VITE_R2_SECRET_ACCESS_KEY
   值: your-secret-access-key
   环境: Production
   
   变量名: VITE_R2_BUCKET_NAME
   值: sparklog-notes
   环境: Production
   ```

5. **保存并重新部署**
   - 点击 "Save and deploy" 按钮
   - 等待构建完成

### 3. 构建配置

确保你的 `wrangler.toml` 文件包含正确的构建命令：

```toml
[build]
command = "npm run build:pages"
cwd = "."

[pages]
pages_build_output_dir = "dist"
```

### 4. 验证部署

部署完成后，你可以通过以下方式验证：

1. **检查构建日志**
   - 在 Pages 项目的 "Deployments" 标签页中查看最新部署
   - 确保构建成功，没有错误

2. **验证静态内容**
   - 访问 `https://your-domain.com/public-notes.json`
   - 应该返回 JSON 格式的笔记数据，而不是 HTML

3. **检查 CORS 头**
   - 使用浏览器开发者工具检查网络请求
   - 确保 `Access-Control-Allow-Origin: *` 头存在

## 🔧 故障排除

### 常见问题

#### 1. 构建失败

**症状：** 构建过程中出现错误，无法完成部署

**可能原因：**
- 环境变量未正确设置
- 构建脚本语法错误
- 依赖包缺失

**解决方案：**
- 检查所有必需的环境变量是否已设置
- 在本地运行 `npm run build:pages` 测试构建
- 查看构建日志中的具体错误信息

#### 2. 网站无法加载笔记

**症状：** 网站正常显示，但没有笔记内容

**可能原因：**
- R2 环境变量未设置
- R2 存储桶权限问题
- 网络连接问题

**解决方案：**
- 确认所有 R2 环境变量已正确设置
- 检查 R2 存储桶的访问权限
- 验证 R2 存储桶中是否有笔记文件

#### 3. CORS 错误

**症状：** 浏览器控制台显示 CORS 相关错误

**可能原因：**
- `_headers` 文件未正确配置
- Cloudflare Pages 配置问题

**解决方案：**
- 确保 `public/_headers` 文件包含正确的 CORS 配置
- 检查 Cloudflare Pages 的 "Functions" 设置

### 调试工具

#### 1. 本地测试

```bash
# 检查环境变量
npm run debug-build

# 测试 Cloudflare Pages 环境
npm run test-cloudflare-env

# 完整构建测试
npm run build:pages
```

#### 2. 部署验证

```bash
# 验证部署状态
npm run verify-deployment https://your-domain.com
```

## 📋 部署检查清单

在部署之前，请确认以下项目：

- [ ] 所有必需的环境变量已设置
- [ ] 本地构建测试通过
- [ ] Git 仓库包含最新代码
- [ ] `wrangler.toml` 配置正确
- [ ] R2 存储桶权限配置正确
- [ ] 域名 DNS 设置正确

## 🆘 获取帮助

如果遇到问题：

1. **查看构建日志** - 在 Cloudflare Pages 控制台中查看详细错误信息
2. **本地测试** - 使用提供的调试脚本在本地重现问题
3. **检查配置** - 确认环境变量和配置文件设置正确
4. **联系支持** - 如果问题持续存在，请联系 Cloudflare 支持

## 📚 相关资源

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [项目 GitHub 仓库](https://github.com/linyuxuanlin/sparklog)
