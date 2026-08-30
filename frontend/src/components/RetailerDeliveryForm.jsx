import { useState } from 'react'
import { deliveryService, ApiError } from '../services/api/deliveryService'

const INITIAL_FORM = {
  customerName: '',
  customerPhone: '',
  address: '',
  itemDescription: '',
}

function RetailerDeliveryForm() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [createdDelivery, setCreatedDelivery] = useState(null)
  const [apiError, setApiError] = useState(null)

  const validate = () => {
    const newErrors = {}

    if (!form.customerName.trim()) {
      newErrors.customerName = 'Customer name is required'
    }

    if (!form.customerPhone.trim()) {
      newErrors.customerPhone = 'Customer phone is required'
    } else if (!/^[\d\s\-+()]{7,}$/.test(form.customerPhone.trim())) {
      newErrors.customerPhone = 'Please enter a valid phone number'
    }

    if (!form.address.trim()) {
      newErrors.address = 'Delivery address is required'
    }

    if (!form.itemDescription.trim()) {
      newErrors.itemDescription = 'Item description is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev }
        delete updated[name]
        return updated
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError(null)

    if (!validate()) return

    setLoading(true)
    try {
      const delivery = await deliveryService.createDelivery({
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        address: form.address.trim(),
        itemDescription: form.itemDescription.trim(),
      })
      setCreatedDelivery(delivery)
      setForm(INITIAL_FORM)
    } catch (error) {
      if (error instanceof ApiError) {
        setApiError(error.message)
      } else {
        setApiError('Failed to create delivery. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (createdDelivery) {
    return (
      <div className="retailer-form">
        <div className="success-card">
          <div className="success-card__icon">✓</div>
          <h2 className="success-card__title">Delivery Created!</h2>
          <div className="success-card__details">
            <div className="success-card__field">
              <label>Delivery ID</label>
              <p>#{createdDelivery.id}</p>
            </div>
            {createdDelivery.customerId && (
              <div className="success-card__field success-card__field--highlight">
                <label>Customer ID</label>
                <p className="success-card__customerId">{createdDelivery.customerId}</p>
                <span className="success-card__hint">Share this ID with the customer for verification</span>
              </div>
            )}
            <div className="success-card__field">
              <label>Customer</label>
              <p>{createdDelivery.customerName}</p>
            </div>
            <div className="success-card__field">
              <label>Phone</label>
              <p>{createdDelivery.customerPhone}</p>
            </div>
            <div className="success-card__field">
              <label>Address</label>
              <p>{createdDelivery.address}</p>
            </div>
            <div className="success-card__field">
              <label>Item</label>
              <p>{createdDelivery.itemDescription}</p>
            </div>
            <div className="success-card__field">
              <label>Status</label>
              <p className="success-card__status">OPEN — Waiting for dispatcher</p>
            </div>
            <p className="success-card__note">Customer ID: <strong>{createdDelivery.customerId}</strong> — give this to the customer so they can verify delivery.</p>
          </div>
          <button
            className="btn btn--primary"
            onClick={() => setCreatedDelivery(null)}
          >
            Create Another Delivery
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="retailer-form">
      <h2 className="retailer-form__title">New Delivery Request</h2>
      <p className="retailer-form__subtitle">
        Fill in the details below to create a new delivery request for a customer.
      </p>

      {apiError && (
        <div className="error-banner" role="alert">
          <span className="error-banner__icon">!</span>
          <span className="error-banner__message">{apiError}</span>
          <button
            className="error-banner__close"
            onClick={() => setApiError(null)}
          >
            ×
          </button>
        </div>
      )}

      <form className="delivery-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="customerName" className="form-label">
            Customer Name <span className="form-label__required">*</span>
          </label>
          <input
            type="text"
            id="customerName"
            name="customerName"
            className={`form-input ${errors.customerName ? 'form-input--error' : ''}`}
            placeholder="e.g. Grace Wanjiru"
            value={form.customerName}
            onChange={handleChange}
            disabled={loading}
            autoComplete="name"
          />
          {errors.customerName && (
            <span className="form-error">{errors.customerName}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="customerPhone" className="form-label">
            Customer Phone <span className="form-label__required">*</span>
          </label>
          <input
            type="tel"
            id="customerPhone"
            name="customerPhone"
            className={`form-input ${errors.customerPhone ? 'form-input--error' : ''}`}
            placeholder="e.g. 0712 345 678"
            value={form.customerPhone}
            onChange={handleChange}
            disabled={loading}
            autoComplete="tel"
          />
          {errors.customerPhone && (
            <span className="form-error">{errors.customerPhone}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="address" className="form-label">
            Delivery Address <span className="form-label__required">*</span>
          </label>
          <input
            type="text"
            id="address"
            name="address"
            className={`form-input ${errors.address ? 'form-input--error' : ''}`}
            placeholder="e.g. Kiganjo, Nyeri"
            value={form.address}
            onChange={handleChange}
            disabled={loading}
          />
          {errors.address && (
            <span className="form-error">{errors.address}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="itemDescription" className="form-label">
            Item Description <span className="form-label__required">*</span>
          </label>
          <textarea
            id="itemDescription"
            name="itemDescription"
            className={`form-input form-textarea ${errors.itemDescription ? 'form-input--error' : ''}`}
            placeholder="e.g. 2kg rice, cooking oil, phone charger"
            rows={3}
            value={form.itemDescription}
            onChange={handleChange}
            disabled={loading}
          />
          {errors.itemDescription && (
            <span className="form-error">{errors.itemDescription}</span>
          )}
        </div>

        <button
          type="submit"
          className="btn btn--primary btn--block"
          disabled={loading}
        >
          {loading ? (
            <span className="btn__loading">
              <span className="btn__spinner" />
              Creating Delivery...
            </span>
          ) : (
            'Create Delivery'
          )}
        </button>
      </form>
    </div>
  )
}

export default RetailerDeliveryForm
