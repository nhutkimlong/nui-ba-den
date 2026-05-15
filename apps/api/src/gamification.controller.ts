import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DEFAULT_LOCALE, type Locale, MVP_DEFAULTS } from '@nui-ba-den/shared';
import { getSupabase } from './supabase';

interface CheckinBody {
  poiSlug: string;
  qrValue: string;
  coords: { lat: number; lng: number } | null;
}

const GPS_RADIUS_METERS = MVP_DEFAULTS.gpsRadiusMeters;
const REPEAT_WINDOW_MINUTES = MVP_DEFAULTS.repeatCheckinWindowMinutes;

// Anonymous-mode placeholder reporter id used until Zalo auth is wired.
// Stored as fallback so MVP demo flows don't break.
const ANON_USER_KEY = 'mvp-anonymous';

@Controller()
export class GamificationController {
  @Post('checkins')
  async checkIn(@Body() body: CheckinBody, @Query('locale') localeParam?: Locale) {
    const locale = pickLocale(localeParam);
    const sb = getSupabase();

    if (!body.coords) {
      return fail(locale === 'vi' ? 'Cần GPS để check-in' : 'GPS required');
    }

    const { data: poi } = await sb
      .from('poi')
      .select(
        'id, slug, latitude, longitude, poi_translations!inner(locale, title), poi_qr_codes(qr_value, check_radius_m, is_active)',
      )
      .eq('slug', body.poiSlug)
      .eq('status', 'published')
      .eq('poi_translations.locale', locale)
      .maybeSingle();

    if (!poi) return fail('POI not found');

    const p: any = poi;
    const qr = (p.poi_qr_codes as any[] | null)?.find(
      (x) => x.qr_value === body.qrValue && x.is_active,
    );
    if (!qr) {
      return fail(locale === 'vi' ? 'Mã QR không đúng' : 'QR code mismatch');
    }

    const distance = haversine(body.coords.lat, body.coords.lng, p.latitude, p.longitude);
    const radius = qr.check_radius_m ?? GPS_RADIUS_METERS;
    if (distance > radius) {
      return fail(
        locale === 'vi'
          ? `Vị trí cách POI ${Math.round(distance)}m, vượt ngưỡng ${radius}m`
          : `You are ${Math.round(distance)}m away, exceeding ${radius}m`,
      );
    }

    const user = await ensureAnonymousUser();

    const sinceIso = new Date(Date.now() - REPEAT_WINDOW_MINUTES * 60_000).toISOString();
    const { data: recent } = await sb
      .from('checkins')
      .select('id')
      .eq('user_id', user.id)
      .eq('poi_id', p.id)
      .gte('created_at', sinceIso)
      .limit(1);
    if (recent?.length) {
      return fail(
        locale === 'vi'
          ? `Bạn đã check-in trong ${REPEAT_WINDOW_MINUTES} phút qua`
          : `You already checked in within ${REPEAT_WINDOW_MINUTES} minutes`,
      );
    }

    await sb.from('checkins').insert({
      user_id: user.id,
      poi_id: p.id,
      qr_id: qr.id ?? null,
      latitude: body.coords.lat,
      longitude: body.coords.lng,
      distance_m: distance,
      is_valid: true,
    });

    const badge = await maybeAwardBadge(user.id, locale);
    const title = p.poi_translations?.[0]?.title ?? p.slug;

    return {
      ok: true,
      message:
        locale === 'vi'
          ? `Check-in tại ${title} thành công`
          : `Checked in at ${title} successfully`,
      badge,
    };
  }

