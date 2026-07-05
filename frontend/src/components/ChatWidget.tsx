import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Bot, X, Send, Minimize2, Loader2, MessageCircle, ChevronDown, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

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
  let userId: number | null = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const parsed = JSON.parse(userStr);
      if (parsed?.id) {
        userId = Number(parsed.id);
      }
    }
  } catch { /* ignore parse errors */ }

  console.log('[ChatWidget] Sending message with userId:', userId);

  const { data } = await axios.post(`${API_BASE}/chatbot/message`, {
    query,
    conversation_id: conversationId || undefined,
    user: 'vinacoach-web-user',
    ...(userId ? { userId } : {}),
  });
  return data;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^---$/gm, '<hr>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!^\s*)\*(?!\s)(.+?)(?<!\s)\*/g, '<em>$1</em>')
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(
      /\[(.+?)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="vinabot-payment-btn">💳 $1</a>'
    )
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
      content: '👋 Xin chào! Tôi là trợ lý ảo VinaCoach. Tôi có thể giúp bạn:\n- 🔍 Tra cứu chuyến xe, giá vé, lịch trình\n- 🎫 **Đặt vé trực tiếp** qua chat\n\nVí dụ: *"Đặt 2 vé HCM đi Đà Lạt ngày mai"*\nHãy hỏi tôi bất cứ điều gì!',
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

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const quickQuestions = [
    'Đặt 1 vé HCM đi Đà Lạt ngày mai',
    'Chuyến xe từ HCM đến Đà Lạt?',
    'Giá vé xe khách?',
  ];

  return (
    <>
      <style>{`
        /* Layout */
        .vinabot-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 16px;
          pointer-events: none;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        /* FAB Button */
        .vinabot-toggle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #1e3a8a; /* VinaCoach Blue */
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(30, 58, 138, 0.4);
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease, background 0.2s;
          position: relative;
          pointer-events: auto;
        }
        .vinabot-toggle:hover {
          transform: scale(1.05) translateY(-2px);
          box-shadow: 0 6px 16px rgba(30, 58, 138, 0.5);
          background: #2563eb;
        }
        .vinabot-toggle:active { transform: scale(0.95); }

        /* Badge */
        .vinabot-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: #ea580c; /* Orange */
          color: white;
          font-size: 11px;
          font-weight: 700;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(234, 88, 12, 0.3);
        }

        /* Panel */
        .vinabot-panel {
          width: 380px;
          max-height: min(80vh, 700px);
          min-height: 550px;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.04);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          transform-origin: bottom right;
          transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .vinabot-panel--open {
          opacity: 1;
          transform: scale(1) translateY(0);
          pointer-events: auto;
        }
        .vinabot-panel--closed {
          opacity: 0;
          transform: scale(0.9) translateY(20px);
          pointer-events: none;
          min-height: 0;
        }

        /* Header */
        .vinabot-header {
          background: #1e3a8a; /* VinaCoach Blue */
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
          flex-shrink: 0;
        }
        .vinabot-header-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: white;
          color: #1e3a8a;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .vinabot-header-info { flex: 1; min-width: 0; }
        .vinabot-header-name {
          font-weight: 600;
          font-size: 15px;
          line-height: 1.2;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .vinabot-header-status {
          font-size: 12px;
          opacity: 0.9;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
        }
        .vinabot-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4ade80;
          display: inline-block;
        }
        .vinabot-header-actions { display: flex; gap: 4px; }
        .vinabot-icon-btn {
          background: transparent;
          border: none;
          border-radius: 6px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.8);
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .vinabot-icon-btn:hover { background: rgba(255,255,255,0.1); color: white; }

        /* Messages area */
        .vinabot-messages {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scroll-behavior: smooth;
          background: #f8fafc;
        }
        .vinabot-messages::-webkit-scrollbar { width: 6px; }
        .vinabot-messages::-webkit-scrollbar-track { background: transparent; }
        .vinabot-messages::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .vinabot-messages::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        /* Message rows */
        .vinabot-message { 
          display: flex; 
          align-items: flex-end; 
          gap: 10px; 
          animation: slideUp 0.3s ease forwards;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .vinabot-message--user { flex-direction: row-reverse; }
        .vinabot-message--assistant { flex-direction: row; }
        
        .vinabot-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #1e3a8a;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        /* Bubbles */
        .vinabot-bubble {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.5;
          position: relative;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .vinabot-bubble p { margin: 0; white-space: pre-wrap; word-break: break-word; }
        .vinabot-bubble--user {
          background: #1e3a8a;
          color: white;
          border-bottom-right-radius: 4px;
        }
        .vinabot-bubble--assistant {
          background: #ffffff;
          color: #1e293b;
          border-bottom-left-radius: 4px;
          border: 1px solid #e2e8f0;
        }
        .vinabot-time {
          display: block;
          font-size: 11px;
          color: #94a3b8;
          margin-top: 6px;
          text-align: right;
          font-weight: 500;
        }

        /* Markdown content styling */
        .vinabot-md { margin: 0; word-break: break-word; line-height: 1.6; }
        .vinabot-md ul { margin: 8px 0 8px 20px; padding: 0; }
        .vinabot-md li { margin: 4px 0; }
        .vinabot-md strong { font-weight: 600; color: #0f172a; }
        .vinabot-md em { font-style: italic; }
        .vinabot-md br { display: block; content: ''; margin: 4px 0; }
        .vinabot-md hr { border: none; border-top: 1px solid #e2e8f0; margin: 12px 0; }
        
        .vinabot-payment-btn {
          display: inline-block;
          background: #ea580c;
          color: white !important;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          margin: 10px 0;
          box-shadow: 0 2px 4px rgba(234, 88, 12, 0.2);
          transition: background 0.2s, transform 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .vinabot-payment-btn:hover {
          background: #c2410c;
          transform: translateY(-1px);
        }

        /* Typing indicator */
        .vinabot-typing { display: flex; gap: 5px; align-items: center; height: 18px; padding: 4px 2px; }
        .vinabot-typing span {
          width: 6px;
          height: 6px;
          background: #94a3b8;
          border-radius: 50%;
          animation: vinabot-bounce 1.4s infinite ease-in-out both;
        }
        .vinabot-typing span:nth-child(1) { animation-delay: -0.32s; }
        .vinabot-typing span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes vinabot-bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        /* Quick questions */
        .vinabot-quick {
          padding: 0 20px 12px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          background: #f8fafc;
        }
        .vinabot-quick-btn {
          font-size: 12px;
          padding: 8px 14px;
          border-radius: 99px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #1e3a8a;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .vinabot-quick-btn:hover {
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        /* Input area */
        .vinabot-input-area {
          padding: 16px 20px;
          background: #ffffff;
          border-top: 1px solid #e5e7eb;
          display: flex;
          align-items: flex-end;
          gap: 12px;
          flex-shrink: 0;
        }
        .vinabot-textarea {
          flex: 1;
          resize: none;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 12px 16px;
          font-size: 14px;
          font-family: inherit;
          background: #f8fafc;
          color: #1e293b;
          outline: none;
          transition: all 0.2s;
          min-height: 44px;
          max-height: 120px;
          line-height: 1.5;
        }
        .vinabot-textarea:focus { 
          border-color: #1e3a8a; 
          background: #ffffff;
        }
        .vinabot-textarea::placeholder { color: #94a3b8; }

        .vinabot-send {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: none;
          background: #1e3a8a;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.2s, transform 0.2s;
        }
        .vinabot-send:disabled { 
          background: #f1f5f9; 
          color: #cbd5e1;
          cursor: not-allowed; 
        }
        .vinabot-send:not(:disabled):hover { 
          background: #2563eb;
        }
        .vinabot-send:not(:disabled):active { transform: scale(0.95); }

        /* Footer */
        .vinabot-footer {
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
          padding: 8px 0 12px;
          background: #ffffff;
          font-weight: 500;
        }

        /* Responsive */
        @media (max-width: 480px) {
          .vinabot-panel {
            width: calc(100vw - 32px);
            max-height: 80vh;
            border-radius: 16px;
            bottom: 80px;
          }
          .vinabot-fab { bottom: 16px; right: 16px; }
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
