import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, save, remove } from '../db/db'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { timeAgo, stripHtml } from '../lib/utils'
import type { InboxItem } from '../types'

const KINDS: InboxItem['kind'][] = ['رابط', 'نص', 'فيديو', 'صورة', 'PDF', 'تغريدة']
const KIND_ICON: Record<string, string> = { 'رابط': '🔗', 'نص': '📝', 'فيديو': '🎬', 'صورة': '🖼️', 'PDF': '📄', 'تغريدة': '🐦' }

export default function InboxPage() {
  const [params, setParams] = useSearchParams()
  const nav = useNavigate()
  const [editing, setEditing] = useState<Partial<InboxItem> | null>(null)
  const [showDone, setShowDone] = useState(false)

  useEffect(() => { if (params.get('add')) setEditing({ kind: 'رابط' }) }, [params])

  const items = useLiveQuery(
    () => db.inbox.filter((i) => !i.deleted && (showDone ? true : !i.processed)).reverse().sortBy('createdAt'),
    [showDone])

  async function submit() {
    if (!editing?.content?.trim()) return
    await save('inbox', {
      ...editing, kind: editing.kind || 'رابط', title: editing.title || '',
      content: editing.content.trim(), note: editing.note || '', processed: editing.processed ?? 0,
    } as any)
    setEditing(null)
    if (params.get('add')) setParams({})
  }

  // Convert an inbox item into a real note, then mark processed
  async function toNote(item: InboxItem) {
    const isUrl = /^https?:\/\//.test(item.content)
    const html = isUrl
      ? `<p><a href="${item.content}">${item.title || item.content}</a></p><p>${item.note || ''}</p>`
      : `<p>${item.content.replace(/\n/g, '</p><p>')}</p>`
    const nid = await save('notes', {
      title: item.title || '', description: item.note || '', contentHTML: html, contentText: stripHtml(html),
      sectionId: null, folderId: null, tags: [], keywords: [], refIds: [], links: [],
      color: null, pinned: 0, favorite: 0, archived: 0, srs: null,
    } as any)
    await save('inbox', { ...item, processed: 1 })
    nav(`/note/${nid}`)
  }

  return (
    <div>
      <h1 className="page-title">صندوق القراءة</h1>
      <p className="page-sub">احفظ أي شيء يعجبك هنا وراجعه لاحقًا</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn primary" onClick={() => setEditing({ kind: 'رابط' })}>+ إضافة عنصر</button>
        <button className={`btn ${showDone ? 'primary' : ''}`} onClick={() => setShowDone(!showDone)}>عرض المعالَجة</button>
      </div>

      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items?.length ? items.map((item) => (
          <div key={item.id} className="card" style={{ opacity: item.processed ? 0.6 : 1 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20 }}>{KIND_ICON[item.kind]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: 14 }}>{item.title || item.kind}</b>
                {/^https?:\/\//.test(item.content) ? (
                  <div><a href={item.content} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, wordBreak: 'break-all' }}>{item.content}</a></div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>{item.content.slice(0, 200)}</div>
                )}
                {item.note && <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 4 }}>💭 {item.note}</div>}
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 6 }}>{timeAgo(item.createdAt)}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {!item.processed && <button className="btn sm" onClick={() => toNote(item)}>📝 لملاحظة</button>}
                {!item.processed && <button className="btn ghost sm" onClick={() => save('inbox', { ...item, processed: 1 })}>✓ تم</button>}
                <button className="btn ghost sm" onClick={() => confirm('حذف؟') && remove('inbox', item.id)}>🗑️</button>
              </div>
            </div>
          </div>
        )) : <EmptyState icon="📥" text="صندوق القراءة فارغ" />}
      </div>

      {editing && (
        <Modal title="إضافة إلى صندوق القراءة" onClose={() => { setEditing(null); if (params.get('add')) setParams({}) }}>
          <label className="field"><span>النوع</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {KINDS.map((k) => (
                <button key={k} className={`chip ${editing.kind === k ? 'on' : ''}`} onClick={() => setEditing({ ...editing, kind: k })}>{KIND_ICON[k]} {k}</button>
              ))}
            </div>
          </label>
          <label className="field"><span>العنوان (اختياري)</span>
            <input className="input" value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
          </label>
          <label className="field"><span>الرابط أو النص *</span>
            <textarea className="input" rows={3} value={editing.content || ''} onChange={(e) => setEditing({ ...editing, content: e.target.value })} autoFocus />
          </label>
          <label className="field"><span>ملاحظة سريعة</span>
            <input className="input" value={editing.note || ''} onChange={(e) => setEditing({ ...editing, note: e.target.value })} />
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => setEditing(null)}>إلغاء</button>
            <button className="btn primary" onClick={submit}>حفظ</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
