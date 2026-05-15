import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { DEFAULT_LOCALE, type Locale, type ReportCategory, type ReportStatus } from '@nui-ba-den/shared';
import { hashToken, parseBearer } from './auth-utils';
import { getSupabase } from './supabase';

interface CreateReportBody {
  category: ReportCategory;
  description: string;
  location: string;
  coords: { lat: number; lng: number } | null;
  // Encrypted phone token from zmp-sdk getPhoneNumber. Optional opt-in.
  contactPhoneToken?: string | null;
}

// Shared API category 'security_order' maps to DB report_categories.code 'security'.
const CATEGORY_CODE_TO_DB: Record<ReportCategory, string> = {
  service: 'service',
  security_order: 'security',
  environment: 'environment',
  other: 'other',
};

const DB_CODE_TO_CATEGORY: Record<string, ReportCategory> = {
  service: 'service',
  security: 'security_order',
  environment: 'environment',
  other: 'other',
};

@Controller('reports')
export class ReportsController {
  @Post()
  async create(
    @Body() body: CreateReportBody,
    @Headers('authorization') auth?: string,
  ) {
    const sb = getSupabase();
    const dbCode = CATEGORY_CODE_TO_DB[body.category];

    const { data: cat, error: catErr } = await sb
      .from('report_categories')
      .select('id')
      .eq('code', dbCode)
      .maybeSingle();
    if (catErr || !cat) {
      return { error: 'invalid_category' };
    }

    const reporterId = await resolveUserIdFromBearer(auth);

    let contactPhone: string | null = null;
    if (body.contactPhoneToken && reporterId) {
      contactPhone = await resolveZaloPhone(body.contactPhoneToken, auth);
    }

    const code = randomCode();
    const { data, error } = await sb
      .from('reports')
      .insert({
        code,
        reporter_id: reporterId,
        category_id: cat.id,
        description: body.description,
        location_text: body.location,
        latitude: body.coords?.lat ?? null,
        longitude: body.coords?.lng ?? null,
        contact_phone: contactPhone,
      })
      .select('id, code, status')
      .single();

    if (error || !data) {
      return { error: 'create_failed', detail: error?.message };
    }

    return { id: data.id, code: data.code, status: data.status as ReportStatus };
  }

  // Upload an attachment for a previously-created report.
  // Auth required: only the reporter can attach to their own report.
  @Post(':code/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 24 * 1024 * 1024 },
    }),
  )
  async uploadAttachment(
    @Param('code') code: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Headers('authorization') auth?: string,
  ) {
    if (!file) return { error: 'no_file' };
    const reporterId = await resolveUserIdFromBearer(auth);
    if (!reporterId) return { error: 'unauthenticated' };

    const sb = getSupabase();
    const { data: report } = await sb
      .from('reports')
      .select('id, reporter_id')
      .eq('code', code)
      .maybeSingle();
    if (!report) return { error: 'report_not_found' };
    if (report.reporter_id !== reporterId) return { error: 'forbidden' };

    const ext = (extname(file.originalname || '') || '.bin').toLowerCase();
    const path = `${reporterId}/${report.id}/${randomUUID()}${ext}`;
    const mediaType = pickMediaType(file.mimetype);

    const { error: upErr } = await sb.storage
      .from('report-attachments')
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
    if (upErr) return { error: 'upload_failed', detail: upErr.message };

    const { data: row, error: rowErr } = await sb
      .from('report_attachments')
      .insert({
        report_id: report.id,
        storage_path: path,
        media_type: mediaType,
        byte_size: file.size,
      })
      .select('id, storage_path, media_type, byte_size')
      .single();
    if (rowErr || !row) return { error: 'attach_record_failed', detail: rowErr?.message };

    return { ok: true, attachment: row };
  }

  @Get('history')
  async history(@Query('locale') localeParam?: Locale) {
    const locale = pickLocale(localeParam);
    const sb = getSupabase();

    const { data, error } = await sb
      .from('reports')
      .select(
        'id, code, status, created_at, report_categories(code, report_category_translations!inner(locale, name))',
      )
      .eq('report_categories.report_category_translations.locale', locale)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return { items: [], error: error.message };

    return {
      items: (data ?? []).map((r: any) => ({
        id: r.id,
        code: r.code,
        category: r.report_categories?.report_category_translations?.[0]?.name ?? '',
        status: r.status as ReportStatus,
        createdAt: r.created_at,
      })),
    };
  }

  @Get('by-code/:code')
  async detail(@Param('code') code: string, @Query('locale') localeParam?: Locale) {
    const locale = pickLocale(localeParam);
    const sb = getSupabase();

    const { data, error } = await sb
      .from('reports')
      .select(
        'id, code, description, location_text, status, created_at, report_categories(code, report_category_translations!inner(locale, name)), report_status_history(from_status, to_status, changed_at, note)',
      )
      .eq('code', code)
      .eq('report_categories.report_category_translations.locale', locale)
      .maybeSingle();

    if (error || !data) return { error: 'not_found' };

    const r: any = data;
    const timeline = (r.report_status_history ?? [])
      .map((h: any) => ({
        at: h.changed_at,
        status: h.to_status as ReportStatus,
        note: h.note ?? autoTimelineNote(h.to_status, locale),
      }))
      .sort((a: any, b: any) => new Date(a.at).getTime() - new Date(b.at).getTime());

    return {
      id: r.id,
      code: r.code,
      category: r.report_categories?.report_category_translations?.[0]?.name ?? '',
      description: r.description,
      location: r.location_text,
      status: r.status as ReportStatus,
      createdAt: r.created_at,
      timeline,
    };
  }
}

