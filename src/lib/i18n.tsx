import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { en } from '@/locales/en'
import { ar } from '@/locales/ar'

export type Lang = 'en' | 'ar'
export type MessageKey = keyof typeof en

type Messages = typeof en

const STORAGE_KEY = 'storecraft-lang'

const catalogs: Record<Lang, Messages> = { en, ar }

interface I18nContextValue {
  lang: Lang
  dir: 'ltr' | 'rtl'
  setLang: (lang: Lang) => void
  toggleLang: () => void
  t: (key: MessageKey | (string & {}), vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

function resolveMessage(lang: Lang, key: MessageKey | (string & {}), vars?: Record<string, string | number>): string {
  let msg: string = catalogs[lang][key as MessageKey]
  if (msg === undefined || msg === '') {
    const fallback = catalogs.en[key as MessageKey]
    msg = fallback !== undefined ? fallback : key
  }
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      msg = msg.split(`{${name}}`).join(String(value))
    }
  }
  return msg
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'ar' || stored === 'en') return stored
      const nav = (navigator.languages?.[0] ?? navigator.language ?? '').toLowerCase()
      return nav.startsWith('ar') ? 'ar' : 'en'
    } catch {
      return 'en'
    }
  })

  const dir: 'ltr' | 'rtl' = lang === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* ignore */
    }
  }, [lang, dir])

  const setLang = useCallback((next: Lang) => setLangState(next), [])
  const toggleLang = useCallback(() => setLangState((prev) => (prev === 'ar' ? 'en' : 'ar')), [])

  const t = useCallback(
    (key: MessageKey | (string & {}), vars?: Record<string, string | number>) => resolveMessage(lang, key, vars),
    [lang],
  )

  const value = useMemo<I18nContextValue>(() => ({ lang, dir, setLang, toggleLang, t }), [lang, dir, setLang, toggleLang, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
