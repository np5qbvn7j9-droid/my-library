import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, save } from '../db/db'
import { srsSchedule, stripHtml } from '../lib/utils'
import EmptyState from '../components/EmptyState'

const GRADES: Array<{ g: 0 | 1 | 2 | 3; label: string; color: string }> = [
  { g: 0, label: 'نسيتها', color: 'var(--danger)' },
  { g: 1, label: 'بصعوبة', color: 'var(--warning)' },
  { g: 2, label: 'جيدة', color: 'var(--accent)' },
  { g: 3, label: 'ممتازة', color: 'var(--success)' },
]

export default function ReviewPage() {
  const [revealed, setRevealed] = useState(false)
  const [doneToday, setDoneToday] = useState(0)

  const due = useLiveQuery(
    () => db.notes.filter((n) => !n.deleted && !n.archived && !!n.srs && n.srs!.due <= Date.now()).toArray(), [])
  const allSrs = useLiveQuery(
    () => db.notes.filter((n) => !n.deleted && !!n.srs).count(), [], 0)

  const current = due?.[0]
  const total = (due?.length || 0) + doneToday
  const progress = total ? Math.round((doneToday / total) * 100) : 0

  async function grade(g: 0 | 1 | 2 | 3) {
    if (!current) return
    await save('notes', { ...current, srs: srsSchedule(current.srs!, g) })
    setDoneToday((d) => d + 1)
    setRevealed(false)
  }

  return (
    <div>
      <h1 className="page-title">المراجعة الذكية</h1>
      <p className="page-sub">
        نظام التكرار المتباعد — {allSrs} ملاحظة ضمن النظام · مراجعات اليوم: {due?.length || 0} · أنجزت: {doneToday} ({progress}%)
      </p>

      {!current ? (
        <EmptyState
          icon="🎉"
          text={doneToday > 0 ? `أحسنت! أنهيت ${doneToday} مراجعة اليوم` : 'لا توجد مراجعات مستحقة — أضف ملاحظات للنظام من زر 🔁 داخل الملاحظة'}
        />
      ) : (
        <div className="card review-card">
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>
            المتبقي: {due!.length} · تكرارات هذه الملاحظة: {current.srs!.reps}
          </div>
          <h2 style={{ margin: '0 0 6px' }}>{current.title || 'بدون عنوان'}</h2>
          {current.description && <p style={{ color: 'var(--text-2)' }}>{current.description}</p>}

          {revealed ? (
            <>
              <div style={{ lineHeight: 1.9, fontSize: 15, whiteSpace: 'pre-wrap', borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 8 }}>
                {stripHtml(current.contentHTML).slice(0, 1500) || '— لا يوجد محتوى —'}
              </div>
              <Link to={`/note/${current.id}`} style={{ fontSize: 13 }}>فتح الملاحظة كاملة ←</Link>
              <div className="grade-row">
                {GRADES.map(({ g, label, color }) => (
                  <button key={g} className="btn" style={{ borderColor: color, color }} onClick={() => grade(g)}>{label}</button>
                ))}
              </div>
            </>
          ) : (
            <button className="btn primary" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }} onClick={() => setRevealed(true)}>
              إظهار المحتوى
            </button>
          )}
        </div>
      )}
    </div>
  )
}
