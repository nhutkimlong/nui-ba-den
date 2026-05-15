import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminAuthGuard, AdminRequest } from './admin-auth.guard';
import { writeAuditLog } from './audit';
import { getSupabase } from './supabase';

interface KbUpsertBody {
  sourceType: 'manual';
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  vi: { title: string; body: string };
  en: { title: string; body: string };
}

interface GuideUpsertBody {
  slug: string;
  status: 'draft' | 'published' | 'archived';
  coverImageUrl?: string | null;
  publishedAt?: string | null;
  vi: { title: string; summary: string; bodyMd: string };
  en: { title: string; summary: string; bodyMd: string };
}

interface BadgeUpsertBody {
  code: string;
  iconUrl?: string | null;
  isActive: boolean;
  sortOrder?: number;
  vi: { name: string; description?: string };
  en: { name: string; description?: string };
  rule: {
    kind: 'first_checkin' | 'n_checkins' | 'visit_poi' | 'visit_all_in_category' | 'manual';
    params: Record<string, any>;
  };
}

@UseGuards(AdminAuthGuard)
@Controller('admin')
export class AdminContentController {
  // =====================================================================
  // Manual KB items (chatbot_kb_items where source_type = 'manual')
  // =====================================================================
  @Get('kb-manual')
  async listKbManual() {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('chatbot_kb_items')
      .select(
        'id, status, tags, source_type, created_at, updated_at, chatbot_kb_translations(locale, title, body_md)',
      )
      .eq('source_type', 'manual')
      .order('created_at', { ascending: false });
    if (error) return { items: [], error: error.message };
    return { items: data ?? [] };
  }

  @Post('kb-manual')
  async createKbManual(@Body() body: KbUpsertBody, @Req() req: AdminRequest) {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('chatbot_kb_items')
      .insert({ source_type: 'manual', status: body.status, tags: body.tags })
      .select('id')
      .single();
    if (error || !data) return { error: error?.message };

    await sb.from('chatbot_kb_translations').insert([
      { kb_id: data.id, locale: 'vi', title: body.vi.title, body_md: body.vi.body },
      { kb_id: data.id, locale: 'en', title: body.en.title, body_md: body.en.body },
    ]);

    await writeAuditLog({
      actor: req.admin,
      entityType: 'chatbot_kb_items',
      entityId: data.id,
      action: 'create',
      after: { source_type: 'manual', status: body.status, tags: body.tags },
      ip: clientIp(req),
      userAgent: (req.headers['user-agent'] as string) ?? null,
    });
    return { ok: true, id: data.id };
  }

  @Put('kb-manual/:id')
  async updateKbManual(
    @Param('id') id: string,
    @Body() body: KbUpsertBody,
    @Req() req: AdminRequest,
  ) {
    const sb = getSupabase();
    const { error } = await sb
      .from('chatbot_kb_items')
      .update({ status: body.status, tags: body.tags })
      .eq('id', id)
      .eq('source_type', 'manual');
    if (error) return { error: error.message };

    await sb.from('chatbot_kb_translations').upsert(
      [
        { kb_id: id, locale: 'vi', title: body.vi.title, body_md: body.vi.body },
        { kb_id: id, locale: 'en', title: body.en.title, body_md: body.en.body },
      ],
      { onConflict: 'kb_id,locale' },
    );

    await writeAuditLog({
      actor: req.admin,
      entityType: 'chatbot_kb_items',
      entityId: id,
      action: 'update',
      after: { status: body.status, tags: body.tags },
      ip: clientIp(req),
      userAgent: (req.headers['user-agent'] as string) ?? null,
    });
    return { ok: true };
  }

  @Delete('kb-manual/:id')
  async deleteKbManual(@Param('id') id: string, @Req() req: AdminRequest) {
    const sb = getSupabase();
    const { error } = await sb
      .from('chatbot_kb_items')
      .delete()
      .eq('id', id)
      .eq('source_type', 'manual');
    if (error) return { error: error.message };
    await writeAuditLog({
      actor: req.admin,
      entityType: 'chatbot_kb_items',
      entityId: id,
      action: 'delete',
      ip: clientIp(req),
      userAgent: (req.headers['user-agent'] as string) ?? null,
    });
    return { ok: true };
  }

  // =====================================================================
  // Guide articles
  // =====================================================================
  @Get('guides')
  async listGuides() {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('guide_articles')
      .select(
        'id, slug, cover_image_url, status, published_at, created_at, guide_article_translations(locale, title, summary, body_md)',
      )
      .order('created_at', { ascending: false });
    if (error) return { items: [], error: error.message };
    return { items: data ?? [] };
  }

  @Post('guides')
  async createGuide(@Body() body: GuideUpsertBody, @Req() req: AdminRequest) {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('guide_articles')
      .insert({
        slug: body.slug,
        status: body.status,
        cover_image_url: body.coverImageUrl ?? null,
        published_at: body.publishedAt ?? null,
      })
      .select('id')
      .single();
    if (error || !data) return { error: error?.message ?? 'create_failed' };

    await sb.from('guide_article_translations').insert([
      {
        article_id: data.id,
        locale: 'vi',
        title: body.vi.title,
        summary: body.vi.summary,
        body_md: body.vi.bodyMd,
      },
      {
        article_id: data.id,
        locale: 'en',
        title: body.en.title,
        summary: body.en.summary,
        body_md: body.en.bodyMd,
      },
    ]);

    await writeAuditLog({
      actor: req.admin,
      entityType: 'guide_articles',
      entityId: data.id,
      action: 'create',
      after: { slug: body.slug, status: body.status },
      ip: clientIp(req),
      userAgent: (req.headers['user-agent'] as string) ?? null,
    });
    return { ok: true, id: data.id };
  }

