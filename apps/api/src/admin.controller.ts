import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DEFAULT_LOCALE, type Locale, type ReportStatus } from '@nui-ba-den/shared';
import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import * as QRCode from 'qrcode';
import { AdminAuthGuard } from './admin-auth.guard';
import { getSupabase } from './supabase';

type Bilingual<T> = { vi: T; en: T };

interface PoiUpsertBody {
  slug: string;
  categoryCode: string;
  qrCodeValue?: string;
  latitude: number;
  longitude: number;
  status?: 'draft' | 'published' | 'archived';
  imageUrl?: string;
  vi: { title: string; shortDescription: string; longDescription: string };
  en: { title: string; shortDescription: string; longDescription: string };
}

interface FaqUpsertBody {
  tags: string[];
  status?: 'draft' | 'published' | 'archived';
  vi: { question: string; answer: string };
  en: { question: string; answer: string };
}

interface BannerUpsertBody {
  imageUrl: string;
  linkUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  vi: { title: string; subtitle?: string };
  en: { title: string; subtitle?: string };
}

interface AlertUpsertBody {
  severity: 'info' | 'warning' | 'critical';
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  vi: { title: string; body?: string };
  en: { title: string; body?: string };
}

interface UpdateReportStatusBody {
  status: ReportStatus;
  note?: string;
}

const BUCKET_BRANDING = 'branding';
const BUCKET_POI = 'poi-media';

