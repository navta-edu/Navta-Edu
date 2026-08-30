import React, {
  useEffect,
  useRef,
  useState
} from 'react';

import {
  Bot,
  X,
  Send,
  Sparkles,
  Minimize2,
  RotateCcw
} from 'lucide-react';

export default function NavtaAI() {
  const [open, setOpen] = useState(false);

  const [message, setMessage] = useState('');

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hi! I am NAVTA AI Tutor 👋\n\nAsk me anything about Physics, Chemistry, Maths, Biology, JEE, NEET or Boards.'
    }
  ]);

  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // ==========================================
  // AUTO SCROLL
  // ==========================================

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }, [
    messages,
    loading,
    open
  ]);

  // ==========================================
  // SEND MESSAGE
  // ==========================================

  const sendMessage = async () => {
    const trimmedMessage =
      message.trim();

    if (
      !trimmedMessage ||
      loading
    ) {
      return;
    }

    const userMessage = {
      role: 'user',
      content: trimmedMessage
    };

    const updatedMessages = [
      ...messages,
      userMessage
    ];

    setMessages(
      updatedMessages
    );

    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(
        '/api/ai/chat',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            message:
              trimmedMessage,

            history:
              updatedMessages
                .slice(-10)
                .map(item => ({
                  role: item.role,
                  content:
                    item.content
                }))
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          'NAVTA AI request failed'
        );
      }

      if (!data?.reply) {
        throw new Error(
          'NAVTA AI returned an empty response'
        );
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply
        }
      ]);
    } catch (error) {
      console.error(
        'NAVTA AI Error:',
        error
      );

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Sorry, NAVTA AI is currently unavailable. Please try again in a moment.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ENTER TO SEND
  // ==========================================

  const handleKeyDown = (
    event
  ) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendMessage();
    }
  };

  // ==========================================
  // QUICK PROMPTS
  // ==========================================

  const handleQuickPrompt = (
    prompt
  ) => {
    setMessage(prompt);
  };

  // ==========================================
  // RESET CHAT
  // ==========================================

  const resetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          'Chat reset successfully ✨\n\nWhat would you like to study now?'
      }
    ]);

    setMessage('');
  };

  return (
    <>
      {/* ======================================
          FLOATING AI BUTTON
      ====================================== */}

      {!open && (
        <button
          type="button"
          onClick={() =>
            setOpen(true)
          }
          style={
            styles.aiButton
          }
          aria-label="Open NAVTA AI Tutor"
        >
          <Sparkles
            size={20}
          />

          <span>
            NAVTA AI
          </span>
        </button>
      )}

      {/* ======================================
          CHAT WINDOW
      ====================================== */}

      {open && (
        <div
          style={
            styles.chatWindow
          }
        >

          {/* ==================================
              HEADER
          ================================== */}

          <div
            style={
              styles.header
            }
          >

            <div
              style={
                styles.headerLeft
              }
            >
              <div
                style={
                  styles.botIcon
                }
              >
                <Bot
                  size={22}
                />
              </div>

              <div>
                <div
                  style={
                    styles.title
                  }
                >
                  NAVTA AI
                </div>

                <div
                  style={
                    styles.subtitle
                  }
                >
                  Your AI Tutor
                </div>
              </div>
            </div>

            <div
              style={
                styles.headerButtons
              }
            >

              <button
                type="button"
                style={
                  styles.iconButton
                }
                onClick={
                  resetChat
                }
                title="Reset chat"
              >
                <RotateCcw
                  size={17}
                />
              </button>

              <button
                type="button"
                style={
                  styles.iconButton
                }
                onClick={() =>
                  setOpen(false)
                }
                title="Minimize"
              >
                <Minimize2
                  size={18}
                />
              </button>

              <button
                type="button"
                style={
                  styles.iconButton
                }
                onClick={() =>
                  setOpen(false)
                }
                title="Close"
              >
                <X
                  size={18}
                />
              </button>

            </div>

          </div>

          {/* ==================================
              QUICK SUBJECT BUTTONS
          ================================== */}

          <div
            style={
              styles.quickActions
            }
          >

            <button
              type="button"
              style={
                styles.quickButton
              }
              onClick={() =>
                handleQuickPrompt(
                  'Explain an important Physics concept for JEE or NEET.'
                )
              }
            >
              Physics
            </button>

            <button
              type="button"
              style={
                styles.quickButton
              }
              onClick={() =>
                handleQuickPrompt(
                  'Help me understand an important Chemistry concept.'
                )
              }
            >
              Chemistry
            </button>

            <button
              type="button"
              style={
                styles.quickButton
              }
              onClick={() =>
                handleQuickPrompt(
                  'Help me solve a Maths problem step by step.'
                )
              }
            >
              Maths
            </button>

            <button
              type="button"
              style={
                styles.quickButton
              }
              onClick={() =>
                handleQuickPrompt(
                  'Explain an important Biology topic for NEET.'
                )
              }
            >
              Biology
            </button>

          </div>

          {/* ==================================
              MESSAGES
          ================================== */}

          <div
            style={
              styles.messages
            }
          >

            {messages.map(
              (
                msg,
                index
              ) => (
                <div
                  key={`${msg.role}-${index}`}
                  style={{
                    ...styles.messageRow,

                    justifyContent:
                      msg.role ===
                      'user'
                        ? 'flex-end'
                        : 'flex-start'
                  }}
                >

                  {msg.role ===
                    'assistant' && (
                    <div
                      style={
                        styles.smallBotIcon
                      }
                    >
                      <Bot
                        size={15}
                      />
                    </div>
                  )}

                  <div
                    style={
                      msg.role ===
                      'user'
                        ? styles.userMessage
                        : styles.aiMessage
                    }
                  >
                    {
                      msg.content
                    }
                  </div>

                </div>
              )
            )}

            {/* ================================
                LOADING INDICATOR
            ================================ */}

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
                    styles.smallBotIcon
                  }
                >
                  <Bot
                    size={15}
                  />
                </div>

                <div
                  style={
                    styles.aiMessage
                  }
                >
                  <span>
                    NAVTA AI is thinking
                  </span>

                  <span
                    style={
                      styles.dots
                    }
                  >
                    ...
                  </span>
                </div>

              </div>
            )}

            <div
              ref={
                messagesEndRef
              }
            />

          </div>

          {/* ==================================
              INPUT AREA
          ================================== */}

          <div
            style={
              styles.inputArea
            }
          >

            <textarea
              value={
                message
              }
              onChange={event =>
                setMessage(
                  event.target.value
                )
              }
              onKeyDown={
                handleKeyDown
              }
              placeholder="Ask NAVTA AI anything..."
              style={
                styles.textarea
              }
              rows={1}
              maxLength={3000}
            />

            <button
              type="button"
              onClick={
                sendMessage
              }
              style={{
                ...styles.sendButton,

                opacity:
                  loading ||
                  !message.trim()
                    ? 0.55
                    : 1,

                cursor:
                  loading ||
                  !message.trim()
                    ? 'not-allowed'
                    : 'pointer'
              }}
              disabled={
                loading ||
                !message.trim()
              }
              aria-label="Send message"
            >
              <Send
                size={19}
              />
            </button>

          </div>

          {/* ==================================
              FOOTER
          ================================== */}

          <div
            style={
              styles.footer
            }
          >
            NAVTA AI can make mistakes.
            Verify important academic
            answers.
          </div>

        </div>
      )}
    </>
  );
}

