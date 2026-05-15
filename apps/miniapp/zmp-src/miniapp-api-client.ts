import { authorize, getAccessToken, getLocation, getUserInfo } from 'zmp-sdk/apis';
import type { AppUser } from './miniapp-types';

const rawApiBase = ((import.meta as unknown as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE) || 'https://nbd-api-t63a.onrender.com';
export const API_BASE = rawApiBase.startsWith('http') ? rawApiBase : `https://${rawApiBase}`;
export const TOKEN_KEY = 'nbd_user_token';

export type Locale = 'vi' | 'en';
export type Coords = { lat: number; lng: number };

export function getUserToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setUserToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function authHeaders(): Record<string, string> {
  const token = getUserToken();
  return token ? { authorization: `Bearer ${token}` } : {};
}

export async function apiGet<T>(path: string, locale: Locale): Promise<T> {
  const url = new URL(path, API_BASE);
  url.searchParams.set('locale', locale);
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown, locale: Locale): Promise<T> {
  const url = new URL(path, API_BASE);
  url.searchParams.set('locale', locale);
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

export async function apiUpload<T>(path: string, file: File, locale: Locale): Promise<T> {
  const url = new URL(path, API_BASE);
  url.searchParams.set('locale', locale);
  const form = new FormData();
  form.set('file', file);
  const res = await fetch(url.toString(), { method: 'POST', headers: authHeaders(), body: form });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

export async function getGps(): Promise<Coords> {
  try {
    const loc = await getLocation({});
    const lat = Number((loc as any).latitude ?? (loc as any).lat);
    const lng = Number((loc as any).longitude ?? (loc as any).lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  } catch {}
  return new Promise((resolve, reject) => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 8000 },
    );
  });
}

export async function fetchMe(): Promise<AppUser | null> {
  const token = getUserToken();
  if (!token) return null;
  const res = await fetch(new URL('/auth/zalo/me', API_BASE).toString(), {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json() as { user?: AppUser };
  return data.user ?? null;
}

export async function logoutUser() {
  const token = getUserToken();
  if (token) {
    await fetch(new URL('/auth/zalo/logout', API_BASE).toString(), {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    }).catch(() => undefined);
  }
  setUserToken(null);
}

export async function loginWithZmp(): Promise<AppUser | null> {
  await authorize({ scopes: ['scope.userInfo'] }).catch(() => undefined);
  const tokenResult = await getAccessToken({});
  const accessToken = typeof tokenResult === 'string' ? tokenResult : (tokenResult as any).accessToken;
  if (!accessToken) return null;

  let zmpUser: { id?: string; name?: string; avatar?: string | null } | undefined;
  try {
    const { userInfo } = await getUserInfo({ avatarType: 'normal' });
    if (userInfo) zmpUser = { id: userInfo.id, name: userInfo.name, avatar: userInfo.avatar ?? null };
  } catch {}

  const res = await fetch(new URL('/auth/zalo/miniapp-login', API_BASE).toString(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ accessToken, zmpUser }),
  });
  if (!res.ok) return null;
  const data = await res.json() as { token?: string; user?: AppUser };
  if (data.token) setUserToken(data.token);
  return data.user ?? null;
}