@UseGuards(AdminAuthGuard)
@Controller('admin')
export class AdminController {
  // ---------- Overview ----------
  @Get('overview')
  async overview() {
    const sb = getSupabase();
    const [r, p, f, c, latest] = await Promise.all([
      sb.from('reports').select('id', { head: true, count: 'exact' }),
      sb.from('poi').select('id', { head: true, count: 'exact' }),
      sb.from('faq_items').select('id', { head: true, count: 'exact' }),
      sb.from('checkins').select('id', { head: true, count: 'exact' }),
      sb
        .from('reports')
        .select('id, code, status, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    return {
      reports: r.count ?? 0,
      pois: p.count ?? 0,
      faqs: f.count ?? 0,
      checkins: c.count ?? 0,
      latestReport: latest.data ?? null,
    };
  }

  // ---------- Site settings ----------
  @Get('site-settings')
  async listSiteSettings() {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('site_settings')
      .select('key, value, updated_at, updated_by')
      .order('key');
    if (error) return { items: [], error: error.message };
    return { items: data ?? [] };
  }

  @Put('site-settings/:key')
  async upsertSiteSetting(@Param('key') key: string, @Body() body: { value: any }) {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('site_settings')
      .upsert({ key, value: body.value }, { onConflict: 'key' })
      .select('key, value')
      .single();
    if (error) return { error: error.message };
    return { ok: true, ...data };
  }

  // ---------- Uploads ----------
  @Post('uploads/branding')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadBranding(@UploadedFile() file: Express.Multer.File) {
    return this.uploadToBucket(file, BUCKET_BRANDING);
  }

  @Post('uploads/poi')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadPoi(@UploadedFile() file: Express.Multer.File) {
    return this.uploadToBucket(file, BUCKET_POI);
  }

  private async uploadToBucket(file: Express.Multer.File | undefined, bucket: string) {
    if (!file) return { error: 'no_file' };
    const ext = extname(file.originalname || '').toLowerCase() || '.bin';
    const path = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}${ext}`;
    const sb = getSupabase();
    const { error } = await sb.storage
      .from(bucket)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
    if (error) return { error: error.message };
    const { data } = sb.storage.from(bucket).getPublicUrl(path);
    return { ok: true, path, publicUrl: data.publicUrl };
  }

  // ---------- POI ----------
  @Get('pois')
  async listPois() {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('poi')
      .select(
        'id, slug, status, latitude, longitude, sort_order, poi_categories(code), poi_translations(locale, title, short_description, long_description), poi_media(id, url, sort_order), poi_qr_codes(id, qr_value, is_active)',
      )
      .order('sort_order', { ascending: true });
    if (error) return { items: [], error: error.message };
    return { items: data ?? [] };
  }

  @Post('pois')
  async createPoi(@Body() body: PoiUpsertBody) {
    const sb = getSupabase();
    const { data: cat } = await sb
      .from('poi_categories')
      .select('id')
      .eq('code', body.categoryCode)
      .maybeSingle();
    if (!cat) return { error: 'invalid_category' };

    const { data: poi, error: poiErr } = await sb
      .from('poi')
      .insert({
        slug: body.slug,
        category_id: cat.id,
        latitude: body.latitude,
        longitude: body.longitude,
        status: body.status ?? 'draft',
      })
      .select('id')
      .maybeSingle();
    if (poiErr || !poi) return { error: 'slug_taken_or_invalid', detail: poiErr?.message };

    const qrValue = body.qrCodeValue?.trim() || generateQrToken(body.slug);

    await Promise.all([
      sb.from('poi_translations').insert([
        { poi_id: poi.id, locale: 'vi', title: body.vi.title, short_description: body.vi.shortDescription, long_description: body.vi.longDescription },
        { poi_id: poi.id, locale: 'en', title: body.en.title, short_description: body.en.shortDescription, long_description: body.en.longDescription },
      ]),
      body.imageUrl
        ? sb.from('poi_media').insert({ poi_id: poi.id, media_type: 'image', url: body.imageUrl, sort_order: 0 })
        : Promise.resolve({}),
      sb.from('poi_qr_codes').insert({ poi_id: poi.id, qr_value: qrValue }),
    ]);

    return { ok: true, id: poi.id, qrValue };
  }

  @Put('pois/:id')
  async updatePoi(@Param('id') id: string, @Body() body: PoiUpsertBody) {
    const sb = getSupabase();
    const { data: cat } = await sb
      .from('poi_categories')
      .select('id')
      .eq('code', body.categoryCode)
      .maybeSingle();
    if (!cat) return { error: 'invalid_category' };

    const { error: poiErr } = await sb
      .from('poi')
      .update({
        slug: body.slug,
        category_id: cat.id,
        latitude: body.latitude,
        longitude: body.longitude,
        status: body.status ?? 'draft',
      })
      .eq('id', id);
    if (poiErr) return { error: poiErr.message };

    await sb.from('poi_translations').upsert(
      [
        { poi_id: id, locale: 'vi', title: body.vi.title, short_description: body.vi.shortDescription, long_description: body.vi.longDescription },
        { poi_id: id, locale: 'en', title: body.en.title, short_description: body.en.shortDescription, long_description: body.en.longDescription },
      ],
      { onConflict: 'poi_id,locale' },
    );

    if (body.imageUrl) {
      const { data: media } = await sb
        .from('poi_media')
        .select('id')
        .eq('poi_id', id)
        .order('sort_order', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (media) {
        await sb.from('poi_media').update({ url: body.imageUrl }).eq('id', media.id);
      } else {
        await sb.from('poi_media').insert({ poi_id: id, media_type: 'image', url: body.imageUrl, sort_order: 0 });
      }
    }

    if (body.qrCodeValue) {
      await sb
        .from('poi_qr_codes')
        .upsert({ poi_id: id, qr_value: body.qrCodeValue, is_active: true }, { onConflict: 'qr_value' });
    } else {
      // ensure POI has at least one QR — auto-create if missing.
      const { data: existing } = await sb
        .from('poi_qr_codes')
        .select('id')
        .eq('poi_id', id)
        .limit(1);
      if (!existing?.length) {
        await sb
          .from('poi_qr_codes')
          .insert({ poi_id: id, qr_value: generateQrToken(body.slug) });
      }
    }

    return { ok: true };
  }

  @Delete('pois/:id')
  async deletePoi(@Param('id') id: string) {
    const sb = getSupabase();
    const { error } = await sb.from('poi').delete().eq('id', id);
    if (error) return { error: error.message };
    return { ok: true };
  }

  // Returns QR image (data URL) + deep-link encoded inside it.
  // Admin staff prints this; tourist scans → opens miniapp /support/checkin?poi=<slug>&qr=<value>
  @Get('pois/:id/qr')
  async getPoiQr(@Param('id') id: string) {
    const sb = getSupabase();
    const { data: poi } = await sb
      .from('poi')
      .select('slug, poi_qr_codes(qr_value, is_active)')
      .eq('id', id)
      .maybeSingle();
    if (!poi) return { error: 'not_found' };
    const qr = (poi as any).poi_qr_codes?.find((x: any) => x.is_active) ?? (poi as any).poi_qr_codes?.[0];
    if (!qr) return { error: 'no_qr_assigned' };

    const base = process.env.MINIAPP_BASE_URL?.trim() || '';
    const url = new URL('/support/checkin', base || 'https://example.invalid');
    url.searchParams.set('poi', (poi as any).slug);
    url.searchParams.set('qr', qr.qr_value);
    const deepLink = base ? url.toString() : `nbd:checkin?poi=${(poi as any).slug}&qr=${encodeURIComponent(qr.qr_value)}`;

    const dataUrl = await QRCode.toDataURL(deepLink, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 360,
    });
    return {
      slug: (poi as any).slug,
      qrValue: qr.qr_value,
      deepLink,
      dataUrl,
    };
  }

  // ---------- FAQ ----------
  @Get('faqs')
  async listFaqs() {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('faq_items')
      .select('id, tags, status, sort_order, faq_item_translations(locale, question, answer_md)')
      .order('sort_order', { ascending: true });
    if (error) return { items: [], error: error.message };
    return { items: data ?? [] };
  }

  @Post('faqs')
  async createFaq(@Body() body: FaqUpsertBody) {
    const sb = getSupabase();
    const { data: created, error } = await sb
      .from('faq_items')
      .insert({ tags: body.tags, status: body.status ?? 'draft' })
      .select('id')
      .single();
    if (error || !created) return { error: 'create_failed', detail: error?.message };

    await sb.from('faq_item_translations').insert([
      { faq_id: created.id, locale: 'vi', question: body.vi.question, answer_md: body.vi.answer },
      { faq_id: created.id, locale: 'en', question: body.en.question, answer_md: body.en.answer },
    ]);
    return { ok: true, id: created.id };
  }

  @Put('faqs/:id')
  async updateFaq(@Param('id') id: string, @Body() body: FaqUpsertBody) {
    const sb = getSupabase();
    const { error: faqErr } = await sb
      .from('faq_items')
      .update({ tags: body.tags, status: body.status ?? 'draft' })
      .eq('id', id);
    if (faqErr) return { error: faqErr.message };

    await sb.from('faq_item_translations').upsert(
      [
        { faq_id: id, locale: 'vi', question: body.vi.question, answer_md: body.vi.answer },
        { faq_id: id, locale: 'en', question: body.en.question, answer_md: body.en.answer },
      ],
      { onConflict: 'faq_id,locale' },
    );
    return { ok: true };
  }

  @Delete('faqs/:id')
  async deleteFaq(@Param('id') id: string) {
    const sb = getSupabase();
    const { error } = await sb.from('faq_items').delete().eq('id', id);
    if (error) return { error: error.message };
    return { ok: true };
  }

  // ---------- Banners ----------
  @Get('banners')
  async listBanners() {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('banners')
      .select('id, image_url, link_url, sort_order, is_active, starts_at, ends_at, banner_translations(locale, title, subtitle)')
      .order('sort_order', { ascending: true });
    if (error) return { items: [], error: error.message };
    return { items: data ?? [] };
  }

  @Post('banners')
  async createBanner(@Body() body: BannerUpsertBody) {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('banners')
      .insert({
        image_url: body.imageUrl,
        link_url: body.linkUrl ?? null,
        sort_order: body.sortOrder ?? 0,
        is_active: body.isActive ?? true,
        starts_at: body.startsAt ?? null,
        ends_at: body.endsAt ?? null,
      })
      .select('id')
      .single();
    if (error || !data) return { error: error?.message };

    await sb.from('banner_translations').insert([
      { banner_id: data.id, locale: 'vi', title: body.vi.title, subtitle: body.vi.subtitle ?? null },
      { banner_id: data.id, locale: 'en', title: body.en.title, subtitle: body.en.subtitle ?? null },
    ]);
    return { ok: true, id: data.id };
  }

  @Put('banners/:id')
  async updateBanner(@Param('id') id: string, @Body() body: BannerUpsertBody) {
    const sb = getSupabase();
    const { error } = await sb
      .from('banners')
      .update({
        image_url: body.imageUrl,
        link_url: body.linkUrl ?? null,
        sort_order: body.sortOrder ?? 0,
        is_active: body.isActive ?? true,
        starts_at: body.startsAt ?? null,
        ends_at: body.endsAt ?? null,
      })
      .eq('id', id);
    if (error) return { error: error.message };

    await sb.from('banner_translations').upsert(
      [
        { banner_id: id, locale: 'vi', title: body.vi.title, subtitle: body.vi.subtitle ?? null },
        { banner_id: id, locale: 'en', title: body.en.title, subtitle: body.en.subtitle ?? null },
      ],
      { onConflict: 'banner_id,locale' },
    );
    return { ok: true };
  }

  @Delete('banners/:id')
  async deleteBanner(@Param('id') id: string) {
    const sb = getSupabase();
    const { error } = await sb.from('banners').delete().eq('id', id);
    if (error) return { error: error.message };
    return { ok: true };
  }

  // ---------- Alerts ----------
  @Get('alerts')
  async listAlerts() {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('alerts')
      .select('id, severity, is_active, starts_at, ends_at, alert_translations(locale, title, body_md)')
      .order('starts_at', { ascending: false });
    if (error) return { items: [], error: error.message };
    return { items: data ?? [] };
  }

  @Post('alerts')
  async createAlert(@Body() body: AlertUpsertBody) {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('alerts')
      .insert({
        severity: body.severity,
        is_active: body.isActive,
        starts_at: body.startsAt ?? null,
        ends_at: body.endsAt ?? null,
      })
      .select('id')
      .single();
    if (error || !data) return { error: error?.message };

    await sb.from('alert_translations').insert([
      { alert_id: data.id, locale: 'vi', title: body.vi.title, body_md: body.vi.body ?? null },
      { alert_id: data.id, locale: 'en', title: body.en.title, body_md: body.en.body ?? null },
    ]);
    return { ok: true, id: data.id };
  }

  @Put('alerts/:id')
  async updateAlert(@Param('id') id: string, @Body() body: AlertUpsertBody) {
    const sb = getSupabase();
    const { error } = await sb
      .from('alerts')
      .update({
        severity: body.severity,
        is_active: body.isActive,
        starts_at: body.startsAt ?? null,
        ends_at: body.endsAt ?? null,
      })
      .eq('id', id);
    if (error) return { error: error.message };

    await sb.from('alert_translations').upsert(
      [
        { alert_id: id, locale: 'vi', title: body.vi.title, body_md: body.vi.body ?? null },
        { alert_id: id, locale: 'en', title: body.en.title, body_md: body.en.body ?? null },
      ],
      { onConflict: 'alert_id,locale' },
    );
    return { ok: true };
  }

  @Delete('alerts/:id')
  async deleteAlert(@Param('id') id: string) {
    const sb = getSupabase();
    const { error } = await sb.from('alerts').delete().eq('id', id);
    if (error) return { error: error.message };
    return { ok: true };
  }

  // ---------- Categories (POI + reports) ----------
  @Get('categories/poi')
  async listPoiCategories() {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('poi_categories')
      .select('id, code, sort_order, is_active, poi_category_translations(locale, name)')
      .order('sort_order', { ascending: true });
    if (error) return { items: [], error: error.message };
    return { items: data ?? [] };
  }

  @Get('categories/reports')
  async listReportCategories() {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('report_categories')
      .select('id, code, sort_order, is_active, sla_hours, report_category_translations(locale, name)')
      .order('sort_order', { ascending: true });
    if (error) return { items: [], error: error.message };
    return { items: data ?? [] };
  }

  // ---------- Reports ----------
  @Get('reports')
  async listReports(@Query('locale') localeParam?: Locale) {
    const locale = pickLocale(localeParam);
    const sb = getSupabase();
    const { data, error } = await sb
      .from('reports')
      .select(
        'id, code, description, location_text, status, created_at, report_categories(code, report_category_translations!inner(locale, name))',
      )
      .eq('report_categories.report_category_translations.locale', locale)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) return { items: [], error: error.message };
    return {
      items: (data ?? []).map((r: any) => ({
        id: r.id,
        code: r.code,
        category: r.report_categories?.report_category_translations?.[0]?.name ?? '',
        categoryCode: r.report_categories?.code ?? '',
        description: r.description,
        location: r.location_text,
        status: r.status,
        createdAt: r.created_at,
      })),
    };
  }

  @Put('reports/:code/status')
  async updateReport(@Param('code') code: string, @Body() body: UpdateReportStatusBody) {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('reports')
      .update({ status: body.status })
      .eq('code', code)
      .select('id, code, status')
      .maybeSingle();
    if (error || !data) return { error: 'not_found', detail: error?.message };

    if (body.note?.trim()) {
      await sb
        .from('report_status_history')
        .update({ note: body.note })
        .eq('report_id', data.id)
        .eq('to_status', body.status)
        .order('changed_at', { ascending: false })
        .limit(1);
    }

    return { ok: true, code: data.code, status: data.status };
  }
}

function pickLocale(value?: string): Locale {
  if (value === 'vi' || value === 'en') return value;
  return DEFAULT_LOCALE;
}

function generateQrToken(slug: string): string {
  const cleanSlug = slug
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 16);
  const rand = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `NBD-${cleanSlug || 'POI'}-${rand}`;
}
