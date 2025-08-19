#!/usr/bin/env node

/**
 * 构建静态内容的脚本
 * 用于 GitHub Actions 自动构建
 */

const fs = require('fs');
const path = require('path');

// 检查必要的文件是否存在
function checkRequiredFiles() {
  const requiredFiles = ['public-notes.json', 'all-notes.json'];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      console.error(`错误: 缺少必要的文件 ${file}`);
      console.error('请先运行 fetch-notes-from-r2.js 脚本');
      process.exit(1);
    }
  }
}

// 验证 JSON 文件格式
function validateJsonFiles() {
  try {
    const publicNotes = JSON.parse(fs.readFileSync('public-notes.json', 'utf8'));
    const allNotes = JSON.parse(fs.readFileSync('all-notes.json', 'utf8'));
    
    if (!Array.isArray(publicNotes) || !Array.isArray(allNotes)) {
      throw new Error('笔记数据必须是数组格式');
    }
    
    console.log(`验证通过: 公开笔记 ${publicNotes.length} 个，所有笔记 ${allNotes.length} 个`);
    
    return { publicNotes, allNotes };
  } catch (error) {
    console.error('JSON 文件验证失败:', error.message);
    process.exit(1);
  }
}

// 生成构建信息
function generateBuildInfo() {
  const buildInfo = {
    buildTime: new Date().toISOString(),
    buildId: `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  };
  
  return buildInfo;
}

// 优化笔记数据
function optimizeNotes(notes) {
  return notes.map(note => {
    // 确保所有必要字段都存在
    const optimizedNote = {
      id: note.id || `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filename: note.filename || note.name || 'untitled.md',
      path: note.path || `notes/${note.filename || note.name}`,
      title: note.title || note.filename || 'Untitled',
      content: note.content || note.fullContent || '',
      excerpt: note.excerpt || note.contentPreview || '',
      createdDate: note.createdDate || note.created_at || new Date().toISOString(),
      updatedDate: note.updatedDate || note.updated_at || new Date().toISOString(),
      isPrivate: note.isPrivate || false,
      tags: Array.isArray(note.tags) ? note.tags : [],
      size: note.size || 0
    };
    
    // 清理和验证字段
    if (typeof optimizedNote.title === 'string') {
      optimizedNote.title = optimizedNote.title.trim();
    }
    
    if (typeof optimizedNote.content === 'string') {
      optimizedNote.content = optimizedNote.content.trim();
    }
    
    if (typeof optimizedNote.excerpt === 'string') {
      optimizedNote.excerpt = optimizedNote.excerpt.trim();
      // 限制摘要长度
      if (optimizedNote.excerpt.length > 300) {
        optimizedNote.excerpt = optimizedNote.excerpt.substring(0, 300) + '...';
      }
    }
    
    // 确保标签是字符串数组
    optimizedNote.tags = optimizedNote.tags
      .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
      .map(tag => tag.trim());
    
    return optimizedNote;
  });
}

// 生成索引文件
function generateIndexFiles(publicNotes, allNotes, buildInfo) {
  // 生成公开笔记索引
  const publicIndex = {
    buildInfo,
    notes: publicNotes,
    totalCount: publicNotes.length,
    lastUpdated: new Date().toISOString()
  };
  
  // 生成所有笔记索引
  const allIndex = {
    buildInfo,
    notes: allNotes,
    totalCount: allNotes.length,
    lastUpdated: new Date().toISOString()
  };
  
  // 生成标签索引
  const tagIndex = {};
  allNotes.forEach(note => {
    note.tags.forEach(tag => {
      if (!tagIndex[tag]) {
        tagIndex[tag] = [];
      }
      tagIndex[tag].push({
        id: note.id,
        title: note.title,
        filename: note.filename,
        excerpt: note.excerpt,
        createdDate: note.createdDate,
        updatedDate: note.updatedDate,
        isPrivate: note.isPrivate
      });
    });
  });
  
  const tagsIndex = {
    buildInfo,
    tags: Object.keys(tagIndex),
    tagCounts: Object.fromEntries(
      Object.entries(tagIndex).map(([tag, notes]) => [tag, notes.length])
    ),
    tagNotes: tagIndex,
    lastUpdated: new Date().toISOString()
  };
  
  return { publicIndex, allIndex, tagsIndex };
}

