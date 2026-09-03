import { useState } from 'react'

const FAQ_ITEMS = [
  {
    q: 'How do I track my delivery?',
    a: 'Go to your dashboard and click on any active delivery to see real-time status updates and location tracking.',
  },
  {
    q: 'How do I create a delivery request?',
    a: 'Log in as a Retailer, click "New Delivery" and fill in the customer details, pickup/dropoff addresses, and item description.',
  },
  {
    q: 'How do rider ratings work?',
    a: 'After each delivery, customers can rate riders from 1-5 stars. Ratings affect rider visibility in assignment queues.',
  },
  {
    q: 'What is proof of delivery?',
    a: 'Proof of delivery is a photo or signature captured by the rider upon successful delivery, visible in the delivery details.',
  },
  {
    q: 'How do I change my role?',
    a: 'Log out and log back in, selecting a different role on the login screen.',
  },
  {
    q: 'How do I contact support?',
    a: 'Use the chatbot (💬 button) or email support@reflex.co.ke for assistance.',
  },
]

function QandAButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState(null)

  return (
    <div className="qanda">
      {!isOpen && (
        <button
          className="qanda__trigger"
          onClick={() => setIsOpen(true)}
          aria-label="Open Q&A"
        >
          <span className="qanda__trigger-icon">❓</span>
        </button>
      )}

      {isOpen && (
        <div className="qanda__panel">
          <div className="qanda__header">
            <div className="qanda__header-info">
              <span className="qanda__header-icon">❓</span>
              <h3 className="qanda__header-title">Questions & Answers</h3>
            </div>
            <button
              className="qanda__close"
              onClick={() => { setIsOpen(false); setExpandedIndex(null) }}
              aria-label="Close Q&A"
            >
              ×
            </button>
          </div>

          <div className="qanda__list">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="qanda__item">
                <button
                  className={`qanda__question ${expandedIndex === i ? 'qanda__question--open' : ''}`}
                  onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                >
                  <span>{item.q}</span>
                  <span className="qanda__chevron">{expandedIndex === i ? '−' : '+'}</span>
                </button>
                {expandedIndex === i && (
                  <div className="qanda__answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default QandAButton
