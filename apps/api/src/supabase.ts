import { createClient, SupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      'Supabase env missing: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in apps/api/.env.local',
    );
  }
  cached = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'public' },
    realtime: { transport: WebSocket as any },
  });
  return cached;
}
