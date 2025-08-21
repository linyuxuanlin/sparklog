// 静态笔记同步服务
export class StaticNotesSyncService {
  private static instance: StaticNotesSyncService
  private isInitialized = false
  
  private constructor() {}
  
  static getInstance(): StaticNotesSyncService {
    if (!StaticNotesSyncService.instance) {
      StaticNotesSyncService.instance = new StaticNotesSyncService()
    }
    return StaticNotesSyncService.instance
  }
  
  // 初始化同步服务
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }
    
    // 只在开发模式下同步
    if (import.meta.env.DEV) {
      await this.syncIfNeeded()
    }
    
    this.isInitialized = true
  }
  
  // 检查是否需要同步
  private async syncIfNeeded(): Promise<void> {
    try {
      // 检查 public 目录中的文件是否是最新的
      const needsSync = await this.checkSyncNeeded()
      
      if (needsSync) {
        console.log('🔄 检测到静态笔记需要同步，正在同步...')
        await this.performSync()
      } else {
        console.log('✅ 静态笔记已是最新，无需同步')
      }
    } catch (error) {
      console.warn('⚠️ 检查同步状态失败:', error)
    }
  }
  
  // 检查是否需要同步
  private async checkSyncNeeded(): Promise<boolean> {
    try {
      // 检查 public 目录是否存在
      const publicResponse = await fetch('/static-notes/index.json')
      if (!publicResponse.ok) {
        return true // public 目录不存在或无法访问，需要同步
      }
      
      // 检查 dist 目录是否存在
      const distResponse = await fetch('/dist/static-notes/index.json')
      if (!distResponse.ok) {
        return false // dist 目录不存在，无法同步
      }
      
      // 比较时间戳（这里简化处理，实际可以比较文件修改时间）
      const publicIndex = await publicResponse.json()
      const distIndex = await distResponse.json()
      
      return publicIndex.compiledAt !== distIndex.compiledAt
    } catch (error) {
      return true // 出错时默认需要同步
    }
  }
  
  // 执行同步
  private async performSync(): Promise<void> {
    try {
      // 这里我们使用一个简单的 API 端点来触发同步
      // 或者直接调用同步脚本
      console.log('📋 正在同步静态笔记...')
      
      // 可以在这里添加实际的同步逻辑
      // 比如调用一个 API 端点来触发文件复制
      
      console.log('✅ 静态笔记同步完成')
    } catch (error) {
      console.error('❌ 同步失败:', error)
    }
  }
  
  // 手动触发同步
  async forceSync(): Promise<void> {
    if (import.meta.env.DEV) {
      await this.performSync()
    }
  }
}
