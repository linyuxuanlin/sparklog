#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

// 检查必需的文件是否存在
function checkRequiredFiles() {
  const requiredFiles = ['public-notes.json', 'all-notes.json'];
  const missingFiles = [];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length > 0) {
    throw new Error(`缺少必需的文件: ${missingFiles.join(', ')}`);
  }
}

// 验证 JSON 文件
function validateJsonFiles() {
  try {
    const publicNotes = JSON.parse(fs.readFileSync('public-notes.json', 'utf8'));
    const allNotes = JSON.parse(fs.readFileSync('all-notes.json', 'utf8'));
    
    if (!Array.isArray(publicNotes) || !Array.isArray(allNotes)) {
      throw new Error('笔记数据必须是数组格式');
    }
    
    return { publicNotes, allNotes };
  } catch (error) {
    throw new Error(`JSON 文件验证失败: ${error.message}`);
  }
}

// 生成构建信息
function generateBuildInfo() {
  return {
    buildTime: new Date().toISOString(),
    buildVersion: process.env.GITHUB_SHA || 'local',
    buildNumber: process.env.GITHUB_RUN_NUMBER || 'local',
    buildUrl: process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : null
  };
}

// 优化笔记数据
function optimizeNotes(notes) {
  return notes.map(note => {
    // 移除不必要的字段，保留核心数据
    const optimized = {
      id: note.id,
      filename: note.filename,
      title: note.title,
      excerpt: note.excerpt,
      createdDate: note.createdDate,
      updatedDate: note.updatedDate,
      isPrivate: note.isPrivate,
      tags: note.tags || []
    };
    
    // 只在需要时包含内容
    if (note.content) {
      optimized.content = note.content;
    }
    
    return optimized;
  });
}

// 生成索引文件
function generateIndexFiles(publicNotes, allNotes, buildInfo) {
  // 生成标签索引
  const tagsIndex = {};
  
  allNotes.forEach(note => {
    if (note.tags && Array.isArray(note.tags)) {
      note.tags.forEach(tag => {
        if (!tagsIndex[tag]) {
          tagsIndex[tag] = [];
        }
        tagsIndex[tag].push({
          id: note.id,
          title: note.title,
          excerpt: note.excerpt,
          createdDate: note.createdDate,
          updatedDate: note.updatedDate
        });
      });
    }
  });
  
  // 按标签下的笔记数量排序
  const sortedTags = Object.keys(tagsIndex).sort((a, b) => {
    return tagsIndex[b].length - tagsIndex[a].length;
  });
  
  const sortedTagsIndex = {};
  sortedTags.forEach(tag => {
    sortedTagsIndex[tag] = tagsIndex[tag];
  });
  
  // 构建最终索引
  const publicIndex = {
    notes: publicNotes,
    total: publicNotes.length,
    buildInfo
  };
  
  const allIndex = {
    notes: allNotes,
    total: allNotes.length,
    buildInfo
  };
  
  const tagsIndexData = {
    tags: sortedTagsIndex,
    totalTags: Object.keys(sortedTagsIndex).length,
    buildInfo
  };
  
  return { publicIndex, allIndex, tagsIndex: tagsIndexData };
}

// 写入优化后的文件
function writeOptimizedFiles(publicIndex, allIndex, tagsIndex) {
  const buildReport = {
    timestamp: new Date().toISOString(),
    files: {
      'public-notes.json': {
        size: JSON.stringify(publicIndex).length,
        notes: publicIndex.total
      },
      'all-notes.json': {
        size: JSON.stringify(allIndex).length,
        notes: allIndex.total
      },
      'tags-index.json': {
        size: JSON.stringify(tagsIndex).length,
        tags: tagsIndex.totalTags
      }
    },
    summary: {
      totalNotes: allIndex.total,
      publicNotes: publicIndex.total,
      privateNotes: allIndex.total - publicIndex.total,
      totalTags: tagsIndex.totalTags
    }
  };
  
  // 写入优化后的文件
  fs.writeFileSync('public-notes.json', JSON.stringify(publicIndex, null, 2));
  fs.writeFileSync('all-notes.json', JSON.stringify(allIndex, null, 2));
  fs.writeFileSync('tags-index.json', JSON.stringify(tagsIndex, null, 2));
  
  // 写入构建报告
  fs.writeFileSync('build-report.json', JSON.stringify(buildReport, null, 2));
  
  return buildReport;
}

async function main() {
  try {
    console.log('🚀 开始构建静态内容...');
    
    // 检查必需文件
    checkRequiredFiles();
    console.log('✅ 必需文件检查通过');
    
    // 验证 JSON 文件
    const { publicNotes, allNotes } = validateJsonFiles();
    console.log(`✅ JSON 文件验证通过: ${publicNotes.length} 个公开笔记, ${allNotes.length} 个总笔记`);
    
    // 生成构建信息
    const buildInfo = generateBuildInfo();
    console.log(`📋 构建信息: ${buildInfo.buildTime}`);
    
    // 优化笔记数据
    const optimizedPublicNotes = optimizeNotes(publicNotes);
    const optimizedAllNotes = optimizeNotes(allNotes);
    console.log('✅ 笔记数据优化完成');
    
    // 生成索引文件
    const { publicIndex, allIndex, tagsIndex } = generateIndexFiles(
      optimizedPublicNotes, optimizedAllNotes, buildInfo
    );
    console.log('✅ 索引文件生成完成');
    
    // 写入优化后的文件
    const buildReport = writeOptimizedFiles(publicIndex, allIndex, tagsIndex);
    console.log('✅ 文件写入完成');
    
    // 输出构建摘要
    console.log('\n📊 构建摘要:');
    console.log(`   总笔记数: ${buildReport.summary.totalNotes}`);
    console.log(`   公开笔记: ${buildReport.summary.publicNotes}`);
    console.log(`   私密笔记: ${buildReport.summary.privateNotes}`);
    console.log(`   标签数量: ${buildReport.summary.totalTags}`);
    console.log(`   构建时间: ${buildReport.timestamp}`);
    
    console.log('\n🎉 静态内容构建完成！');
    
  } catch (error) {
    console.error('❌ 构建失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
