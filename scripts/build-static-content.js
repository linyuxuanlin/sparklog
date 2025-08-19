#!/usr/bin/env node

/**
 * 静态内容构建脚本
 * 将 notes/ 目录下的 Markdown 文件编译为静态 JSON 数据
 * 生成两个文件：
 * - public-notes.json: 只包含公开笔记
 * - all-notes.json: 包含所有笔记（需要登录验证）
 */

import fs from 'fs/promises'
import path from 'path'

// 解析 Markdown 文件的 frontmatter
function parseFrontmatter(content) {
  const lines = content.split('\n');
  const frontmatter = {};
  let inFrontmatter = false;
  let frontmatterEndIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === '---' && !inFrontmatter) {
      inFrontmatter = true;
      continue;
    }
    
    if (line === '---' && inFrontmatter) {
      frontmatterEndIndex = i;
      break;
    }
    
    if (inFrontmatter && line.includes(':')) {
      const colonIndex = line.indexOf(':');
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      
      if (key === 'created_at' || key === 'updated_at') {
        frontmatter[key] = value.replace(/"/g, '').trim();
      } else if (key === 'private') {
        frontmatter[key] = value === 'true';
      } else if (key === 'tags') {
        const tagValue = value.replace(/"/g, '').trim();
        if (tagValue.startsWith('[') && tagValue.endsWith(']')) {
          frontmatter[key] = tagValue.slice(1, -1).split(',').map(tag => tag.trim()).filter(tag => tag);
        } else if (tagValue.includes(',')) {
          frontmatter[key] = tagValue.split(',').map(tag => tag.trim()).filter(tag => tag);
        } else if (tagValue) {
          frontmatter[key] = [tagValue];
        } else {
          frontmatter[key] = [];
        }
      }
    }
  }
  
  // 提取正文内容
  const contentLines = frontmatterEndIndex >= 0 
    ? lines.slice(frontmatterEndIndex + 1) 
    : lines;
  
  const bodyContent = contentLines.join('\n').trim();
  
  return {
    frontmatter,
    content: bodyContent,
    contentPreview: bodyContent.substring(0, 200) + (bodyContent.length > 200 ? '...' : '')
  };
}

// 处理单个笔记文件
async function processNoteFile(filePath, fileName) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter, content: bodyContent, contentPreview } = parseFrontmatter(content);
    
    // 从文件名提取时间戳
    const timestamp = fileName.replace(/\.md$/, '');
    
    // 检查是否为私密笔记
    const isPrivate = frontmatter.private || false;
    
    // 对于私密笔记，保持加密内容，不显示明文
    let processedContent = bodyContent;
    let processedContentPreview = contentPreview;
    
    if (isPrivate) {
      // 检查是否有加密标记
      if (content.includes('---ENCRYPTED---') && content.includes('---END-ENCRYPTED---')) {
        // 私密笔记保持加密状态，只显示加密标记
        processedContent = '🔒 这是私密笔记，需要管理员密码才能查看内容';
        processedContentPreview = '🔒 私密笔记';
      } else {
        // 私密笔记但没有加密标记，显示提示
        processedContent = '⚠️ 私密笔记未加密，请使用管理员密码加密';
        processedContentPreview = '⚠️ 未加密的私密笔记';
      }
    }
    
    return {
      name: fileName,
      path: `notes/${fileName}`,
      title: timestamp, // 使用时间戳作为标题
      content: processedContent,
      contentPreview: processedContentPreview,
      fullContent: content, // 保持原始内容（包括加密内容）
      created_at: frontmatter.created_at || new Date().toISOString(),
      updated_at: frontmatter.updated_at || new Date().toISOString(),
      createdDate: frontmatter.created_at,
      updatedDate: frontmatter.updated_at,
      isPrivate: isPrivate,
      tags: frontmatter.tags || [],
      // 生成一个简单的 ID（实际项目中可能需要更复杂的逻辑）
      sha: Buffer.from(filePath + content).toString('base64').substring(0, 40),
      size: Buffer.byteLength(content, 'utf8'),
      type: 'file'
    };
  } catch (error) {
    console.error(`处理文件 ${fileName} 时出错:`, error);
    return null;
  }
}

