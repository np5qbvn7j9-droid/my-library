import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, save, remove } from '../db/db'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { normalizeArabic } from '../lib/utils'
import type { Quote } from '../types'

export default function QuotesPage() {
  const [params, setParams] = useSearchParams()
  const [editing, setEditing] = useState<Partial<Quote> | null>(null)
  const [filter, setFilter] = useState(params.get('q') || '')

  useEffect(() => { if (params.get('add')) setEditing({}) }, [params])

  const quotes = useLiveQuery(() => db.quotes.filter((q) => !q.deleted).reverse().sortBy('updatedAt'), [])
  const shown = quotes?.filter((q) => {
    if (!filter.trim()) return true
    const f = normalizeArabic(filter)
    return [q.text, q.author, q.source, q.category, ...(q.tags || [])].some((s) => normalizeArabic(s || '').includes(f))
  })

  async function submit() {
    if (!editing?.text?.trim()) return
    await save('quotes', {
      ...editing, text: editing.text.trim(),
      author: editing.author || '', source: editing.source || '', page: editing.page || '',
      category: editing.category || '', tags: editing.tags || [], comment: editing.comment || '',
    } as any)
    setEditing(null)
    if (params.get('add')) setParams({})
  }

  return (
    <div>
      <h1 className="page-title">مكتبة الاقتباسات</h1>
      <p className="page-sub">{quotes?.length || 0} اقتباس</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn primary" onClick={() => setEditing({})}>+ اقتباس جديد</button>
        <input className="input" style={{ maxWidth: 260 }} placeholder="تصفية…" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>

      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {shown?.length ? shown.map((q) => (
          <div key={q.id} className="card">
            <blockquote style={{ margin: 0, fontSize: 15.5, lineHeight: 1.9 }}>❝ {q.text} ❞</blockquote>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 12.5, color: 'var(--text-2)', flexWrap: 'wrap' }}>
              {q.author && <b>— {q.author}</b>}
              {q.source && <span>· {q.source}{q.page ? ` (ص ${q.page})` : ''}</span>}
              {q.category && <span className="chip">{q.category}</span>}
              {q.tags?.map((t) => <span key={t} className="chip">#{t}</span>)}
              <span style={{ marginInlineStart: 'auto' }}>
                <button className="btn ghost sm" onClick={() => setEditing(q)}>✏️</button>
              </span>
            </div>
            {q.comment && <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-2)' }}>💭 {q.comment}</div>}
          </div>
        )) : <EmptyState icon="❝" text="لا توجد اقتباسات بعد" />}
      </div>

      {editing && (
        <Modal title={editing.id ? 'تعديل الاقتباس' : 'اقتباس جديد'} onClose={() => { setEditing(null); if (params.get('add')) setParams({}) }}>
          <label className="field"><span>النص *</span>
            <textarea className="input" rows={4} value={editing.text || ''} onChange={(e) => setEditing({ ...editing, text: e.target.value })} autoFocus />
          </label>
          <div className="grid cols-2">
            <label className="field"><span>القائل</span>
              <input className="input" value={editing.author || ''} onChange={(e) => setEditing({ ...editing, author: e.target.value })} />
            </label>
            <label className="field"><span>المصدر</span>
              <input className="input" value={editing.source || ''} onChange={(e) => setEditing({ ...editing, source: e.target.value })} />
            </label>
            <label className="field"><span>الصفحة</span>
              <input className="input" value={editing.page || ''} onChange={(e) => setEditing({ ...editing, page: e.target.value })} />
            </label>
            <label className="field"><span>التصنيف</span>
              <input className="input" value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
            </label>
          </div>
          <label className="field"><span>الوسوم (افصل بفاصلة)</span>
            <input className="input" value={(editing.tags || []).join('، ')}
              onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(/[،,]/).map((s) => s.trim()).filter(Boolean) })} />
          </label>
          <label className="field"><span>ملاحظاتي</span>
            <textarea className="input" rows={2} value={editing.comment || ''} onChange={(e) => setEditing({ ...editing, comment: e.target.value })} />
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {editing.id && (
              <button className="btn danger" onClick={async () => {
                if (confirm('حذف الاقتباس؟')) { await remove('quotes', editing.id!); setEditing(null) }
              }}>حذف</button>
            )}
            <button className="btn" onClick={() => setEditing(null)}>إلغاء</button>
            <button className="btn primary" onClick={submit}>حفظ</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
