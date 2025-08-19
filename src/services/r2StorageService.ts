/**
 * Cloudflare R2 存储服务
 * 负责笔记文件的上传、下载、删除等操作
 */

export interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  publicUrl?: string
}

export interface R2UploadResult {
  success: boolean
  key: string
  url?: string
  etag?: string
  message?: string
}

export interface R2DownloadResult {
  success: boolean
  content?: string
  lastModified?: Date
  etag?: string
  message?: string
}

export class R2StorageService {
  private static instance: R2StorageService
  private config: R2Config | null = null

  private constructor() {}

  static getInstance(): R2StorageService {
    if (!R2StorageService.instance) {
      R2StorageService.instance = new R2StorageService()
    }
    return R2StorageService.instance
  }

  /**
   * 初始化 R2 配置
   */
  initialize(config: R2Config) {
    this.config = config
    console.log('R2 存储服务已初始化:', {
      accountId: config.accountId,
      bucketName: config.bucketName,
      hasAccessKey: !!config.accessKeyId
    })
  }

  /**
   * 检查配置是否有效
   */
  private checkConfig(): R2Config {
    if (!this.config) {
      throw new Error('R2 存储服务未初始化，请先调用 initialize() 方法')
    }
    return this.config
  }

  /**
   * 生成 S3 兼容的签名
   */
  private async generateSignature(
    method: string,
    path: string,
    headers: Record<string, string>,
    payload: string = ''
  ): Promise<string> {
    const config = this.checkConfig()
    
    // 使用 Web Crypto API 生成 AWS V4 签名
    const region = 'auto' // Cloudflare R2 使用 'auto' 作为区域
    const service = 's3'
    const algorithm = 'AWS4-HMAC-SHA256'
    
    const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '')
    const date = timestamp.substr(0, 8)
    
    // 构建规范请求
    const canonicalHeaders = Object.keys(headers)
      .sort()
      .map(key => `${key.toLowerCase()}:${headers[key]}`)
      .join('\n')
    
    const signedHeaders = Object.keys(headers)
      .sort()
      .map(key => key.toLowerCase())
      .join(';')
    
    const payloadHash = await this.sha256(payload)
    
    const canonicalRequest = [
      method,
      path,
      '', // 查询字符串
      canonicalHeaders,
      '',
      signedHeaders,
      payloadHash
    ].join('\n')
    
    const canonicalRequestHash = await this.sha256(canonicalRequest)
    
    // 构建签名字符串
    const credentialScope = `${date}/${region}/${service}/aws4_request`
    const stringToSign = [
      algorithm,
      timestamp,
      credentialScope,
      canonicalRequestHash
    ].join('\n')
    
    // 生成签名密钥
    const kDate = await this.hmacSha256(`AWS4${config.secretAccessKey}`, date)
    const kRegion = await this.hmacSha256(kDate, region)
    const kService = await this.hmacSha256(kRegion, service)
    const kSigning = await this.hmacSha256(kService, 'aws4_request')
    
    // 生成最终签名
    const signature = await this.hmacSha256(kSigning, stringToSign, true)
    
