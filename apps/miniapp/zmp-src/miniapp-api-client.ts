import { getLocation } from 'zmp-sdk/apis';

const rawApiBase = ((import.meta as unknown as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE) || 'https://nbd-api-t63a.onrender.com';
export const API_BASE = rawApiBase.startsWith('http') ? rawApiBase : `https://${rawApiBase}`;
export const TOKEN_KEY = 'nbd_user_token';

export type Locale = 'vi' | 'en';
export type Coords = { lat: number; lng: number };

export function authHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
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
