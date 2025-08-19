/**
 * 加密服务
 * 负责私密笔记的加密和解密
 * 使用 AES-GCM 算法确保安全性
 */

export interface EncryptionResult {
  success: boolean
  data?: string
  error?: string
}

export interface DecryptionResult {
  success: boolean
  data?: string
  error?: string
}

export class EncryptionService {
  private static instance: EncryptionService
  private encoder = new TextEncoder()
  private decoder = new TextDecoder()

  private constructor() {}

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService()
    }
    return EncryptionService.instance
  }

  /**
   * 从密码生成加密密钥
   */
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      this.encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    )

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
  }

  /**
   * 生成随机盐值
   */
  private generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16))
  }

  /**
   * 生成随机初始向量
   */
  private generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(12))
  }

  /**
   * 将数组转换为 Base64 字符串
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /**
   * 将 Base64 字符串转换为数组
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  /**
   * 加密文本内容
   */
  async encrypt(plaintext: string, password: string): Promise<EncryptionResult> {
    try {
      // 生成盐值和初始向量
      const salt = this.generateSalt()
      const iv = this.generateIV()

      // 从密码生成密钥
      const key = await this.deriveKey(password, salt)

      // 加密数据
      const plaintextBuffer = this.encoder.encode(plaintext)
      const ciphertextBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        plaintextBuffer
      )

      // 组合盐值、初始向量和密文
      const combinedBuffer = new Uint8Array(
        salt.length + iv.length + ciphertextBuffer.byteLength
      )
      combinedBuffer.set(salt, 0)
      combinedBuffer.set(iv, salt.length)
      combinedBuffer.set(new Uint8Array(ciphertextBuffer), salt.length + iv.length)

      // 转换为 Base64
      const encryptedData = this.arrayBufferToBase64(combinedBuffer.buffer)

      return {
        success: true,
        data: encryptedData
      }
    } catch (error) {
      console.error('加密失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '加密失败'
      }
    }
  }

  /**
   * 解密文本内容
   */
  async decrypt(encryptedData: string, password: string): Promise<DecryptionResult> {
    try {
      // 从 Base64 转换为数组
      const combinedBuffer = this.base64ToArrayBuffer(encryptedData)
      const combinedArray = new Uint8Array(combinedBuffer)

      // 提取盐值、初始向量和密文
      const salt = combinedArray.slice(0, 16)
      const iv = combinedArray.slice(16, 28)
      const ciphertext = combinedArray.slice(28)

      // 从密码生成密钥
      const key = await this.deriveKey(password, salt)

      // 解密数据
      const plaintextBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        ciphertext
      )

      // 转换为字符串
      const plaintext = this.decoder.decode(plaintextBuffer)

      return {
        success: true,
        data: plaintext
      }
    } catch (error) {
      console.error('解密失败:', error)
      
      // 区分不同类型的错误
      let errorMessage = '解密失败'
      if (error instanceof Error) {
        if (error.message.includes('decrypt')) {
          errorMessage = '密码错误或数据已损坏'
        } else {
          errorMessage = error.message
        }
      }

      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * 验证密码是否正确（通过尝试解密一个测试字符串）
   */
  async verifyPassword(password: string): Promise<boolean> {
    try {
      const testString = 'SparkLog-Password-Verification-Test'
      const encrypted = await this.encrypt(testString, password)
      
      if (!encrypted.success || !encrypted.data) {
        return false
      }

      const decrypted = await this.decrypt(encrypted.data, password)
      return decrypted.success && decrypted.data === testString
    } catch (error) {
      console.error('密码验证失败:', error)
      return false
    }
  }

  /**
   * 生成密码哈希（用于验证）
   */
  async hashPassword(password: string): Promise<string> {
    const salt = this.generateSalt()
    const key = await this.deriveKey(password, salt)
    
    // 导出密钥的原始数据
    const keyData = await crypto.subtle.exportKey('raw', key)
    
    // 组合盐值和密钥哈希
    const combined = new Uint8Array(salt.length + keyData.byteLength)
    combined.set(salt, 0)
    combined.set(new Uint8Array(keyData), salt.length)
    
    return this.arrayBufferToBase64(combined.buffer)
  }

  /**
   * 验证密码哈希
   */
  async verifyPasswordHash(password: string, hash: string): Promise<boolean> {
    try {
      const combined = this.base64ToArrayBuffer(hash)
      const combinedArray = new Uint8Array(combined)
      
      // 提取盐值
      const salt = combinedArray.slice(0, 16)
      const expectedKeyData = combinedArray.slice(16)
      
      // 使用相同盐值生成密钥
      const key = await this.deriveKey(password, salt)
      const keyData = await crypto.subtle.exportKey('raw', key)
      
      // 比较密钥数据
      const actualKeyArray = new Uint8Array(keyData)
      
      if (actualKeyArray.length !== expectedKeyData.length) {
        return false
      }
      
      for (let i = 0; i < actualKeyArray.length; i++) {
        if (actualKeyArray[i] !== expectedKeyData[i]) {
          return false
        }
      }
      
      return true
    } catch (error) {
      console.error('密码哈希验证失败:', error)
      return false
    }
  }

  /**
   * 检查内容是否已加密
   */
  isEncrypted(content: string): boolean {
    try {
      // 首先检查是否包含加密标记
      if (content.includes('---ENCRYPTED---') && content.includes('---END-ENCRYPTED---')) {
        return true
      }
      
      // 尝试解析为 Base64，如果成功且长度合理，可能是加密内容
      const decoded = atob(content)
      
      // 加密内容应该至少包含盐值(16) + IV(12) + 一些密文
      return decoded.length >= 32 && content.match(/^[A-Za-z0-9+/]+=*$/) !== null
    } catch {
      return false
    }
  }

  /**
   * 为笔记内容添加加密标记
   */
  markAsEncrypted(encryptedContent: string): string {
    return `---ENCRYPTED---\n${encryptedContent}\n---END-ENCRYPTED---`
  }

  /**
   * 提取加密标记中的内容
   */
  extractEncryptedContent(markedContent: string): string | null {
    const match = markedContent.match(/---ENCRYPTED---\n([\s\S]*?)\n---END-ENCRYPTED---/)
    return match ? match[1] : null
  }

  /**
   * 检查内容是否有加密标记
   */
  hasEncryptionMarker(content: string): boolean {
    return content.includes('---ENCRYPTED---') && content.includes('---END-ENCRYPTED---')
  }
}
