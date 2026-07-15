import { Link } from 'react-router-dom'
import { Pin, Star, Repeat2 } from 'lucide-react'
import type { Note } from '../types'
import { timeAgo } from '../lib/utils'

export default function NoteCard({ note }: { note: Note }) {
  return (
    <Link to={`/note/${note.id}`} style={{ color: 'inherit' }}>
      <div className="card clickable note-card">
        {note.color && <div className="bar" style={{ background: note.color }} />}
        <h4 style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {note.pinned ? <Pin size={13} style={{ color: 'var(--accent)' }} /> : null}
          {note.favorite ? <Star size={13} style={{ color: 'var(--warning)', fill: 'var(--warning)' }} /> : null}
          {note.title || 'بدون عنوان'}
        </h4>
        {(note.description || note.contentText) && <p>{note.description || note.contentText.slice(0, 140)}</p>}
        <div className="meta">
          <span>{timeAgo(note.updatedAt)}</span>
          {note.tags?.slice(0, 3).map((t) => (
            <span key={t} className="chip">#{t}</span>
          ))}
          {note.srs && <Repeat2 size={12} />}
        </div>
      </div>
    </Link>
  )
}

// Renders notes in the user's preferred layout (cards / grid / list) from Settings
import { useSettings } from '../lib/settings'
export function NotesGrid({ notes }: { notes: Note[] }) {
  const { settings } = useSettings()
  const cls =
    settings.noteView === 'list' ? 'notes-list' : settings.noteView === 'grid' ? 'grid cols-3' : 'grid cols-2'
  return <div className={cls}>{notes.map((n) => <NoteCard key={n.id} note={n} />)}</div>
}
