import { Link } from 'react-router-dom'
import StatusBadge from '../delivery/StatusBadge'
import RiderDeliveryActions from './RiderDeliveryActions'
import { getRiderDeliveryId, riderExperienceService } from '../../services/riderExperienceService'

function RiderDeliveryCard({ delivery, riderId, riderName, onUpdated, onError }) {
  const id = getRiderDeliveryId(delivery)
  const localState = riderExperienceService.getDeliveryState(riderId, id)
  const status = localState.status || delivery.status
  const proof = localState.proof || delivery.proofOfDelivery
  const rating = localState.rating || delivery.rating?.rating

  return (
    <article className="rider-delivery-card">
      <Link to={`/deliveries/${id}`} className="rider-delivery-card__link">
        <div className="rider-delivery-card__header">
          <span className="delivery-card__id">#{id.slice(-6)}</span>
          <StatusBadge status={status} />
        </div>
        <div className="rider-delivery-card__details">
          <p><strong>{delivery.customerName}</strong></p>
          <p>{delivery.customerPhone}</p>
          <p>{delivery.deliveryAddress}</p>
          <p className="delivery-card__item">{delivery.itemDescription}</p>
        </div>
        <div className="rider-delivery-card__meta">
          <span>{proof ? 'POD saved' : 'POD pending'}</span>
          {rating && <span>{'★'.repeat(rating)} rating</span>}
        </div>
      </Link>
      <RiderDeliveryActions
        delivery={delivery}
        riderId={riderId}
        riderName={riderName}
        onUpdated={onUpdated}
        onError={onError}
      />
    </article>
  )
}

export default RiderDeliveryCard
