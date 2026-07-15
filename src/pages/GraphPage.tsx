import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/db'
import EmptyState from '../components/EmptyState'

interface GNode { id: string; title: string; x: number; y: number; vx: number; vy: number; deg: number; color: string }
interface GEdge { a: number; b: number }

// Knowledge graph: nodes = notes, edges = wiki links + shared tags.
// Small custom force simulation (no external dependency).
export default function GraphPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nav = useNavigate()
  const [count, setCount] = useState<number | null>(null)
  const nodesRef = useRef<GNode[]>([])

  useEffect(() => {
    let raf = 0
    let running = true

    async function build() {
      const notes = await db.notes.filter((n) => !n.deleted && !n.archived).toArray()
      const W = canvasRef.current?.parentElement?.clientWidth || 800
      const H = Math.max(460, window.innerHeight - 260)
      const canvas = canvasRef.current!
      const dpr = window.devicePixelRatio || 1
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'

      const nodes: GNode[] = notes.map((n, i) => ({
        id: n.id, title: n.title || 'بدون عنوان',
        x: W / 2 + Math.cos(i) * (100 + (i % 7) * 30), y: H / 2 + Math.sin(i) * (100 + (i % 5) * 30),
        vx: 0, vy: 0, deg: 0, color: n.color || '#5aa9e6',
      }))
      const byTitle = new Map(notes.map((n, i) => [(n.title || '').trim(), i]))
      const edges: GEdge[] = []
      const seen = new Set<string>()
      notes.forEach((n, i) => {
        for (const l of n.links || []) {
          const j = byTitle.get(l)
          if (j !== undefined && j !== i) {
            const key = Math.min(i, j) + '-' + Math.max(i, j)
            if (!seen.has(key)) { seen.add(key); edges.push({ a: i, b: j }) }
          }
        }
      })
      // shared-tag edges (lighter)
      const tagMap = new Map<string, number[]>()
      notes.forEach((n, i) => (n.tags || []).forEach((t) => {
        if (!tagMap.has(t)) tagMap.set(t, [])
        tagMap.get(t)!.push(i)
      }))
      const tagEdges: GEdge[] = []
      for (const idxs of tagMap.values()) {
        if (idxs.length < 2 || idxs.length > 12) continue
        for (let a = 0; a < idxs.length - 1; a++) {
          const key = Math.min(idxs[a], idxs[a + 1]) + '-' + Math.max(idxs[a], idxs[a + 1])
          if (!seen.has(key)) { seen.add(key); tagEdges.push({ a: idxs[a], b: idxs[a + 1] }) }
        }
      }
      for (const e of [...edges, ...tagEdges]) { nodes[e.a].deg++; nodes[e.b].deg++ }
      nodesRef.current = nodes
      setCount(nodes.length)

      const ctx = canvas.getContext('2d')!
      ctx.scale(dpr, dpr)
      const styles = getComputedStyle(document.documentElement)
      const textColor = styles.getPropertyValue('--text-2') || '#888'
      const borderColor = styles.getPropertyValue('--border') || '#ccc'

      let iterations = 0
      function tick() {
        if (!running) return
        // forces
        if (iterations < 300) {
          iterations++
          for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i]
            // repulsion (sampled for performance on large graphs)
            const step = nodes.length > 400 ? 5 : 1
            for (let j = 0; j < nodes.length; j += step) {
              if (i === j) continue
              const m = nodes[j]
              let dx = n.x - m.x, dy = n.y - m.y
              const d2 = dx * dx + dy * dy || 1
              const f = 1600 / d2
              n.vx += dx * f * 0.01
              n.vy += dy * f * 0.01
            }
            // center gravity
            n.vx += (W / 2 - n.x) * 0.0015
            n.vy += (H / 2 - n.y) * 0.0015
          }
          for (const e of [...edges, ...tagEdges]) {
            const a = nodes[e.a], b = nodes[e.b]
            const dx = b.x - a.x, dy = b.y - a.y
            const d = Math.sqrt(dx * dx + dy * dy) || 1
            const f = (d - 90) * 0.004
            a.vx += (dx / d) * f; a.vy += (dy / d) * f
            b.vx -= (dx / d) * f; b.vy -= (dy / d) * f
          }
          for (const n of nodes) {
            n.vx *= 0.85; n.vy *= 0.85
            n.x += n.vx; n.y += n.vy
            n.x = Math.max(20, Math.min(W - 20, n.x))
            n.y = Math.max(20, Math.min(H - 20, n.y))
          }
        }
        // draw
        ctx.clearRect(0, 0, W, H)
        ctx.strokeStyle = borderColor
        ctx.lineWidth = 1
        for (const e of tagEdges) {
          ctx.globalAlpha = 0.35
          ctx.beginPath(); ctx.moveTo(nodes[e.a].x, nodes[e.a].y); ctx.lineTo(nodes[e.b].x, nodes[e.b].y); ctx.stroke()
        }
        ctx.globalAlpha = 0.8
        for (const e of edges) {
          ctx.beginPath(); ctx.moveTo(nodes[e.a].x, nodes[e.a].y); ctx.lineTo(nodes[e.b].x, nodes[e.b].y); ctx.stroke()
        }
        ctx.globalAlpha = 1
        for (const n of nodes) {
          const r = 5 + Math.min(n.deg, 8)
          ctx.fillStyle = n.color
          ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fill()
          if (nodes.length < 120 || n.deg > 1) {
            ctx.fillStyle = textColor
            ctx.font = '11px IBM Plex Sans Arabic, sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText(n.title.slice(0, 22), n.x, n.y + r + 13)
          }
        }
        raf = requestAnimationFrame(tick)
      }
      tick()
    }

    build()
    return () => { running = false; cancelAnimationFrame(raf) }
  }, [])

  function onClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect()
    const x = e.clientX - rect.left, y = e.clientY - rect.top
    for (const n of nodesRef.current) {
      const dx = n.x - x, dy = n.y - y
      if (dx * dx + dy * dy < 200) { nav(`/note/${n.id}`); return }
    }
  }

  return (
    <div>
      <h1 className="page-title">الخريطة المعرفية</h1>
      <p className="page-sub">العلاقات بين ملاحظاتك — الخطوط الداكنة روابط [[ويكي]]، والفاتحة وسوم مشتركة. اضغط أي عقدة لفتحها.</p>
      {count === 0 && <EmptyState icon="🕸️" text="أضف ملاحظات وروابط [[ويكي]] لتظهر الخريطة" />}
      <div className="card" style={{ padding: 6 }}>
        <canvas ref={canvasRef} onClick={onClick} style={{ display: 'block', cursor: 'pointer' }} />
      </div>
    </div>
  )
}