// ============================================
// STYLES
// ============================================

const styles = {

  aiButton: {
    position: 'fixed',

    right: '22px',
    bottom: '22px',

    border: 'none',

    borderRadius:
      '999px',

    padding:
      '14px 20px',

    background:
      'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',

    color: '#ffffff',

    display: 'flex',

    alignItems:
      'center',

    justifyContent:
      'center',

    gap: '8px',

    fontWeight: '800',

    fontSize: '14px',

    cursor: 'pointer',

    boxShadow:
      '0 14px 40px rgba(37, 99, 235, 0.35)',

    zIndex: 9999
  },

  chatWindow: {
    position: 'fixed',

    right: '20px',
    bottom: '20px',

    width:
      'min(390px, calc(100vw - 20px))',

    height:
      'min(620px, calc(100vh - 30px))',

    background:
      '#ffffff',

    borderRadius:
      '22px',

    boxShadow:
      '0 25px 80px rgba(15, 23, 42, 0.28)',

    overflow:
      'hidden',

    display:
      'flex',

    flexDirection:
      'column',

    zIndex: 9999,

    border:
      '1px solid #e2e8f0'
  },

  header: {
    display:
      'flex',

    justifyContent:
      'space-between',

    alignItems:
      'center',

    padding:
      '14px 15px',

    background:
      'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',

    color:
      '#ffffff'
  },

  headerLeft: {
    display:
      'flex',

    alignItems:
      'center',

    gap:
      '10px'
  },

  botIcon: {
    width:
      '42px',

    height:
      '42px',

    borderRadius:
      '13px',

    background:
      'rgba(255,255,255,0.18)',

    display:
      'flex',

    alignItems:
      'center',

    justifyContent:
      'center'
  },

  title: {
    fontWeight:
      '800',

    fontSize:
      '16px'
  },

  subtitle: {
    fontSize:
      '11px',

    opacity:
      0.85,

    marginTop:
      '1px'
  },

  headerButtons: {
    display:
      'flex',

    gap:
      '5px'
  },

  iconButton: {
    border:
      'none',

    background:
      'rgba(255,255,255,0.12)',

    color:
      '#ffffff',

    borderRadius:
      '9px',

    width:
      '33px',

    height:
      '33px',

    cursor:
      'pointer',

    display:
      'flex',

    alignItems:
      'center',

    justifyContent:
      'center'
  },

  quickActions: {
    display:
      'flex',

    gap:
      '7px',

    padding:
      '10px',

    overflowX:
      'auto',

    borderBottom:
      '1px solid #e2e8f0',

    background:
      '#ffffff'
  },

  quickButton: {
    border:
      '1px solid #dbeafe',

    background:
      '#eff6ff',

    color:
      '#2563eb',

    padding:
      '7px 11px',

    borderRadius:
      '999px',

    fontSize:
      '11px',

    fontWeight:
      '700',

    cursor:
      'pointer',

    whiteSpace:
      'nowrap'
  },

  messages: {
    flex:
      1,

    overflowY:
      'auto',

    padding:
      '14px',

    background:
      '#f8fafc'
  },

  messageRow: {
    display:
      'flex',

    alignItems:
      'flex-end',

    gap:
      '7px',

    marginBottom:
      '11px'
  },

  smallBotIcon: {
    minWidth:
      '28px',

    width:
      '28px',

    height:
      '28px',

    borderRadius:
      '9px',

    display:
      'flex',

    alignItems:
      'center',

    justifyContent:
      'center',

    background:
      '#e0e7ff',

    color:
      '#4f46e5'
  },

  aiMessage: {
    maxWidth:
      '82%',

    background:
      '#ffffff',

    padding:
      '11px 13px',

    borderRadius:
      '15px 15px 15px 5px',

    fontSize:
      '13px',

    lineHeight:
      '1.55',

    color:
      '#334155',

    boxShadow:
      '0 2px 8px rgba(15,23,42,0.06)',

    whiteSpace:
      'pre-wrap',

    wordBreak:
      'break-word'
  },

  userMessage: {
    maxWidth:
      '82%',

    background:
      'linear-gradient(135deg, #2563eb, #4f46e5)',

    color:
      '#ffffff',

    padding:
      '11px 13px',

    borderRadius:
      '15px 15px 5px 15px',

    fontSize:
      '13px',

    lineHeight:
      '1.55',

    whiteSpace:
      'pre-wrap',

    wordBreak:
      'break-word'
  },

  dots: {
    marginLeft:
      '2px',

    fontWeight:
      '900'
  },

  inputArea: {
    padding:
      '10px',

    borderTop:
      '1px solid #e2e8f0',

    display:
      'flex',

    alignItems:
      'flex-end',

    gap:
      '8px',

    background:
      '#ffffff'
  },

  textarea: {
    flex:
      1,

    resize:
      'none',

    border:
      '1px solid #cbd5e1',

    borderRadius:
      '13px',

    padding:
      '11px 12px',

    outline:
      'none',

    fontSize:
      '13px',

    lineHeight:
      '1.4',

    fontFamily:
      'inherit',

    minHeight:
      '42px',

    maxHeight:
      '110px',

    color:
      '#0f172a',

    background:
      '#ffffff'
  },

  sendButton: {
    border:
      'none',

    minWidth:
      '42px',

    width:
      '42px',

    height:
      '42px',

    borderRadius:
      '12px',

    background:
      'linear-gradient(135deg, #2563eb, #7c3aed)',

    color:
      '#ffffff',

    display:
      'flex',

    alignItems:
      'center',

    justifyContent:
      'center',

    transition:
      'all 0.2s ease'
  },

  footer: {
    textAlign:
      'center',

    fontSize:
      '9px',

    color:
      '#94a3b8',

    padding:
      '5px 10px 8px',

    background:
      '#ffffff'
  }
};
