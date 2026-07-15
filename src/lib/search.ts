// Fast client-side full-text search over notes/quotes/references,
// with Arabic normalization so «محمّد» matches «محمد».
import MiniSearch from 'minisearch'
import { db } from '../db/db'
import { normalizeArabic, startOfToday } from './utils'

export interface SearchDoc {
  id: string
  kind: 'note' | 'quote' | 'reference'
  title: string
  text: string
  tags: string
  extra: string
  updatedAt: number
  createdAt: number
}

let mini: MiniSearch<SearchDoc> | null = null
let docs: Map<string, SearchDoc> = new Map()
let builtAt = 0

const options = {
  fields: ['title', 'text', 'tags', 'extra'],
  storeFields: ['kind', 'title', 'updatedAt', 'createdAt'],
  processTerm: (term: string) => {
    const t = normalizeArabic(term)
    return t.length > 1 ? t : null
  },
  searchOptions: { boost: { title: 3, tags: 2 }, prefix: true, fuzzy: 0.15 },
}

export async function buildIndex(force = false) {
  if (mini && !force && Date.now() - builtAt < 15_000) return
  const [notes, quotes, refs] = await Promise.all([
    db.notes.toArray(), db.quotes.toArray(), db.references.toArray(),
  ])
  docs = new Map()
  const all: SearchDoc[] = []
  for (const n of notes) {
    if (n.deleted) continue
    const d: SearchDoc = {
      id: 'note:' + n.id, kind: 'note', title: n.title || 'بدون عنوان',
      text: [n.description, n.contentText].join(' '),
      tags: [...(n.tags || []), ...(n.keywords || [])].join(' '),
      extra: '', updatedAt: n.updatedAt, createdAt: n.createdAt,
    }
    all.push(d); docs.set(d.id, d)
  }
  for (const q of quotes) {
    if (q.deleted) continue
    const d: SearchDoc = {
      id: 'quote:' + q.id, kind: 'quote', title: q.author || 'اقتباس',
      text: [q.text, q.comment].join(' '), tags: (q.tags || []).join(' '),
      extra: [q.source, q.category].join(' '), updatedAt: q.updatedAt, createdAt: q.createdAt,
    }
    all.push(d); docs.set(d.id, d)
  }
  for (const r of refs) {
    if (r.deleted) continue
    const d: SearchDoc = {
      id: 'reference:' + r.id, kind: 'reference', title: r.title,
      text: r.notes || '', tags: '', extra: [r.author, r.type].join(' '),
      updatedAt: r.updatedAt, createdAt: r.createdAt,
    }
    all.push(d); docs.set(d.id, d)
  }
  mini = new MiniSearch<SearchDoc>(options as any)
  mini.addAll(all)
  builtAt = Date.now()
}

export interface SearchHit {
  id: string
  rawId: string
  kind: SearchDoc['kind']
  title: string
  score: number
}

// Lightweight natural-language filters (this month / this week / today)
function timeFilter(q: string): { from: number; cleaned: string } | null {
  const today = startOfToday()
  const pairs: Array<[RegExp, number]> = [
    [/هذا الشهر|الشهر الحالي/, today - 30 * 864e5],
    [/هذا الأسبوع|الاسبوع/, today - 7 * 864e5],
    [/اليوم/, today],
  ]
  for (const [re, from] of pairs) {
    if (re.test(q)) return { from, cleaned: q.replace(re, ' ') }
  }
  return null
}

const STOP = /\b(جميع|كل|ما|التي|الذي|عن|في|من|إلى|على|ملاحظاتي|ملاحظات|يتعلق|بـ|أضفتها|كتبت)\b/g

export async function search(queryText: string): Promise<SearchHit[]> {
  await buildIndex()
  if (!mini) return []
  let q = queryText
  const tf = timeFilter(q)
  if (tf) q = tf.cleaned
  q = q.replace(STOP, ' ').trim()

  let results: SearchHit[]
  if (!q && tf) {
    results = Array.from(docs.values())
      .filter((d) => d.createdAt >= tf.from)
      .map((d) => ({ id: d.id, rawId: d.id.split(':')[1], kind: d.kind, title: d.title, score: d.updatedAt }))
  } else {
    results = mini.search(q).map((r: any) => ({
      id: r.id, rawId: String(r.id).split(':')[1], kind: r.kind, title: r.title, score: r.score,
    }))
    if (tf) {
      results = results.filter((r) => {
        const d = docs.get(r.id)
        return d && d.createdAt >= tf.from
      })
    }
  }
  return results.slice(0, 80)
}

export const invalidateIndex = () => { builtAt = 0 }
