import type { SrsState } from '../types'

export const uid = () =>
  crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)

export const now = () => Date.now()

// ---- Arabic text normalization for search ----
export function normalizeArabic(s: string): string {
  return (s || '')
    .replace(/[ً-ْٰـ]/g, '') // diacritics + tatweel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .toLowerCase()
}

export function stripHtml(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html || ''
  return (div.textContent || '').replace(/\s+/g, ' ').trim()
}

// Extract [[wiki links]] from plain text
export function extractWikiLinks(text: string): string[] {
  const out: string[] = []
  const re = /\[\[([^\[\]]+)\]\]/g
  let m
  while ((m = re.exec(text || ''))) out.push(m[1].trim())
  return Array.from(new Set(out))
}

// ---- Dates ----
const DAY = 24 * 60 * 60 * 1000

export function fmtDate(ts: number): string {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function timeAgo(ts: number): string {
  const d = Date.now() - ts
  const min = Math.floor(d / 60000)
  if (min < 1) return 'الآن'
  if (min < 60) return `قبل ${min} دقيقة`
  const h = Math.floor(min / 60)
  if (h < 24) return `قبل ${h} ساعة`
  const days = Math.floor(h / 24)
  if (days === 1) return 'أمس'
  if (days < 30) return `قبل ${days} يوم`
  const months = Math.floor(days / 30)
  if (months < 12) return `قبل ${months} شهر`
  return `قبل ${Math.floor(months / 12)} سنة`
}

export const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

// ---- Spaced repetition (SM-2 style, grades 0..3) ----
// 0 = نسيتها, 1 = بصعوبة, 2 = جيدة, 3 = ممتازة
export function srsInit(): SrsState {
  return { due: Date.now(), interval: 0, ease: 2.5, reps: 0 }
}

export function srsSchedule(s: SrsState, grade: 0 | 1 | 2 | 3): SrsState {
  let { interval, ease, reps } = s
  if (grade === 0) {
    reps = 0
    interval = 0
    ease = Math.max(1.3, ease - 0.2)
  } else {
    reps += 1
    if (reps === 1) interval = 1
    else if (reps === 2) interval = grade === 1 ? 2 : 4
    else interval = Math.round(interval * (grade === 1 ? 1.2 : ease))
    if (grade === 1) ease = Math.max(1.3, ease - 0.15)
    if (grade === 3) ease = Math.min(3.0, ease + 0.1)
  }
  const due = Date.now() + Math.max(interval, grade === 0 ? 0 : 1) * DAY + (grade === 0 ? 10 * 60 * 1000 : 0)
  return { due, interval, ease, reps, lastGrade: grade }
}

export function download(filename: string, content: string, type = 'application/json') {
  const blob = new Blob([content], { type })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
