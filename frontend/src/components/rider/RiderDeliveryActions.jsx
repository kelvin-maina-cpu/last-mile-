import { useCallback, useEffect, useRef, useState } from 'react'
import { deliveryService, ApiError } from '../../services/api/deliveryService'
import { getRiderDeliveryId, riderExperienceService } from '../../services/riderExperienceService'

const NEXT_ACTIONS = {
  ASSIGNED: { label: 'Pick Up', next: 'PICKED_UP' },
  PICKED_UP: { label: 'Start Delivery', next: 'OUT_FOR_DELIVERY' },
}

function RiderDeliveryActions({ delivery, riderId, riderName, onUpdated, onError }) {
  const deliveryId = getRiderDeliveryId(delivery)
  const [localState, setLocalState] = useState(() => riderExperienceService.getDeliveryState(riderId, deliveryId))
  const [photo, setPhoto] = useState(localState.proof?.photo || '')
  const [previewing, setPreviewing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [rating, setRating] = useState(localState.rating || 0)
  const [comment, setComment] = useState(localState.comment || '')
  const [ratingError, setRatingError] = useState('')
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')

  useEffect(() => {
    setLocalState(riderExperienceService.getDeliveryState(riderId, deliveryId))
  }, [riderId, deliveryId, delivery.status])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraActive(false)
  }, [])

  useEffect(() => stopCamera, [stopCamera])

  const startCamera = useCallback(async () => {
    setCameraError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is unavailable in this browser. Use the file option below.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      setCameraActive(true)
    } catch (error) {
      setCameraError(error.name === 'NotAllowedError'
        ? 'Camera permission was denied. Allow camera access in the browser and try again.'
        : error.name === 'NotFoundError'
          ? 'No camera was found. Use the file option below.'
          : 'Unable to access the camera. Use the file option below.')
    }
  }, [])

  useEffect(() => {
    if (!cameraActive || !videoRef.current || !streamRef.current) return
    videoRef.current.srcObject = streamRef.current
    videoRef.current.play().catch(() => {
      setCameraError('Tap the camera preview to start the video.')
    })
  }, [cameraActive])

  const captureFromCamera = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      setCameraError('Camera is still starting. Please wait a moment and try again.')
      return
    }
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    setPhoto(canvas.toDataURL('image/jpeg', 0.8))
    setPreviewing(true)
    stopCamera()
  }, [stopCamera])

  const status = delivery.status
  const proof = localState.proof || delivery.proofOfDelivery

  const updateLocal = (changes, nextStatus = status) => {
    const next = { ...localState, ...changes, status: nextStatus }
    setLocalState(next)
    onUpdated({ ...delivery, ...changes, status: nextStatus, proofOfDelivery: changes.proof || proof })
  }

  const handleNextAction = async () => {
    const action = NEXT_ACTIONS[status]
    if (!action) return
    setSaving(true)
    try {
      const updated = await deliveryService.updateDeliveryStatus(deliveryId, action.next, riderId)
      if (action.next === 'PICKED_UP') riderExperienceService.markPickedUp(riderId, deliveryId)
      onUpdated(updated)
      setLocalState({ ...localState, status: action.next })
    } catch (error) {
      onError(error instanceof ApiError ? error.message : 'Failed to update delivery status.')
    } finally {
      setSaving(false)
    }
  }

  const handlePhoto = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setPhoto(reader.result)
      setPreviewing(true)
    }
    reader.readAsDataURL(file)
  }

  const saveProofAndComplete = async () => {
    if (!photo) return
    setSaving(true)
    const savedProof = {
      photo,
      deliveredBy: riderName,
      timestamp: new Date().toISOString(),
      riderId,
    }
    try {
      const updated = await deliveryService.completeDelivery(deliveryId, savedProof)
      riderExperienceService.saveProof(riderId, deliveryId, savedProof)
      await riderExperienceService.markDelivered(riderId, deliveryId)
      setLocalState({ ...localState, status: 'DELIVERED', proof: savedProof, completionAwarded: true })
      setPreviewing(false)
      onUpdated({ ...updated, status: 'DELIVERED', proofOfDelivery: savedProof })
    } catch (error) {
      onError(error instanceof ApiError ? error.message : 'Delivery could not be completed. Your proof is saved; try again.')
    } finally {
      setSaving(false)
    }
  }

  const submitRating = async () => {
    setRatingError('')
    try {
      await deliveryService.submitRating(riderId, deliveryId, rating, comment)
      const saved = riderExperienceService.saveRating(riderId, deliveryId, rating, comment)
      setLocalState({ ...localState, ...saved })
    } catch (error) {
      setRatingError(error instanceof ApiError ? error.message : 'Rating could not be saved.')
    }
  }

  if (status === 'DELIVERED') {
    return (
      <div className="rider-delivery-actions rider-delivery-actions--complete">
        <div className="rider-delivery-actions__complete-line"><strong>Delivered</strong><span>+10 points earned</span></div>
        {proof?.photo && <button className="btn btn--secondary" type="button" onClick={() => setPreviewing(true)}>View Proof</button>}
        {!(localState.rating || delivery.rating?.rating) ? (
          <div className="rider-rating-form">
            <p className="rider-rating-form__title">Customer rating</p>
            <div className="rider-rating-form__stars" role="group" aria-label="Customer rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" className={value <= rating ? 'is-selected' : ''} onClick={() => setRating(value)} aria-label={`${value} star${value > 1 ? 's' : ''}`}>★</button>
              ))}
            </div>
            <input className="form-input" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Optional comment" maxLength={500} />
            {ratingError && <p className="pod-error">{ratingError}</p>}
            <button className="btn btn--primary" type="button" onClick={submitRating} disabled={!rating}>Save rating</button>
            <small>Local MVP feedback until a rating-write endpoint is available.</small>
          </div>
        ) : <p className="rider-delivery-actions__rating">Customer rating: {'★'.repeat(localState.rating || delivery.rating.rating)}{'☆'.repeat(5 - (localState.rating || delivery.rating.rating))}</p>}
        {previewing && proof?.photo && <ProofPreview proof={proof} onClose={() => setPreviewing(false)} />}
      </div>
    )
  }

  return (
    <div className="rider-delivery-actions">
      {NEXT_ACTIONS[status] && <button className="status-btn status-btn--primary" type="button" onClick={handleNextAction} disabled={saving}>{saving ? 'Updating...' : NEXT_ACTIONS[status].label}</button>}
      {status === 'OUT_FOR_DELIVERY' && (
        <div className="rider-pod-capture">
          <p className="rider-pod-capture__title">Proof of delivery required</p>
          {!photo ? <>
            {!cameraActive ? (
              <button className="btn btn--primary" type="button" onClick={startCamera}>Open Camera</button>
            ) : (
              <div className="rider-camera">
                <video ref={videoRef} className="rider-camera__video" autoPlay playsInline muted />
                <button className="btn btn--success" type="button" onClick={captureFromCamera}>Capture Photo</button>
              </div>
            )}
            {cameraError && <p className="pod-error" role="alert">{cameraError}</p>}
            <label className="btn btn--secondary"><input type="file" accept="image/*" capture="environment" onChange={handlePhoto} hidden />Choose Photo File</label>
            <canvas ref={canvasRef} hidden />
          </> : (
            <>
              <img className="rider-pod-capture__preview" src={photo} alt="Proof preview" />
              <div className="rider-pod-capture__actions"><button className="btn btn--secondary" type="button" onClick={() => { setPhoto(''); setPreviewing(false); startCamera() }}>Retake</button><button className="btn btn--success" type="button" onClick={saveProofAndComplete} disabled={saving}>{saving ? 'Saving...' : 'Confirm & Complete'}</button></div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ProofPreview({ proof, onClose }) {
  return <div className="rider-proof-preview" role="dialog" aria-label="Proof of delivery"><img src={proof.photo} alt="Proof of delivery" /><p>Captured {new Date(proof.timestamp).toLocaleString()}</p><button className="btn btn--secondary" type="button" onClick={onClose}>Close</button></div>
}

export default RiderDeliveryActions
