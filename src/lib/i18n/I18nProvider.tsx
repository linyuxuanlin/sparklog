"use client"
import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import zh from './locales/zh-CN.json'
import en from './locales/en.json'

type Locale = 'zh-CN' | 'en'
type Dict = Record<string, string>

const DICTS: Record<Locale, Dict> = { 'zh-CN': zh as Dict, en: en as Dict }

interface Ctx {
  t: (key: string) => string
  locale: Locale
  setLocale: (l: Locale) => void
}

const I18nCtx = createContext<Ctx>({ t: (k) => k, locale: 'zh-CN', setLocale: () => {} })

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<Locale>('zh-CN')
  useEffect(() => {
    const saved = localStorage.getItem('sparklog_locale') as Locale | null
    if (saved && DICTS[saved]) setLocale(saved)
    else {
      const sys = navigator.language.startsWith('zh') ? 'zh-CN' : 'en'
      setLocale(sys as Locale)
    }
  }, [])
  useEffect(() => { localStorage.setItem('sparklog_locale', locale) }, [locale])
  const t = useMemo(() => (key: string) => DICTS[locale][key] ?? key, [locale])
  return <I18nCtx.Provider value={{ t, locale, setLocale }}>{children}</I18nCtx.Provider>
}

export const useI18n = () => useContext(I18nCtx)

