import React, { useState } from 'react'
import {
  Bot,
  X,
  Send,
  Sparkles,
  Minimize2
} from 'lucide-react'

export default function NavtaAI() {
  const [open, setOpen] = useState(false)

  const [message, setMessage] = useState('')

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hi! I am NAVTA AI Tutor 👋\n\nAsk me anything about Physics, Chemistry, Maths, Biology, JEE, NEET or Boards.'
    }
  ])

  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!message.trim() || loading) return

    const userMessage = {
      role: 'user',
      content: message
    }

    setMessages(prev => [
      ...prev,
      userMessage
    ])

    const currentMessage = message

    setMessage('')
    setLoading(true)

    try {
      const response = await fetch(
        'http://localhost:5000/api/ai/chat',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            message: currentMessage
          })
        }
      )

      if (!response.ok) {
        throw new Error(
          'AI request failed'
        )
      }

      const data =
        await response.json()

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content:
            data.reply ||
            'I could not generate a response.'
        }
      ])
    } catch (error) {
      console.error(error)

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content:
            'NAVTA AI is currently unavailable. Please try again.'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = e => {
    if (
      e.key === 'Enter' &&
      !e.shiftKey
    ) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={styles.aiButton}
        >
          <Sparkles size={20} />

          <span>NAVTA AI</span>
        </button>
      )}

      {open && (
        <div style={styles.chatWindow}>

          <div style={styles.header}>

            <div style={styles.headerLeft}>
              <div style={styles.botIcon}>
                <Bot size={22} />
              </div>

              <div>
                <div style={styles.title}>
                  NAVTA AI
                </div>

                <div style={styles.subtitle}>
                  Your AI Tutor
                </div>
              </div>
            </div>

            <div style={styles.headerButtons}>

              <button
                style={styles.iconButton}
                onClick={() =>
                  setOpen(false)
                }
              >
                <Minimize2 size={18} />
              </button>

              <button
                style={styles.iconButton}
                onClick={() =>
                  setOpen(false)
                }
              >
                <X size={18} />
              </button>

            </div>

          </div>

          <div style={styles.quickActions}>

            <button
              style={styles.quickButton}
              onClick={() =>
                setMessage(
                  'Explain a Physics concept to me'
                )
              }
            >
              Physics
            </button>

            <button
              style={styles.quickButton}
              onClick={() =>
                setMessage(
                  'Help me with Chemistry'
                )
              }
            >
              Chemistry
            </button>

            <button
              style={styles.quickButton}
              onClick={() =>
                setMessage(
                  'Help me solve a Maths problem'
                )
              }
            >
              Maths
            </button>

            <button
              style={styles.quickButton}
              onClick={() =>
                setMessage(
                  'Explain a Biology topic'
                )
              }
            >
              Biology
            </button>

          </div>

          <div style={styles.messages}>

            {messages.map(
              (msg, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.messageRow,

                    justifyContent:
                      msg.role === 'user'
                        ? 'flex-end'
                        : 'flex-start'
                  }}
                >

                  <div
                    style={
                      msg.role === 'user'
                        ? styles.userMessage
                        : styles.aiMessage
                    }
                  >
                    {msg.content}
                  </div>

                </div>
              )
            )}

            {loading && (
              <div
                style={{
                  ...styles.messageRow,
                  justifyContent:
                    'flex-start'
                }}
              >
                <div
                  style={
                    styles.aiMessage
                  }
                >
                  NAVTA AI is thinking...
                </div>
              </div>
            )}

          </div>

          <div style={styles.inputArea}>

            <textarea
              value={message}
              onChange={e =>
                setMessage(
                  e.target.value
                )
              }
              onKeyDown={
                handleKeyDown
              }
              placeholder="Ask NAVTA AI anything..."
              style={styles.textarea}
              rows={1}
            />

            <button
              onClick={
                sendMessage
              }
              style={styles.sendButton}
              disabled={loading}
            >
              <Send size={19} />
            </button>

          </div>

          <div style={styles.footer}>
            AI can make mistakes. Verify important answers.
          </div>

        </div>
      )}
    </>
  )
}

const styles = {

  aiButton: {
    position: 'fixed',
    right: '24px',
    bottom: '24px',
    border: 'none',
    borderRadius: '999px',
    padding: '14px 20px',
    background:
      'linear-gradient(135deg, #2563eb, #7c3aed)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow:
      '0 15px 40px rgba(37,99,235,0.35)',
    zIndex: 9999
  },

  chatWindow: {
    position: 'fixed',
    right: '24px',
    bottom: '24px',
    width: '380px',
    maxWidth:
      'calc(100vw - 24px)',
    height: '570px',
    maxHeight:
      'calc(100vh - 40px)',
    background: '#ffffff',
    borderRadius: '20px',
    boxShadow:
      '0 25px 80px rgba(15,23,42,0.25)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 9999,
    border:
      '1px solid #e2e8f0'
  },

  header: {
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'center',
    padding: '16px',
    background:
      'linear-gradient(135deg, #2563eb, #7c3aed)',
    color: 'white'
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },

  botIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background:
      'rgba(255,255,255,0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'center'
  },

  title: {
    fontWeight: '800',
    fontSize: '16px'
  },

  subtitle: {
    fontSize: '11px',
    opacity: 0.85
  },

  headerButtons: {
    display: 'flex',
    gap: '5px'
  },

  iconButton: {
    border: 'none',
    background:
      'rgba(255,255,255,0.12)',
    color: 'white',
    borderRadius: '8px',
    width: '34px',
    height: '34px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'center'
  },

  quickActions: {
    display: 'flex',
    gap: '7px',
    padding: '10px',
    overflowX: 'auto',
    borderBottom:
      '1px solid #e2e8f0'
  },

  quickButton: {
    border:
      '1px solid #dbeafe',
    background: '#eff6ff',
    color: '#2563eb',
    padding: '7px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },

  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '14px',
    background: '#f8fafc'
  },

  messageRow: {
    display: 'flex',
    marginBottom: '10px'
  },

  aiMessage: {
    maxWidth: '82%',
    background: '#ffffff',
    padding: '11px 13px',
    borderRadius:
      '14px 14px 14px 4px',
    fontSize: '13px',
    lineHeight: '1.5',
    color: '#334155',
    boxShadow:
      '0 2px 8px rgba(15,23,42,0.06)',
    whiteSpace: 'pre-wrap'
  },

  userMessage: {
    maxWidth: '82%',
    background: '#2563eb',
    color: 'white',
    padding: '11px 13px',
    borderRadius:
      '14px 14px 4px 14px',
    fontSize: '13px',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap'
  },

  inputArea: {
    padding: '10px',
    borderTop:
      '1px solid #e2e8f0',
    display: 'flex',
    alignItems:
      'flex-end',
    gap: '8px',
    background: 'white'
  },

  textarea: {
    flex: 1,
    resize: 'none',
    border:
      '1px solid #cbd5e1',
    borderRadius: '12px',
    padding: '10px',
    outline: 'none',
    fontSize: '13px',
    fontFamily: 'inherit',
    maxHeight: '100px'
  },

  sendButton: {
    border: 'none',
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: '#2563eb',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'center'
  },

  footer: {
    textAlign: 'center',
    fontSize: '9px',
    color: '#94a3b8',
    padding: '6px 10px 9px'
  }
}
