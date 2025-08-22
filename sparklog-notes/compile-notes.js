const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 解析笔记内容的函数（复制自 TypeScript 版本）
function parseNoteContent(content, fileName) {
  const lines = content.split('\n');
  
  let contentPreview = '';
  let createdDate = '';
  let updatedDate = '';
  let isPrivate = false;
  let tags = [];
  let inFrontmatter = false;
  let frontmatterEndIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 检测Frontmatter开始
    if (line === '---' && !inFrontmatter) {
      inFrontmatter = true;
      continue;
    }
    
    // 检测Frontmatter结束
    if (line === '---' && inFrontmatter) {
      frontmatterEndIndex = i;
      break;
    }
    
    // 解析Frontmatter内容
    if (inFrontmatter && line.includes(':')) {
      const colonIndex = line.indexOf(':');
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      
      if (key === 'created_at') {
        createdDate = value.replace(/"/g, '').trim();
      } else if (key === 'updated_at') {
        updatedDate = value.replace(/"/g, '').trim();
      } else if (key === 'private') {
        isPrivate = value === 'true';
      } else if (key === 'tags') {
        const tagValue = value.replace(/"/g, '').trim();
        if (tagValue.startsWith('[') && tagValue.endsWith(']')) {
          const tagArray = tagValue.slice(1, -1).split(',').map(tag => tag.trim()).filter(tag => tag);
          tags = tagArray;
        } else if (tagValue.includes(',')) {
          tags = tagValue.split(',').map(tag => tag.trim()).filter(tag => tag);
        } else if (tagValue) {
          tags = [tagValue];
        }
      }
    }
  }
  
  // 提取内容（跳过Frontmatter）
  const contentLines = frontmatterEndIndex >= 0 
    ? lines.slice(frontmatterEndIndex + 1) 
    : lines;
  
  // 生成内容预览
  const previewText = contentLines.join('\n').trim();
  contentPreview = previewText.substring(0, 200) + (previewText.length > 200 ? '...' : '');
  
  return {
    title: fileName.replace(/\.md$/, ''),
    contentPreview,
    createdDate,
    updatedDate,
    isPrivate,
    tags
  };
}

// 获取文件的修改时间
function getFileModifiedTime(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime.toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

// 检查静态文件是否需要更新
function shouldUpdateStaticFile(mdFilePath, staticFilePath) {
  if (!fs.existsSync(staticFilePath)) {
    return true; // 静态文件不存在，需要创建
  }
  
  const mdModified = getFileModifiedTime(mdFilePath);
  
  try {
    const staticContent = JSON.parse(fs.readFileSync(staticFilePath, 'utf8'));
    const staticModified = staticContent.compiledAt || '1970-01-01T00:00:00.000Z';
    
    return new Date(mdModified) > new Date(staticModified);
  } catch (error) {
    return true; // 静态文件损坏，需要重新生成
  }
}

// 编译单个笔记
function compileNote(mdFilePath, outputDir) {
  console.log(`处理文件: ${mdFilePath}`);
  
  const content = fs.readFileSync(mdFilePath, 'utf8');
  const fileName = path.basename(mdFilePath);
  const parsed = parseNoteContent(content, fileName);
  
  // 跳过私密笔记
  if (parsed.isPrivate) {
    console.log(`跳过私密笔记: ${fileName}`);
    return { skipped: true, reason: 'private' };
  }
  
  const staticFilePath = path.join(outputDir, `${fileName}.json`);
  
  // 检查是否需要更新
  if (!shouldUpdateStaticFile(mdFilePath, staticFilePath)) {
    console.log(`跳过未修改的笔记: ${fileName}`);
    return { skipped: true, reason: 'no-changes' };
  }
  
  const staticNoteData = {
    id: path.basename(mdFilePath, '.md'),
    title: parsed.title,
    content: content,
    contentPreview: parsed.contentPreview,
    createdDate: parsed.createdDate || getFileModifiedTime(mdFilePath),
    updatedDate: parsed.updatedDate || getFileModifiedTime(mdFilePath),
    isPrivate: parsed.isPrivate,
    tags: parsed.tags,
    filename: fileName,
    compiledAt: new Date().toISOString(),
    path: mdFilePath
  };
  
  // 确保输出目录存在
  fs.mkdirSync(outputDir, { recursive: true });
  
  // 写入静态文件
  fs.writeFileSync(staticFilePath, JSON.stringify(staticNoteData, null, 2));
  console.log(`已编译: ${fileName} -> ${fileName}.json`);
  
  return { skipped: false, compiled: true };
}

// 生成索引文件
function generateIndex(outputDir, mdFiles, compileStats) {
  const staticNotes = {};
  let publicNotesCount = 0;
  let totalCompiledNotes = 0;
  let totalSkippedNotes = 0;
  
  // 读取所有已编译的静态文件
  const jsonFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.json') && f !== 'index.json');
  
  for (const jsonFile of jsonFiles) {
    try {
      const staticData = JSON.parse(fs.readFileSync(path.join(outputDir, jsonFile), 'utf8'));
      if (!staticData.isPrivate) {
        const { content, ...noteWithoutContent } = staticData;
        staticNotes[staticData.filename] = noteWithoutContent;
        publicNotesCount++;
        
        // 统计编译状态
        if (compileStats[jsonFile.replace('.json', '')]) {
          if (compileStats[jsonFile.replace('.json', '')].skipped) {
            totalSkippedNotes++;
          } else {
            totalCompiledNotes++;
          }
        }
      }
    } catch (error) {
      console.error(`读取静态文件失败: ${jsonFile}`, error);
    }
  }
  
  // 只有当有笔记被重新编译时，才更新索引的 compiledAt
  const shouldUpdateIndex = totalCompiledNotes > 0;
  const currentIndexPath = path.join(outputDir, 'index.json');
  let existingCompiledAt = new Date().toISOString();
  
  if (fs.existsSync(currentIndexPath) && !shouldUpdateIndex) {
    try {
      const existingIndex = JSON.parse(fs.readFileSync(currentIndexPath, 'utf8'));
      existingCompiledAt = existingIndex.compiledAt || existingCompiledAt;
    } catch (error) {
      console.warn('读取现有索引文件失败，将使用当前时间');
    }
  }
  
  const indexData = {
    version: '1.0.0',
    compiledAt: shouldUpdateIndex ? new Date().toISOString() : existingCompiledAt,
    totalNotes: mdFiles.length,
    publicNotes: publicNotesCount,
    notes: staticNotes,
    // 添加编译统计信息
    lastBuildStats: {
      compiledNotes: totalCompiledNotes,
      skippedNotes: totalSkippedNotes,
      buildTime: new Date().toISOString()
    }
  };
  
  fs.writeFileSync(path.join(outputDir, 'index.json'), JSON.stringify(indexData, null, 2));
  
  if (shouldUpdateIndex) {
    console.log(`已更新索引文件，包含 ${publicNotesCount} 个公开笔记`);
    console.log(`本次构建: 编译 ${totalCompiledNotes} 个笔记，跳过 ${totalSkippedNotes} 个笔记`);
  } else {
    console.log(`索引文件无需更新，所有笔记都是最新的`);
    console.log(`当前状态: 总笔记 ${publicNotesCount} 个，跳过 ${totalSkippedNotes} 个笔记`);
  }
}

// 主函数
function main() {
  const currentDir = process.cwd();
  const targetRepoDir = path.join(currentDir, 'target-repo');
  const outputDir = path.join(targetRepoDir, 'public', 'static-notes');
  
  // 查找所有 Markdown 文件
  function findMdFiles(dir) {
    const files = [];
    const notesDir = path.join(dir, 'notes');
    
    // 检查 notes 文件夹是否存在
    if (!fs.existsSync(notesDir) || !fs.statSync(notesDir).isDirectory()) {
      console.log('⚠️ notes 文件夹不存在，跳过编译');
      console.log('📁 期望路径:', notesDir);
      return files;
    }
    
    console.log('✅ 找到 notes 文件夹:', notesDir);
    const entries = fs.readdirSync(notesDir, { withFileTypes: true });
    
    // 扁平结构：只处理 notes 文件夹下的 .md 文件，不递归搜索子文件夹
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const fullPath = path.join(notesDir, entry.name);
        files.push(fullPath);
      }
    }
    
    return files;
  }
  
  const mdFiles = findMdFiles(currentDir);
  console.log(`📊 编译统计:`);
  console.log(`   找到的 Markdown 文件: ${mdFiles.length} 个`);
  
  if (mdFiles.length === 0) {
    console.log('⚠️ 没有找到 Markdown 文件，请确保:');
    console.log('   1. notes 文件夹存在于当前目录');
    console.log('   2. notes 文件夹中包含 .md 文件（扁平存放，无子文件夹）');
    console.log('   3. 脚本在正确的笔记仓库目录中运行');
  }
  
  // 编译所有笔记
  const compileStats = {};
  for (const mdFile of mdFiles) {
    const result = compileNote(mdFile, outputDir);
    compileStats[path.basename(mdFile, '.md')] = result;
  }
  
  // 生成索引文件
  generateIndex(outputDir, mdFiles, compileStats);
  
  console.log('✅ 笔记编译完成！');
  console.log(`📁 输出目录: ${outputDir}`);
  console.log(`📝 编译的笔记将保存在: ${outputDir}`);
  console.log(`📋 所有笔记都扁平存放在 notes 文件夹下，无子文件夹结构`);
}

// 运行主函数
if (require.main === module) {
  main();
}