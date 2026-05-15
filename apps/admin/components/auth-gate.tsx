'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { adminGet, getAdminToken } from '../lib/api';

const PUBLIC_PATHS = ['/login'];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'authed' | 'public' | 'redirect'>('loading');

  useEffect(() => {
    let alive = true;
    if (PUBLIC_PATHS.includes(pathname)) {
      setState('public');
      return;
    }
    if (!getAdminToken()) {
      router.replace('/login');
      setState('redirect');
      return;
    }
    adminGet('/admin/auth/me')
      .then(() => alive && setState('authed'))
      .catch(() => {
        if (!alive) return;
        router.replace('/login');
        setState('redirect');
      });
    return () => {
      alive = false;
    };
  }, [pathname, router]);

  if (state === 'loading' || state === 'redirect') {
    return <div style={{ padding: 32, color: 'var(--text-muted)' }}>Đang kiểm tra phiên đăng nhập…</div>;
  }
  return <>{children}</>;
}
