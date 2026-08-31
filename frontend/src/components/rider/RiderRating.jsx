import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true'
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true'

const MOCK_RATING_DATA = {
  averageRating: 4.3,
  totalRatings: 12,
  breakdown: { 5: 6, 4: 3, 3: 2, 2: 1, 1: 0 },
}

function StarRating({ rating, size = 20 }) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(<span key={i} className="star star--filled" style={{ fontSize: size }}>★</span>)
    } else if (i - rating < 1 && i - rating > 0) {
      stars.push(<span key={i} className="star star--half" style={{ fontSize: size }}>★</span>)
    } else {
      stars.push(<span key={i} className="star star--empty" style={{ fontSize: size }}>☆</span>)
    }
  }
  return <div className="star-rating">{stars}</div>
}

function RiderRating() {
  const { user, token } = useAuth()
  const [ratingData, setRatingData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user || user.role !== 'rider' || !token) {
      setLoading(false)
      return
    }

    const fetchRating = async () => {
      if (USE_MOCK_AUTH || USE_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 300))
        setRatingData(MOCK_RATING_DATA)
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/riders/${user.id}/rating`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch rating')
        }

        const data = await response.json()
        setRatingData(data)
      } catch (err) {
        // Auto-fallback: if backend is unreachable, use mock rating data
        if (err instanceof TypeError && err.message.includes('fetch')) {
          console.warn('[Rating] Backend unreachable — using mock rating data.')
          setRatingData(MOCK_RATING_DATA)
        } else {
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchRating()
  }, [user, token])

  if (loading) {
    return (
      <div className="rider-rating rider-rating--loading">
        <div className="loading-state__spinner" style={{ width: 24, height: 24 }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rider-rating rider-rating--error">
        <p>Unable to load ratings</p>
      </div>
    )
  }

  if (!ratingData || ratingData.totalRatings === 0) {
    return (
      <div className="rider-rating rider-rating--empty">
        <div className="rider-rating__header">
          <h3>Rider Rating</h3>
        </div>
        <div className="rider-rating__empty-state">
          <span className="rider-rating__empty-icon">⭐</span>
          <p>No ratings yet</p>
          <p className="rider-rating__empty-hint">Ratings will appear here after customers rate your deliveries.</p>
        </div>
      </div>
    )
  }

  const { averageRating, totalRatings, breakdown } = ratingData
  const maxBreakdown = Math.max(...Object.values(breakdown), 1)

  return (
    <div className="rider-rating">
      <div className="rider-rating__header">
        <h3>Rider Rating</h3>
      </div>

      <div className="rider-rating__content">
        <div className="rider-rating__score">
          <span className="rider-rating__number">{averageRating}</span>
          <span className="rider-rating__max">/ 5.0</span>
          <StarRating rating={averageRating} size={22} />
        </div>

        <p className="rider-rating__count">{totalRatings} rating{totalRatings !== 1 ? 's' : ''}</p>

        <div className="rider-rating__breakdown">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = breakdown[star] || 0
            const percentage = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0
            return (
              <div key={star} className="rider-rating__bar-row">
                <span className="rider-rating__bar-label">{star} ★</span>
                <div className="rider-rating__bar-track">
                  <div
                    className="rider-rating__bar-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="rider-rating__bar-percent">{percentage}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default RiderRating
