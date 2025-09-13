#!/usr/bin/env node

import { staticNotesBuilder } from './staticNotesBuilder'

async function main() {
  console.log('🚀 启动静态笔记构建...')
  
  try {
    await staticNotesBuilder.build()
    console.log('✅ 静态笔记构建完成')
    process.exit(0)
  } catch (error) {
    console.error('❌ 静态笔记构建失败:', error)
    process.exit(1)
  }
}

main()
