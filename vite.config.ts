import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'globalThis',
  },
  server: {
    // 开发服务器配置
    port: 5173,
    host: true
  },
  // 配置静态文件服务
  build: {
    // 确保构建输出到 dist 目录
    outDir: 'dist'
  },
  // 设置公共目录为 dist，这样开发环境也能访问构建后的文件
  publicDir: 'dist'
}) 