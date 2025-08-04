# Cloudflare Pages 环境变量问题解决指南

## 问题描述
在Cloudflare Pages上部署的应用提示"环境变量未配置"，但实际已在Cloudflare控制台中正确配置了环境变量。

## 可能的原因和解决方案

### 1. 环境变量名称问题

**问题**: Cloudflare Pages可能对环境变量名称有特殊要求
**解决方案**: 确保使用正确的环境变量名称

#### 必需的环境变量名称：
```
VITE_REPO_OWNER=your-github-username
VITE_REPO_NAME=your-notes-repository
VITE_GITHUB_TOKEN=your-github-token
VITE_ADMIN_PASSWORD=your-admin-password
```

**注意**: 必须以 `VITE_` 开头，这是Vite的要求。

### 2. 环境变量作用域问题

**问题**: 环境变量可能没有正确应用到生产环境
**解决方案**: 在Cloudflare Pages控制台中检查环境变量作用域

1. 登录Cloudflare Dashboard
2. 进入Pages项目
3. 点击 "Settings" → "Environment variables"
4. 确保环境变量设置为 "Production" 和 "Preview"

### 3. 构建时环境变量问题

**问题**: 环境变量在构建时没有正确注入
**解决方案**: 检查构建配置

#### 在Cloudflare Pages控制台中：
- **构建命令**: `npm run build`
- **输出目录**: `dist`
- **Node.js 版本**: 18 或更高

### 4. 缓存问题

**问题**: 浏览器或Cloudflare缓存了旧的环境变量
**解决方案**: 清除缓存

1. **清除浏览器缓存**:
   - 按 `Ctrl+Shift+R` (Windows) 或 `Cmd+Shift+R` (Mac)
   - 或者在开发者工具中右键刷新按钮，选择"清空缓存并硬性重新加载"

2. **清除Cloudflare缓存**:
   - 在Cloudflare Pages控制台中重新部署
   - 或者等待几分钟让缓存自动过期

### 5. 环境变量格式问题

**问题**: 环境变量值可能包含特殊字符
**解决方案**: 检查环境变量格式

#### 检查清单：
- ✅ 没有多余的空格
- ✅ 没有引号包围（除非值本身包含空格）
- ✅ 特殊字符已正确转义
- ✅ 没有换行符

### 6. 调试步骤

#### 步骤1: 检查环境变量是否正确设置
1. 打开浏览器开发者工具 (F12)
2. 查看控制台输出
3. 查找 "=== 详细环境变量检查 ===" 部分
4. 检查每个环境变量的状态

#### 步骤2: 手动调试
在浏览器控制台中运行：
```javascript
// 检查所有环境变量
console.log('所有环境变量:', import.meta.env)

// 检查特定变量
console.log('VITE_REPO_OWNER:', import.meta.env.VITE_REPO_OWNER)
console.log('VITE_REPO_NAME:', import.meta.env.VITE_REPO_NAME)
console.log('VITE_GITHUB_TOKEN:', import.meta.env.VITE_GITHUB_TOKEN ? '已设置' : '未设置')
console.log('VITE_ADMIN_PASSWORD:', import.meta.env.VITE_ADMIN_PASSWORD ? '已设置' : '未设置')
```

#### 步骤3: 重新部署
1. 在Cloudflare Pages控制台中触发重新部署
2. 等待部署完成
3. 清除浏览器缓存
4. 重新访问网站

### 7. 常见错误和解决方案

#### 错误1: "环境变量未配置"
**症状**: 应用显示环境变量未配置错误
**解决方案**:
1. 检查Cloudflare Pages环境变量设置
2. 确保变量名以 `VITE_` 开头
3. 重新部署应用

#### 错误2: "GitHub API错误"
**症状**: 环境变量已配置但GitHub API调用失败
**解决方案**:
1. 检查GitHub Token是否有效
2. 确认Token具有正确权限
3. 检查仓库名称是否正确

#### 错误3: "CORS错误"
**症状**: 浏览器控制台显示CORS错误
**解决方案**:
1. 检查_headers文件配置
2. 确认Content-Security-Policy设置
3. 检查网络请求是否被阻止

### 8. 验证环境变量

#### 方法1: 使用调试工具
应用内置了调试工具，会自动显示环境变量状态：
1. 打开浏览器开发者工具
2. 查看控制台输出
3. 查找调试信息

#### 方法2: 手动验证
在浏览器控制台中运行：
```javascript
// 导入调试函数
import { debugEnvironment } from './src/utils/debugUtils'

// 运行调试
debugEnvironment()
```

### 9. 联系支持

如果问题仍然存在，请提供以下信息：

1. **浏览器控制台截图** (包含调试信息)
2. **Cloudflare Pages环境变量配置截图** (隐藏敏感信息)
3. **部署日志** (如果有错误)
4. **网络请求详情** (开发者工具Network标签)

### 10. 预防措施

1. **使用正确的环境变量名称**
2. **定期检查Token有效性**
3. **在本地测试环境变量**
4. **使用版本控制管理环境变量模板**

## 快速修复清单

- [ ] 检查环境变量名称是否以 `VITE_` 开头
- [ ] 确认环境变量在Cloudflare Pages控制台中正确设置
- [ ] 重新部署应用
- [ ] 清除浏览器缓存
- [ ] 检查浏览器控制台调试信息
- [ ] 验证GitHub Token有效性 