// 主构建函数
async function buildStaticContent() {
  console.log('开始构建静态内容...');
  
  const notesDir = path.join(process.cwd(), 'notes');
  const outputDir = path.join(process.cwd(), 'public');
  
  try {
    // 检查 notes 目录是否存在
    try {
      await fs.access(notesDir);
    } catch (error) {
      console.log('notes 目录不存在，创建示例目录和文件...');
      await fs.mkdir(notesDir, { recursive: true });
      
      // 创建示例笔记
      const exampleNote = `---
created_at: ${new Date().toISOString()}
updated_at: ${new Date().toISOString()}
private: false
tags: [示例, 欢迎]
---

# 欢迎使用 SparkLog

这是一个示例笔记，展示了新的静态内容架构。

## 主要特性

- 🚀 静态内容加载，更快的访问速度
- 🔒 私密内容保护
- ⚡ GitHub Actions 自动编译
- 📝 Markdown 支持

现在您可以开始创建自己的笔记了！`;

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').replace('Z', '');
      await fs.writeFile(path.join(notesDir, `${timestamp}.md`), exampleNote);
      console.log('已创建示例笔记');
    }
    
    // 读取所有 Markdown 文件
    const files = await fs.readdir(notesDir);
    const markdownFiles = files.filter(file => file.endsWith('.md'));
    
    console.log(`找到 ${markdownFiles.length} 个笔记文件`);
    
    // 处理所有笔记文件
    const notes = [];
    for (const fileName of markdownFiles) {
      const filePath = path.join(notesDir, fileName);
      const note = await processNoteFile(filePath, fileName);
      if (note) {
        notes.push(note);
      }
    }
    
    // 按时间排序（新到旧）
    notes.sort((a, b) => {
      const timeA = a.name.replace(/\.md$/, '').split('-').slice(0, 6).join('-');
      const timeB = b.name.replace(/\.md$/, '').split('-').slice(0, 6).join('-');
      return timeB.localeCompare(timeA);
    });
    
    // 生成公开笔记数据（过滤私密笔记）
    const publicNotes = notes.filter(note => !note.isPrivate);
    
    // 确保输出目录存在
    await fs.mkdir(outputDir, { recursive: true });
    
    // 生成统计信息
    const buildInfo = {
      buildTime: new Date().toISOString(),
      totalNotes: notes.length,
      publicNotes: publicNotes.length,
      privateNotes: notes.length - publicNotes.length,
      tags: [...new Set(notes.flatMap(note => note.tags))].sort()
    };
    
    // 写入公开笔记文件
    await fs.writeFile(
      path.join(outputDir, 'public-notes.json'),
      JSON.stringify({
        notes: publicNotes,
        buildInfo: {
          ...buildInfo,
          type: 'public'
        }
      }, null, 2)
    );
    
    // 写入完整笔记文件
    await fs.writeFile(
      path.join(outputDir, 'all-notes.json'),
      JSON.stringify({
        notes: notes,
        buildInfo: {
          ...buildInfo,
          type: 'complete'
        }
      }, null, 2)
    );
    
    // 写入构建信息文件
    await fs.writeFile(
      path.join(outputDir, 'build-info.json'),
      JSON.stringify(buildInfo, null, 2)
    );
    
    console.log('✅ 静态内容构建完成');
    console.log(`📊 统计信息:`);
    console.log(`   - 总笔记数: ${notes.length}`);
    console.log(`   - 公开笔记: ${publicNotes.length}`);
    console.log(`   - 私密笔记: ${notes.length - publicNotes.length}`);
    console.log(`   - 标签数量: ${buildInfo.tags.length}`);
    console.log(`📁 输出文件:`);
    console.log(`   - public-notes.json (${(JSON.stringify(publicNotes).length / 1024).toFixed(1)} KB)`);
    console.log(`   - all-notes.json (${(JSON.stringify(notes).length / 1024).toFixed(1)} KB)`);
    console.log(`   - build-info.json`);
    
  } catch (error) {
    console.error('❌ 构建失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  buildStaticContent()
}

export { buildStaticContent };
