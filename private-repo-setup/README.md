# SparkLog 私有笔记仓库设置指南

这个文件夹包含了在您的**私有笔记仓库**中需要设置的文件。

## 🔐 安全架构说明

- **这个 SparkLog 仓库**：公开仓库，包含前端代码，部署到 Cloudflare Pages
- **您的私有笔记仓库**：私密仓库，存储所有笔记文件和 GitHub Actions

## 📁 需要在私有仓库中创建的文件

### 1. GitHub Actions 工作流

将 `build-static-content.yml` 复制到您私有仓库的 `.github/workflows/` 目录：

```bash
# 在您的私有笔记仓库中
mkdir -p .github/workflows
cp build-static-content.yml .github/workflows/
```

### 2. 构建脚本

将 `build-static-content.js` 复制到您的私有仓库的 `scripts/` 目录：

```bash
# 在您的私有笔记仓库中
mkdir -p scripts
cp build-static-content.js scripts/
```

### 3. package.json 配置

将 `package.json` 复制到您的私有仓库根目录：

```bash
# 在您的私有笔记仓库根目录
cp package.json ./
```

这个 package.json 文件包含：
- 项目基本信息
- 构建脚本配置
- Node.js 版本要求
- 无外部依赖（使用 Node.js 内置模块）

## 🚀 工作流程

1. **用户在 SparkLog 网站上编辑笔记** → 调用 GitHub API 保存到私有仓库
2. **私有仓库的 GitHub Actions 被触发** → 运行构建脚本
3. **生成静态 JSON 文件** → 提交到私有仓库的 `public/` 目录
4. **Cloudflare Pages 检测到变化** → 重新部署网站（如果配置了 webhook）

## ⚙️ 配置步骤

1. 在您的私有仓库中设置 GitHub Actions 权限：
   - 进入仓库设置 → Actions → General
   - 选择 "Read and write permissions"

2. 确保环境变量正确配置：
   - `VITE_REPO_OWNER`: 您的 GitHub 用户名
   - `VITE_REPO_NAME`: 您的私有笔记仓库名
   - `VITE_GITHUB_TOKEN`: 有访问私有仓库权限的 token

## 🔄 同步静态文件到公开仓库（可选）

如果需要将生成的静态文件同步到这个公开仓库，可以在私有仓库的 GitHub Actions 中添加额外步骤：

```yaml
- name: 同步到公开仓库
  env:
    PUBLIC_REPO_TOKEN: ${{ secrets.PUBLIC_REPO_TOKEN }}
  run: |
    # 将生成的 JSON 文件推送到公开仓库
    # 这需要额外的 token 和配置
```
