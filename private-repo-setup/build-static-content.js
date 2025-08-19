#!/usr/bin/env node

/**
 * 静态内容构建脚本
 * 将 notes/ 目录下的 Markdown 文件编译为静态 JSON 数据
 * 生成三个文件：
 * - public-notes.json: 只包含公开笔记
 * - all-notes.json: 包含所有笔记（需要登录验证）
 * - build-info.json: 构建统计信息
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
  
  const contentLines = frontmatterEndIndex > -1 
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
    
    return {
      name: fileName,
      path: `notes/${fileName}`,
      title: timestamp, // 使用时间戳作为标题
      content: bodyContent,
      contentPreview,
      fullContent: content,
      created_at: frontmatter.created_at || new Date().toISOString(),
      updated_at: frontmatter.updated_at || new Date().toISOString(),
      createdDate: frontmatter.created_at || new Date().toISOString(),
      updatedDate: frontmatter.updated_at || new Date().toISOString(),
      isPrivate: frontmatter.private || false,
      tags: frontmatter.tags || [],
      sha: Buffer.from(filePath).toString('base64').substring(0, 40), // 模拟 SHA
      size: content.length,
      type: 'file',
      url: `https://api.github.com/repos/user/repo/contents/notes/${fileName}`,
      git_url: `https://api.github.com/repos/user/repo/git/blobs/${Buffer.from(filePath).toString('base64').substring(0, 40)}`,
      html_url: `https://github.com/user/repo/blob/main/notes/${fileName}`,
      download_url: `https://raw.githubusercontent.com/user/repo/main/notes/${fileName}`
    };
  } catch (error) {
    console.error(`处理文件 ${fileName} 时出错:`, error.message);
    return null;
  }
}

// 主构建函数
async function buildStaticContent() {
  const projectRoot = process.cwd();
  const notesDir = path.join(projectRoot, 'notes');
  const outputDir = path.join(projectRoot, 'public');
  
  try {
    console.log('开始构建静态内容...');
    
    // 检查 notes 目录是否存在
    try {
      await fs.access(notesDir);
    } catch (error) {
      console.log('notes 目录不存在，创建示例内容...');
      
      // 创建 notes 目录
      await fs.mkdir(notesDir, { recursive: true });
      
      // 创建示例笔记
      const exampleNote = `---
created_at: ${new Date().toISOString()}
updated_at: ${new Date().toISOString()}
private: false
tags: [欢迎, 示例]
---

# 欢迎使用 SparkLog

这是您的第一篇笔记！您可以：

- 📝 编写 Markdown 格式的笔记
- 🏷️ 使用标签组织内容
- 🔒 设置笔记为公开或私密
- 🔍 快速搜索和筛选笔记

开始记录您的想法吧！`;

      const exampleFileName = `${new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').replace('Z', '')}.md`;
      await fs.writeFile(path.join(notesDir, exampleFileName), exampleNote, 'utf-8');
      console.log(`创建了示例笔记: ${exampleFileName}`);
    }
    
    // 读取所有 Markdown 文件
    const files = await fs.readdir(notesDir);
    const markdownFiles = files.filter(file => file.endsWith('.md'));
    
    console.log(`找到 ${markdownFiles.length} 个笔记文件`);
    
    // 处理所有笔记文件
    const notes = [];
    for (const file of markdownFiles) {
      const filePath = path.join(notesDir, file);
      const note = await processNoteFile(filePath, file);
      if (note) {
        notes.push(note);
      }
    }
    
    // 按创建时间倒序排序（最新的在前）
    notes.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
    
    // 分离公开和私密笔记
    const publicNotes = notes.filter(note => !note.isPrivate);
    const privateNotes = notes.filter(note => note.isPrivate);
    
    // 收集所有标签
    const allTags = [...new Set(notes.flatMap(note => note.tags))].sort();
    
    // 构建信息
    const buildInfo = {
      buildTime: new Date().toISOString(),
      totalNotes: notes.length,
      publicNotes: publicNotes.length,
      privateNotes: privateNotes.length,
      tags: allTags
    };
    
    // 确保输出目录存在
    await fs.mkdir(outputDir, { recursive: true });
    
    // 生成公开笔记数据（只包含公开笔记）
    const publicNotesData = {
      notes: publicNotes,
      buildInfo: {
        ...buildInfo,
        type: 'public'
      }
    };
    
    // 生成完整笔记数据（包含所有笔记）
    const allNotesData = {
      notes: notes,
      buildInfo: {
        ...buildInfo,
        type: 'complete'
      }
    };
    
    // 写入文件
    const publicNotesPath = path.join(outputDir, 'public-notes.json');
    const allNotesPath = path.join(outputDir, 'all-notes.json');
    const buildInfoPath = path.join(outputDir, 'build-info.json');
    
    await fs.writeFile(publicNotesPath, JSON.stringify(publicNotesData, null, 2), 'utf-8');
    await fs.writeFile(allNotesPath, JSON.stringify(allNotesData, null, 2), 'utf-8');
    await fs.writeFile(buildInfoPath, JSON.stringify(buildInfo, null, 2), 'utf-8');
    
    // 计算文件大小
    const publicSize = (await fs.stat(publicNotesPath)).size;
    const allSize = (await fs.stat(allNotesPath)).size;
    
    console.log('✅ 静态内容构建完成');
    console.log('📊 统计信息:');
    console.log(`   - 总笔记数: ${notes.length}`);
    console.log(`   - 公开笔记: ${publicNotes.length}`);
    console.log(`   - 私密笔记: ${privateNotes.length}`);
    console.log(`   - 标签数量: ${allTags.length}`);
    console.log('📁 输出文件:');
    console.log(`   - public-notes.json (${(publicSize / 1024).toFixed(1)} KB)`);
    console.log(`   - all-notes.json (${(allSize / 1024).toFixed(1)} KB)`);
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
