# 开发指南

本文档提供SparkLog的开发环境搭建和贡献指南。

## 开发环境搭建

### 环境要求

- **Node.js**: 18.0.0 或更高版本
- **npm**: 8.0.0 或更高版本
- **Git**: 最新版本

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/linyuxuanlin/sparklog.git
   cd sparklog
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   ```

4. **编辑环境变量**
   在 `.env` 文件中配置以下变量：
   ```env
   VITE_REPO_OWNER=your-github-username
   VITE_REPO_NAME=your-notes-repository
   VITE_GITHUB_TOKEN=your-github-token
   VITE_ADMIN_PASSWORD=your-admin-password
   ```

5. **启动开发服务器**
   ```bash
   npm run dev
   ```

### 开发工具配置

#### VS Code 推荐扩展

- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **TypeScript Importer**: TypeScript导入助手
- **Tailwind CSS IntelliSense**: Tailwind CSS智能提示
- **GitLens**: Git增强功能

#### 代码规范

项目使用ESLint和Prettier进行代码规范检查：

```bash
# 检查代码规范
npm run lint

# 自动修复代码规范问题
npm run lint:fix

# 格式化代码
npm run format
```

## 项目结构

```
sparklog/
├── src/
│   ├── components/          # UI组件
│   │   ├── Header.tsx      # 页面头部
│   │   ├── Layout.tsx      # 布局组件
│   │   ├── Sidebar.tsx     # 侧边栏
│   │   ├── NoteCard.tsx    # 笔记卡片
│   │   ├── NoteDetailModal.tsx # 笔记详情弹窗
│   │   ├── MarkdownRenderer.tsx # Markdown渲染器
│   │   └── SparkLogLogo.tsx # Logo组件
│   ├── pages/              # 页面组件
│   │   ├── NotesPage.tsx   # 笔记列表页面
│   │   ├── NoteEditPage.tsx # 笔记编辑页面
│   │   └── SettingsPage.tsx # 设置页面
│   ├── hooks/              # 自定义Hooks
│   │   ├── useGitHub.ts    # GitHub认证Hook
│   │   ├── useNotes.ts     # 笔记管理Hook
│   │   └── useTheme.ts     # 主题Hook
│   ├── config/             # 配置文件
│   │   ├── env.ts          # 环境变量配置
│   │   └── defaultRepo.ts  # 默认仓库配置
│   ├── utils/              # 工具函数
│   │   └── noteUtils.ts    # 笔记工具函数
│   ├── types/              # TypeScript类型
│   │   └── Note.ts         # 笔记类型定义
│   ├── styles/             # 样式文件
│   │   └── index.css       # 全局样式
│   ├── App.tsx             # 应用主组件
│   └── main.tsx            # 应用入口
├── public/                 # 静态资源
├── docs/                   # 文档
├── dist/                   # 构建输出目录
├── .env.example           # 环境变量示例
├── package.json           # 项目配置
├── vite.config.ts         # Vite配置
├── tailwind.config.js     # Tailwind配置
├── tsconfig.json          # TypeScript配置
└── README.md              # 项目说明
```

## 开发工作流

### 1. 功能开发

1. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **开发功能**
   - 编写代码
   - 添加测试（可选）
   - 更新文档

3. **代码检查**
   ```bash
   npm run lint
   npm run type-check
   ```

4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **推送分支**
   ```bash
   git push origin feature/your-feature-name
   ```

### 2. 测试

#### 单元测试

```bash
# 运行所有测试
npm test

# 运行测试并监听文件变化
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage
```

#### 集成测试

```bash
# 运行集成测试
npm run test:integration
```

### 3. 构建和部署

#### 本地构建

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

#### 部署测试

```bash
# 部署到测试环境
npm run deploy:test

