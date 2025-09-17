# 部署指南

本文档提供SparkLog的详细部署说明和故障排除指南。

## 认证机制

### 管理员密码认证

1. **设置管理员密码**
   - 在环境变量中设置 `VITE_ADMIN_PASSWORD`
   - 本地开发：在 `.env` 文件中设置
   - 生产环境：在Cloudflare Pages环境变量中设置

2. **登录流程**
   - 访问应用后，点击"连接GitHub"按钮
   - 输入管理员密码进行身份验证
   - 验证成功后即可管理笔记

3. **权限说明**
   - **未认证用户**: 只能查看公开笔记
   - **已认证管理员**: 可以创建、编辑、删除所有笔记
   - **Token存储**: 使用localStorage安全存储认证状态

## 仓库配置

### GitHub仓库要求

1. **笔记数据仓库**（私有）
   - 用途：存放用户的笔记内容和附件
   - 仓库名：`sparklog-notes`、`my-notes`等
   - 权限：私有仓库，只有用户自己可以访问
   - 内容：笔记文件、图片、附件、元数据等

2. **仓库结构**
   应用会自动在仓库中创建以下结构：
   ```
   your-notes-repo/
   ├── notes/
   │   ├── public/          # 公开笔记
   │   └── private/         # 私密笔记
   ├── assets/
   │   ├── images/          # 图片文件
   │   └── attachments/     # 其他附件
   ├── metadata/
   │   ├── tags.json        # 标签数据
   │   ├── settings.json    # 应用设置
   │   └── index.json       # 笔记索引
   └── README.md            # 仓库说明
   ```

## 首次使用流程

### 1. 配置环境变量

- 设置 `VITE_REPO_OWNER`（GitHub 用户名）
- 设置 `VITE_REPO_DEPLOY`（部署仓库名称）
- 设置 `VITE_REPO_NOTES`（笔记仓库名称）
- 设置 `VITE_GITHUB_TOKEN`（GitHub 个人访问令牌）
- 设置 `VITE_ADMIN_PASSWORD`（管理员密码）

> 提示：部署仓库与笔记仓库的 GitHub 地址会由 `VITE_REPO_OWNER` 与对应的仓库名称自动组合。

### 2. 创建笔记仓库

- 在GitHub上创建一个新的私有仓库
- 仓库名称建议：`sparklog-notes`、`my-notes`、`personal-notes`等
- **重要**：确保仓库为私有状态，保护你的笔记数据

### 3. 获取GitHub Token

- 登录GitHub，进入Settings → Developer settings → Personal access tokens → Tokens (classic)
- 点击"Generate new token (classic)"
- 选择权限：`repo` (完整的仓库访问权限)
- 生成并复制token

### 4. 访问应用

- 打开部署好的SparkLog应用
- 点击"连接GitHub"按钮
- 输入管理员密码进行身份验证

### 5. 开始使用

- 验证成功后即可创建和管理笔记
- 应用会自动在仓库中创建必要的目录结构

## 故障排除

### 常见问题

#### 1. 认证失败

**症状**: 输入管理员密码后仍然无法登录

**解决方案**:
- 检查管理员密码是否正确
- 确认环境变量 `VITE_ADMIN_PASSWORD` 已正确设置
- 检查浏览器控制台是否有错误信息
- 清除浏览器缓存和localStorage后重试

#### 2. 仓库访问失败

**症状**: 无法读取或写入GitHub仓库

**解决方案**:
- 确认GitHub Token有仓库的读写权限
- 检查仓库是否为私有仓库
- 确认Token未过期
- 检查Token权限是否包含`repo`权限
- 确认仓库名称和所有者用户名正确

#### 3. 部署失败

**症状**: Cloudflare Pages构建失败

**解决方案**:
- 检查构建是否成功：`npm run build`
- 确认dist目录存在且包含文件
- 检查Cloudflare Pages的构建配置
- 确认Node.js版本为18或更高
- 检查package.json中的构建脚本

#### 4. 环境变量问题

**症状**: 应用无法正确读取配置

**解决方案**:
- 确认所有必需的环境变量都已设置
- 检查变量名是否正确（以VITE_开头）
- 重新部署应用以应用新的环境变量
- 确认环境变量在Cloudflare Pages中正确配置

#### 5. 图片上传失败

**症状**: 无法上传图片到仓库

**解决方案**:
- 检查文件大小是否超过GitHub API限制（100MB）
- 确认图片格式支持（JPG、PNG、GIF、WebP）
- 检查网络连接是否稳定
- 确认Token有足够的权限

#### 6. 同步问题

**症状**: 笔记更改未同步到GitHub

**解决方案**:
- 检查网络连接
- 确认GitHub API服务状态
- 手动触发同步操作
- 检查浏览器控制台错误信息

### 调试技巧

#### 1. 浏览器开发者工具

- 打开F12开发者工具
- 查看Console标签页的错误信息
- 检查Network标签页的API请求
- 查看Application标签页的localStorage

#### 2. 环境变量检查

```javascript
// 在浏览器控制台中检查环境变量
console.log('REPO_OWNER:', import.meta.env.VITE_REPO_OWNER)
console.log('REPO_DEPLOY:', import.meta.env.VITE_REPO_DEPLOY)
console.log('REPO_NOTES:', import.meta.env.VITE_REPO_NOTES || import.meta.env.VITE_REPO_NAME)
console.log('ADMIN_PASSWORD:', import.meta.env.VITE_ADMIN_PASSWORD ? '已设置' : '未设置')
```

#### 3. API请求检查

- 在Network标签页中查看GitHub API请求
- 检查请求状态码（200为成功）
- 查看请求头和响应内容

### 性能优化建议

#### 1. 缓存策略

- 启用浏览器缓存
- 使用Service Worker进行离线缓存
- 实现API请求缓存机制

#### 2. 图片优化

- 压缩图片文件大小
- 使用WebP格式
- 实现懒加载

#### 3. 代码分割

- 使用动态导入减少初始包大小
- 实现路由级别的代码分割

### 安全建议

#### 1. Token安全

- 定期更换GitHub Token
- 使用最小权限原则
- 不要在代码中硬编码Token

#### 2. 密码安全

- 使用强密码
- 定期更换管理员密码
- 不要在公共场合暴露密码

#### 3. 仓库安全

- 确保笔记仓库为私有
- 定期备份重要数据
- 监控仓库访问日志

## 监控和维护

### 1. 应用监控

- 监控应用可用性
- 检查API调用频率
- 监控错误率

### 2. 数据备份

- 定期备份GitHub仓库
- 导出重要笔记
- 保存配置文件

### 3. 更新维护

- 定期更新依赖包
- 检查安全漏洞
- 更新部署配置 