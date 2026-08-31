import { useState, useRef, useEffect } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true'

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "Hi! 👋 I'm the Reflex Assistant. How can I help you with your delivery today?",
}

const SUGGESTED_QUESTIONS = [
  'How do I track my delivery?',
  'What is proof of delivery?',
  'How do rider ratings work?',
  'How do I verify my delivery?',
  'How do I log in?',
]

const MOCK_RESPONSES = {
  'track': 'To track your delivery, go to the Rider Dashboard. Each delivery shows its current status: ASSIGNED → PICKED_UP → DELIVERED. You\'ll see real-time updates as the rider progresses through each stage.',
  'proof': 'Proof of Delivery (POD) is a confirmation step for riders. When delivering, the rider verifies the customer\'s ID, optionally takes a photo, and marks the delivery as complete. This ensures accountability.',
  'rating': 'Rider ratings are submitted by customers after a successful delivery. Ratings range from 1-5 stars and appear on the Rider Dashboard sidebar. Higher ratings help riders get more assignments.',
  'verify': 'Customers can verify their delivery by providing their Customer ID (shown on their order confirmation) when the rider arrives. The rider enters this ID during the Proof of Delivery step.',
  'log in': 'To log in, go to the Login page and select your role (Retailer, Dispatcher, or Rider). Enter your credentials and you\'ll be redirected to the appropriate dashboard.',
  'default': 'I can help with delivery tracking, proof of delivery, rider ratings, customer verification, and login questions. Try asking about one of these topics!',
}

function getMockResponse(message) {
  const lower = message.toLowerCase()
  for (const [key, response] of Object.entries(MOCK_RESPONSES)) {
    if (key !== 'default' && lower.includes(key)) {
      return response
    }
  }
  return MOCK_RESPONSES.default
}

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return

    const userMessage = { role: 'user', content: text.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    if (USE_MOCK_DATA) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500))
      const reply = getMockResponse(text.trim())
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting. Please try again in a moment.",
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleSuggestionClick = (question) => {
    sendMessage(question)
  }

  return (
    <div className="chatbot">
      {/* Floating button */}
      {!isOpen && (
        <button
          className="chatbot__trigger"
          onClick={() => setIsOpen(true)}
          aria-label="Open Reflex Assistant"
        >
          <span className="chatbot__trigger-icon">💬</span>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="chatbot__panel">
          <div className="chatbot__header">
            <div className="chatbot__header-info">
              <span className="chatbot__header-icon">&#9889;</span>
              <div>
                <h3 className="chatbot__header-title">Reflex Assistant</h3>
                <span className="chatbot__header-status">Online</span>
              </div>
            </div>
            <button
              className="chatbot__close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          <div className="chatbot__messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chatbot__message chatbot__message--${msg.role}`}
              >
                {msg.role === 'assistant' && (
                  <span className="chatbot__avatar">⚡</span>
                )}
                <div className="chatbot__bubble">
                  {msg.content.split('\n').map((line, j) => (
                    <p key={j}>{line}</p>
                  ))}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chatbot__message chatbot__message--assistant">
                <span className="chatbot__avatar">⚡</span>
                <div className="chatbot__bubble chatbot__typing">
                  <span className="chatbot__dot" />
                  <span className="chatbot__dot" />
                  <span className="chatbot__dot" />
                </div>
              </div>
            )}

            {/* Show suggestions only at the start */}
            {messages.length === 1 && (
              <div className="chatbot__suggestions">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    className="chatbot__suggestion"
                    onClick={() => handleSuggestionClick(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot__input-area" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="chatbot__input"
              placeholder="Ask about Reflex..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              maxLength={500}
            />
            <button
              type="submit"
              className="chatbot__send"
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default Chatbot
