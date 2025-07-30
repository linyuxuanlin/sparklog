#!/bin/bash

# 清理之前的构建
rm -rf dist

# 安装依赖
npm install

# 构建项目
npm run build

# 检查构建结果
if [ -d "dist" ]; then
    echo "构建成功！"
    echo "构建文件列表："
    find dist -type f -name "*.js" -o -name "*.css" -o -name "*.html" | head -10
    
    # 验证index.html中的脚本引用
    echo "检查index.html中的脚本引用："
    grep -E "script.*src" dist/index.html || echo "未找到脚本引用"
else
    echo "构建失败！"
    exit 1
fi 