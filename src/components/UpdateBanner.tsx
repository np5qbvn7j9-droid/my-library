import { useEffect, useState } from 'react'

// Version of the page currently running (baked into index.html at deploy time)
const CURRENT = document.querySelector('meta[name="app-version"]')?.getAttribute('content') || ''

async function fetchLatestVersion(): Promise<string | null> {
  try {
    const res = await fetch(`./index.html?nocache=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return null
    const html = await res.text()
    const m = html.match(/name="app-version"\s+content="([^"]+)"/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

export default function UpdateBanner() {
  const [available, setAvailable] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const check = async () => {
      const latest = await fetchLatestVersion()
      if (latest && CURRENT && latest !== CURRENT) setAvailable(true)
    }
    check()
    const iv = setInterval(check, 30 * 60 * 1000) // every 30 min
    const onVisible = () => document.visibilityState === 'visible' && check()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(iv)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  if (!available || dismissed) return null

  async function refresh() {
    setBusy(true)
    try {
      // Drop every cache + refresh the service worker so the reload is truly fresh
      if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      }
      const regs = (await navigator.serviceWorker?.getRegistrations?.()) || []
      await Promise.all(regs.map((r) => r.update()))
    } catch {}
    location.reload()
  }

  return (
    <div className="update-banner">
      <div style={{ flex: 1 }}>
        <b style={{ fontSize: 14 }}>يتوفر إصدار جديد من التطبيق</b>
        <div style={{ fontSize: 12.5, color: 'var(--text-2)' }}>تم إجراء تحسينات وإصلاحات جديدة</div>
      </div>
      <button className="btn primary sm" disabled={busy} onClick={refresh}>{busy ? '…' : 'تحديث الآن'}</button>
      <button className="btn ghost sm" onClick={() => setDismissed(true)}>لاحقًا</button>
    </div>
  )
}
