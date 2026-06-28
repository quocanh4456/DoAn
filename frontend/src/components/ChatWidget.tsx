import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Bot, X, Send, Minimize2, Loader2, MessageCircle, ChevronDown, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function sendChatMessage(
  query: string,
  conversationId: string,
): Promise<{ answer: string; conversation_id: string }> {
  const { data } = await axios.post(`${API_BASE}/chatbot/message`, {
    query,
    conversation_id: conversationId || undefined,
    user: 'vinacoach-web-user',
  });
  return data;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #ddd;margin:8px 0">')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!^\s*)\*(?!\s)(.+?)(?<!\s)\*/g, '<em>$1</em>')
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul style="margin:6px 0 6px 16px;padding:0;list-style:disc">${m}</ul>`)
    .replace(/\n/g, '<br>');
}

function MarkdownContent({ text, isUser }: { text: string; isUser: boolean }) {
  if (isUser) return <p style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{text}</p>;
  return (
    <div
      className="vinabot-md"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
    />
  );
}

function TypingIndicator() {
  return (
    <div className="vinabot-bubble vinabot-bubble--assistant">
      <div className="vinabot-typing">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`vinabot-message ${isUser ? 'vinabot-message--user' : 'vinabot-message--assistant'}`}>
      {!isUser && (
        <div className="vinabot-avatar">
          <Bot size={14} />
        </div>
      )}
      <div className={`vinabot-bubble ${isUser ? 'vinabot-bubble--user' : 'vinabot-bubble--assistant'}`}>
        <MarkdownContent text={msg.content} isUser={isUser} />
        <span className="vinabot-time">
          {msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '👋 Xin chào! Tôi là trợ lý ảo VinaCoach. Tôi có thể giúp bạn tra cứu chuyến xe, giá vé, lịch trình và giải đáp mọi thắc mắc. Hãy hỏi tôi bất cứ điều gì!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await sendChatMessage(trimmed, conversationId);
      if (result.conversation_id) setConversationId(result.conversation_id);

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: result.answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);

      if (isMinimized || !isOpen) {
        setUnreadCount((c) => c + 1);
      }
    } catch {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau ít phút hoặc liên hệ hotline 1900 0000.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, conversationId, isMinimized, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    'Chuyến xe từ HCM đến Đà Lạt?',
    'Giá vé xe khách?',
    'Cách đặt vé online?',
  ];

  return (
    <>
      <style>{`
        /* Layout */
        .vinabot-fab {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
          pointer-events: none;
        }

        /* FAB Button */
        .vinabot-toggle {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: linear-gradient(135deg, oklch(0.546 0.19 264), oklch(0.45 0.22 275));
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 32px oklch(0.546 0.19 264 / 40%), 0 2px 8px rgba(0,0,0,0.15);
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease;
          position: relative;
          pointer-events: auto;
        }
        .vinabot-toggle:hover {
          transform: scale(1.1) translateY(-2px);
          box-shadow: 0 12px 40px oklch(0.546 0.19 264 / 50%), 0 4px 12px rgba(0,0,0,0.2);
        }
        .vinabot-toggle:active { transform: scale(0.96); }

        /* Badge */
        .vinabot-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: oklch(0.577 0.245 27.325);
          color: white;
          font-size: 10px;
          font-weight: 700;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          animation: vinabot-pulse 1.5s infinite;
        }
        @keyframes vinabot-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }

        /* Panel */
        .vinabot-panel {
          width: 390px;
          max-height: min(82vh, 680px);
          min-height: 520px;
          background: oklch(0.985 0.002 264);
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid oklch(0.915 0.02 264);
          transform-origin: bottom right;
          transition: opacity 0.25s ease, transform 0.28s cubic-bezier(0.34,1.56,0.64,1);
        }
        .vinabot-panel--open {
          opacity: 1;
          transform: scale(1) translateY(0);
          pointer-events: auto;
        }
        .vinabot-panel--closed {
          opacity: 0;
          transform: scale(0.85) translateY(20px);
          pointer-events: none;
          min-height: 0;
        }

        /* Header */
        .vinabot-header {
          background: linear-gradient(135deg, oklch(0.546 0.19 264), oklch(0.45 0.22 275));
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: white;
          flex-shrink: 0;
        }
        .vinabot-header-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .vinabot-header-info { flex: 1; min-width: 0; }
        .vinabot-header-name {
          font-weight: 700;
          font-size: 14px;
          line-height: 1.2;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .vinabot-header-status {
          font-size: 11px;
          opacity: 0.8;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 2px;
        }
        .vinabot-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4ade80;
          display: inline-block;
          animation: vinabot-blink 2s infinite;
        }
        @keyframes vinabot-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .vinabot-header-actions { display: flex; gap: 4px; }
        .vinabot-icon-btn {
          background: rgba(255,255,255,0.15);
          border: none;
          border-radius: 8px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          transition: background 0.15s;
        }
        .vinabot-icon-btn:hover { background: rgba(255,255,255,0.28); }

        /* Messages area — flex:1 + min-height:0 allows proper shrink/grow */
        .vinabot-messages {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          scroll-behavior: smooth;
          overscroll-behavior: contain;
        }
        .vinabot-messages::-webkit-scrollbar { width: 5px; }
        .vinabot-messages::-webkit-scrollbar-track { background: transparent; }
        .vinabot-messages::-webkit-scrollbar-thumb {
          background: oklch(0.88 0.03 264);
          border-radius: 99px;
        }
        .vinabot-messages::-webkit-scrollbar-thumb:hover {
          background: oklch(0.75 0.06 264);
        }
        /* Markdown content styles */
        .vinabot-md { margin: 0; word-break: break-word; line-height: 1.6; }
        .vinabot-md ul { margin: 6px 0 6px 18px; padding: 0; }
        .vinabot-md li { margin: 3px 0; }
        .vinabot-md strong { font-weight: 700; }
        .vinabot-md em { font-style: italic; }
        .vinabot-md br { display: block; content: ''; margin: 2px 0; }

        /* Message rows */
        .vinabot-message { display: flex; align-items: flex-end; gap: 8px; }
        .vinabot-message--user { flex-direction: row-reverse; }
        .vinabot-message--assistant { flex-direction: row; }
        .vinabot-avatar {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: linear-gradient(135deg, oklch(0.546 0.19 264), oklch(0.45 0.22 275));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        /* Bubbles */
        .vinabot-bubble {
          max-width: 78%;
          padding: 10px 13px;
          border-radius: 16px;
          font-size: 13.5px;
          line-height: 1.55;
          position: relative;
        }
        .vinabot-bubble p { margin: 0; white-space: pre-wrap; word-break: break-word; }
        .vinabot-bubble--user {
          background: linear-gradient(135deg, oklch(0.546 0.19 264), oklch(0.45 0.22 275));
          color: white;
          border-bottom-right-radius: 4px;
        }
        .vinabot-bubble--assistant {
          background: oklch(0.96 0.01 264);
          color: oklch(0.195 0.02 264);
          border-bottom-left-radius: 4px;
          border: 1px solid oklch(0.915 0.02 264);
        }
        .vinabot-time {
          display: block;
          font-size: 10px;
          opacity: 0.55;
          margin-top: 4px;
          text-align: right;
        }

        /* Typing indicator */
        .vinabot-typing { display: flex; gap: 4px; align-items: center; height: 16px; padding: 2px 0; }
        .vinabot-typing span {
          width: 7px;
          height: 7px;
          background: oklch(0.546 0.19 264);
          border-radius: 50%;
          animation: vinabot-bounce 1.2s infinite;
        }
        .vinabot-typing span:nth-child(2) { animation-delay: 0.2s; }
        .vinabot-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes vinabot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-6px); opacity: 1; }
        }

        /* Quick questions */
        .vinabot-quick {
          padding: 0 14px 10px;
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          border-bottom: 1px solid oklch(0.915 0.02 264);
        }
        .vinabot-quick-btn {
          font-size: 11.5px;
          padding: 4px 10px;
          border-radius: 99px;
          border: 1px solid oklch(0.546 0.19 264 / 35%);
          background: oklch(0.546 0.19 264 / 8%);
          color: oklch(0.546 0.19 264);
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .vinabot-quick-btn:hover {
          background: oklch(0.546 0.19 264);
          color: white;
        }

        /* Input area */
        .vinabot-input-area {
          padding: 12px 14px;
          background: oklch(0.985 0.002 264);
          border-top: 1px solid oklch(0.915 0.02 264);
          display: flex;
          align-items: flex-end;
          gap: 8px;
          flex-shrink: 0;
        }
        .vinabot-textarea {
          flex: 1;
          resize: none;
          border: 1.5px solid oklch(0.915 0.02 264);
          border-radius: 12px;
          padding: 9px 12px;
          font-size: 13.5px;
          font-family: inherit;
          background: white;
          color: oklch(0.195 0.02 264);
          outline: none;
          transition: border-color 0.15s;
          min-height: 40px;
          max-height: 100px;
          line-height: 1.4;
        }
        .vinabot-textarea:focus { border-color: oklch(0.546 0.19 264); }
        .vinabot-textarea::placeholder { color: oklch(0.50 0.03 264); }

        .vinabot-send {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, oklch(0.546 0.19 264), oklch(0.45 0.22 275));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: opacity 0.15s, transform 0.15s;
        }
        .vinabot-send:disabled { opacity: 0.45; cursor: not-allowed; }
        .vinabot-send:not(:disabled):hover { transform: scale(1.08); }
        .vinabot-send:not(:disabled):active { transform: scale(0.95); }

        /* Footer */
        .vinabot-footer {
          text-align: center;
          font-size: 10.5px;
          color: oklch(0.50 0.03 264);
          padding: 6px 0 8px;
        }

        /* Responsive */
        @media (max-width: 480px) {
          .vinabot-panel {
            width: calc(100vw - 24px);
            min-height: 0;
            max-height: 75vh;
          }
          .vinabot-fab { bottom: 16px; right: 12px; }
        }
      `}</style>

      <div className="vinabot-fab" role="region" aria-label="Trợ lý ảo VinaCoach">
        <div
          className={`vinabot-panel ${
            isOpen && !isMinimized ? 'vinabot-panel--open' : 'vinabot-panel--closed'
          }`}
          aria-hidden={!isOpen || isMinimized}
        >
          <div className="vinabot-header">
            <div className="vinabot-header-avatar">
              <Bot size={18} />
            </div>
            <div className="vinabot-header-info">
              <div className="vinabot-header-name">
                <span>Trợ lý VinaCoach</span>
                <Sparkles size={12} style={{ opacity: 0.75 }} />
              </div>
              <div className="vinabot-header-status">
                <span className="vinabot-status-dot" />
                Trực tuyến • Powered by AI
              </div>
            </div>
            <div className="vinabot-header-actions">
              <button
                className="vinabot-icon-btn"
                onClick={() => setIsMinimized(true)}
                title="Thu nhỏ"
                aria-label="Thu nhỏ hộp chat"
              >
                <Minimize2 size={13} />
              </button>
              <button
                className="vinabot-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Đóng"
                aria-label="Đóng hộp chat"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          <div className="vinabot-messages" role="log" aria-live="polite">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && !isLoading && (
            <div className="vinabot-quick">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  className="vinabot-quick-btn"
                  onClick={() => {
                    setInput(q);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="vinabot-input-area">
            <textarea
              ref={inputRef}
              className="vinabot-textarea"
              placeholder="Nhập câu hỏi của bạn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              aria-label="Nhập câu hỏi"
              disabled={isLoading}
            />
            <button
              className="vinabot-send"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              aria-label="Gửi tin nhắn"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <div className="vinabot-footer">Powered by Dify · Gemini AI</div>
        </div>

        <button
          className="vinabot-toggle"
          onClick={isOpen && !isMinimized ? () => setIsMinimized(true) : handleOpen}
          aria-label={isOpen && !isMinimized ? 'Thu nhỏ chat' : 'Mở trợ lý ảo'}
          title="Trợ lý ảo VinaCoach"
        >
          {isOpen && !isMinimized ? (
            <ChevronDown size={22} />
          ) : (
            <MessageCircle size={22} />
          )}
          {unreadCount > 0 && (
            <span className="vinabot-badge" aria-label={`${unreadCount} tin nhắn mới`}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </>
  );
}
