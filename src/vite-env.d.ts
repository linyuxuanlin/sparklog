/// <reference types="vite/client" />

declare global {
  /* eslint-disable-next-line no-unused-vars */
  interface ImportMetaEnv {
  readonly VITE_REPO_OWNER?: string
  readonly VITE_REPO_DEPLOY?: string
  readonly VITE_REPO_NOTES?: string
  readonly VITE_GITHUB_TOKEN?: string
  readonly VITE_GITHUB_OWNER?: string
  readonly VITE_GITHUB_REPO?: string
  readonly VITE_REPO_NAME?: string
  readonly VITE_DEPLOY_REPO_URL?: string
  readonly REPO_OWNER?: string
  readonly REPO_DEPLOY?: string
  readonly REPO_NOTES?: string
  readonly REPO_NAME?: string
  readonly DEPLOY_REPO_URL?: string
  readonly GITHUB_TOKEN?: string
  readonly GITHUB_OWNER?: string
  readonly GITHUB_REPO?: string
  readonly VITE_ADMIN_PASSWORD?: string
  readonly DEV?: boolean
  readonly MODE?: string
  }
}

 
