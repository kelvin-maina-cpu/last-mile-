function ProofViewer({ proof, onClose }) {
  if (!proof) return null

  return (
    <div className="pod-overlay" onClick={onClose}>
      <div className="pod-modal pod-modal--proof" onClick={(e) => e.stopPropagation()}>
        <div className="pod-modal__header">
          <h2 className="pod-modal__title">Proof of Delivery</h2>
          <button className="pod-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="pod-modal__body">
          <div className="proof-viewer">
            <div className="proof-viewer__status">
              <span className="proof-viewer__status-icon">✓</span>
              <span className="proof-viewer__status-text">DELIVERED</span>
            </div>

            <div className="proof-viewer__details">
              <div className="proof-viewer__item">
                <span className="proof-viewer__icon">✓</span>
                <span>Customer ID verified</span>
              </div>
              <div className="proof-viewer__field">
                <label>Customer ID</label>
                <p>{proof.customerId}</p>
              </div>
            </div>

            {proof.photo && (
              <div className="proof-viewer__photo">
                <label>Delivery Photo</label>
                <img
                  src={proof.photo}
                  alt="Delivery proof"
                  className="proof-viewer__photo-img"
                />
              </div>
            )}

            <div className="proof-viewer__info">
              <div className="proof-viewer__field">
                <label>Delivered by</label>
                <p>{proof.deliveredBy}</p>
              </div>
              <div className="proof-viewer__field">
                <label>Delivery timestamp</label>
                <p>{new Date(proof.timestamp).toLocaleString()}</p>
              </div>
              <div className="proof-viewer__field">
                <label>Delivery status</label>
                <p className="proof-viewer__delivered">DELIVERED ✓</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProofViewer
