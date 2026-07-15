import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import EmptyState from '../components/EmptyState'
import { fmtDate } from '../lib/utils'

export default function TimelinePage() {
  const notes = useLiveQuery(
    () => db.notes.orderBy('createdAt').reverse().filter((n) => !n.deleted).limit(300).toArray(), [])

  // Group by day
  const groups: Array<{ day: string; items: typeof notes }> = []
  if (notes) {
    let currentDay = ''
    for (const n of notes) {
      const day = fmtDate(n.createdAt)
      if (day !== currentDay) {
        currentDay = day
        groups.push({ day, items: [] as any })
      }
      groups[groups.length - 1].items!.push(n)
    }
  }

  return (
    <div>
      <h1 className="page-title">الخط الزمني</h1>
      <p className="page-sub">كل ما أضفته مرتبًا حسب التاريخ</p>
      {!notes?.length && <EmptyState icon="🕐" text="لا يوجد شيء بعد" />}
      {groups.map((g) => (
        <div key={g.day}>
          <div className="section-h">📅 {g.day}</div>
          <div className="tl-line">
            {g.items!.map((n) => (
              <div key={n.id} className="tl-item">
                <div className="tl-dot" style={{ background: n.color || 'var(--accent)' }} />
                <Link to={`/note/${n.id}`} style={{ color: 'inherit' }}>
                  <b style={{ fontSize: 14 }}>{n.title || 'بدون عنوان'}</b>
                  {n.description && <div style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{n.description}</div>}
                </Link>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
