import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../config/apiConfig'
import { riderExperienceService } from '../../services/riderExperienceService'

function RiderProgress({ riderId, completedCount }) {
  const { token } = useAuth()
  const [rating, setRating] = useState(0)
  const [progress, setProgress] = useState(() => riderExperienceService.getProgress(riderId, completedCount, 0))

  useEffect(() => {
    let active = true
    const loadRating = async () => {
      try {
        const [ratingResponse, progressResponse] = await Promise.all([
          apiFetch(`/riders/${riderId}/rating`, { headers: { Authorization: `Bearer ${token}` } }),
          apiFetch(`/riders/${riderId}/progress`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        const data = ratingResponse.ok ? await ratingResponse.json() : null
        const persisted = progressResponse.ok ? await progressResponse.json() : null
        if (active) {
          const average = data?.averageRating || 0
          setRating(average)
          setProgress({
            points: persisted?.points || 0,
            completedDeliveries: persisted?.completedDeliveries ?? completedCount,
            averageRating: average,
            badges: persisted?.badges || [],
          })
        }
      } catch {
        if (active) setProgress(riderExperienceService.getProgress(riderId, completedCount, 0))
      }
    }
    loadRating()
    return () => { active = false }
  }, [riderId, completedCount, token])

  return (
    <section className="rider-progress" aria-label="Rider progress">
      <div className="rider-progress__header">
        <div>
          <p className="eyebrow">Rider progress</p>
          <h2>Keep the route moving</h2>
        </div>
        <span className="rider-progress__points">{progress.points} pts</span>
      </div>
      <div className="rider-progress__stats">
        <div><strong>{progress.completedDeliveries}</strong><span>Completed</span></div>
        <div><strong>{rating ? `${rating} / 5` : 'No rating'}</strong><span>Customer rating</span></div>
      </div>
      <div className="rider-progress__badges">
        {progress.badges.length > 0 ? progress.badges.map((badge) => (
          <span className="rider-progress__badge" key={badge}>{badge}</span>
        )) : <span className="rider-progress__empty">Complete a delivery to earn your first badge.</span>}
      </div>
    </section>
  )
}

export default RiderProgress
