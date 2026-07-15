import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { search, type SearchHit } from '../lib/search'
import EmptyState from '../components/EmptyState'

const KIND_LABEL = { note: '📝 ملاحظة', quote: '❝ اقتباس', reference: '📚 مرجع' }
const KIND_LINK = { note: '/note/', quote: '/quotes?q=', reference: '/references?q=' }

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const [hits, setHits] = useState<SearchHit[] | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const query = params.get('q') || ''
    setQ(query)
    if (!query.trim()) { setHits(null); return }
    setBusy(true)
    search(query).then((r) => { setHits(r); setBusy(false) })
  }, [params])

  return (
    <div>
      <h1 className="page-title">البحث</h1>
      <p className="page-sub">ابحث في العناوين والمحتوى والوسوم والكلمات المفتاحية — يدعم «هذا الشهر»، «اليوم»…</p>
      <form className="search-hero" onSubmit={(e) => { e.preventDefault(); setParams(q.trim() ? { q } : {}) }}>
        <span>🔍</span>
        <input autoFocus placeholder="اكتب سؤالك أو كلمات البحث…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn primary sm" type="submit">بحث</button>
      </form>

      {busy && <div className="empty">جارٍ البحث…</div>}
      {hits && !busy && (
        hits.length === 0 ? (
          <EmptyState icon="🔎" text="لا توجد نتائج — جرّب كلمات أخرى" />
        ) : (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{hits.length} نتيجة</div>
            {hits.map((h) => (
              <Link key={h.id} to={h.kind === 'note' ? KIND_LINK.note + h.rawId : KIND_LINK[h.kind] + encodeURIComponent(h.title)} style={{ color: 'inherit' }}>
                <div className="card clickable" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>{KIND_LABEL[h.kind]}</span>
                  <b style={{ fontSize: 14 }}>{h.title}</b>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  )
}
