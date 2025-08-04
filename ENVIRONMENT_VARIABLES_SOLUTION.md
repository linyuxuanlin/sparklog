# 环境变量问题解决方案

## 问题描述
网页后台提示错误：
```
Uncaught (in promise) Error: Website default repository not configured, please contact administrator or connect GitHub to view notes
```

## 问题原因
这个错误表明应用无法获取到默认仓库配置，主要原因可能是：

1. **环境变量未正确设置**
2. **环境变量名称不匹配**
3. **Cloudflare Pages环境变量未生效**
4. **构建时环境变量未注入**

## 解决方案

### 1. 检查Cloudflare Pages环境变量设置

在Cloudflare Pages控制台中，确保设置了以下环境变量：

#### 必需变量：
```
VITE_REPO_OWNER=linyuxuanlin
VITE_REPO_NAME=sparklog-notes
VITE_ADMIN_PASSWORD=your-admin-password
```

#### 可选变量：
```
VITE_GITHUB_TOKEN=your-github-token
```

### 2. 环境变量设置步骤

1. **登录Cloudflare Dashboard**
2. **进入Pages项目**
3. **点击 "Settings" 标签**
4. **在 "Environment variables" 部分添加变量**
5. **确保设置为 "Production" 和 "Preview" 环境**

### 3. 调试方法

#### 方法1: 使用浏览器开发者工具
1. 打开浏览器开发者工具 (F12)
2. 查看控制台输出
3. 查找 "=== Environment Variables Check ===" 部分
4. 检查每个环境变量的状态

#### 方法2: 手动调试
在浏览器控制台中运行：
```javascript
// 检查所有环境变量
console.log('Environment variables:', import.meta.env)

// 检查特定变量
console.log('VITE_REPO_OWNER:', import.meta.env.VITE_REPO_OWNER)
console.log('VITE_REPO_NAME:', import.meta.env.VITE_REPO_NAME)
console.log('VITE_GITHUB_TOKEN:', import.meta.env.VITE_GITHUB_TOKEN ? '已设置' : '未设置')
console.log('VITE_ADMIN_PASSWORD:', import.meta.env.VITE_ADMIN_PASSWORD ? '已设置' : '未设置')
```

### 4. 常见问题及解决方案

#### 问题1: 环境变量显示为 "undefined"
**解决方案**:
- 检查变量名是否以 `VITE_` 开头
- 重新部署应用
- 清除浏览器缓存

#### 问题2: 环境变量已设置但仍报错
**解决方案**:
- 检查变量值是否正确
- 确认变量设置为Production和Preview环境
- 等待几分钟让缓存过期

#### 问题3: 本地正常但Cloudflare Pages报错
**解决方案**:
- 检查Cloudflare Pages的环境变量设置
- 确认构建配置正确
- 查看部署日志

### 5. 临时解决方案

如果环境变量问题无法立即解决，应用现在会使用默认配置：

```javascript
// 默认配置
owner: 'linyuxuanlin'
repo: 'sparklog-notes'
```

这意味着应用会尝试访问 `linyuxuanlin/sparklog-notes` 仓库。

### 6. 验证步骤

1. **重新部署应用**
2. **打开浏览器开发者工具**
3. **查看控制台输出**
4. **检查是否有调试信息**
5. **验证笔记是否能正常加载**

### 7. 调试信息说明

应用会在控制台显示以下调试信息：

- **环境变量检查**: 显示所有环境变量的状态
- **有效配置**: 显示实际使用的配置
- **GitHub API测试**: 测试API连接是否正常
- **网络连接测试**: 检查基本网络连接

### 8. 联系支持

如果问题仍然存在，请提供以下信息：

1. **浏览器控制台的完整错误信息**
2. **环境变量检查的输出**
3. **Cloudflare Pages环境变量配置截图** (隐藏敏感信息)
4. **部署日志** (如果有错误)

## 预防措施

1. **使用正确的环境变量名称** (以 `VITE_` 开头)
2. **定期检查Token有效性**
3. **在本地测试环境变量**
4. **使用版本控制管理环境变量模板**

## 更新日志

- **2025-08-04**: 添加了默认配置支持
- **2025-08-04**: 增强了环境变量检测
- **2025-08-04**: 添加了详细的调试工具
- **2025-08-04**: 修复了构建错误

现在应用应该能够正常工作，即使环境变量未完全配置。 