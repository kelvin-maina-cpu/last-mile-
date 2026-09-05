const STATUS_LABELS = {
  REQUESTED: 'Requested',
  ASSIGNED: 'Assigned',
  PICKED_UP: 'Picked Up',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
}

const STATUS_COLORS = {
  REQUESTED: { bg: 'rgba(33, 150, 243, 0.2)', text: '#90caf9', border: '#1976d2' },
  ASSIGNED: { bg: 'rgba(124, 45, 158, 0.25)', text: '#d9b3f0', border: '#7c2d9e' },
  PICKED_UP: { bg: 'rgba(230, 81, 0, 0.2)', text: '#ffb877', border: '#e65100' },
  OUT_FOR_DELIVERY: { bg: 'rgba(0, 121, 107, 0.2)', text: '#80cbc4', border: '#00796b' },
  DELIVERED: { bg: 'rgba(46, 125, 50, 0.2)', text: '#8ee39b', border: '#2e7d32' },
}

function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || { bg: 'rgba(241, 238, 246, 0.08)', text: '#f1eef6', border: '#4a1d5c' }

  return (
    <span
      className="status-badge"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border,
      }}
    >
      {STATUS_LABELS[status] || status}
    </span>
  )
}

export default StatusBadge