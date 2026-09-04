import { useState } from 'react'

const FAQ_ITEMS = [
  {
    q: 'How do I track my delivery?',
    a: 'Every delivery moves through REQUESTED → ASSIGNED → PICKED_UP → DELIVERED. Open the Dispatcher Dashboard to see every delivery\'s status, or open a single delivery\'s detail page to follow just that one.',
  },
  {
    q: 'How do I create a delivery request?',
    a: 'Log in as a Retailer and fill in the delivery form — customer name, phone, address, and item description. Submitting it creates a delivery in the REQUESTED state.',
  },
  {
    q: 'How do rider ratings work?',
    a: 'Riders can see their own rating on their dashboard — average out of 5, star breakdown, and total ratings — aggregated from ratings tied to their deliveries. It shows "No ratings yet" until ratings exist; there isn\'t a rate-a-rider screen for customers yet.',
  },
  {
    q: 'What is proof of delivery?',
    a: 'When a rider marks a delivery complete, they verify the customer\'s ID and take a photo of the item. Both are shown on the delivery\'s detail page once it\'s DELIVERED.',
  },
  {
    q: 'How do I change my role?',
    a: 'Log out and log back in — pick a different role (Retailer, Dispatcher, or Rider) on the login screen, or sign in with a different Google account.',
  },
  {
    q: 'How do I contact support?',
    a: 'Use this chatbot (💬 button) — there isn\'t a support email set up yet.',
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
