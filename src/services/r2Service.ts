import { getR2Config, isCorsProxyEnabled, getCorsProxyUrl } from '@/config/env'

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

  private getEndpoint(): string {
    if (!this.config) {
      throw new Error('R2 配置未初始化')
    }
    return `https://${this.config.accountId}.r2.cloudflarestorage.com`
  }

  // 获取 CORS 代理 URL
  private getCorsProxyUrl(): string | null {
    // 优先使用环境变量配置的代理
    const envProxy = getCorsProxyUrl()
    if (envProxy) {
      return envProxy
    }
    
    // 备选公共 CORS 代理服务
    const corsProxies = [
      'https://cors-anywhere.herokuapp.com/',
      'https://api.allorigins.win/raw?url=',
      'https://corsproxy.io/?'
    ]
    
    // 返回第一个可用的代理
    return corsProxies[0] || null
  }

  private getHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    // 简化请求头以避免 CORS 预检请求
    const baseHeaders: Record<string, string> = {}
    
    // 只在需要时添加 Authorization 头
    if (this.config?.accessKeyId) {
      baseHeaders['Authorization'] = `AWS4-HMAC-SHA256 Credential=${this.config.accessKeyId}`
    }
    
    // 只在需要时添加 Content-Type
    if (additionalHeaders['Content-Type']) {
      baseHeaders['Content-Type'] = additionalHeaders['Content-Type']
    }
    
    return {
      ...baseHeaders,
      ...additionalHeaders
    }
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
      const url = `${endpoint}/${this.config.bucketName}?list-type=2&prefix=${encodeURIComponent(prefix)}`
      
      // CORS 绕过策略
      let response: Response
      
      // 如果启用了 CORS 代理模式，直接使用代理
      if (isCorsProxyEnabled()) {
        const proxyUrl = this.getCorsProxyUrl()
        if (proxyUrl) {
          console.log('CORS 代理模式已启用，使用代理服务:', proxyUrl)
          const proxyFullUrl = `${proxyUrl}${encodeURIComponent(url)}`
          response = await fetch(proxyFullUrl, {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit'
          })
        } else {
          throw new Error('CORS 代理模式已启用但未配置代理 URL')
        }
      } else {
        // 尝试多种 CORS 绕过策略
        try {
          // 策略 1: 标准 CORS 请求
          response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit',
            headers: this.getHeaders(),
            cache: 'default'
          })
        } catch (corsError) {
          console.warn('CORS 请求失败，尝试无模式请求:', corsError)
          
          // 策略 2: 无模式请求（可能绕过某些 CORS 限制）
          try {
            response = await fetch(url, {
              method: 'GET',
              mode: 'no-cors',
              credentials: 'omit',
              headers: this.getHeaders(),
              cache: 'default'
            })
          } catch (noCorsError) {
            console.warn('无模式请求也失败，尝试代理方式:', noCorsError)
            
            // 策略 3: 使用公共 R2 访问点（如果配置了）
            if (this.config.publicUrl) {
              const publicUrl = `${this.config.publicUrl}/list?prefix=${encodeURIComponent(prefix)}`
              response = await fetch(publicUrl, {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit'
              })
            } else {
              // 策略 4: 使用 CORS 代理服务作为最后的备选方案
              const proxyUrl = this.getCorsProxyUrl()
              if (proxyUrl) {
                console.log('使用 CORS 代理服务:', proxyUrl)
                const proxyFullUrl = `${proxyUrl}${encodeURIComponent(url)}`
                response = await fetch(proxyFullUrl, {
                  method: 'GET',
                  mode: 'cors',
                  credentials: 'omit'
                })
              } else {
                throw new Error('所有 CORS 绕过策略都失败了，请配置 R2 存储桶的 CORS 策略、设置 publicUrl 或使用 CORS 代理服务')
              }
            }
          }
        }
      }

      if (!response.ok) {
        throw new Error(`R2 API 错误: ${response.status} - ${response.statusText}`)
      }

      const data = await response.text()
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(data, 'text/xml')
      
      const contents = xmlDoc.getElementsByTagName('Contents')
      const files: R2File[] = []

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
      const url = `${endpoint}/${this.config.bucketName}/${encodeURIComponent(path)}`
      
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: this.getHeaders(),
        // 添加 CORS 友好的配置
        cache: 'default'
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
      const url = `${endpoint}/${this.config.bucketName}/${encodeURIComponent(path)}`
      
      // 如果是私密笔记，进行加密
      let finalContent = content
      if (isPrivate) {
        finalContent = await this.encryptContent(content)
      }

      const response = await fetch(url, {
        method: 'PUT',
        mode: 'cors',
        credentials: 'omit',
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
      const url = `${endpoint}/${this.config.bucketName}/${encodeURIComponent(path)}`
      
      const response = await fetch(url, {
        method: 'DELETE',
        mode: 'cors',
        credentials: 'omit',
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