  @Get('profile')
  async profile(@Query('locale') localeParam?: Locale) {
    const locale = pickLocale(localeParam);
    const sb = getSupabase();
    const user = await ensureAnonymousUser();

    const [checkinsRes, badgeCatalogRes, userBadgesRes, reportsRes] = await Promise.all([
      sb
        .from('checkins')
        .select('id, created_at, poi:poi_id(slug, poi_translations!inner(locale, title))')
        .eq('user_id', user.id)
        .eq('poi.poi_translations.locale', locale)
        .order('created_at', { ascending: false })
        .limit(10),
      sb
        .from('badges')
        .select(
          'id, code, badge_translations!inner(locale, name), badge_rules(kind, params)',
        )
        .eq('is_active', true)
        .eq('badge_translations.locale', locale)
        .order('sort_order', { ascending: true }),
      sb.from('user_badges').select('badge_id').eq('user_id', user.id),
      sb
        .from('reports')
        .select('id', { head: true, count: 'exact' })
        .eq('reporter_id', user.id),
    ]);

    const totalCheckins = (await sb
      .from('checkins')
      .select('id', { head: true, count: 'exact' })
      .eq('user_id', user.id)).count ?? 0;

    const earned = new Set(
      (userBadgesRes.data ?? []).map((b: any) => b.badge_id as string),
    );

    const badges = (badgeCatalogRes.data ?? []).map((b: any) => ({
      id: b.id,
      name: b.badge_translations?.[0]?.name ?? b.code,
      achieved: earned.has(b.id) || meetsRule(b.badge_rules, totalCheckins),
    }));

    return {
      user: {
        name:
          user.display_name ?? (locale === 'vi' ? 'Du khách Núi Bà Đen' : 'Ba Den Visitor'),
        locale,
      },
      stats: {
        checkins: totalCheckins,
        reports: reportsRes.count ?? 0,
        badges: badges.filter((b) => b.achieved).length,
      },
      badges,
      recentCheckins: (checkinsRes.data ?? []).map((c: any) => ({
        id: c.id,
        poiTitle: c.poi?.poi_translations?.[0]?.title ?? c.poi?.slug ?? '',
        at: c.created_at,
      })),
    };
  }
}

function pickLocale(value?: string): Locale {
  if (value === 'vi' || value === 'en') return value;
  return DEFAULT_LOCALE;
}

function fail(message: string) {
  return { ok: false, message };
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function ensureAnonymousUser() {
  const sb = getSupabase();
  const { data } = await sb
    .from('app_users')
    .select('id, display_name')
    .eq('zalo_user_id', ANON_USER_KEY)
    .maybeSingle();
  if (data) return data;
  const { data: created, error } = await sb
    .from('app_users')
    .insert({ zalo_user_id: ANON_USER_KEY, display_name: 'Du khách Núi Bà Đen' })
    .select('id, display_name')
    .single();
  if (error || !created) throw new Error(`ensureAnonymousUser: ${error?.message}`);
  return created;
}

function meetsRule(
  rules: { kind: string; params: any } | { kind: string; params: any }[] | null,
  totalCheckins: number,
) {
  if (!rules) return false;
  const arr = Array.isArray(rules) ? rules : [rules];
  for (const r of arr) {
    if (r.kind === 'first_checkin' && totalCheckins >= 1) return true;
    if (r.kind === 'n_checkins') {
      const n = Number(r.params?.n ?? 0);
      if (n > 0 && totalCheckins >= n) return true;
    }
  }
  return false;
}

async function maybeAwardBadge(userId: string, locale: Locale): Promise<string | undefined> {
  const sb = getSupabase();
  const total = (await sb
    .from('checkins')
    .select('id', { head: true, count: 'exact' })
    .eq('user_id', userId)).count ?? 0;

  const { data: badges } = await sb
    .from('badges')
    .select('id, code, badge_translations!inner(locale, name), badge_rules(kind, params)')
    .eq('is_active', true)
    .eq('badge_translations.locale', locale);

  for (const b of (badges as any[]) ?? []) {
    if (!meetsRule(b.badge_rules, total)) continue;
    const { data: existing } = await sb
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId)
      .eq('badge_id', b.id)
      .maybeSingle();
    if (existing) continue;
    await sb.from('user_badges').insert({
      user_id: userId,
      badge_id: b.id,
      source: 'auto',
    });
    return b.badge_translations?.[0]?.name as string | undefined;
  }
  return undefined;
}
