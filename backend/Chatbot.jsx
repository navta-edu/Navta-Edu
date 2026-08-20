import React, { useState } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

export default function Chatbot() {
  const [open, setOpen] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "👋 Hi! I'm Navta AI. Welcome to Navta! I can help you with Physics, Chemistry, Maths, Biology, JEE, NEET, Boards, concepts, formulas and numerical problems. What would you like to learn today?"
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    const text = input.trim();

    if (!text || loading) {
      return;
    }

    const userMessage = {
      role: 'user',
      content: text
    };

    const history = messages.map((message) => ({
      role: message.role,
      content: message.content
    }));

    setMessages((previous) => [...previous, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          history
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong.');
      }

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content:
            data.answer || 'Sorry, I could not generate an answer.'
        }
      ]);
    } catch (error) {
      console.error('Chatbot error:', error);

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content:
            "Sorry! I'm having trouble connecting right now. Please try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg transition hover:scale-105 hover:bg-primary-600"
          aria-label="Open Navta AI"
        >
          <MessageCircle className="h-7 w-7" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[380px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">

          <div className="flex items-center justify-between bg-primary-500 px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-6 w-6" />
              </div>

              <div>
                <h2 className="font-bold">Navta AI</h2>
                <p className="text-xs text-white/80">
                  Your study assistant
                </p>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-2 transition hover:bg-white/20"
              aria-label="Close chatbot"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4 dark:bg-slate-900">

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-2 ${
                  message.role === 'user'
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'rounded-br-sm bg-primary-500 text-white'
                      : 'rounded-bl-sm bg-white text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  {message.content}
                </div>

                {message.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-white">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white">
                  <Bot className="h-4 w-4" />
                </div>

                <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-sm text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-300">
                  Navta AI is thinking...
                </div>
              </div>
            )}

          </div>

          <div className="border-t border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">

            <div className="flex items-end gap-2">

              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Navta AI a question..."
                rows={1}
                className="max-h-24 min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none focus:border-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />

              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </button>

            </div>

            <p className="mt-2 text-center text-[10px] text-slate-400">
              Navta AI can make mistakes. Verify important answers.
            </p>

          </div>

        </div>
      )}
    </>
  );
}
