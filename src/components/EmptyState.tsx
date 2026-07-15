export default function EmptyState({ icon = '📭', text }: { icon?: string; text: string }) {
  return (
    <div className="empty">
      <div className="big">{icon}</div>
      {text}
    </div>
  )
}