function pickLocale(value?: string): Locale {
  if (value === 'vi' || value === 'en') return value;
  return DEFAULT_LOCALE;
}

function autoTimelineNote(status: ReportStatus, locale: Locale): string {
  const map: Record<ReportStatus, { vi: string; en: string }> = {
    new: { vi: 'Tiếp nhận tự động', en: 'Auto received' },
    triaged: { vi: 'Đã phân loại', en: 'Triaged' },
    in_progress: { vi: 'Đang xử lý', en: 'In progress' },
    resolved: { vi: 'Đã xử lý xong', en: 'Resolved' },
    rejected: { vi: 'Đã từ chối', en: 'Rejected' },
    needs_more_info: { vi: 'Cần thêm thông tin', en: 'Needs more info' },
  };
  return map[status][locale];
}

function randomCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = 'NBD-';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// Helper kept for future migration of legacy code.
export { DB_CODE_TO_CATEGORY };

async function resolveUserIdFromBearer(auth?: string): Promise<string | null> {
  const token = parseBearer(auth);
  if (!token) return null;
  const sb = getSupabase();
  const { data } = await sb
    .from('app_sessions')
    .select('user_id, expires_at, revoked_at')
    .eq('token_hash', hashToken(token))
    .maybeSingle();
  if (!data || data.revoked_at || new Date(data.expires_at) < new Date()) return null;
  return data.user_id as string;
}

function pickMediaType(
  mime: string,
): 'image' | 'video' | 'audio' | 'doc' {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'doc';
}

// Decrypts the encrypted phone token returned by zmp-sdk getPhoneNumber.
// Calls Zalo Graph API with the user's accessToken and our secret_key.
// We don't store the access token; the bearer here is our own session.
// Caller must guarantee the user opted-in.
async function resolveZaloPhone(
  encryptedToken: string,
  auth: string | undefined,
): Promise<string | null> {
  // We need the user's Zalo access_token. Look it up from app_users via session.
  const sb = getSupabase();
  const sessionToken = parseBearer(auth);
  if (!sessionToken) return null;
  const { data: session } = await sb
    .from('app_sessions')
    .select('user_id')
    .eq('token_hash', hashToken(sessionToken))
    .maybeSingle();
  if (!session?.user_id) return null;
  const { data: user } = await sb
    .from('app_users')
    .select('zalo_user_id')
    .eq('id', session.user_id)
    .maybeSingle();
  if (!user?.zalo_user_id) return null;

  const secret = process.env.ZALO_APP_SECRET;
  if (!secret) return null;

  try {
    const res = await fetch(
      `https://graph.zalo.me/v2.0/me/info?code=${encodeURIComponent(encryptedToken)}`,
      {
        headers: {
          access_token: encryptedToken,
          code: encryptedToken,
          secret_key: secret,
        },
      },
    );
    const json = (await res.json()) as { data?: { number?: string } };
    return json?.data?.number ?? null;
  } catch {
    return null;
  }
}
