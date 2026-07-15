import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, save, remove } from '../db/db'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { normalizeArabic } from '../lib/utils'
import type { Reference, RefType } from '../types'

const TYPES: RefType[] = ['كتاب', 'مقال', 'بحث', 'موقع', 'PDF', 'فيديو', 'دورة', 'وثيقة']
const TYPE_ICON: Record<string, string> = {
  'كتاب': '📖', 'مقال': '📰', 'بحث': '🔬', 'موقع': '🌐', 'PDF': '📄', 'فيديو': '🎬', 'دورة': '🎓', 'وثيقة': '📑',
}

export default function ReferencesPage() {
  const [params] = useSearchParams()
  const [editing, setEditing] = useState<Partial<Reference> | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [filter, setFilter] = useState(params.get('q') || '')

  const refs = useLiveQuery(() => db.references.filter((r) => !r.deleted).reverse().sortBy('updatedAt'), [])
  // Notes linked to each reference (automatic bidirectional linking)
  const usage = useLiveQuery(async () => {
    const map: Record<string, Array<{ id: string; title: string }>> = {}
    await db.notes.filter((n) => !n.deleted).each((n) => {
      for (const rid of n.refIds || []) {
        if (!map[rid]) map[rid] = []
        map[rid].push({ id: n.id, title: n.title || 'بدون عنوان' })
      }
    })
    return map
  }, [])

  const shown = refs?.filter((r) => {
    if (typeFilter && r.type !== typeFilter) return false
    if (!filter.trim()) return true
    const f = normalizeArabic(filter)
    return [r.title, r.author, r.notes].some((s) => normalizeArabic(s || '').includes(f))
  })

  async function submit() {
    if (!editing?.title?.trim()) return
    await save('references', {
      ...editing, title: editing.title.trim(), type: editing.type || 'كتاب',
      author: editing.author || '', url: editing.url || '', year: editing.year || '', notes: editing.notes || '',
    } as any)
    setEditing(null)
  }

  return (
    <div>
      <h1 className="page-title">مكتبة المراجع</h1>
      <p className="page-sub">{refs?.length || 0} مرجع — كل مرجع يعرض الملاحظات التي استخدمته</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn primary" onClick={() => setEditing({})}>+ مرجع جديد</button>
        <input className="input" style={{ maxWidth: 240 }} placeholder="تصفية…" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
        <button className={`chip ${!typeFilter ? 'on' : ''}`} onClick={() => setTypeFilter('')}>الكل</button>
        {TYPES.map((t) => (
          <button key={t} className={`chip ${typeFilter === t ? 'on' : ''}`} onClick={() => setTypeFilter(t)}>{TYPE_ICON[t]} {t}</button>
        ))}
      </div>

      <div className="grid cols-2" style={{ marginTop: 16 }}>
        {shown?.length ? shown.map((r) => (
          <div key={r.id} className="card">
            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 22 }}>{TYPE_ICON[r.type]}</span>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 14 }}>{r.title}</b>
                <div style={{ fontSize: 12.5, color: 'var(--text-2)' }}>
                  {r.author}{r.year ? ` · ${r.year}` : ''} · {r.type}
                </div>
                {r.url && <a href={r.url} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>فتح الرابط ↗</a>}
              </div>
              <button className="btn ghost sm" onClick={() => setEditing(r)}>✏️</button>
            </div>
            {usage?.[r.id]?.length ? (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-2)', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                مستخدم في:{' '}
                {usage[r.id].slice(0, 4).map((n) => (
                  <Link key={n.id} to={`/note/${n.id}`} className="chip" style={{ margin: 2 }}>{n.title}</Link>
                ))}
                {usage[r.id].length > 4 && ` +${usage[r.id].length - 4}`}
              </div>
            ) : null}
          </div>
        )) : <EmptyState icon="📚" text="لا توجد مراجع بعد" />}
      </div>

      {editing && (
        <Modal title={editing.id ? 'تعديل المرجع' : 'مرجع جديد'} onClose={() => setEditing(null)}>
          <label className="field"><span>العنوان *</span>
            <input className="input" value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} autoFocus />
          </label>
          <div className="grid cols-2">
            <label className="field"><span>النوع</span>
              <select className="input" value={editing.type || 'كتاب'} onChange={(e) => setEditing({ ...editing, type: e.target.value as RefType })}>
                {TYPES.map((t) => <option key={t} value={t}>{TYPE_ICON[t]} {t}</option>)}
              </select>
            </label>
            <label className="field"><span>المؤلف / الجهة</span>
              <input className="input" value={editing.author || ''} onChange={(e) => setEditing({ ...editing, author: e.target.value })} />
            </label>
            <label className="field"><span>السنة</span>
              <input className="input" value={editing.year || ''} onChange={(e) => setEditing({ ...editing, year: e.target.value })} />
            </label>
            <label className="field"><span>الرابط</span>
              <input className="input" dir="ltr" value={editing.url || ''} onChange={(e) => setEditing({ ...editing, url: e.target.value })} />
            </label>
          </div>
          <label className="field"><span>ملاحظات</span>
            <textarea className="input" rows={2} value={editing.notes || ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {editing.id && (
              <button className="btn danger" onClick={async () => {
                if (confirm('حذف المرجع؟')) { await remove('references', editing.id!); setEditing(null) }
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
