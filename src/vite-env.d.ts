/// <reference types="vite/client" />

interface ImportMetaEnv {
  // 管理员配置
  readonly VITE_ADMIN_PASSWORD?: string
  
  // Cloudflare R2 存储配置
  readonly VITE_R2_ACCOUNT_ID?: string
  readonly VITE_R2_ACCESS_KEY_ID?: string
  readonly VITE_R2_SECRET_ACCESS_KEY?: string
  readonly VITE_R2_BUCKET_NAME?: string
  readonly VITE_R2_PUBLIC_URL?: string
  
  // 应用配置
  readonly VITE_APP_TITLE?: string
  readonly VITE_APP_DESCRIPTION?: string
  readonly VITE_DEFAULT_THEME?: string
  
  // CORS 代理配置
  readonly VITE_ENABLE_CORS_PROXY?: string
  readonly VITE_CORS_PROXY_URL?: string
  
  // 系统环境变量
  readonly DEV?: boolean
  readonly MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 