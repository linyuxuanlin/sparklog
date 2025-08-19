#!/usr/bin/env node
import https from 'https';
import crypto from 'crypto';
import fs from 'fs';

// 从环境变量获取 R2 配置
const R2_ACCOUNT_ID = process.env.VITE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.VITE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.VITE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.VITE_R2_BUCKET_NAME;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error('错误: 缺少必要的 R2 环境变量');
  console.error('请确保设置了以下环境变量:');
  console.error('- VITE_R2_ACCOUNT_ID');
  console.error('- VITE_R2_ACCESS_KEY_ID');
  console.error('- VITE_R2_SECRET_ACCESS_KEY');
  console.error('- VITE_R2_BUCKET_NAME');
  process.exit(1);
}

// AWS S3 兼容的签名函数
function sign(key, msg) {
  return crypto.createHmac('sha256', key).update(msg).digest();
}

function getSignatureKey(key, dateStamp, regionName, serviceName) {
  const kDate = sign('AWS4' + key, dateStamp);
  const kRegion = sign(kDate, regionName);
  const kService = sign(kRegion, serviceName);
  const kSigning = sign(kService, 'aws4_request');
  return kSigning;
}

function generateSignature(stringToSign, secretKey, dateStamp, regionName, serviceName) {
  const signatureKey = getSignatureKey(secretKey, dateStamp, regionName, serviceName);
  return crypto.createHmac('sha256', signatureKey).update(stringToSign).digest('hex');
}

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, data: responseData, headers: res.headers });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

// 列出 R2 存储桶中的文件
async function listFiles(prefix = '') {
  const date = new Date();
  const dateStamp = date.toISOString().slice(0, 10).replace(/-/g, '');
  const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  
  const region = 'auto'; // R2 使用 'auto' 作为区域
  const service = 's3';
  
  const canonicalUri = `/${R2_BUCKET_NAME}`;
  const canonicalQueryString = `list-type=2&prefix=${encodeURIComponent(prefix)}`;
  
  const canonicalHeaders = `host:${R2_ACCOUNT_ID}.r2.cloudflarestorage.com\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-date';
  
  const payloadHash = crypto.createHash('sha256').update('').digest('hex');
  
  const canonicalRequest = [
    'GET',
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');
  
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex')
  ].join('\n');
  
  const signature = generateSignature(stringToSign, R2_SECRET_ACCESS_KEY, dateStamp, region, service);
  
  const authorizationHeader = `${algorithm} Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  const options = {
    hostname: `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    port: 443,
    path: `/${R2_BUCKET_NAME}?${canonicalQueryString}`,
    method: 'GET',
    headers: {
      'X-Amz-Date': amzDate,
      'Authorization': authorizationHeader
    }
  };
  
  try {
    const response = await makeRequest(options);
    return response.data;
  } catch (error) {
    console.error('列出文件失败:', error.message);
    throw error;
  }
}

// 获取文件内容
async function getFileContent(key) {
  const date = new Date();
  const dateStamp = date.toISOString().slice(0, 10).replace(/-/g, '');
  const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  
  const region = 'auto';
  const service = 's3';
  
  const canonicalUri = `/${R2_BUCKET_NAME}/${encodeURIComponent(key)}`;
  const canonicalQueryString = '';
  
  const canonicalHeaders = `host:${R2_ACCOUNT_ID}.r2.cloudflarestorage.com\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-date';
  
  const payloadHash = crypto.createHash('sha256').update('').digest('hex');
  
  const canonicalRequest = [
    'GET',
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');
  
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex')
  ].join('\n');
  
  const signature = generateSignature(stringToSign, R2_SECRET_ACCESS_KEY, dateStamp, region, service);
  
  const authorizationHeader = `${algorithm} Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  const options = {
    hostname: `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    port: 443,
    path: `/${R2_BUCKET_NAME}/${encodeURIComponent(key)}`,
    method: 'GET',
    headers: {
      'X-Amz-Date': amzDate,
      'Authorization': authorizationHeader
    }
  };
  
  try {
    const response = await makeRequest(options);
    return response.data;
  } catch (error) {
    if (error.message.includes('HTTP 404')) {
      return null; // 文件不存在
    }
    console.error(`获取文件 ${key} 失败:`, error.message);
    throw error;
  }
}

