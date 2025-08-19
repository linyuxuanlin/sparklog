import { getR2Config } from '@/config/env'

interface R2File {
  name: string
  path: string
  size: number
  uploaded: string
  etag: string
  content?: string
}

interface R2UploadResponse {
  success: boolean
  etag?: string
  error?: string
}

export class R2Service {
  private static instance: R2Service
  private config: any = null
  private cache: Map<string, { data: any, timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

  private constructor() {
    this.initializeConfig()
  }

  static getInstance(): R2Service {
    if (!R2Service.instance) {
      R2Service.instance = new R2Service()
    }
    return R2Service.instance
  }

  private initializeConfig() {
    this.config = getR2Config()
    if (!this.config) {
      console.warn('R2 配置未找到，请检查环境变量')
    }
  }

  // 获取 API 端点 - 优先使用 GitHub Actions 代理
  private getEndpoint(): string {
    if (!this.config) {
      throw new Error('R2 配置未初始化')
    }
    
    // 检查是否有 GitHub Actions 代理 URL
    const proxyUrl = import.meta.env.VITE_R2_PROXY_URL
    if (proxyUrl) {
      return proxyUrl
    }
    
    // 回退到直接 R2 访问（可能遇到 CORS 问题）
    return `https://${this.config.accountId}.r2.cloudflarestorage.com`
  }

  // 检查是否使用代理
  private isUsingProxy(): boolean {
    return !!import.meta.env.VITE_R2_PROXY_URL
  }

  private getHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...additionalHeaders
    }
    
    // 如果使用代理，不需要 AWS 签名
    if (!this.isUsingProxy()) {
      headers['Authorization'] = `AWS4-HMAC-SHA256 Credential=${this.config.accessKeyId}`
    }
    
