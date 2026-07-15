import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, save, remove } from '../db/db'
import Modal from '../components/Modal'
import type { Section } from '../types'

const EMOJIS = ['📁', '🕌', '📜', '🗺️', '🏛️', '📈', '💻', '🤖', '⌨️', '📚', '🩺', '🗂️', '🏥', '💰', '🚀', '🌱', '⚖️', '🎨', '🍎', '✈️']

export default function SectionsPage() {
  const sections = useLiveQuery(() => db.sections.orderBy('order').filter((s) => !s.deleted).toArray(), [])
  const counts = useLiveQuery(async () => {
    const map: Record<string, number> = {}
    await db.notes.filter((n) => !n.deleted).each((n) => {
      if (n.sectionId) map[n.sectionId] = (map[n.sectionId] || 0) + 1
    })
    return map
  }, [])
  const [editing, setEditing] = useState<Partial<Section> | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)

  // Drag & drop reorder: move dragged section to the drop target's position
  async function dropOn(targetId: string) {
    if (!dragId || dragId === targetId || !sections) return
    const list = [...sections]
    const from = list.findIndex((x) => x.id === dragId)
    const to = list.findIndex((x) => x.id === targetId)
    if (from < 0 || to < 0) return
    const [moved] = list.splice(from, 1)
    list.splice(to, 0, moved)
    for (let i = 0; i < list.length; i++) {
      if (list[i].order !== i) await save('sections', { id: list[i].id, order: i } as any)
    }
    setDragId(null)
  }

  async function submit() {
    if (!editing?.name?.trim()) return
    await save('sections', {
      ...editing,
      name: editing.name.trim(),
      icon: editing.icon || '📁',
      color: editing.color || '#5aa9e6',
      order: editing.order ?? (sections?.length || 0),
    } as any)
    setEditing(null)
  }

  return (
    <div>
      <h1 className="page-title">الأقسام</h1>
      <p className="page-sub">نظّم معرفتك في أقسام بلا حدود — اسحب البطاقات لإعادة الترتيب</p>
      <button className="btn primary" onClick={() => setEditing({})}>+ قسم جديد</button>

      <div className="grid cols-3" style={{ marginTop: 18 }}>
        {sections?.map((s) => (
          <div
            key={s.id} className="card"
            style={{ position: 'relative', opacity: dragId === s.id ? 0.4 : 1, cursor: 'grab' }}
            draggable
            onDragStart={() => setDragId(s.id)}
            onDragEnd={() => setDragId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); dropOn(s.id) }}
          >
            <Link to={`/section/${s.id}`} style={{ color: 'inherit', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <div>
                <b style={{ fontSize: 14 }}>{s.name}</b>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{counts?.[s.id] || 0} ملاحظة</div>
              </div>
            </Link>
            <button className="btn ghost sm" style={{ position: 'absolute', top: 8, insetInlineEnd: 8 }} onClick={() => setEditing(s)}>✏️</button>
          </div>
        ))}
      </div>

      {editing && (
        <Modal title={editing.id ? 'تعديل القسم' : 'قسم جديد'} onClose={() => setEditing(null)}>
          <label className="field"><span>الاسم</span>
            <input className="input" value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
          </label>
          <label className="field"><span>الأيقونة</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {EMOJIS.map((e) => (
                <button key={e} className={`chip ${editing.icon === e ? 'on' : ''}`} style={{ fontSize: 18 }} onClick={() => setEditing({ ...editing, icon: e })}>{e}</button>
              ))}
            </div>
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {editing.id && (
              <button className="btn danger" onClick={async () => {
                if (confirm('حذف القسم؟ (الملاحظات لن تُحذف)')) { await remove('sections', editing.id!); setEditing(null) }
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
