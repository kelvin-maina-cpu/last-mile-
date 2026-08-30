const CONNECTION_CONFIG = {
  connected: { label: 'Live', color: '#2e7d32', icon: '' },
  connecting: { label: 'Connecting...', color: '#f57c00', icon: '' },
  reconnecting: { label: 'Reconnecting...', color: '#f57c00', icon: '' },
  disconnected: { label: 'Offline', color: '#c62828', icon: '' },
  error: { label: 'Connection Error', color: '#c62828', icon: '' },
}

function ConnectionIndicator({ state }) {
  const config = CONNECTION_CONFIG[state] || CONNECTION_CONFIG.disconnected

  return (
    <div className="connection-indicator" title={`Connection: ${state}`}>
      <span
        className="connection-indicator__dot"
        style={{ backgroundColor: config.color }}
      />
      <span className="connection-indicator__label">{config.label}</span>
    </div>
  )
}

export default ConnectionIndicator