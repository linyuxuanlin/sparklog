#!/bin/bash

# 清理之前的构建
rm -rf dist

# 安装依赖
npm install

# 构建项目
npm run build

# 检查构建结果
if [ -d "dist" ]; then
    echo "✅ 构建成功！"
    echo "📁 构建输出目录: dist/"
    ls -la dist/
else
    echo "❌ 构建失败！"
    exit 1
fi 