import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, save, remove } from '../db/db'
import RichEditor from '../components/RichEditor'
import NoteCard from '../components/NoteCard'
import { stripHtml, extractWikiLinks, srsInit, fmtDate, uid, now } from '../lib/utils'
import { invalidateIndex } from '../lib/search'
import { NOTE_COLORS, type Note } from '../types'

export default function NotePage() {
  const { id } = useParams()
  const nav = useNavigate()
  const note = useLiveQuery(() => db.notes.get(id!), [id])
  const sections = useLiveQuery(() => db.sections.orderBy('order').filter((s) => !s.deleted).toArray(), [])
  const folders = useLiveQuery(
    () => (note?.sectionId ? db.folders.filter((f) => !f.deleted && f.sectionId === note.sectionId).toArray() : []),
    [note?.sectionId])
  const references = useLiveQuery(() => db.references.filter((r) => !r.deleted).toArray(), [])
  const [showMeta, setShowMeta] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [saved, setSaved] = useState(true)
  const timer = useRef<any>(null)

  // Related notes: outgoing wiki links + backlinks + shared tags
  const related = useLiveQuery(async () => {
    if (!note) return { linked: [], backlinks: [], similar: [] }
    const all = await db.notes.filter((n) => !n.deleted && n.id !== note.id).toArray()
    const myTitle = (note.title || '').trim()
    const linked = all.filter((n) => note.links?.includes((n.title || '').trim()))
    const backlinks = all.filter((n) => myTitle && n.links?.includes(myTitle))
    const myTags = new Set(note.tags || [])
    const similar = all
      .filter((n) => !linked.includes(n) && !backlinks.includes(n) && (n.tags || []).some((t) => myTags.has(t)))
      .slice(0, 4)
    return { linked, backlinks, similar }
  }, [note?.links?.join(','), note?.tags?.join(','), note?.title, note?.id])

  useEffect(() => () => clearTimeout(timer.current), [])

  // Pending patches accumulate so a debounced save never drops an earlier edit
  const pending = useRef<Partial<Note>>({})
  function update(patch: Partial<Note>, debounce = false) {
    if (!note) return
    setSaved(false)
    pending.current = { ...pending.current, ...patch }
    const doSave = async () => {
      const p = pending.current
      pending.current = {}
      const fresh = (await db.notes.get(note.id)) || note
      const merged: any = { ...fresh, ...p, id: note.id }
      merged.contentText = stripHtml(merged.contentHTML || '')
      merged.links = extractWikiLinks(merged.contentText)
      await save('notes', merged)
      invalidateIndex()
      setSaved(true)
    }
    clearTimeout(timer.current)
    if (debounce) timer.current = setTimeout(doSave, 700)
    else doSave()
  }

  async function duplicate() {
    if (!note) return
    const nid = uid()
    await save('notes', { ...note, id: nid, title: note.title + ' (نسخة)', createdAt: now(), pinned: 0 })
    nav(`/note/${nid}`)
  }

  if (!note) return <div className="empty">الملاحظة غير موجودة</div>

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '')
    if (t && !note.tags?.includes(t)) update({ tags: [...(note.tags || []), t] })
    setTagInput('')
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        <button className="btn ghost sm" onClick={() => nav(-1)}>← رجوع</button>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{saved ? '✓ محفوظ' : '⏳ يحفظ…'}</span>
        <div style={{ flex: 1 }} />
        <button className={`btn ghost sm ${note.pinned ? 'on' : ''}`} title="تثبيت" onClick={() => update({ pinned: note.pinned ? 0 : 1 })}>📌</button>
        <button className="btn ghost sm" title="مفضلة" onClick={() => update({ favorite: note.favorite ? 0 : 1 })}>{note.favorite ? '⭐' : '☆'}</button>
        <button className="btn ghost sm" title="نظام المراجعة" onClick={() => update({ srs: note.srs ? null : srsInit() })}>{note.srs ? '🔁✓' : '🔁'}</button>
        <button className="btn ghost sm" onClick={() => setShowMeta(!showMeta)}>⚙️ خصائص</button>
      </div>

      <input
        className="input" style={{ fontSize: 24, fontWeight: 700, border: 'none', background: 'transparent', padding: '4px 0' }}
        placeholder="عنوان الملاحظة…" value={note.title}
        onChange={(e) => update({ title: e.target.value }, true)}
      />
      <input
        className="input" style={{ border: 'none', background: 'transparent', padding: '2px 0', color: 'var(--text-2)' }}
        placeholder="وصف مختصر…" value={note.description}
        onChange={(e) => update({ description: e.target.value }, true)}
      />

      {showMeta && (
        <div className="card" style={{ margin: '10px 0' }}>
          <div className="grid cols-2">
            <label className="field"><span>القسم</span>
              <select className="input" value={note.sectionId || ''} onChange={(e) => update({ sectionId: e.target.value || null, folderId: null })}>
                <option value="">— بدون قسم —</option>
                {sections?.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </label>
            <label className="field"><span>المجلد</span>
              <select className="input" value={note.folderId || ''} onChange={(e) => update({ folderId: e.target.value || null })}>
                <option value="">— بدون مجلد —</option>
                {folders?.map((f) => <option key={f.id} value={f.id}>📂 {f.name}</option>)}
              </select>
            </label>
          </div>
          <label className="field"><span>اللون</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="chip" onClick={() => update({ color: null })}>بدون</button>
              {NOTE_COLORS.map((c) => (
                <button key={c} onClick={() => update({ color: c })}
                  style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: note.color === c ? '3px solid var(--text)' : 'none', cursor: 'pointer' }} />
              ))}
            </div>
          </label>
          <label className="field"><span>الكلمات المفتاحية (افصل بفاصلة)</span>
            <input className="input" value={(note.keywords || []).join('، ')}
              onChange={(e) => update({ keywords: e.target.value.split(/[،,]/).map((s) => s.trim()).filter(Boolean) }, true)} />
          </label>
          <label className="field"><span>المراجع المرتبطة</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {references?.map((r) => (
                <button key={r.id} className={`chip ${note.refIds?.includes(r.id) ? 'on' : ''}`}
                  onClick={() => update({
                    refIds: note.refIds?.includes(r.id) ? note.refIds.filter((x) => x !== r.id) : [...(note.refIds || []), r.id],
                  })}>
                  📖 {r.title}
                </button>
              ))}
              {!references?.length && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>أضف مراجع من صفحة المراجع أولًا</span>}
            </div>
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn sm" onClick={duplicate}>📄 نسخ الملاحظة</button>
            <button className="btn sm" onClick={() => update({ archived: note.archived ? 0 : 1 })}>{note.archived ? '📤 إلغاء الأرشفة' : '🗄️ أرشفة'}</button>
            <button className="btn danger sm" onClick={async () => {
              if (confirm('حذف الملاحظة نهائيًا؟')) { await remove('notes', note.id); nav(-1) }
            }}>🗑️ حذف</button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
            أُنشئت: {fmtDate(note.createdAt)} · آخر تعديل: {fmtDate(note.updatedAt)}
          </div>
        </div>
      )}

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '8px 0 14px', alignItems: 'center' }}>
        {note.tags?.map((t) => (
          <span key={t} className="chip on" onClick={() => update({ tags: note.tags.filter((x) => x !== t) })} title="اضغط للحذف">
            #{t} ×
          </span>
        ))}
        <input
          style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--text)', minWidth: 90 }}
          placeholder="+ وسم" value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
          onBlur={addTag}
        />
      </div>

      <RichEditor key={note.id} value={note.contentHTML} onChange={(html) => update({ contentHTML: html }, true)} />

      {/* Related notes */}
      {related && (related.linked.length + related.backlinks.length + related.similar.length > 0) && (
        <>
          <div className="section-h">🔗 ملاحظات مرتبطة</div>
          <div className="grid cols-2">
            {related.linked.map((n) => <NoteCard key={n.id} note={n} />)}
            {related.backlinks.map((n) => <NoteCard key={'b' + n.id} note={n} />)}
            {related.similar.map((n) => <NoteCard key={'s' + n.id} note={n} />)}
          </div>
        </>
      )}

      {/* Unresolved wiki links */}
      {note.links?.filter((l) => !(related?.linked || []).some((n) => (n.title || '').trim() === l)).length > 0 && (
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-2)' }}>
          روابط لملاحظات غير موجودة بعد:{' '}
          {note.links
            .filter((l) => !(related?.linked || []).some((n) => (n.title || '').trim() === l))
            .map((l) => (
              <button key={l} className="chip" onClick={async () => {
                const nid = await save('notes', {
                  title: l, description: '', contentHTML: '', contentText: '',
                  sectionId: note.sectionId, folderId: null, tags: [], keywords: [], refIds: [], links: [],
                  color: null, pinned: 0, favorite: 0, archived: 0, srs: null,
                } as any)
                nav(`/note/${nid}`)
              }}>+ إنشاء «{l}»</button>
            ))}
        </div>
      )}
    </div>
  )
}
