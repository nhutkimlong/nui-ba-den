'use client';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3002';
const TOKEN_KEY = 'nbd_admin_token';

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = getAdminToken();
  return {
    ...(extra ?? {}),
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
}

async function handle<T>(res: Response, path: string): Promise<T> {
  if (res.status === 401) {
    setAdminToken(null);
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new Error('unauthenticated');
  }
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export async function adminGet<T>(path: string): Promise<T> {
  const res = await fetch(new URL(path, API_BASE).toString(), {
    cache: 'no-store',
    headers: authHeaders(),
  });
  return handle<T>(res, path);
}

export async function adminPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(new URL(path, API_BASE).toString(), {
    method: 'POST',
    headers: authHeaders({ 'content-type': 'application/json' }),
    body: JSON.stringify(body),
  });
  return handle<T>(res, path);
}

export async function adminPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(new URL(path, API_BASE).toString(), {
    method: 'PUT',
    headers: authHeaders({ 'content-type': 'application/json' }),
    body: JSON.stringify(body),
  });
  return handle<T>(res, path);
}

export async function adminDelete<T>(path: string): Promise<T> {
  const res = await fetch(new URL(path, API_BASE).toString(), {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handle<T>(res, path);
}

export async function adminUpload<T>(
  path: string,
  file: File,
): Promise<T> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(new URL(path, API_BASE).toString(), {
    method: 'POST',
    headers: authHeaders(),
    body: fd,
  });
  return handle<T>(res, path);
}

export async function adminLogin(email: string, password: string) {
  const res = await fetch(new URL('/admin/auth/login', API_BASE).toString(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`login failed: ${res.status}`);
  const data = (await res.json()) as { token?: string; error?: string };
  if (data.token) setAdminToken(data.token);
  return data;
}

export async function adminLogout() {
  await fetch(new URL('/admin/auth/logout', API_BASE).toString(), {
    method: 'POST',
    headers: authHeaders(),
  });
  setAdminToken(null);
}
