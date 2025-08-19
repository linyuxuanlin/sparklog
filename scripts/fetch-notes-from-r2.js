#!/usr/bin/env node

/**
 * 从 Cloudflare R2 获取笔记内容的脚本
 * 用于 GitHub Actions 自动构建
 */

const https = require('https');
const crypto = require('crypto');

// 环境变量
const R2_ACCOUNT_ID = process.env.VITE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.VITE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.VITE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.VITE_R2_BUCKET_NAME;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error('错误: 缺少必要的 R2 环境变量');
  process.exit(1);
}

// AWS S3 兼容的签名函数
function sign(key, msg) {
  return crypto.createHmac('sha256', key).update(msg).digest();
}

function getSignatureKey(key, dateStamp, regionName, serviceName) {
  const kDate = sign(`AWS4${key}`, dateStamp);
  const kRegion = sign(kDate, regionName);
  const kService = sign(kRegion, serviceName);
  const kSigning = sign(kService, 'aws4_request');
  return kSigning;
}

// 生成 AWS 签名
function generateSignature(method, path, headers, body = '') {
  const datetime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const date = datetime.substr(0, 8);
  
  const canonicalUri = path;
  const canonicalQueryString = '';
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map(key => `${key.toLowerCase()}:${headers[key]}`)
    .join('\n') + '\n';
  
  const signedHeaders = Object.keys(headers)
    .sort()
    .map(key => key.toLowerCase())
    .join(';');
  
  const payloadHash = crypto.createHash('sha256').update(body).digest('hex');
  
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');
  
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${date}/auto/s3/aws4_request`;
  const stringToSign = [
    algorithm,
    datetime,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex')
  ].join('\n');
  
  const signingKey = getSignatureKey(R2_SECRET_ACCESS_KEY, date, 'auto', 's3');
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  
  return {
    authorization: `${algorithm} Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    'x-amz-date': datetime
  };
}

// 发送 HTTP 请求
function makeRequest(method, path, headers = {}, body = '') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      port: 443,
      path: `/${R2_BUCKET_NAME}${path}`,
      method: method,
      headers: {
        'Host': `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, data, headers: res.headers });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

// 列出存储桶中的文件
async function listFiles(prefix = '') {
  try {
    const path = prefix ? `?list-type=2&prefix=${encodeURIComponent(prefix)}` : '?list-type=2';
    const headers = generateSignature('GET', `/${R2_BUCKET_NAME}${path}`, {
      'host': `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    });

    const response = await makeRequest('GET', path, headers);
    
    // 解析 XML 响应
    const files = [];
    const contentMatch = response.data.match(/<Contents>([\s\S]*?)<\/Content>/g);
    
    if (contentMatch) {
      for (const content of contentMatch) {
        const keyMatch = content.match(/<Key>([^<]+)<\/Key>/);
        const sizeMatch = content.match(/<Size>([^<]+)<\/Size>/);
        const lastModifiedMatch = content.match(/<LastModified>([^<]+)<\/LastModified>/);
        const etagMatch = content.match(/<ETag>"([^"]+)"<\/ETag>/);
        
        if (keyMatch && keyMatch[1].endsWith('.md')) {
          files.push({
            key: keyMatch[1],
            size: parseInt(sizeMatch ? sizeMatch[1] : '0'),
            lastModified: lastModifiedMatch ? lastModifiedMatch[1] : '',
            etag: etagMatch ? etagMatch[1] : ''
          });
        }
      }
    }
    
    return files;
  } catch (error) {
    console.error('列出文件失败:', error.message);
    return [];
  }
}

// 获取文件内容
async function getFileContent(key) {
  try {
    const headers = generateSignature('GET', `/${R2_BUCKET_NAME}/${key}`, {
      'host': `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    });

    const response = await makeRequest('GET', `/${key}`, headers);
    return response.data;
  } catch (error) {
    console.error(`获取文件内容失败 ${key}:`, error.message);
    return null;
  }
}

// 主函数
async function main() {
  try {
    console.log('开始从 R2 获取笔记内容...');
    
    // 列出所有 markdown 文件
    const files = await listFiles('notes/');
    console.log(`找到 ${files.length} 个 markdown 文件`);
    
    if (files.length === 0) {
      console.log('没有找到笔记文件，创建空的静态内容文件');
      const emptyNotes = [];
      require('fs').writeFileSync('public-notes.json', JSON.stringify(emptyNotes, null, 2));
      require('fs').writeFileSync('all-notes.json', JSON.stringify(emptyNotes, null, 2));
      return;
    }
    
    // 按文件名中的时间戳排序（新到旧）
    files.sort((a, b) => {
      const timeA = a.key.replace(/\.md$/, '').split('-').slice(0, 6).join('-');
      const timeB = b.key.replace(/\.md$/, '').split('-').slice(0, 6).join('-');
      return timeB.localeCompare(timeA);
    });
    
    // 获取所有文件内容
    const allNotes = [];
    const publicNotes = [];
    
    for (const file of files) {
      console.log(`处理文件: ${file.key}`);
      const content = await getFileContent(file.key);
      
      if (content) {
        // 解析笔记内容（简单的 frontmatter 解析）
        const lines = content.split('\n');
        let title = '';
        let isPrivate = false;
        let tags = [];
        let contentStart = 0;
        
        // 查找 frontmatter
        if (lines[0] === '---') {
          for (let i = 1; i < lines.length; i++) {
            if (lines[i] === '---') {
              contentStart = i + 1;
              break;
            }
            
            const [key, ...valueParts] = lines[i].split(':');
            const value = valueParts.join(':').trim();
            
            if (key === 'title') {
              title = value;
            } else if (key === 'private') {
              isPrivate = value.toLowerCase() === 'true';
            } else if (key === 'tags') {
              tags = value.split(',').map(tag => tag.trim());
            }
          }
        }
        
        // 如果没有标题，使用文件名
        if (!title) {
          title = file.key.split('/').pop().replace(/\.md$/, '');
        }
        
        // 提取内容预览
        const contentText = lines.slice(contentStart).join('\n');
        const contentPreview = contentText.length > 200 
          ? contentText.substring(0, 200) + '...'
          : contentText;
        
        const note = {
          id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          filename: file.key.split('/').pop(),
          path: file.key,
          title,
          content: contentText,
          excerpt: contentPreview,
          createdDate: file.lastModified,
          updatedDate: file.lastModified,
          isPrivate,
          tags,
          size: file.size
        };
        
        allNotes.push(note);
        
        // 只将公开笔记添加到公开列表
        if (!isPrivate) {
          publicNotes.push(note);
        }
      }
      
      // 添加延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`成功处理 ${allNotes.length} 个笔记，其中 ${publicNotes.length} 个为公开`);
    
    // 写入静态内容文件
    require('fs').writeFileSync('public-notes.json', JSON.stringify(publicNotes, null, 2));
    require('fs').writeFileSync('all-notes.json', JSON.stringify(allNotes, null, 2));
    
    console.log('静态内容文件已生成');
    
  } catch (error) {
    console.error('获取笔记内容失败:', error);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}
