// App-wide appearance settings: font, sizing, accent, density, layout.
// Stored in localStorage, applied as CSS variables / data-attributes on <html>.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

// Google Fonts family → supported weight axis (some fonts only ship 400/700)
export const FONTS: Record<string, string> = {
  'IBM Plex Sans Arabic': '400;500;600;700',
  'Cairo': '400..700',
  'Tajawal': '400;500;700',
  'Almarai': '400;700',
  'Alexandria': '400..700',
  'Readex Pro': '400..700',
  'Noto Sans Arabic': '400..700',
  'El Messiri': '400..700',
  'Changa': '400..700',
  'Reem Kufi': '400..700',
  'Aref Ruqaa': '400;700',
  'Markazi Text': '400..700',
  'Amiri': '400;700',
  'Baloo Bhaijaan 2': '400..700',
}

export const ACCENTS = [
  { name: 'أزرق', value: '#3b82c4' },
  { name: 'فيروزي', value: '#2a9d8f' },
  { name: 'أخضر', value: '#4d9d7c' },
  { name: 'بنفسجي', value: '#8b7ec8' },
  { name: 'وردي', value: '#c76a8a' },
  { name: 'برتقالي', value: '#d9863f' },
  { name: 'أحمر', value: '#d5604c' },
  { name: 'رمادي', value: '#64748b' },
]

export interface AppSettings {
  fontFamily: string
  fontSize: number // percentage 85–120
  fontWeight: number // body text weight
  lineHeight: number
  letterSpacing: number // px
  accent: string // '' = theme default
  radius: 'rounded' | 'square'
  density: 'comfortable' | 'compact'
  noteView: 'cards' | 'grid' | 'list'
  home: { stats: boolean; due: boolean; pinned: boolean; recent: boolean; inbox: boolean; sections: boolean }
}

export const DEFAULT_SETTINGS: AppSettings = {
  fontFamily: 'IBM Plex Sans Arabic',
  fontSize: 100,
  fontWeight: 400,
  lineHeight: 1.9,
  letterSpacing: 0,
  accent: '',
  radius: 'rounded',
  density: 'comfortable',
  noteView: 'cards',
  home: { stats: true, due: true, pinned: true, recent: true, inbox: true, sections: true },
}

const KEY = 'maktabati-settings'

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_SETTINGS, ...parsed, home: { ...DEFAULT_SETTINGS.home, ...(parsed.home || {}) } }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function fontHref(families: string[]): string {
  const parts = families
    .map((f) => `family=${f.replace(/ /g, '+')}:wght@${FONTS[f] || '400;700'}`)
    .join('&')
  return `https://fonts.googleapis.com/css2?${parts}&display=swap`
}

function injectLink(id: string, href: string) {
  let el = document.getElementById(id) as HTMLLinkElement | null
  if (el && el.href === href) return
  if (!el) {
    el = document.createElement('link')
    el.id = id
    el.rel = 'stylesheet'
    document.head.appendChild(el)
  }
  el.href = href
}

export const ensureFont = (family: string) => injectLink('mk-font', fontHref([family]))
// Settings page loads every family once so the picker previews render in their real fonts
export const ensureAllFonts = () => injectLink('mk-fonts-all', fontHref(Object.keys(FONTS)))

export function applySettings(s: AppSettings) {
  const r = document.documentElement
  ensureFont(s.fontFamily)
  r.style.setProperty('--font', `'${s.fontFamily}', 'IBM Plex Sans Arabic', -apple-system, sans-serif`)
  r.style.setProperty('--fs-scale', String(s.fontSize / 100))
  r.style.setProperty('--fw-base', String(s.fontWeight))
  r.style.setProperty('--lh-content', String(s.lineHeight))
  r.style.setProperty('--ls-content', s.letterSpacing + 'px')
  if (s.accent) r.style.setProperty('--accent', s.accent)
  else r.style.removeProperty('--accent')
  r.setAttribute('data-radius', s.radius)
  r.setAttribute('data-density', s.density)
}

interface Ctx {
  settings: AppSettings
  update: (patch: Partial<AppSettings>) => void
  reset: () => void
}

const SettingsContext = createContext<Ctx>({ settings: DEFAULT_SETTINGS, update: () => {}, reset: () => {} })

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)

  useEffect(() => {
    applySettings(settings)
  }, [settings])

  const update = (patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch, home: { ...prev.home, ...(patch.home || {}) } }
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }

  const reset = () => {
    localStorage.removeItem(KEY)
    setSettings(DEFAULT_SETTINGS)
  }

  return <SettingsContext.Provider value={{ settings, update, reset }}>{children}</SettingsContext.Provider>
}

export const useSettings = () => useContext(SettingsContext)