    return `${algorithm} Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
  }

  /**
   * SHA256 哈希
   */
  private async sha256(message: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(message)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * HMAC-SHA256
   */
  private async hmacSha256(key: string | ArrayBuffer, message: string, hex: boolean = false): Promise<string | ArrayBuffer> {
    const encoder = new TextEncoder()
    
    let keyBuffer: ArrayBuffer
    if (typeof key === 'string') {
      keyBuffer = encoder.encode(key)
    } else {
      keyBuffer = key
    }
    
    const messageBuffer = encoder.encode(message)
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageBuffer)
    
    if (hex) {
      const hashArray = Array.from(new Uint8Array(signature))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }
    
    return signature
  }

  /**
   * 生成 R2 API 端点 URL
   */
  private getApiUrl(key?: string): string {
    const config = this.checkConfig()
    const baseUrl = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucketName}`
    return key ? `${baseUrl}/${key}` : baseUrl
  }

  /**
   * 上传笔记文件到 R2
   */
  async uploadNote(key: string, content: string, contentType: string = 'text/markdown'): Promise<R2UploadResult> {
    try {
      const config = this.checkConfig()
      const url = this.getApiUrl(key)
      
      const headers: Record<string, string> = {
        'Content-Type': contentType,
        'Content-Length': content.length.toString(),
        'Host': `${config.accountId}.r2.cloudflarestorage.com`,
        'X-Amz-Date': new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '')
      }
      
      // 生成授权签名
      const authorization = await this.generateSignature('PUT', `/${config.bucketName}/${key}`, headers, content)
      headers['Authorization'] = authorization
      
      console.log('上传笔记到 R2:', { key, url, contentLength: content.length })
      
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: content
      })
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new Error(`R2 上传失败: ${response.status} ${response.statusText} - ${errorText}`)
      }
      
      const etag = response.headers.get('ETag')
      
      return {
        success: true,
        key,
        url,
        etag: etag || undefined,
        message: '笔记上传成功'
      }
      
    } catch (error) {
      console.error('R2 上传失败:', error)
      return {
        success: false,
        key,
        message: error instanceof Error ? error.message : '上传失败'
      }
    }
  }

  /**
   * 从 R2 下载笔记文件
   */
  async downloadNote(key: string): Promise<R2DownloadResult> {
    try {
      const config = this.checkConfig()
      const url = this.getApiUrl(key)
      
      const headers: Record<string, string> = {
        'Host': `${config.accountId}.r2.cloudflarestorage.com`,
        'X-Amz-Date': new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '')
      }
      
      // 生成授权签名
      const authorization = await this.generateSignature('GET', `/${config.bucketName}/${key}`, headers)
      headers['Authorization'] = authorization
      
      console.log('从 R2 下载笔记:', { key, url })
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            message: '笔记文件不存在'
          }
        }
        const errorText = await response.text().catch(() => '')
        throw new Error(`R2 下载失败: ${response.status} ${response.statusText} - ${errorText}`)
      }
      
      const content = await response.text()
      const lastModified = response.headers.get('Last-Modified')
      const etag = response.headers.get('ETag')
      
      return {
        success: true,
        content,
        lastModified: lastModified ? new Date(lastModified) : undefined,
        etag: etag || undefined,
        message: '笔记下载成功'
      }
      
    } catch (error) {
      console.error('R2 下载失败:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '下载失败'
      }
    }
  }

  /**
   * 删除 R2 中的笔记文件
   */
  async deleteNote(key: string): Promise<R2UploadResult> {
    try {
      const config = this.checkConfig()
      const url = this.getApiUrl(key)
      
      const headers: Record<string, string> = {
        'Host': `${config.accountId}.r2.cloudflarestorage.com`,
        'X-Amz-Date': new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '')
      }
      
      // 生成授权签名
      const authorization = await this.generateSignature('DELETE', `/${config.bucketName}/${key}`, headers)
      headers['Authorization'] = authorization
      
      console.log('从 R2 删除笔记:', { key, url })
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers
      })
      
      if (!response.ok && response.status !== 404) {
        const errorText = await response.text().catch(() => '')
        throw new Error(`R2 删除失败: ${response.status} ${response.statusText} - ${errorText}`)
      }
      
      return {
        success: true,
        key,
        message: '笔记删除成功'
      }
      
    } catch (error) {
      console.error('R2 删除失败:', error)
      return {
        success: false,
        key,
        message: error instanceof Error ? error.message : '删除失败'
      }
    }
  }

  /**
   * 列出 R2 中的所有笔记文件
   */
  async listNotes(prefix: string = 'notes/', maxKeys: number = 1000): Promise<{
    success: boolean
    keys: string[]
    message?: string
  }> {
    try {
      const config = this.checkConfig()
      const url = `${this.getApiUrl()}?list-type=2&prefix=${encodeURIComponent(prefix)}&max-keys=${maxKeys}`
      
      const headers: Record<string, string> = {
        'Host': `${config.accountId}.r2.cloudflarestorage.com`,
        'X-Amz-Date': new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '')
      }
      
      // 生成授权签名
      const authorization = await this.generateSignature('GET', `/${config.bucketName}/?list-type=2&prefix=${encodeURIComponent(prefix)}&max-keys=${maxKeys}`, headers)
      headers['Authorization'] = authorization
      
      console.log('列出 R2 笔记文件:', { prefix, maxKeys })
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      })
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new Error(`R2 列表失败: ${response.status} ${response.statusText} - ${errorText}`)
      }
      
      const xmlText = await response.text()
      
      // 简单的 XML 解析，提取 Key 元素
      const keyMatches = xmlText.match(/<Key>([^<]+)<\/Key>/g) || []
      const keys = keyMatches
        .map(match => match.replace(/<\/?Key>/g, ''))
        .filter(key => key.endsWith('.md'))
        .sort()
        .reverse() // 按时间倒序（文件名包含时间戳）
      
      return {
        success: true,
        keys,
        message: `找到 ${keys.length} 个笔记文件`
      }
      
    } catch (error) {
      console.error('R2 列表失败:', error)
      return {
        success: false,
        keys: [],
        message: error instanceof Error ? error.message : '列表失败'
      }
    }
  }

  /**
   * 检查 R2 连接状态
   */
  async checkConnection(): Promise<boolean> {
    try {
      const result = await this.listNotes('notes/', 1)
      return result.success
    } catch (error) {
      console.error('R2 连接检查失败:', error)
      return false
    }
  }
}
