import { useState, useRef, useCallback } from 'react'
import { deliveryService, ApiError } from '../../services/api/deliveryService'

const STEPS = {
  CUSTOMER_ID: 'customer_id',
  PHOTO: 'photo',
  COMPLETE: 'complete',
}

function ProofOfDelivery({ delivery, riderName, onComplete, onCancel }) {
  const [step, setStep] = useState(STEPS.CUSTOMER_ID)
  const [customerId, setCustomerId] = useState('')
  const [customerIdVerified, setCustomerIdVerified] = useState(false)
  const [customerIdError, setCustomerIdError] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoError, setPhotoError] = useState('')
  const [completing, setCompleting] = useState(false)
  const [completeError, setCompleteError] = useState('')

  // Camera refs
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [photoPreview, setPhotoPreview] = useState(null)
  const [showRetake, setShowRetake] = useState(false)

  // ============================================================
  // STEP 1: Customer ID Verification
  // ============================================================
  const handleVerifyCustomerId = () => {
    setCustomerIdError('')
    const entered = customerId.trim()

    if (!entered) {
      setCustomerIdError('Please enter a Customer ID')
      return
    }

    // MVP verification: compare against delivery's customerId
    // In production, this would call a backend verification endpoint
    if (entered === delivery.customerId) {
      setCustomerIdVerified(true)
      // Auto-advance to photo step after brief confirmation
      setTimeout(() => setStep(STEPS.PHOTO), 800)
    } else {
      setCustomerIdVerified(false)
      setCustomerIdError('Invalid Customer ID')
    }
  }

  // ============================================================
  // STEP 2: Photo Capture
  // ============================================================
  const startCamera = useCallback(async () => {
    try {
      setCameraError('')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraActive(true)
    } catch (err) {
      console.error('Camera access error:', err)
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access and try again.')
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device.')
      } else {
        setCameraError('Unable to access camera. Please try again.')
      }
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setPhotoPreview(imageDataUrl)
    setPhoto(imageDataUrl)
    setShowRetake(true)
    stopCamera()
  }, [stopCamera])

  const handleRetake = () => {
    setPhotoPreview(null)
    setPhoto(null)
    setShowRetake(false)
    setPhotoError('')
    startCamera()
  }

  const handleUsePhoto = () => {
    if (photo) {
      setPhotoError('')
      setStep(STEPS.COMPLETE)
    }
  }

  // ============================================================
  // STEP 3: Complete Delivery
  // ============================================================
  const handleCompleteDelivery = async () => {
    setCompleting(true)
    setCompleteError('')

    const podData = {
      customerId: delivery.customerId,
      photo: photo,
      deliveredBy: riderName,
      timestamp: new Date().toISOString(),
    }

    try {
      const updated = await deliveryService.completeDeliveryWithPOD(delivery.id, podData)
      onComplete(updated)
    } catch (error) {
      if (error instanceof ApiError) {
        setCompleteError(error.message)
      } else {
        setCompleteError('Failed to complete delivery. Please try again.')
      }
      setCompleting(false)
    }
  }

  // ============================================================
  // Cleanup on unmount
  // ============================================================
  const handleCancel = () => {
    stopCamera()
    onCancel()
  }

  // ============================================================
  // RENDER: Step Progress Indicator
  // ============================================================
  const renderProgress = () => (
    <div className="pod-progress">
      <div className={`pod-progress__step ${step === STEPS.CUSTOMER_ID ? 'pod-progress__step--active' : customerIdVerified ? 'pod-progress__step--done' : ''}`}>
        <span className="pod-progress__number">{customerIdVerified ? '✓' : '①'}</span>
        <span className="pod-progress__label">Customer ID</span>
      </div>
      <span className="pod-progress__arrow">→</span>
      <div className={`pod-progress__step ${step === STEPS.PHOTO ? 'pod-progress__step--active' : photo ? 'pod-progress__step--done' : ''}`}>
        <span className="pod-progress__number">{photo ? '✓' : '②'}</span>
        <span className="pod-progress__label">Take Photo</span>
      </div>
      <span className="pod-progress__arrow">→</span>
      <div className={`pod-progress__step ${step === STEPS.COMPLETE ? 'pod-progress__step--active' : ''}`}>
        <span className="pod-progress__number">③</span>
        <span className="pod-progress__label">Complete</span>
      </div>
    </div>
  )

  // ============================================================
  // RENDER: Step 1 — Customer ID
  // ============================================================
  const renderCustomerIdStep = () => (
    <div className="pod-step">
      <h3 className="pod-step__title">Customer Verification</h3>
      <p className="pod-step__description">
        Enter the Customer ID for this delivery.
      </p>

      <div className="pod-step__field">
        <label htmlFor="customerId" className="form-label">
          Customer ID
        </label>
        <input
          type="text"
          id="customerId"
          className={`form-input ${customerIdError ? 'form-input--error' : ''}`}
          placeholder="Enter Customer ID"
          value={customerId}
          onChange={(e) => {
            setCustomerId(e.target.value)
            setCustomerIdError('')
          }}
          disabled={customerIdVerified}
          autoComplete="off"
        />
        {customerIdError && (
          <span className="pod-error">✕ {customerIdError}</span>
        )}
        {customerIdVerified && (
          <span className="pod-success">✓ Customer Verified</span>
        )}
      </div>

      <button
        className="btn btn--primary btn--block"
        onClick={handleVerifyCustomerId}
        disabled={customerIdVerified}
      >
        {customerIdVerified ? '✓ Verified' : 'Verify Customer'}
      </button>
    </div>
  )

  // ============================================================
  // RENDER: Step 2 — Photo
  // ============================================================
  const renderPhotoStep = () => (
    <div className="pod-step">
      <h3 className="pod-step__title">Proof of Delivery</h3>
      <p className="pod-step__description">
        Take a clear photo of the delivered package/item.
      </p>

      {cameraError && (
        <div className="pod-error-banner">
          <span>⚠</span> {cameraError}
        </div>
      )}

      {showRetake && photoPreview ? (
        <div className="pod-photo-preview">
          <img src={photoPreview} alt="Delivery proof" className="pod-photo-preview__img" />
          <div className="pod-photo-preview__actions">
            <button className="btn btn--secondary" onClick={handleRetake}>
              Retake
            </button>
            <button className="btn btn--primary" onClick={handleUsePhoto}>
              Use Photo
            </button>
          </div>
        </div>
      ) : (
        <div className="pod-camera">
          <video
            ref={videoRef}
            className="pod-camera__video"
            autoPlay
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="pod-camera__canvas" style={{ display: 'none' }} />
          <button
            className="pod-camera__capture"
            onClick={capturePhoto}
            aria-label="Take photo"
          >
            <span className="pod-camera__ring" />
          </button>
        </div>
      )}

      {!cameraActive && !photoPreview && (
        <button className="btn btn--primary btn--block" onClick={startCamera}>
          Take Photo
        </button>
      )}

      {photoError && (
        <span className="pod-error">{photoError}</span>
      )}
    </div>
  )

  // ============================================================
  // RENDER: Step 3 — Complete
  // ============================================================
  const renderCompleteStep = () => (
    <div className="pod-step">
      <div className="pod-complete__header">
        <span className="pod-complete__check">✓</span>
        <h3 className="pod-step__title">DELIVERY VERIFIED</h3>
      </div>

      <div className="pod-complete__summary">
        <div className="pod-complete__item">
          <span className="pod-complete__icon">✓</span>
          <span>Customer verified</span>
        </div>
        <div className="pod-complete__item">
          <span className="pod-complete__icon">✓</span>
          <span>Delivery photo captured</span>
        </div>
      </div>

      {photoPreview && (
        <div className="pod-complete__photo">
          <img src={photoPreview} alt="Delivery proof" className="pod-complete__photo-img" />
        </div>
      )}

      <div className="pod-complete__info">
        <div className="pod-complete__field">
          <label>Delivered by</label>
          <p>{riderName}</p>
        </div>
        <div className="pod-complete__field">
          <label>Time</label>
          <p>{new Date().toLocaleString()}</p>
        </div>
      </div>

      {completeError && (
        <div className="error-banner error-banner--compact" role="alert">
          <span className="error-banner__icon">!</span>
          <span className="error-banner__message">{completeError}</span>
        </div>
      )}

      <button
        className="btn btn--success btn--block"
        onClick={handleCompleteDelivery}
        disabled={completing}
      >
        {completing ? (
          <span className="btn__loading">
            <span className="btn__spinner" />
            Completing...
          </span>
        ) : (
          'Complete Delivery'
        )}
      </button>
    </div>
  )

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="pod-overlay" onClick={handleCancel}>
      <div className="pod-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pod-modal__header">
          <h2 className="pod-modal__title">Proof of Delivery</h2>
          <button className="pod-modal__close" onClick={handleCancel} aria-label="Close">
            ×
          </button>
        </div>

        {renderProgress()}

        <div className="pod-modal__body">
          {step === STEPS.CUSTOMER_ID && renderCustomerIdStep()}
          {step === STEPS.PHOTO && renderPhotoStep()}
          {step === STEPS.COMPLETE && renderCompleteStep()}
        </div>
      </div>
    </div>
  )
}

export default ProofOfDelivery
