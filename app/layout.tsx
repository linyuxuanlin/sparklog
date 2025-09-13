import './globals.css'
import React from 'react'

export const metadata = {
  title: 'SparkLog - 基于GitHub的静态笔记',
  description: '一个基于GitHub仓库的静态笔记应用，完全静态无后端',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {children}
      </body>
    </html>
  )
}

