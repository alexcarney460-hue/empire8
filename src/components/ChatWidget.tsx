'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I can help with products, pricing, wholesale, and more. What do you need?' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  async function send() {
    const text = input.trim();
    if (!text || isLoading) return;

    const updated: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(updated);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content ?? 'Sorry, something went wrong. Email info@empire8salesdirect.com for help.';
      setMessages([...updated, { role: 'assistant', content: reply }]);
    } catch {
      setMessages([...updated, { role: 'assistant', content: 'Something went wrong. Please email info@empire8salesdirect.com.' }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* Chat window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 96,
            right: 16,
            width: 'min(360px, calc(100vw - 32px))',
            maxHeight: 520,
            backgroundColor: '#fff',
            borderRadius: 16,
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: 'var(--color-royal)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MessageCircle size={16} color="#fff" />
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', lineHeight: 1 }}>Empire 8</div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', marginTop: 2 }}>Typically replies instantly</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', display: 'flex', padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              backgroundColor: '#fafaf9',
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '9px 13px',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    backgroundColor: msg.role === 'user' ? 'var(--color-royal)' : '#fff',
                    color: msg.role === 'user' ? '#fff' : 'var(--color-charcoal)',
                    fontSize: '0.82rem',
                    lineHeight: 1.5,
                    border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '14px 14px 14px 4px',
                    backgroundColor: '#fff',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    gap: 4,
                    alignItems: 'center',
                  }}
                >
                  {[0, 1, 2].map((d) => (
                    <div
                      key={d}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-warm-gray)',
                        animation: 'e8-bounce 1.2s ease-in-out infinite',
                        animationDelay: `${d * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: '12px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              gap: 8,
              backgroundColor: '#fff',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask about products, brands, pricing, wholesale..."
              aria-label="Type your message"
              disabled={isLoading}
              style={{
                flex: 1,
                border: '1px solid var(--color-border)',
                borderRadius: 9999,
                padding: '8px 14px',
                fontSize: '0.8rem',
                outline: 'none',
                backgroundColor: '#fafaf9',
                color: 'var(--color-charcoal)',
              }}
            />
            <button
              onClick={send}
              aria-label="Send message"
              disabled={isLoading || !input.trim()}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: input.trim() && !isLoading ? 'var(--color-gold)' : 'var(--color-border)',
                border: 'none',
                cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background-color 150ms ease',
              }}
            >
              <Send size={15} color="#fff" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: 'var(--color-royal)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          zIndex: 1001,
          transition: 'transform 200ms ease, background-color 150ms ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
      >
        {isOpen ? <X size={22} color="#fff" /> : <MessageCircle size={22} color="#fff" />}
        {!isOpen && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: 'var(--color-gold)',
              border: '2px solid #fff',
            }}
          />
        )}
      </button>

      <style>{`
        @keyframes e8-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        @media (max-width: 480px) {
          /* chat window goes full width on small screens */
        }
      `}</style>
    </>
  );
}