    return headers
  }

  private isValidCache(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey)
    if (!cached) return false
    return Date.now() - cached.timestamp < this.CACHE_DURATION
  }

  // 清除缓存
  public clearCache(): void {
    this.cache.clear()
    console.log('R2 服务缓存已清除')
  }

  // 获取存储桶中的所有文件
  async listFiles(prefix: string = ''): Promise<R2File[]> {
    if (!this.config) {
      throw new Error('R2 配置未初始化')
    }

    const cacheKey = `list-${prefix}`
    if (this.isValidCache(cacheKey)) {
      console.log('使用缓存的文件列表')
      return this.cache.get(cacheKey)!.data
    }

    try {
      const endpoint = this.getEndpoint()
      let url: string
      
      if (this.isUsingProxy()) {
        // 使用代理时，路径直接传递
        url = `${endpoint}/${prefix}?list-type=2`
      } else {
        // 直接访问 R2 时，需要完整的存储桶路径
        url = `${endpoint}/${this.config.bucketName}?list-type=2&prefix=${encodeURIComponent(prefix)}`
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`R2 API 错误: ${response.status} - ${response.statusText}`)
      }

      let files: R2File[] = []
      
      if (this.isUsingProxy()) {
        // 代理返回 JSON 格式
        const data = await response.json()
        files = data.objects?.map((obj: any) => ({
          name: obj.key.split('/').pop() || obj.key,
          path: obj.key,
          size: obj.size || 0,
          uploaded: obj.uploaded || obj.etag || '',
          etag: obj.etag || ''
        })) || []
      } else {
        // 直接访问 R2 时解析 XML
        const data = await response.text()
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(data, 'text/xml')
        
        const contents = xmlDoc.getElementsByTagName('Contents')
        
        for (let i = 0; i < contents.length; i++) {
          const content = contents[i]
          const key = content.getElementsByTagName('Key')[0]?.textContent
          const size = content.getElementsByTagName('Size')[0]?.textContent
          const lastModified = content.getElementsByTagName('LastModified')[0]?.textContent
          const etag = content.getElementsByTagName('ETag')[0]?.textContent

          if (key && key.endsWith('.md')) {
            files.push({
              name: key.split('/').pop() || key,
              path: key,
              size: parseInt(size || '0'),
              uploaded: lastModified || '',
              etag: etag?.replace(/"/g, '') || ''
            })
          }
        }
      }

      // 按文件名中的时间戳排序（新到旧）
      const sortedFiles = files.sort((a, b) => {
        const timeA = a.name.replace(/\.md$/, '').split('-').slice(0, 6).join('-')
        const timeB = b.name.replace(/\.md$/, '').split('-').slice(0, 6).join('-')
        return timeB.localeCompare(timeA)
      })

      // 缓存结果
      this.cache.set(cacheKey, {
        data: sortedFiles,
        timestamp: Date.now()
      })

      return sortedFiles
    } catch (error) {
      console.error('获取 R2 文件列表失败:', error)
      throw error
    }
  }

  // 获取文件内容
  async getFileContent(path: string): Promise<string | null> {
    if (!this.config) {
      throw new Error('R2 配置未初始化')
    }

    const cacheKey = `content-${path}`
    if (this.isValidCache(cacheKey)) {
      console.log('使用缓存的文件内容')
      return this.cache.get(cacheKey)!.data
    }

    try {
      const endpoint = this.getEndpoint()
      let url: string
      
      if (this.isUsingProxy()) {
        // 使用代理时，路径直接传递
        url = `${endpoint}/${path}`
      } else {
        // 直接访问 R2 时，需要完整的存储桶路径
        url = `${endpoint}/${this.config.bucketName}/${encodeURIComponent(path)}`
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`R2 API 错误: ${response.status} - ${response.statusText}`)
      }

      const content = await response.text()
      
      // 缓存结果
      this.cache.set(cacheKey, {
        data: content,
        timestamp: Date.now()
      })

      return content
    } catch (error) {
      console.error('获取 R2 文件内容失败:', error)
      throw error
    }
  }

  // 上传文件
  async uploadFile(path: string, content: string, isPrivate: boolean = false): Promise<R2UploadResponse> {
    if (!this.config) {
      throw new Error('R2 配置未初始化')
    }

    try {
      const endpoint = this.getEndpoint()
      let url: string
      
      if (this.isUsingProxy()) {
        // 使用代理时，路径直接传递
        url = `${endpoint}/${path}`
      } else {
        // 直接访问 R2 时，需要完整的存储桶路径
        url = `${endpoint}/${this.config.bucketName}/${encodeURIComponent(path)}`
      }
      
      // 如果是私密笔记，进行加密
      let finalContent = content
      if (isPrivate) {
        finalContent = await this.encryptContent(content)
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders({
          'Content-Length': finalContent.length.toString()
        }),
        body: finalContent
      })

      if (!response.ok) {
        throw new Error(`R2 上传失败: ${response.status} - ${response.statusText}`)
      }

      const etag = response.headers.get('ETag')?.replace(/"/g, '')
      
      // 清除相关缓存
      this.cache.delete(`list-`)
      this.cache.delete(`content-${path}`)

      return {
        success: true,
        etag
      }
    } catch (error) {
      console.error('R2 上传失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  // 删除文件
  async deleteFile(path: string): Promise<boolean> {
    if (!this.config) {
      throw new Error('R2 配置未初始化')
    }

    try {
      const endpoint = this.getEndpoint()
      let url: string
      
      if (this.isUsingProxy()) {
        // 使用代理时，路径直接传递
        url = `${endpoint}/${path}`
      } else {
        // 直接访问 R2 时，需要完整的存储桶路径
        url = `${endpoint}/${this.config.bucketName}/${encodeURIComponent(path)}`
      }
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`R2 删除失败: ${response.status} - ${response.statusText}`)
      }

      // 清除相关缓存
      this.cache.delete(`list-`)
      this.cache.delete(`content-${path}`)

      return true
    } catch (error) {
      console.error('R2 删除失败:', error)
      throw error
    }
  }

  // 批量获取文件内容
  async getBatchFileContent(files: R2File[]): Promise<Record<string, string>> {
    if (!this.config || files.length === 0) {
      return {}
    }

    const batchResponses: Record<string, string> = {}
    const batchSize = 5 // 每批处理5个请求

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize)
      
      // 并发处理当前批次
      const batchPromises = batch.map(async (file) => {
        try {
          const content = await this.getFileContent(file.path)
          if (content !== null) {
            return {
              path: file.path,
              content
            }
          }
          return null
        } catch (error) {
          console.error(`获取文件内容失败: ${file.name}`, error)
          return null
        }
      })

      // 等待当前批次完成
      const batchResults = await Promise.all(batchPromises)
      
      // 处理批次结果
      batchResults.forEach(result => {
        if (result) {
          batchResponses[result.path] = result.content
        }
      })

      // 批次间延迟
      if (i + batchSize < files.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return batchResponses
  }

  // 加密内容（使用 Web Crypto API）
  private async encryptContent(content: string): Promise<string> {
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(content)
      
      // 生成随机密钥
      const key = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      )

      // 生成随机 IV
      const iv = crypto.getRandomValues(new Uint8Array(12))
      
      // 加密数据
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        data
      )

      // 导出密钥
      const exportedKey = await crypto.subtle.exportKey('raw', key)
      
      // 组合 IV、密钥和加密数据
      const combined = new Uint8Array(iv.length + exportedKey.byteLength + encryptedData.byteLength)
      combined.set(iv, 0)
      combined.set(new Uint8Array(exportedKey), iv.length)
      combined.set(new Uint8Array(encryptedData), iv.length + exportedKey.byteLength)
      
      // 转换为 base64
      return btoa(String.fromCharCode(...combined))
    } catch (error) {
      console.error('加密失败:', error)
      throw new Error('内容加密失败')
    }
  }

  // 解密内容
  async decryptContent(encryptedContent: string): Promise<string | null> {
    try {
      // 从 base64 转换
      const combined = new Uint8Array(
        atob(encryptedContent).split('').map(char => char.charCodeAt(0))
      )
      
      // 提取 IV、密钥和加密数据
      const iv = combined.slice(0, 12)
      const exportedKey = combined.slice(12, 44)
      const encryptedData = combined.slice(44)
      
      // 导入密钥
      const key = await crypto.subtle.importKey(
        'raw',
        exportedKey,
        {
          name: 'AES-GCM',
          length: 256
        },
        false,
        ['decrypt']
      )
      
      // 解密数据
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        encryptedData
      )
      
      // 转换为文本
      const decoder = new TextDecoder()
      return decoder.decode(decryptedData)
    } catch (error) {
      console.error('解密失败:', error)
      return null
    }
  }
}
