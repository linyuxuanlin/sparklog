/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REPO_OWNER?: string
  readonly VITE_REPO_NAME?: string
  readonly VITE_GITHUB_TOKEN?: string
  readonly VITE_GITHUB_OWNER?: string
  readonly VITE_GITHUB_REPO?: string
  readonly REPO_OWNER?: string
  readonly REPO_NAME?: string
  readonly GITHUB_TOKEN?: string
  readonly GITHUB_OWNER?: string
  readonly GITHUB_REPO?: string
  readonly DEV?: boolean
  readonly MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 