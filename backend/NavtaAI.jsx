import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Trash2,
  BookOpen,
  Calculator,
  Atom,
  Brain,
  Loader2,
  Copy,
  Check
} from 'lucide-react';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function NavtaAI() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hello! I'm Navta AI 🤖\n\nI'm your personal study companion. Ask me anything about Physics, Chemistry, Mathematics, Biology, JEE, NEET, Boards, or general academics.\n\nYou can ask me to explain a concept, solve a numerical, create questions, compare topics, or help you prepare for an exam."
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages, loading]);

  const askAI = async (question = input) => {
    const cleanQuestion = question.trim();

    if (!cleanQuestion || loading) return;

    const userMessage = {
      role: 'user',
      content: cleanQuestion
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token
            ? {
                Authorization: `Bearer ${token}`
              }
            : {})
        },
        body: JSON.stringify({
          message: cleanQuestion,
          history: messages.slice(-10)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'AI request failed');
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            data.answer ||
            'Sorry, I could not generate an answer.'
        }
      ]);
    } catch (error) {
      console.error('Navta AI error:', error);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            '⚠️ I could not connect to Navta AI right now. Please try again in a moment.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    askAI();
  };

  const copyAnswer = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);

      setTimeout(() => {
        setCopiedIndex(null);
      }, 1500);
    } catch (error) {
      console.error(error);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          "Chat cleared! 👋\n\nWhat would you like to learn today?"
      }
    ]);
  };

  const quickQuestions = [
    {
      icon: Atom,
      title: 'Physics',
      question:
        'Explain Newton’s laws of motion with simple examples.'
    },
    {
      icon: Calculator,
      title: 'Mathematics',
      question:
        'Explain differentiation from basics with examples.'
    },
    {
      icon: Brain,
      title: 'Biology',
      question:
        'Explain the human circulatory system for NEET preparation.'
    },
    {
      icon: BookOpen,
      title: 'Chemistry',
      question:
        'Explain chemical bonding in an easy way for JEE.'
    }
  ];

  return (
    <div className="min-h-[calc(100vh-100px)] bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white shadow-lg">
              <Bot className="h-6 w-6" />
            </div>

            <div>
              <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
                Navta AI
                <Sparkles className="h-5 w-5 text-primary-500" />
              </h1>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your personal AI study companion
              </p>
            </div>
          </div>

          <button
            onClick={clearChat}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </button>
        </div>

        {/* Quick questions */}
        {messages.length <= 1 && (
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickQuestions.map((item, index) => {
              const Icon = item.icon;

              return (
                <button
                  key={index}
                  onClick={() => askAI(item.question)}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-1 hover:border-primary-400 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                >
                  <Icon className="mb-3 h-5 w-5 text-primary-500" />

                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </p>

                  <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                    {item.question}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Chat */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          {/* Chat top */}
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-white">
                <Bot className="h-5 w-5" />
              </div>

              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Navta AI
              </p>

              <p className="text-[11px] text-emerald-500">
                Online • Ready to help
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[55vh] min-h-[450px] overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto max-w-4xl space-y-5">

              {messages.map((message, index) => {
                const isUser = message.role === 'user';

                return (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      isUser ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-white">
                        <Bot className="h-5 w-5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        isUser
                          ? 'rounded-br-md bg-primary-500 text-white'
                          : 'rounded-bl-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-7">
                        {message.content}
                      </div>

                      {!isUser && (
                        <button
                          onClick={() =>
                            copyAnswer(message.content, index)
                          }
                          className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-primary-500"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check className="h-3 w-3" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              Copy
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {isUser && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-white">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-white">
                    <Bot className="h-5 w-5" />
                  </div>

                  <div className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 dark:bg-slate-800">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Navta AI is thinking...
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-200 p-4 dark:border-slate-800"
          >
            <div className="mx-auto flex max-w-4xl items-end gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                rows={2}
                placeholder="Ask Navta AI anything..."
                className="min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-primary-500 text-white shadow-lg transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>

            <p className="mx-auto mt-2 max-w-4xl text-[10px] text-slate-400">
              Navta AI can make mistakes. Always verify important academic information.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
