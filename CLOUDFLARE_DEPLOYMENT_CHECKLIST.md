# Cloudflare Pages 部署检查清单

## 环境变量配置

确保在Cloudflare Pages控制台中设置了以下环境变量：

### 必需变量
- `VITE_REPO_OWNER`: 您的GitHub用户名
- `VITE_REPO_NAME`: 您的笔记仓库名称  
- `VITE_ADMIN_PASSWORD`: 管理员密码

### 可选变量
- `VITE_GITHUB_TOKEN`: GitHub Personal Access Token（用于访问私有仓库）

## 构建配置

- **构建命令**: `npm run build`
- **输出目录**: `dist`
- **Node.js 版本**: 18 或更高

## 部署前检查

### 1. 环境变量检查
```bash
# 在本地测试环境变量是否正确
npm run build
```

### 2. GitHub仓库检查
- 确保仓库存在且可访问
- 确保仓库中有 `notes` 目录
- 确保 `notes` 目录中有 `.md` 文件

### 3. GitHub Token检查
- 确保Token具有 `repo` 权限
- 确保Token未过期
- 确保Token对目标仓库有访问权限

## 部署后调试

### 1. 浏览器控制台检查
打开浏览器开发者工具，查看控制台输出：
- 环境变量是否正确加载
- GitHub API请求是否成功
- 是否有CORS错误

### 2. 网络请求检查
在开发者工具的Network标签中：
- 检查GitHub API请求的状态码
- 检查请求头是否正确
- 检查响应内容

### 3. 常见错误及解决方案

#### 错误1: 环境变量未加载
**症状**: 控制台显示环境变量为"未设置"
**解决方案**: 
- 检查Cloudflare Pages环境变量配置
- 重新部署应用
- 清除浏览器缓存

#### 错误2: GitHub API 401错误
**症状**: API请求返回401 Unauthorized
**解决方案**:
- 检查GitHub Token是否有效
- 确认Token具有正确权限
- 检查Token是否过期

#### 错误3: GitHub API 404错误
**症状**: API请求返回404 Not Found
**解决方案**:
- 检查仓库名称是否正确
- 确认仓库存在且可访问
- 检查notes目录是否存在

#### 错误4: CORS错误
**症状**: 浏览器控制台显示CORS错误
**解决方案**:
- 检查_headers文件配置
- 确认Content-Security-Policy设置正确
- 检查wrangler.toml配置

## 调试工具

应用内置了调试工具，在Cloudflare Pages环境中会自动运行：

1. 打开浏览器开发者工具
2. 查看控制台输出
3. 查找"=== 环境调试信息 ===" 和 "=== 网络连接测试 ===" 部分

## 手动调试

如果自动调试不够详细，可以手动调用调试函数：

```javascript
// 在浏览器控制台中运行
import { debugEnvironment, debugGitHubAPI } from './src/utils/debugUtils'

// 运行环境调试
debugEnvironment()

// 运行GitHub API调试
debugGitHubAPI('your-username', 'your-repo', 'your-token')
```

## 联系支持

如果问题仍然存在，请提供以下信息：

1. 浏览器控制台的完整错误信息
2. 网络请求的详细信息
3. 环境变量配置截图（隐藏敏感信息）
4. GitHub仓库的访问权限设置 