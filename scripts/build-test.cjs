#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🧪 SparkLog 测试构建脚本启动...')

// 从文件名解析日期
function parseDateFromFilename(filename) {
  // 支持多种文件名格式：
  // 1. 2024-08-05-13-30-58.md
  // 2. 2024-08-05.md
  // 3. 2024-08-05-13-30.md
  // 4. 2024-08-05-13-30-45-123.md
  
  // 使用简单的字符串分割方法
  const parts = filename.replace('.md', '').split('-')
  
  if (parts.length >= 3) {
    const year = parseInt(parts[0])
    const month = parseInt(parts[1]) - 1 // JavaScript 月份从 0 开始
    const day = parseInt(parts[2])
    
    // 检查是否有时间部分
    let hour = 0, minute = 0, second = 0, millisecond = 0
    
    if (parts.length >= 5) {
      hour = parseInt(parts[3]) || 0
      minute = parseInt(parts[4]) || 0
    }
    
    if (parts.length >= 6) {
      second = parseInt(parts[5]) || 0
    }
    
    if (parts.length >= 7) {
      millisecond = parseInt(parts[6]) || 0
    }
    
    try {
      const date = new Date(year, month, day, hour, minute, second, millisecond)
      if (!isNaN(date.getTime())) {
        return date.toISOString()
      }
    } catch (e) {
      console.log(`⚠️ 解析日期失败: ${filename}`)
    }
  }
  
  // 如果无法从文件名解析，返回当前时间
  return new Date().toISOString()
}

// 生成测试笔记
function generateTestNotes() {
  const testFilenames = [
    '2024-08-05-13-30-58.md',
    '2024-08-06-14-20-15.md',
    '2024-08-07-09-45-33.md',
    '2024-08-08-16-27-15-060.md',
    '2024-08-09-03-04-46-252.md'
  ]
  
  return testFilenames.map(filename => {
    const parsedDate = parseDateFromFilename(filename)
    console.log(`📅 文件名: ${filename} -> 解析日期: ${parsedDate}`)
    
    return {
      name: filename,
      title: filename.replace('.md', ''),
      contentPreview: `这是测试笔记 ${filename} 的内容预览...`,
      content: `# ${filename.replace('.md', '')}\n\n这是测试笔记的内容。`,
      tags: ['测试', '示例'],
      created_at: parsedDate,
      updated_at: parsedDate,
      isPrivate: false,
      isStatic: true
    }
  })
}

async function main() {
  try {
    // 第一步：构建 React 应用
    console.log('📦 构建 React 应用...')
    execSync('npm run build', { stdio: 'inherit' })
    console.log('✅ React 应用构建完成')

    // 第二步：生成测试静态笔记
    console.log('📝 生成测试静态笔记...')
    
    const outputDir = path.resolve(process.cwd(), 'dist/static-notes')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // 生成测试笔记
    const notes = generateTestNotes()
    
    // 生成索引文件
    const notesIndex = {
      notes: notes.map(note => ({
        name: note.name,
        title: note.title,
        contentPreview: note.contentPreview,
        tags: note.tags,
        created_at: note.created_at,
        updated_at: note.updated_at,
        isPrivate: note.isPrivate,
        isStatic: true
      })),
      totalCount: notes.length,
      generatedAt: new Date().toISOString(),
      buildMode: 'test'
    }

    // 写入索引文件
    fs.writeFileSync(
      path.join(outputDir, 'index.json'),
      JSON.stringify(notesIndex, null, 2)
    )

    // 写入各个笔记文件
    notes.forEach(note => {
      const noteData = {
        name: note.name,
        title: note.title,
        contentPreview: note.contentPreview,
        content: note.content,
        tags: note.tags,
        created_at: note.created_at,
        updated_at: note.updated_at,
        isPrivate: note.isPrivate,
        isStatic: true
      }
      
      fs.writeFileSync(
        path.join(outputDir, `${note.name}.json`),
        JSON.stringify(noteData, null, 2)
      )
    })

    console.log(`✅ 成功生成 ${notes.length} 个测试静态笔记`)
    console.log(`📁 输出目录: ${outputDir}`)
    console.log('🎉 测试构建完成！')

  } catch (error) {
    console.error('❌ 构建失败:', error.message)
    process.exit(1)
  }
}

// 运行主函数
main().catch(error => {
  console.error('❌ 运行失败:', error)
  process.exit(1)
})
