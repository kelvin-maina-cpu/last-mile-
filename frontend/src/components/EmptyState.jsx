function EmptyState({ icon = '📦', title, hint, compact = false }) {
  return (
    <div className={`empty-state ${compact ? 'empty-state--compact' : ''}`}>
      <p className="empty-state__icon">{icon}</p>
      <p className="empty-state__title">{title}</p>
      {hint && <p className="empty-state__hint">{hint}</p>}
    </div>
  )
}

export default EmptyState
