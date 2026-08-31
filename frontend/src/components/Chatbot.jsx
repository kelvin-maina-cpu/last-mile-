import { useState, useRef, useEffect } from 'react'

import { apiFetch } from '../config/apiConfig'

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

    try {
      const response = await apiFetch('/chat', {
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
