import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'

function DeliveryCard({ delivery }) {
  const { id, customerName, address, itemDescription, status } = delivery

  return (
    <Link to={`/deliveries/${id}`} className="delivery-card">
      <div className="delivery-card__header">
        <span className="delivery-card__id">#{id}</span>
        <StatusBadge status={status} />
      </div>
      <div className="delivery-card__body">
        <p className="delivery-card__customer">{customerName}</p>
        <p className="delivery-card__address">{address}</p>
        <p className="delivery-card__item">{itemDescription}</p>
      </div>
    </Link>
  )
}

export default DeliveryCard