# 部署到生产环境
npm run deploy:prod
```

## 贡献指南

### 贡献类型

1. **Bug修复**: 修复现有功能的问题
2. **功能增强**: 改进现有功能
3. **新功能**: 添加新的功能
4. **文档改进**: 更新或改进文档
5. **性能优化**: 提升应用性能
6. **代码重构**: 改进代码结构

### 贡献流程

1. **Fork项目**
   - 在GitHub上Fork项目到你的账户

2. **克隆Fork**
   ```bash
   git clone https://github.com/your-username/sparklog.git
   cd sparklog
   ```

3. **设置上游仓库**
   ```bash
   git remote add upstream https://github.com/linyuxuanlin/sparklog.git
   ```

4. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **开发功能**
   - 编写代码
   - 添加测试
   - 更新文档

6. **代码检查**
   ```bash
   npm run lint
   npm run type-check
   npm test
   ```

7. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

8. **推送分支**
   ```bash
   git push origin feature/your-feature-name
   ```

9. **创建Pull Request**
   - 在GitHub上创建Pull Request
   - 填写详细的描述
   - 等待代码审查

### 代码规范

#### 提交信息规范

使用[Conventional Commits](https://www.conventionalcommits.org/)规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

类型说明：
- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

示例：
```
feat: add image upload functionality
fix: resolve authentication issue
docs: update deployment guide
```

#### 代码风格

- 使用TypeScript进行类型检查
- 遵循ESLint规则
- 使用Prettier格式化代码
- 编写清晰的注释
- 使用有意义的变量名

#### 组件开发规范

1. **组件结构**
   ```typescript
   import React from 'react'
   import { ComponentProps } from './types'
   
   interface Props {
     // 组件属性定义
   }
   
   export const Component: React.FC<Props> = ({ ...props }) => {
     // 组件逻辑
     return (
       // JSX
     )
   }
   ```

2. **Hook开发规范**
   ```typescript
   import { useState, useEffect } from 'react'
   
   export const useCustomHook = () => {
     // Hook逻辑
     return {
       // 返回值
     }
   }
   ```

### 测试规范

#### 单元测试

```typescript
import { render, screen } from '@testing-library/react'
import { Component } from './Component'

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

#### 集成测试

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Component } from './Component'

describe('Component Integration', () => {
  it('should handle user interaction', async () => {
    render(<Component />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(screen.getByText('Clicked')).toBeInTheDocument()
  })
})
```

## 调试技巧

### 1. 浏览器调试

- 使用Chrome DevTools
- 查看Console错误信息
- 检查Network请求
- 使用React Developer Tools

### 2. 环境变量调试

```javascript
// 在浏览器控制台中检查环境变量
console.log('REPO_OWNER:', import.meta.env.VITE_REPO_OWNER)
console.log('REPO_NAME:', import.meta.env.VITE_REPO_NAME)
```

### 3. API调试

```javascript
// 检查GitHub API请求
const response = await fetch('https://api.github.com/repos/owner/repo')
console.log('API Response:', response)
```

### 4. 性能调试

- 使用React Profiler
- 检查Bundle大小
- 监控内存使用

## 常见问题

### 1. 依赖安装失败

**解决方案**:
```bash
# 清除缓存
npm cache clean --force

# 删除node_modules
rm -rf node_modules

# 重新安装
npm install
```

### 2. TypeScript错误

**解决方案**:
```bash
# 检查类型错误
npm run type-check

# 自动修复
npm run type-check -- --fix
```

### 3. 构建失败

**解决方案**:
```bash
# 清理构建缓存
npm run clean

# 重新构建
npm run build
```

### 4. 测试失败

**解决方案**:
```bash
# 运行特定测试
npm test -- --grep "test name"

# 更新快照
npm test -- --updateSnapshot
```

## 发布流程

### 1. 版本管理

使用语义化版本控制：

```bash
# 补丁版本 (1.0.0 -> 1.0.1)
npm version patch

# 次要版本 (1.0.0 -> 1.1.0)
npm version minor

# 主要版本 (1.0.0 -> 2.0.0)
npm version major
```

### 2. 发布步骤

1. **更新版本号**
   ```bash
   npm version patch
   ```

2. **构建项目**
   ```bash
   npm run build
   ```

3. **运行测试**
   ```bash
   npm test
   ```

4. **创建Git标签**
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

5. **部署到生产环境**
   ```bash
   npm run deploy:prod
   ```

### 3. 发布检查清单

- [ ] 所有测试通过
- [ ] 代码规范检查通过
- [ ] 文档已更新
- [ ] 版本号已更新
- [ ] 构建成功
- [ ] 部署成功

## 社区贡献

### 1. 问题报告

- 使用GitHub Issues
- 提供详细的复现步骤
- 包含环境信息
- 添加错误日志

### 2. 功能建议

- 详细描述功能需求
- 提供使用场景
- 考虑实现复杂度
- 讨论替代方案

### 3. 代码审查

- 仔细审查代码
- 提供建设性反馈
- 确保代码质量
- 验证功能正确性

## 学习资源

### 1. 技术栈

- [React官方文档](https://react.dev/)
- [TypeScript官方文档](https://www.typescriptlang.org/)
- [Tailwind CSS文档](https://tailwindcss.com/)
- [Vite官方文档](https://vitejs.dev/)

### 2. 开发工具

- [ESLint文档](https://eslint.org/)
- [Prettier文档](https://prettier.io/)
- [Vitest文档](https://vitest.dev/)

### 3. 最佳实践

- [React最佳实践](https://react.dev/learn)
- [TypeScript最佳实践](https://www.typescriptlang.org/docs/)
- [Git工作流](https://git-scm.com/book/en/v2) 