// 写入优化后的文件
function writeOptimizedFiles(publicIndex, allIndex, tagsIndex) {
  try {
    // 写入公开笔记索引
    fs.writeFileSync('public-notes.json', JSON.stringify(publicIndex, null, 2));
    console.log('✅ 公开笔记索引已生成');
    
    // 写入所有笔记索引
    fs.writeFileSync('all-notes.json', JSON.stringify(allIndex, null, 2));
    console.log('✅ 所有笔记索引已生成');
    
    // 写入标签索引
    fs.writeFileSync('tags-index.json', JSON.stringify(tagsIndex, null, 2));
    console.log('✅ 标签索引已生成');
    
    // 生成构建报告
    const buildReport = {
      buildInfo: publicIndex.buildInfo,
      summary: {
        totalNotes: allIndex.totalCount,
        publicNotes: publicIndex.totalCount,
        privateNotes: allIndex.totalCount - publicIndex.totalCount,
        uniqueTags: tagsIndex.tags.length,
        buildTime: new Date().toISOString()
      },
      files: {
        'public-notes.json': {
          size: fs.statSync('public-notes.json').size,
          notes: publicIndex.totalCount
        },
        'all-notes.json': {
          size: fs.statSync('all-notes.json').size,
          notes: allIndex.totalCount
        },
        'tags-index.json': {
          size: fs.statSync('tags-index.json').size,
          tags: tagsIndex.tags.length
        }
      }
    };
    
    fs.writeFileSync('build-report.json', JSON.stringify(buildReport, null, 2));
    console.log('✅ 构建报告已生成');
    
    return buildReport;
  } catch (error) {
    console.error('写入文件失败:', error.message);
    process.exit(1);
  }
}

// 主函数
async function main() {
  try {
    console.log('🚀 开始构建静态内容...');
    
    // 检查必要文件
    checkRequiredFiles();
    
    // 验证 JSON 文件
    const { publicNotes, allNotes } = validateJsonFiles();
    
    // 生成构建信息
    const buildInfo = generateBuildInfo();
    console.log(`📋 构建信息: ${buildInfo.buildId}`);
    
    // 优化笔记数据
    console.log('🔧 优化笔记数据...');
    const optimizedPublicNotes = optimizeNotes(publicNotes);
    const optimizedAllNotes = optimizeNotes(allNotes);
    
    // 生成索引文件
    console.log('📚 生成索引文件...');
    const { publicIndex, allIndex, tagsIndex } = generateIndexFiles(
      optimizedPublicNotes,
      optimizedAllNotes,
      buildInfo
    );
    
    // 写入优化后的文件
    console.log('💾 写入文件...');
    const buildReport = writeOptimizedFiles(publicIndex, allIndex, tagsIndex);
    
    // 输出构建摘要
    console.log('\n📊 构建完成!');
    console.log(`📝 总笔记数: ${buildReport.summary.totalNotes}`);
    console.log(`🌐 公开笔记: ${buildReport.summary.publicNotes}`);
    console.log(`🔒 私密笔记: ${buildReport.summary.privateNotes}`);
    console.log(`🏷️ 唯一标签: ${buildReport.summary.uniqueTags}`);
    console.log(`⏰ 构建时间: ${buildReport.summary.buildTime}`);
    console.log(`🆔 构建 ID: ${buildInfo.buildId}`);
    
    console.log('\n📁 生成的文件:');
    console.log(`   • public-notes.json (${buildReport.files['public-notes.json'].size} bytes)`);
    console.log(`   • all-notes.json (${buildReport.files['all-notes.json'].size} bytes)`);
    console.log(`   • tags-index.json (${buildReport.files['tags-index.json'].size} bytes)`);
    console.log(`   • build-report.json`);
    
  } catch (error) {
    console.error('❌ 构建失败:', error.message);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}
