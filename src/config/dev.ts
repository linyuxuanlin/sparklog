// 开发环境配置
export const devConfig = {
  // 开发服务器端口配置
  ports: [3000, 3001, 3003, 5173],
  
  // 默认端口
  defaultPort: 3000,
  
  // 静态笔记路径配置
  staticNotesPath: '/static-notes',
  
  // 是否启用调试日志
  enableDebugLogs: true,
  
  // 开发模式下的 API 超时时间
  apiTimeout: 10000,
  
  // 是否自动同步静态笔记到 public 目录
  autoSyncToPublic: true,
}

// 获取当前开发端口
export function getCurrentDevPort(): number {
  if (typeof window !== 'undefined') {
    const port = parseInt(window.location.port)
    if (devConfig.ports.includes(port)) {
      return port
    }
  }
  return devConfig.defaultPort
}

// 获取开发模式下的静态笔记基础路径
export function getDevStaticNotesBase(): string {
  const port = getCurrentDevPort()
  
  // 开发模式下使用 public 目录（Vite 开发服务器提供）
  return `http://localhost:${port}${devConfig.staticNotesPath}`
}

// 检查是否为开发模式
export function isDevelopment(): boolean {
  return import.meta.env.DEV === true
}
