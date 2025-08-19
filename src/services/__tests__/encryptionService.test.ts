/**
 * 加密服务单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { EncryptionService } from '../encryptionService'

// Mock Web Crypto API for testing
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      importKey: vi.fn(),
      deriveKey: vi.fn(),
      encrypt: vi.fn(),
      decrypt: vi.fn(),
      exportKey: vi.fn()
    },
    getRandomValues: vi.fn((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    })
  }
})

// Mock TextEncoder/TextDecoder
global.TextEncoder = class TextEncoder {
  encode(input: string): Uint8Array {
    return new Uint8Array(Array.from(input).map(char => char.charCodeAt(0)))
  }
}

global.TextDecoder = class TextDecoder {
  decode(input: Uint8Array): string {
    return String.fromCharCode(...Array.from(input))
  }
}

// Mock btoa/atob
global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64')
global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary')

describe('EncryptionService', () => {
  let encryptionService: EncryptionService

  beforeEach(() => {
    encryptionService = EncryptionService.getInstance()
    vi.clearAllMocks()
  })

  it('应该是单例模式', () => {
    const instance1 = EncryptionService.getInstance()
    const instance2 = EncryptionService.getInstance()
    expect(instance1).toBe(instance2)
  })

  it('应该能检测加密标记', () => {
    const encryptedContent = '---ENCRYPTED---\nencrypteddata123\n---END-ENCRYPTED---'
    const plainContent = 'This is plain text'

    expect(encryptionService.hasEncryptionMarker(encryptedContent)).toBe(true)
    expect(encryptionService.hasEncryptionMarker(plainContent)).toBe(false)
  })

  it('应该能提取加密内容', () => {
    const encryptedData = 'encrypteddata123'
    const markedContent = `---ENCRYPTED---\n${encryptedData}\n---END-ENCRYPTED---`
    
    const extracted = encryptionService.extractEncryptedContent(markedContent)
    expect(extracted).toBe(encryptedData)
  })

  it('应该能添加加密标记', () => {
    const encryptedData = 'encrypteddata123'
    const marked = encryptionService.markAsEncrypted(encryptedData)
    
    expect(marked).toBe(`---ENCRYPTED---\n${encryptedData}\n---END-ENCRYPTED---`)
  })

  it('应该能检测内容是否可能已加密', () => {
    // Base64 格式的内容
    const possibleEncrypted = 'YWJjZGVmZ2hpamtsbW5vcA=='
    const plainText = 'This is plain text with special chars: 中文'

    expect(encryptionService.isEncrypted(possibleEncrypted)).toBe(true)
    expect(encryptionService.isEncrypted(plainText)).toBe(false)
  })

  // 由于 Web Crypto API 的复杂性，这里主要测试接口和基本逻辑
  // 实际的加密/解密功能需要在浏览器环境中测试
  it('应该有正确的加密接口', () => {
    expect(typeof encryptionService.encrypt).toBe('function')
    expect(typeof encryptionService.decrypt).toBe('function')
    expect(typeof encryptionService.verifyPassword).toBe('function')
    expect(typeof encryptionService.hashPassword).toBe('function')
    expect(typeof encryptionService.verifyPasswordHash).toBe('function')
  })
})
