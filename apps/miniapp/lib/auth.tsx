'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const rawApiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3002';
const API_BASE = rawApiBase.startsWith('http') ? rawApiBase : `https://${rawApiBase}`;
const TOKEN_KEY = 'nbd_user_token';

export interface AppUser {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  preferred_locale: 'vi' | 'en';
  zalo_user_id: string | null;
}

export function getUserToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setUserToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export async function fetchMe(): Promise<AppUser | null> {
  const token = getUserToken();
  if (!token) return null;
  const res = await fetch(new URL('/auth/zalo/me', API_BASE).toString(), {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { user?: AppUser; error?: string };
  return data.user ?? null;
}

export async function logout() {
  const token = getUserToken();
  if (token) {
    await fetch(new URL('/auth/zalo/logout', API_BASE).toString(), {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    });
  }
  setUserToken(null);
}

/**
 * Try to login via Zalo Mini App SDK (only works inside Zalo).
 * Falls back to web OAuth flow when SDK is unavailable.
 */
export async function loginWithZalo(redirectTo = '/'): Promise<AppUser | null> {
  // Try ZMP SDK first.
  if (typeof window !== 'undefined') {
    const u = await tryZmpLogin();
    if (u) return u;

    // Fallback: redirect to server-side OAuth start.
    const url = new URL('/auth/zalo/start', API_BASE);
    url.searchParams.set('redirect_uri', redirectTo);
    window.location.href = url.toString();
  }
  return null;
}

/**
 * Silent attempt — only via ZMP SDK. Returns null when not inside Zalo or
 * when user has not granted scope yet. Never redirects.
 */
async function tryZmpLogin(): Promise<AppUser | null> {
  if (typeof window === 'undefined') return null;
  try {
    const sdk: any = await import('zmp-sdk/apis').catch(() => null);
    if (!sdk?.getAccessToken) return null;
    if (sdk.authorize) {
      try {
        await sdk.authorize({ scopes: ['scope.userInfo'] });
      } catch {
        // user denied — proceed; backend can still upsert by id
      }
    }
    const { accessToken } = await sdk.getAccessToken({});
    if (!accessToken) return null;

    // Best-effort: also pull name + avatar from ZMP getUserInfo so we
    // capture them even if Zalo Graph API returns blanks for unverified OAs.
    let zmpUser: { id?: string; name?: string; avatar?: string | null } | undefined;
    if (sdk.getUserInfo) {
      try {
        const { userInfo } = await sdk.getUserInfo({ avatarType: 'normal' });
        if (userInfo) {
          zmpUser = {
            id: userInfo.id,
            name: userInfo.name,
            avatar: userInfo.avatar ?? null,
          };
        }
      } catch {
        // ignore
      }
    }

    const res = await fetch(new URL('/auth/zalo/miniapp-login', API_BASE).toString(), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accessToken, zmpUser }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { token?: string; user?: AppUser };
    if (data.token) setUserToken(data.token);
    return data.user ?? null;
  } catch {
    return null;
  }
}

interface AuthCtx {
  user: AppUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signIn: (redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  refresh: async () => {},
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    setUser(await fetchMe());
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Capture token from OAuth redirect (?token=...)
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('token');
        if (t) {
          setUserToken(t);
          params.delete('token');
          const clean = window.location.pathname + (params.toString() ? `?${params}` : '');
          window.history.replaceState({}, '', clean);
        }
      }

      let me = await fetchMe();

      // First-launch silent login: if no token yet AND we're inside Zalo,
      // ask ZMP SDK for an access token and exchange it for our session.
      // This is silent; no web redirect, no extra UI. Subsequent launches
      // already have the bearer token cached in localStorage.
      if (!me) {
        const auto = await tryZmpLogin();
        if (auto) me = auto;
      }

      if (!cancelled) {
        setUser(me);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function signIn(redirectTo?: string) {
    const u = await loginWithZalo(redirectTo ?? window.location.pathname);
    if (u) setUser(u);
  }

  async function signOut() {
    await logout();
    setUser(null);
  }

  return (
    <Ctx.Provider value={{ user, loading, refresh, signIn, signOut }}>{children}</Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
