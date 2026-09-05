const STORAGE_KEY = 'reflex_rider_experience_v1'

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function getRiderState(riderId) {
  const store = readStore()
  return store[riderId] || { deliveries: {}, points: 0, badges: [] }
}

function updateDelivery(riderId, deliveryId, changes) {
  const store = readStore()
  const riderState = store[riderId] || { deliveries: {}, points: 0, badges: [] }
  riderState.deliveries[deliveryId] = {
    ...(riderState.deliveries[deliveryId] || {}),
    ...changes,
  }
  store[riderId] = riderState
  writeStore(store)
  return riderState.deliveries[deliveryId]
}

function awardBadge(riderState, badge) {
  if (!riderState.badges.includes(badge)) {
    riderState.badges.push(badge)
  }
}

export const riderExperienceService = {
  getDeliveryState(riderId, deliveryId) {
    return getRiderState(riderId).deliveries[deliveryId] || {}
  },

  getProgress(riderId, completedCount, averageRating) {
    const state = getRiderState(riderId)
    const localRatings = Object.values(state.deliveries).filter((delivery) => delivery.rating)
    const fiveStarRatings = localRatings.filter((delivery) => delivery.rating === 5).length
    const completed = Math.max(completedCount, Object.values(state.deliveries).filter((delivery) => delivery.status === 'DELIVERED').length)
    const badges = [...state.badges]

    if (completed >= 1) awardBadge({ badges }, 'First Delivery')
    if (completed >= 10) awardBadge({ badges }, '10 Deliveries')
    if (fiveStarRatings >= 3) awardBadge({ badges }, 'Customer Favorite')
    if (completed >= 5) awardBadge({ badges }, 'Reliable Rider')

    return {
      points: state.points,
      completedDeliveries: completed,
      averageRating,
      badges,
      localRatings,
    }
  },

  markPickedUp(riderId, deliveryId) {
    return updateDelivery(riderId, deliveryId, { status: 'PICKED_UP' })
  },

  markOutForDelivery(riderId, deliveryId) {
    return updateDelivery(riderId, deliveryId, { status: 'OUT_FOR_DELIVERY' })
  },

  saveProof(riderId, deliveryId, proof) {
    return updateDelivery(riderId, deliveryId, { proof })
  },

  async markDelivered(riderId, deliveryId) {
    const store = readStore()
    const riderState = store[riderId] || { deliveries: {}, points: 0, badges: [] }
    const deliveryState = riderState.deliveries[deliveryId] || {}

    if (deliveryState.completionAwarded) {
      return deliveryState
    }

    riderState.points += 10
    deliveryState.status = 'DELIVERED'
    deliveryState.completionAwarded = true
    riderState.deliveries[deliveryId] = deliveryState
    awardBadge(riderState, 'First Delivery')
    if (Object.values(riderState.deliveries).filter((delivery) => delivery.completionAwarded).length >= 10) {
      awardBadge(riderState, '10 Deliveries')
    }
    store[riderId] = riderState
    writeStore(store)
    return deliveryState
  },

  saveRating(riderId, deliveryId, rating, comment) {
    const numericRating = Number(rating)
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      throw new Error('Rating must be between 1 and 5 stars.')
    }

    const store = readStore()
    const riderState = store[riderId] || { deliveries: {}, points: 0, badges: [] }
    const deliveryState = riderState.deliveries[deliveryId] || {}
    if (deliveryState.status !== 'DELIVERED') {
      throw new Error('A rating can only be submitted after delivery.')
    }
    if (deliveryState.rating) {
      throw new Error('This delivery has already been rated.')
    }

    riderState.points += 2
    if (numericRating === 5) riderState.points += 5
    deliveryState.rating = numericRating
    deliveryState.comment = comment.trim()
    deliveryState.ratingAwarded = true
    riderState.deliveries[deliveryId] = deliveryState
    if (numericRating === 5 && Object.values(riderState.deliveries).filter((delivery) => delivery.rating === 5).length >= 3) {
      awardBadge(riderState, 'Customer Favorite')
    }
    store[riderId] = riderState
    writeStore(store)
    return deliveryState
  },
}

export function getRiderDeliveryId(delivery) {
  return delivery?._id || delivery?.id
}
