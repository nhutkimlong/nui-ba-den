'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppHeader } from '../../../components/app-header';
import { useLocale } from '../../../lib/locale';
import { useToast } from '../../../lib/toast';
import { apiPost, apiGet } from '../../../lib/api';
import { SendIcon, TrashIcon } from '../../../components/icons';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  feedback?: 'helpful' | 'unhelpful';
}

interface FaqItem {
  id: string;
  question: string;
}

interface AskResponse {
  answer: string;
  sources?: string[];
}

const STORAGE_KEY = 'nbd_chat_history';

function ChatInner() {
  const { locale, t } = useLocale();
  const toast = useToast();
  const search = useSearchParams();
  const contextId = search.get('context') ?? undefined;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [faq, setFaq] = useState<FaqItem[]>([]);
  const [composerBottom, setComposerBottom] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const restoredRef = useRef(false);

  // Restore prior conversation on mount
  useEffect(() => {
    if (typeof window === 'undefined' || restoredRef.current) return;
    restoredRef.current = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch {
      // ignore corrupt cache
    }
  }, []);

  // Persist on every change
  useEffect(() => {
    if (!restoredRef.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // quota or private mode — silently ignore
    }
  }, [messages]);

  useEffect(() => {
    let alive = true;
    apiGet<{ items: FaqItem[] }>('/chatbot/suggestions', locale)
      .then((d) => alive && setFaq(d.items))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [locale]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Keep composer above on-screen keyboard via visualViewport.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => {
      const offset = window.innerHeight - vv.height - vv.offsetTop;
      // when keyboard opens, offset > 0 — push composer up by that much.
      setComposerBottom(offset > 40 ? offset : null);
    };
    vv.addEventListener('resize', handler);
    vv.addEventListener('scroll', handler);
    handler();
    return () => {
      vv.removeEventListener('resize', handler);
      vv.removeEventListener('scroll', handler);
    };
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
      };
      setMessages((m) => [...m, userMsg]);
      setInput('');
      setSending(true);
      try {
        const res = await apiPost<AskResponse>(
          '/chatbot/ask',
          { question: trimmed, context: contextId },
          locale,
        );
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: 'bot',
            content: res.answer || t('chat.fallback'),
          },
        ]);
      } catch {
        setMessages((m) => [
          ...m,
          { id: crypto.randomUUID(), role: 'bot', content: t('chat.fallback') },
        ]);
      } finally {
        setSending(false);
      }
    },
    [contextId, locale, sending, t],
  );

  const giveFeedback = async (msgId: string, feedback: 'helpful' | 'unhelpful') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedback } : m)),
    );
    try {
      await apiPost('/chatbot/feedback', { messageId: msgId, feedback }, locale);
    } catch {}
  };

  const clearConversation = () => {
    if (!messages.length) return;
    const ok = window.confirm(
      locale === 'vi'
        ? 'Xóa toàn bộ lịch sử trò chuyện?'
        : 'Clear the whole conversation?',
    );
    if (!ok) return;
    setMessages([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
    toast.show(locale === 'vi' ? 'Đã xóa hội thoại' : 'Conversation cleared', 'info');
  };

  const composerStyle: React.CSSProperties =
    composerBottom != null
      ? { bottom: composerBottom + 8 }
      : {};

  return (
    <>
      <AppHeader
        title={t('support.chatbot')}
        showBack
        rightSlot={
          messages.length > 0 ? (
            <button
              type="button"
              className="chat-clear-btn"
              onClick={clearConversation}
              aria-label="Clear conversation"
            >
              <TrashIcon size={14} />
              <span style={{ marginLeft: 4 }}>
                {locale === 'vi' ? 'Xóa' : 'Clear'}
              </span>
            </button>
          ) : null
        }
      />

      {messages.length === 0 && (
        <section className="section">
          <div className="chat-empty">
            {locale === 'vi'
              ? 'Dạ em là trợ lý du lịch Núi Bà Đen. Anh/chị cần em hỗ trợ điều gì ạ?'
              : 'Hi! I am the Ba Den Mountain travel assistant. How can I help you today?'}
          </div>
          {faq.length > 0 && (
            <>
              <h3 className="section-title">{t('support.faq')}</h3>
              <div className="chip-row">
                {faq.map((q) => (
                  <button key={q.id} className="chip" onClick={() => send(q.question)}>
                    {q.question}
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <section className="section chat-shell">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`bubble ${m.role === 'user' ? 'bubble-user' : 'bubble-bot'}`}
          >
            {m.content}
            {m.role === 'bot' && (
              <div className="bubble-feedback">
                <button
                  className={`feedback-btn ${
                    m.feedback === 'helpful' ? 'is-selected-positive' : ''
                  }`}
                  onClick={() => giveFeedback(m.id, 'helpful')}
                  disabled={!!m.feedback}
                  type="button"
                >
                  👍 {t('chat.helpful')}
                </button>
                <button
                  className={`feedback-btn ${
                    m.feedback === 'unhelpful' ? 'is-selected-negative' : ''
                  }`}
                  onClick={() => giveFeedback(m.id, 'unhelpful')}
                  disabled={!!m.feedback}
                  type="button"
                >
                  👎 {t('chat.unhelpful')}
                </button>
              </div>
            )}
          </div>
        ))}
        {sending && (
          <div className="bubble bubble-bot" aria-live="polite">
            <span style={{ opacity: 0.6 }}>
              {locale === 'vi' ? 'Đang soạn câu trả lời…' : 'Typing…'}
            </span>
          </div>
        )}
        <div ref={endRef} />
      </section>

      <form
        className="chat-composer"
        style={composerStyle}
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          ref={inputRef}
          className="input"
          value={input}
          placeholder={t('chat.placeholder')}
          onChange={(e) => setInput(e.target.value)}
          enterKeyHint="send"
          autoComplete="off"
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={sending || !input.trim()}
          aria-label="Send"
        >
          <SendIcon size={18} />
        </button>
      </form>
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="empty">...</div>}>
      <ChatInner />
    </Suspense>
  );
}
