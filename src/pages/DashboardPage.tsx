import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../db/db'
import { startOfToday } from '../lib/utils'

export default function DashboardPage() {
  const stats = useLiveQuery(async () => {
    const [notes, sections, quotes, refs, inbox] = await Promise.all([
      db.notes.filter((n) => !n.deleted).toArray(),
      db.sections.filter((s) => !s.deleted).toArray(),
      db.quotes.filter((q) => !q.deleted).count(),
      db.references.filter((r) => !r.deleted).toArray(),
      db.inbox.filter((i) => !i.deleted && !i.processed).count(),
    ])
    const bySection: Record<string, number> = {}
    for (const n of notes) if (n.sectionId) bySection[n.sectionId] = (bySection[n.sectionId] || 0) + 1
    const topSections = sections
      .map((s) => ({ ...s, count: bySection[s.id] || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
    const tagCount: Record<string, number> = {}
    for (const n of notes) for (const t of n.tags || []) tagCount[t] = (tagCount[t] || 0) + 1
    const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 15)
    const week = notes.filter((n) => n.createdAt >= startOfToday() - 7 * 864e5).length
    const srsCount = notes.filter((n) => n.srs).length
    const dueCount = notes.filter((n) => n.srs && n.srs.due <= Date.now()).length
    const books = refs.filter((r) => r.type === 'كتاب').length
    return { total: notes.length, quotes, refs: refs.length, books, inbox, topSections, topTags, week, srsCount, dueCount }
  }, [])

  if (!stats) return null
  const maxCount = stats.topSections[0]?.count || 1

  return (
    <div>
      <h1 className="page-title">الإحصائيات</h1>
      <p className="page-sub">نظرة عامة على مكتبتك المعرفية</p>

      <div className="grid cols-4">
        <div className="card stat"><div className="num">{stats.total}</div><div className="lbl">ملاحظة</div></div>
        <div className="card stat"><div className="num">{stats.books}</div><div className="lbl">كتاب</div></div>
        <div className="card stat"><div className="num">{stats.refs}</div><div className="lbl">مرجع</div></div>
        <div className="card stat"><div className="num">{stats.quotes}</div><div className="lbl">اقتباس</div></div>
        <div className="card stat"><div className="num">{stats.week}</div><div className="lbl">إضافات هذا الأسبوع</div></div>
        <div className="card stat"><div className="num">{stats.srsCount}</div><div className="lbl">في نظام المراجعة</div></div>
        <div className="card stat"><div className="num">{stats.dueCount}</div><div className="lbl">مراجعات مستحقة</div></div>
        <div className="card stat"><div className="num">{stats.inbox}</div><div className="lbl">في صندوق القراءة</div></div>
      </div>

      <div className="section-h">أكثر الأقسام نشاطًا</div>
      <div className="card">
        {stats.topSections.map((s) => (
          <Link key={s.id} to={`/section/${s.id}`} style={{ color: 'inherit' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
              <span style={{ width: 130, fontSize: 13, flexShrink: 0 }}>{s.icon} {s.name}</span>
              <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 6, height: 18, overflow: 'hidden' }}>
                <div style={{ width: `${(s.count / maxCount) * 100}%`, height: '100%', background: s.color, borderRadius: 6, transition: 'width 0.4s' }} />
              </div>
              <b style={{ fontSize: 13, width: 30, textAlign: 'end' }}>{s.count}</b>
            </div>
          </Link>
        ))}
      </div>

      {stats.topTags.length > 0 && (
        <>
          <div className="section-h">أكثر الوسوم استخدامًا</div>
          <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {stats.topTags.map(([t, c]) => (
              <Link key={t} to={`/search?q=${encodeURIComponent(t)}`} className="chip on">#{t} ({c})</Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
