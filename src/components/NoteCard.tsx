import { Link } from 'react-router-dom'
import type { Note } from '../types'
import { timeAgo } from '../lib/utils'

export default function NoteCard({ note }: { note: Note }) {
  return (
    <Link to={`/note/${note.id}`} style={{ color: 'inherit' }}>
      <div className="card clickable note-card">
        {note.color && <div className="bar" style={{ background: note.color }} />}
        <h4>
          {note.pinned ? '📌 ' : ''}
          {note.favorite ? '⭐ ' : ''}
          {note.title || 'بدون عنوان'}
        </h4>
        {(note.description || note.contentText) && <p>{note.description || note.contentText.slice(0, 140)}</p>}
        <div className="meta">
          <span>{timeAgo(note.updatedAt)}</span>
          {note.tags?.slice(0, 3).map((t) => (
            <span key={t} className="chip">#{t}</span>
          ))}
          {note.srs && <span title="ضمن نظام المراجعة">🔁</span>}
        </div>
      </div>
    </Link>
  )
}
