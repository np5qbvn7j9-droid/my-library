import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, save, remove } from '../db/db'
import Modal from '../components/Modal'
import { BUILTIN_TEMPLATES } from '../lib/templates'
import { stripHtml } from '../lib/utils'
import type { Template } from '../types'

export default function TemplatesPage() {
  const nav = useNavigate()
  const custom = useLiveQuery(() => db.templates.filter((t) => !t.deleted).toArray(), [])
  const [editing, setEditing] = useState<Partial<Template> | null>(null)

  async function useTemplate(contentHTML: string, name: string) {
    const id = await save('notes', {
      title: '', description: '', contentHTML, contentText: stripHtml(contentHTML),
      sectionId: null, folderId: null, tags: [], keywords: [], refIds: [], links: [],
      color: null, pinned: 0, favorite: 0, archived: 0, srs: null,
    } as any)
    nav(`/note/${id}`)
  }

  async function submit() {
    if (!editing?.name?.trim()) return
    await save('templates', {
      ...editing, name: editing.name.trim(), icon: editing.icon || '📋',
      contentHTML: editing.contentHTML || '<p></p>',
    } as any)
    setEditing(null)
  }

  return (
    <div>
      <h1 className="page-title">القوالب</h1>
      <p className="page-sub">اختر قالبًا لإنشاء ملاحظة جاهزة التنسيق</p>
      <button className="btn primary" onClick={() => setEditing({})}>+ قالب خاص</button>

      <div className="section-h">قوالب جاهزة</div>
      <div className="grid cols-3">
        {BUILTIN_TEMPLATES.map((t) => (
          <div key={t.name} className="card clickable" onClick={() => useTemplate(t.contentHTML, t.name)}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>{t.icon}</span>
            <b style={{ fontSize: 14 }}>{t.name}</b>
          </div>
        ))}
      </div>

      {custom && custom.length > 0 && (
        <>
          <div className="section-h">قوالبي الخاصة</div>
          <div className="grid cols-3">
            {custom.map((t) => (
              <div key={t.id} className="card clickable" onClick={() => useTemplate(t.contentHTML, t.name)}
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{t.icon}</span>
                <b style={{ fontSize: 14, flex: 1 }}>{t.name}</b>
                <button className="btn ghost sm" onClick={(e) => { e.stopPropagation(); setEditing(t) }}>✏️</button>
              </div>
            ))}
          </div>
        </>
      )}

      {editing && (
        <Modal title={editing.id ? 'تعديل القالب' : 'قالب جديد'} onClose={() => setEditing(null)}>
          <label className="field"><span>الاسم</span>
            <input className="input" value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
          </label>
          <label className="field"><span>الأيقونة (إيموجي)</span>
            <input className="input" style={{ maxWidth: 90 }} value={editing.icon || ''} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} />
          </label>
          <label className="field"><span>محتوى القالب (HTML أو نص)</span>
            <textarea className="input" rows={7} dir="auto" value={editing.contentHTML || ''} onChange={(e) => setEditing({ ...editing, contentHTML: e.target.value })} />
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {editing.id && (
              <button className="btn danger" onClick={async () => {
                if (confirm('حذف القالب؟')) { await remove('templates', editing.id!); setEditing(null) }
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
