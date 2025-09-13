"use client"
import React, { useMemo } from 'react'
import { RouterProvider } from '@/lib/router'
import AppShell from '@/components/AppShell'
import { I18nProvider } from '@/lib/i18n/I18nProvider'

export default function Page() {
  // Entire app is CSR with a tiny client router to support Cloudflare Pages + static export
  return (
    <I18nProvider>
      <RouterProvider>
        <AppShell />
      </RouterProvider>
    </I18nProvider>
  )
}
