// Lightweight in-app toast notifications.
// Usage: toast('تم الحفظ') / toast('فشل', 'error') — ToastHost renders the stack.
import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'
interface ToastItem { id: number; message: string; type: ToastType }

let nextId = 1
let emit: ((t: ToastItem) => void) | null = null

export function toast(message: string, type: ToastType = 'success') {
  emit?.({ id: nextId++, message, type })
}

const ICONS: Record<ToastType, any> = {
  success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info,
}
const COLORS: Record<ToastType, string> = {
  success: 'var(--success)', error: 'var(--danger)', warning: 'var(--warning)', info: 'var(--accent)',
}

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    emit = (t) => {
      setItems((prev) => [...prev.slice(-2), t]) // max 3 visible
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), 3200)
    }
    return () => { emit = null }
  }, [])

  if (!items.length) return null
  return (
    <div className="toast-stack">
      {items.map((t) => {
        const Icon = ICONS[t.type]
        return (
          <div key={t.id} className="toast" onClick={() => setItems((p) => p.filter((x) => x.id !== t.id))}>
            <Icon size={17} style={{ color: COLORS[t.type], flexShrink: 0 }} />
            <span>{t.message}</span>
          </div>
        )
      })}
    </div>
  )
}