  @Put('guides/:id')
  async updateGuide(
    @Param('id') id: string,
    @Body() body: GuideUpsertBody,
    @Req() req: AdminRequest,
  ) {
    const sb = getSupabase();
    const { error } = await sb
      .from('guide_articles')
      .update({
        slug: body.slug,
        status: body.status,
        cover_image_url: body.coverImageUrl ?? null,
        published_at: body.publishedAt ?? null,
      })
      .eq('id', id);
    if (error) return { error: error.message };

    await sb.from('guide_article_translations').upsert(
      [
        {
          article_id: id,
          locale: 'vi',
          title: body.vi.title,
          summary: body.vi.summary,
          body_md: body.vi.bodyMd,
        },
        {
          article_id: id,
          locale: 'en',
          title: body.en.title,
          summary: body.en.summary,
          body_md: body.en.bodyMd,
        },
      ],
      { onConflict: 'article_id,locale' },
    );

    await writeAuditLog({
      actor: req.admin,
      entityType: 'guide_articles',
      entityId: id,
      action: 'update',
      after: { slug: body.slug, status: body.status },
      ip: clientIp(req),
      userAgent: (req.headers['user-agent'] as string) ?? null,
    });
    return { ok: true };
  }

  @Delete('guides/:id')
  async deleteGuide(@Param('id') id: string, @Req() req: AdminRequest) {
    const sb = getSupabase();
    const { error } = await sb.from('guide_articles').delete().eq('id', id);
    if (error) return { error: error.message };
    await writeAuditLog({
      actor: req.admin,
      entityType: 'guide_articles',
      entityId: id,
      action: 'delete',
      ip: clientIp(req),
      userAgent: (req.headers['user-agent'] as string) ?? null,
    });
    return { ok: true };
  }

  // =====================================================================
  // Badges + rules
  // =====================================================================
  @Get('badges')
  async listBadges() {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('badges')
      .select(
        'id, code, icon_url, is_active, sort_order, badge_translations(locale, name, description), badge_rules(kind, params)',
      )
      .order('sort_order', { ascending: true });
    if (error) return { items: [], error: error.message };
    return { items: data ?? [] };
  }

  @Post('badges')
  async createBadge(@Body() body: BadgeUpsertBody, @Req() req: AdminRequest) {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('badges')
      .insert({
        code: body.code,
        icon_url: body.iconUrl ?? null,
        is_active: body.isActive,
        sort_order: body.sortOrder ?? 0,
      })
      .select('id')
      .single();
    if (error || !data) return { error: error?.message ?? 'create_failed' };

    await sb.from('badge_translations').insert([
      {
        badge_id: data.id,
        locale: 'vi',
        name: body.vi.name,
        description: body.vi.description ?? null,
      },
      {
        badge_id: data.id,
        locale: 'en',
        name: body.en.name,
        description: body.en.description ?? null,
      },
    ]);
    await sb
      .from('badge_rules')
      .insert({ badge_id: data.id, kind: body.rule.kind, params: body.rule.params });

    await writeAuditLog({
      actor: req.admin,
      entityType: 'badges',
      entityId: data.id,
      action: 'create',
      after: { code: body.code, rule: body.rule },
      ip: clientIp(req),
      userAgent: (req.headers['user-agent'] as string) ?? null,
    });
    return { ok: true, id: data.id };
  }

  @Put('badges/:id')
  async updateBadge(
    @Param('id') id: string,
    @Body() body: BadgeUpsertBody,
    @Req() req: AdminRequest,
  ) {
    const sb = getSupabase();
    const { error } = await sb
      .from('badges')
      .update({
        code: body.code,
        icon_url: body.iconUrl ?? null,
        is_active: body.isActive,
        sort_order: body.sortOrder ?? 0,
      })
      .eq('id', id);
    if (error) return { error: error.message };

    await sb.from('badge_translations').upsert(
      [
        {
          badge_id: id,
          locale: 'vi',
          name: body.vi.name,
          description: body.vi.description ?? null,
        },
        {
          badge_id: id,
          locale: 'en',
          name: body.en.name,
          description: body.en.description ?? null,
        },
      ],
      { onConflict: 'badge_id,locale' },
    );
    await sb
      .from('badge_rules')
      .upsert(
        { badge_id: id, kind: body.rule.kind, params: body.rule.params },
        { onConflict: 'badge_id' },
      );

    await writeAuditLog({
      actor: req.admin,
      entityType: 'badges',
      entityId: id,
      action: 'update',
      after: { code: body.code, rule: body.rule },
      ip: clientIp(req),
      userAgent: (req.headers['user-agent'] as string) ?? null,
    });
    return { ok: true };
  }

  @Delete('badges/:id')
  async deleteBadge(@Param('id') id: string, @Req() req: AdminRequest) {
    const sb = getSupabase();
    const { error } = await sb.from('badges').delete().eq('id', id);
    if (error) return { error: error.message };
    await writeAuditLog({
      actor: req.admin,
      entityType: 'badges',
      entityId: id,
      action: 'delete',
      ip: clientIp(req),
      userAgent: (req.headers['user-agent'] as string) ?? null,
    });
    return { ok: true };
  }
}

function clientIp(req: Request): string | null {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string') return xf.split(',')[0]!.trim();
  return req.socket?.remoteAddress ?? null;
}
