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
    return;
  }
  
  const staticFilePath = path.join(outputDir, `${fileName}.json`);
  
  // 检查是否需要更新
  if (!shouldUpdateStaticFile(mdFilePath, staticFilePath)) {
    console.log(`跳过未修改的笔记: ${fileName}`);
    return;
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
}

// 生成索引文件
function generateIndex(outputDir, mdFiles) {
  const staticNotes = {};
  let publicNotesCount = 0;
  
  // 读取所有已编译的静态文件
  const jsonFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.json') && f !== 'index.json');
  
  for (const jsonFile of jsonFiles) {
    try {
      const staticData = JSON.parse(fs.readFileSync(path.join(outputDir, jsonFile), 'utf8'));
      if (!staticData.isPrivate) {
        const { content, ...noteWithoutContent } = staticData;
        staticNotes[staticData.filename] = noteWithoutContent;
        publicNotesCount++;
      }
    } catch (error) {
      console.error(`读取静态文件失败: ${jsonFile}`, error);
    }
  }
  
  const indexData = {
    version: '1.0.0',
    compiledAt: new Date().toISOString(),
    totalNotes: mdFiles.length,
    publicNotes: publicNotesCount,
    notes: staticNotes
  };
  
  fs.writeFileSync(path.join(outputDir, 'index.json'), JSON.stringify(indexData, null, 2));
  console.log(`已生成索引文件，包含 ${publicNotesCount} 个公开笔记`);
}

// 主函数
function main() {
  const currentDir = process.cwd();
  const targetRepoDir = path.join(currentDir, 'target-repo');
  const outputDir = path.join(targetRepoDir, 'public', 'static-notes');
  
  // 查找所有 Markdown 文件
  function findMdFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== '.git' && entry.name !== 'node_modules' && entry.name !== 'target-repo') {
        files.push(...findMdFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }
  
  const mdFiles = findMdFiles(currentDir);
  console.log(`找到 ${mdFiles.length} 个 Markdown 文件`);
  
  // 编译所有笔记
  for (const mdFile of mdFiles) {
    compileNote(mdFile, outputDir);
  }
  
  // 生成索引文件
  generateIndex(outputDir, mdFiles);
  
  console.log('编译完成！');
}

// 运行主函数
if (require.main === module) {
  main();
}