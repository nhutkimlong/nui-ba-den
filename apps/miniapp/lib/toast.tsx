'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface ToastMsg {
  id: string;
  text: string;
  kind: 'info' | 'success' | 'error';
}

interface Ctx {
  show: (text: string, kind?: ToastMsg['kind']) => void;
}

const ToastCtx = createContext<Ctx>({ show: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastMsg[]>([]);

  const show = useCallback((text: string, kind: ToastMsg['kind'] = 'info') => {
    const id = Math.random().toString(36).slice(2, 9);
    setItems((prev) => [...prev, { id, text, kind }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 88,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          pointerEvents: 'none',
          zIndex: 100,
          padding: '0 16px',
        }}
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            style={{
              maxWidth: 360,
              padding: '10px 16px',
              borderRadius: 12,
              background:
                t.kind === 'error'
                  ? '#fef2f2'
                  : t.kind === 'success'
                  ? '#ecfdf5'
                  : '#0f172a',
              color:
                t.kind === 'error'
                  ? '#b91c1c'
                  : t.kind === 'success'
                  ? '#047857'
                  : '#fff',
              fontSize: 13,
              fontWeight: 500,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              pointerEvents: 'auto',
            }}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
