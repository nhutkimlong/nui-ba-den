import { DEFAULT_LOCALE, type Locale, SUPPORTED_LOCALES } from '@nui-ba-den/shared';

const rawApiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3002';
const API_BASE = rawApiBase.startsWith('http') ? rawApiBase : `https://${rawApiBase}`;

export function pickLocale(value: string | null | undefined): Locale {
  if (value && SUPPORTED_LOCALES.includes(value as Locale)) return value as Locale;
  return DEFAULT_LOCALE;
}

function authHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const t = window.localStorage.getItem('nbd_user_token');
  return t ? { authorization: `Bearer ${t}` } : {};
}

export async function apiGet<T>(path: string, locale: Locale): Promise<T> {
  const url = new URL(path, API_BASE);
  url.searchParams.set('locale', locale);
  const res = await fetch(url.toString(), { cache: 'no-store', headers: authHeader() });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown, locale: Locale): Promise<T> {
  const url = new URL(path, API_BASE);
  url.searchParams.set('locale', locale);
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authHeader() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export async function apiUpload<T>(path: string, file: File, locale: Locale): Promise<T> {
  const url = new URL(path, API_BASE);
  url.searchParams.set('locale', locale);
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: authHeader(),
    body: fd,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}
