# SparkLog 妙想

一个基于GitHub仓库的静态笔记应用，灵感来源于Memos，但采用完全不同的架构设计。

## 🌟 项目特点

- **纯静态部署**: 可托管在Cloudflare Pages、GitHub Pages等静态托管平台
- **GitHub仓库存储**: 所有笔记数据存储在私有GitHub仓库中
- **实时编辑**: 在网页上直接创建、编辑笔记
- **权限控制**: 支持笔记公开/私密设置
- **多媒体支持**: 支持图片上传，自动创建assets目录
- **现代化UI**: 参考Memos的简洁美观界面设计

## 🏗️ 技术架构

### 前端技术栈
- **框架**: React 18 + TypeScript
- **样式**: Tailwind CSS + Headless UI
- **状态管理**: Zustand
- **路由**: React Router
- **编辑器**: Monaco Editor / CodeMirror
- **Markdown渲染**: React Markdown
- **图标**: Lucide React

### 核心功能模块
1. **GitHub集成模块**
   - GitHub OAuth认证
   - GitHub API调用
   - 仓库内容读写

2. **笔记管理模块**
   - 笔记CRUD操作
   - Markdown编辑器
   - 标签管理
   - 搜索功能

3. **文件管理模块**
   - 图片上传
   - 文件存储
   - 资源管理

4. **权限控制模块**
   - 公开/私密设置
   - 访问控制

5. **UI组件模块**
   - 响应式设计
   - 主题切换
   - 组件库

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm/yarn/pnpm
- GitHub账号

### 本地开发
```bash
# 克隆项目
git clone https://github.com/your-username/sparklog.git
cd sparklog

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 部署
```bash
# 构建生产版本
npm run build

# 部署到Cloudflare Pages
# 将dist目录内容上传到Cloudflare Pages
```

## 📖 使用指南

### 首次使用
1. 访问SparkLog应用
2. 点击"连接GitHub"按钮
3. 授权应用访问你的GitHub账号
4. 选择或创建用于存储笔记的仓库
5. 开始创建你的第一篇笔记！

### 创建笔记
1. 点击"新建笔记"按钮
2. 使用Markdown编辑器编写内容
3. 设置笔记为公开或私密
4. 添加标签（可选）
5. 点击保存，笔记将自动同步到GitHub仓库

### 上传图片
1. 在编辑器中点击图片上传按钮
2. 选择本地图片文件
3. 图片将自动上传到仓库的assets目录
4. 在笔记中插入图片链接

## 🔧 配置说明

### GitHub OAuth配置
需要在GitHub中创建OAuth应用：
- Authorization callback URL: `https://your-domain.com/auth/callback`
- 权限范围: `repo` (私有仓库访问)

### 环境变量
```env
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_GITHUB_CLIENT_SECRET=your_github_client_secret
VITE_APP_URL=https://your-domain.com
```

## 📁 项目结构

```
sparklog/
├── src/
│   ├── components/          # UI组件
│   ├── pages/              # 页面组件
│   ├── hooks/              # 自定义Hooks
│   ├── services/           # API服务
│   ├── stores/             # 状态管理
│   ├── types/              # TypeScript类型
│   ├── utils/              # 工具函数
│   └── styles/             # 样式文件
├── public/                 # 静态资源
├── docs/                   # 文档
└── TODO.md                 # 开发计划
```

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发流程
1. Fork项目
2. 创建功能分支
3. 提交代码
4. 创建Pull Request

## 📄 许可证

MIT License

## 🙏 致谢

- 灵感来源于 [Memos](https://github.com/usememos/memos)
- 感谢所有开源项目的贡献者 