// 解析 Markdown 文件的 frontmatter
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return {
      frontmatter: {},
      content: content
    };
  }
  
  const frontmatterText = match[1];
  const markdownContent = match[2];
  
  const frontmatter = {};
  frontmatterText.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      
      // 处理引号包围的值
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // 处理数组值（如标签）
      if (value.startsWith('[') && value.endsWith(']')) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // 如果解析失败，按逗号分割
          value = value.slice(1, -1).split(',').map(tag => tag.trim());
        }
      }
      
      frontmatter[key] = value;
    }
  });
  
  return {
    frontmatter,
    content: markdownContent
  };
}

// 生成笔记摘要
function generateExcerpt(content, maxLength = 150) {
  // 移除 Markdown 标记
  const plainText = content
    .replace(/^#+\s+/gm, '') // 移除标题标记
    .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体标记
    .replace(/\*(.*?)\*/g, '$1') // 移除斜体标记
    .replace(/`(.*?)`/g, '$1') // 移除代码标记
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接标记
    .replace(/\n+/g, ' ') // 将换行符替换为空格
    .trim();
  
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  return plainText.substring(0, maxLength).trim() + '...';
}

async function main() {
  try {
    console.log('开始从 R2 获取笔记内容...');
    
    // 列出所有笔记文件
    const xmlResponse = await listFiles('notes/');
    console.log('获取到 XML 响应，正在解析...');
    
    // 解析 XML 获取文件列表
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlResponse, 'text/xml');
    
    const contents = xmlDoc.getElementsByTagName('Contents');
    const files = [];
    
    for (let i = 0; i < contents.length; i++) {
      const content = contents[i];
      const key = content.getElementsByTagName('Key')[0]?.textContent;
      const size = content.getElementsByTagName('Size')[0]?.textContent;
      const lastModified = content.getElementsByTagName('LastModified')[0]?.textContent;
      const etag = content.getElementsByTagName('ETag')[0]?.textContent;
      
      if (key && key.endsWith('.md') && key.startsWith('notes/')) {
        files.push({
          key,
          size: parseInt(size || '0'),
          lastModified: lastModified || '',
          etag: etag?.replace(/"/g, '') || ''
        });
      }
    }
    
    // 按修改时间排序（新到旧）
    files.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    
    console.log(`找到 ${files.length} 个笔记文件`);
    
    const allNotes = [];
    const publicNotes = [];
    
    for (const file of files) {
      try {
        console.log(`正在处理: ${file.key}`);
        const content = await getFileContent(file.key);
        
        if (content) {
          const { frontmatter, content: markdownContent } = parseFrontmatter(content);
          
          const note = {
            id: file.key.replace('notes/', '').replace('.md', ''),
            filename: file.key.split('/').pop(),
            title: frontmatter.title || file.key.split('/').pop().replace('.md', ''),
            content: markdownContent,
            excerpt: generateExcerpt(markdownContent),
            createdDate: frontmatter.createdDate || frontmatter.date || file.lastModified,
            updatedDate: file.lastModified,
            isPrivate: frontmatter.private === true || frontmatter.private === 'true',
            tags: frontmatter.tags || []
          };
          
          allNotes.push(note);
          
          if (!note.isPrivate) {
            publicNotes.push(note);
          }
        }
        
        // 添加延迟避免请求过快
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`处理文件 ${file.key} 时出错:`, error.message);
      }
    }
    
    console.log(`成功处理 ${allNotes.length} 个笔记，其中 ${publicNotes.length} 个为公开笔记`);
    
    // 写入文件
    fs.writeFileSync('public-notes.json', JSON.stringify(publicNotes, null, 2));
    fs.writeFileSync('all-notes.json', JSON.stringify(allNotes, null, 2));
    
    console.log('静态内容文件已生成:');
    console.log('- public-notes.json');
    console.log('- all-notes.json');
    
  } catch (error) {
    console.error('获取笔记内容失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
