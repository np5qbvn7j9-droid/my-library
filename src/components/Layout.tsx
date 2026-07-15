import { type ReactNode, useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, save } from '../db/db'
import { onSyncStatus, type SyncStatus, syncNow } from '../lib/sync'
import { stripHtml } from '../lib/utils'
import type { Theme } from '../App'

const NAV = [
  { to: '/', icon: '🏠', label: 'الرئيسية' },
  { to: '/sections', icon: '🗂️', label: 'الأقسام' },
  { to: '/search', icon: '🔍', label: 'البحث' },
  { to: '/review', icon: '🔁', label: 'المراجعة' },
  { to: '/inbox', icon: '📥', label: 'صندوق القراءة' },
]
const NAV2 = [
  { to: '/quotes', icon: '❝', label: 'الاقتباسات' },
  { to: '/references', icon: '📚', label: 'المراجع' },
  { to: '/graph', icon: '🕸️', label: 'الخريطة المعرفية' },
  { to: '/templates', icon: '📋', label: 'القوالب' },
  { to: '/timeline', icon: '🕐', label: 'الخط الزمني' },
  { to: '/dashboard', icon: '📊', label: 'الإحصائيات' },
  { to: '/settings', icon: '⚙️', label: 'الإعدادات' },
]

const SYNC_LABEL: Record<SyncStatus, string> = {
  off: '⚪ بدون مزامنة', idle: '🟢 متزامن', syncing: '🔄 جارٍ المزامنة…', error: '🔴 خطأ بالمزامنة',
}

export default function Layout({ children, theme, setTheme, user }: {
  children: ReactNode; theme: Theme; setTheme: (t: Theme) => void; user: any
}) {
  const [open, setOpen] = useState(false)
  const [fab, setFab] = useState(false)
  const [sync, setSync] = useState<SyncStatus>('off')
  const nav = useNavigate()
  const loc = useLocation()
  const dueCount = useLiveQuery(async () => {
    const notes = await db.notes.filter((n) => !n.deleted && !!n.srs && n.srs!.due <= Date.now()).count()
    return notes
  }, [], 0)

  useEffect(() => onSyncStatus((s) => setSync(s)) && undefined, [])
  useEffect(() => { setOpen(false); setFab(false) }, [loc.pathname])

  async function newNote(contentHTML = '') {
    const id = await save('notes', {
      title: '', description: '', contentHTML, contentText: stripHtml(contentHTML),
      sectionId: null, folderId: null, tags: [], keywords: [], refIds: [], links: [],
      color: null, pinned: 0, favorite: 0, archived: 0, srs: null,
    } as any)
    nav(`/note/${id}`)
  }

  async function pasteNote() {
    try {
      const text = await navigator.clipboard.readText()
      await newNote(`<p>${text.replace(/\n/g, '</p><p>')}</p>`)
    } catch {
      alert('تعذر قراءة الحافظة — الصق النص داخل ملاحظة جديدة')
      newNote()
    }
  }

  return (
    <div className="app">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <img src="./icon.svg" alt="" /> مكتبتي
        </div>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => `navlink ${isActive ? 'active' : ''}`} end={n.to === '/'}>
            <span>{n.icon}</span> {n.label}
            {n.to === '/review' && dueCount ? <span className="chip on" style={{ marginInlineStart: 'auto' }}>{dueCount}</span> : null}
          </NavLink>
        ))}
        <div className="nav-section-title">المكتبة</div>
        {NAV2.map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => `navlink ${isActive ? 'active' : ''}`}>
            <span>{n.icon}</span> {n.label}
          </NavLink>
        ))}
        <div style={{ marginTop: 'auto', padding: '12px 12px 4px', fontSize: 12, color: 'var(--text-3)' }}>
          <button className="btn ghost sm" onClick={() => syncNow()} title="مزامنة الآن">{SYNC_LABEL[sync]}</button>
          <div style={{ marginTop: 6 }}>
            <button
              className="btn ghost sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'auto' : 'dark')}
            >
              {theme === 'dark' ? '🌙 داكن' : theme === 'light' ? '☀️ فاتح' : '🌓 تلقائي'}
            </button>
          </div>
          {user && <div style={{ marginTop: 6, padding: '0 6px' }}>{user.email}</div>}
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <button className="btn ghost menu-btn" onClick={() => setOpen(!open)}>☰</button>
          <div style={{ flex: 1 }} />
          <button className="btn sm" onClick={() => nav('/search')}>🔍 بحث</button>
          <button className="btn primary sm" onClick={() => newNote()}>+ ملاحظة</button>
        </div>
        <div className="content">{children}</div>
      </div>

      {/* Quick actions */}
      {fab && (
        <div className="fab-menu">
          <button onClick={() => newNote()}>📝 ملاحظة جديدة</button>
          <button onClick={() => { setFab(false); nav('/templates') }}>📋 من قالب</button>
          <button onClick={() => { setFab(false); pasteNote() }}>📎 لصق من الحافظة</button>
          <button onClick={() => { setFab(false); nav('/inbox?add=1') }}>🔗 حفظ رابط</button>
          <button onClick={() => { setFab(false); nav('/quotes?add=1') }}>❝ اقتباس جديد</button>
        </div>
      )}
      <button className="fab" onClick={() => setFab(!fab)}>{fab ? '×' : '+'}</button>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {[...NAV.slice(0, 4), { to: '/settings', icon: '⚙️', label: 'الإعدادات' }].map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? 'active' : '')} end={n.to === '/'}>
            <span className="ic">{n.icon}</span> {n.label}
          </NavLink>
        ))}
      </nav>

      {open && <div className="modal-overlay" style={{ zIndex: 80 }} onClick={() => setOpen(false)} />}
    </div>
  )
}
