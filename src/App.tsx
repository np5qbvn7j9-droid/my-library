import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import SectionsPage from './pages/SectionsPage'
import SectionPage from './pages/SectionPage'
import NotePage from './pages/NotePage'
import SearchPage from './pages/SearchPage'
import GraphPage from './pages/GraphPage'
import ReviewPage from './pages/ReviewPage'
import QuotesPage from './pages/QuotesPage'
import TemplatesPage from './pages/TemplatesPage'
import InboxPage from './pages/InboxPage'
import ReferencesPage from './pages/ReferencesPage'
import TimelinePage from './pages/TimelinePage'
import DashboardPage from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'
import { seedIfEmpty } from './db/db'
import { initFirebase, watchAuth } from './lib/firebase'
import { startSync, stopSync } from './lib/sync'

export type Theme = 'light' | 'dark' | 'auto'

function applyTheme(theme: Theme) {
  const dark =
    theme === 'dark' ||
    (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('maktabati-theme') as Theme) || 'auto')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem('maktabati-theme', theme)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const fn = () => theme === 'auto' && applyTheme('auto')
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [theme])

  // Settings page changes the theme through this event
  useEffect(() => {
    const fn = (e: any) => setTheme(e.detail as Theme)
    window.addEventListener('mk-theme', fn)
    return () => window.removeEventListener('mk-theme', fn)
  }, [])

  useEffect(() => {
    seedIfEmpty()
    if (initFirebase()) {
      const unsub = watchAuth((u) => {
        setUser(u)
        if (u) startSync()
        else stopSync()
      })
      return unsub
    }
  }, [])

  return (
    <Layout theme={theme} setTheme={setTheme} user={user}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sections" element={<SectionsPage />} />
        <Route path="/section/:id" element={<SectionPage />} />
        <Route path="/note/:id" element={<NotePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/graph" element={<GraphPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/quotes" element={<QuotesPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/references" element={<ReferencesPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/settings" element={<SettingsPage user={user} setUser={setUser} />} />
      </Routes>
    </Layout>
  )
}
