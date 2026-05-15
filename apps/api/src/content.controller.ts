import { Controller, Get, Param, Query } from '@nestjs/common';
import { DEFAULT_LOCALE, type Locale, type HomePayload, type PoiSummary } from '@nui-ba-den/shared';
import { getSupabase } from './supabase';

@Controller('content')
export class ContentController {
  @Get('site-settings')
  async getSiteSettings() {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('site_settings')
      .select('key, value')
      .order('key');
    if (error) return { settings: {} };
    const settings: Record<string, any> = {};
    for (const row of data ?? []) settings[row.key] = row.value;
    return { settings };
  }

  @Get('guides')
  async listGuides(@Query('locale') localeParam?: Locale) {
    const locale = pickLocale(localeParam);
    const sb = getSupabase();
    const { data, error } = await sb
      .from('guide_articles')
      .select(
        'id, slug, cover_image_url, published_at, guide_article_translations!inner(locale, title, summary)',
      )
      .eq('status', 'published')
      .eq('guide_article_translations.locale', locale)
      .order('published_at', { ascending: false, nullsFirst: false });
    if (error) return { items: [] };
    return {
      items: (data ?? []).map((g: any) => ({
        id: g.id,
        slug: g.slug,
        coverImageUrl: g.cover_image_url,
        publishedAt: g.published_at,
        title: g.guide_article_translations?.[0]?.title ?? '',
        summary: g.guide_article_translations?.[0]?.summary ?? '',
      })),
    };
  }

  @Get('guides/:slug')
  async getGuide(@Param('slug') slug: string, @Query('locale') localeParam?: Locale) {
    const locale = pickLocale(localeParam);
    const sb = getSupabase();
    const { data, error } = await sb
      .from('guide_articles')
      .select(
        'id, slug, cover_image_url, published_at, guide_article_translations!inner(locale, title, summary, body_md)',
      )
      .eq('slug', slug)
      .eq('status', 'published')
      .eq('guide_article_translations.locale', locale)
      .maybeSingle();
    if (error || !data) return { error: 'not_found' };
    const t = (data as any).guide_article_translations?.[0];
    return {
      id: (data as any).id,
      slug: (data as any).slug,
      coverImageUrl: (data as any).cover_image_url,
      publishedAt: (data as any).published_at,
      title: t?.title ?? '',
      summary: t?.summary ?? '',
      bodyMd: t?.body_md ?? '',
    };
  }

  @Get('home')
  async getHome(@Query('locale') localeParam?: Locale): Promise<HomePayload> {
    const locale = pickLocale(localeParam);
    const sb = getSupabase();

    const [bannersRes, alertsRes, poisRes] = await Promise.all([
      sb
        .from('banners')
        .select('id, image_url, banner_translations!inner(locale, title, subtitle)')
        .eq('is_active', true)
        .eq('banner_translations.locale', locale)
        .order('sort_order', { ascending: true })
        .limit(5),
      sb
        .from('alerts')
        .select('id, alert_translations!inner(locale, title)')
        .eq('is_active', true)
        .eq('alert_translations.locale', locale)
        .limit(5),
      sb
        .from('poi')
        .select(
          'id, slug, poi_translations!inner(locale, title, short_description), poi_categories(code, poi_category_translations(locale, name)), poi_media(url, sort_order)',
        )
        .eq('status', 'published')
        .eq('poi_translations.locale', locale)
        .order('sort_order', { ascending: true })
        .limit(2),
    ]);

    return {
      locale,
      banners: (bannersRes.data ?? []).map((b: any) => ({
        id: b.id,
        title: b.banner_translations?.[0]?.title ?? '',
        subtitle: b.banner_translations?.[0]?.subtitle ?? '',
        imageUrl: b.image_url ?? undefined,
      })),
      alerts: (alertsRes.data ?? []).map((a: any) => a.alert_translations?.[0]?.title ?? ''),
      featuredPois: (poisRes.data ?? []).map((p: any) => mapPoiSummary(p, locale)),
    };
  }

  @Get('explore')
  async getExplore(@Query('locale') localeParam?: Locale) {
    const locale = pickLocale(localeParam);
    const sb = getSupabase();

    const [poisRes, catsRes] = await Promise.all([
      sb
        .from('poi')
        .select(
          'id, slug, poi_translations!inner(locale, title, short_description), poi_categories(code, poi_category_translations(locale, name)), poi_media(url, sort_order)',
        )
        .eq('status', 'published')
        .eq('poi_translations.locale', locale)
        .order('sort_order', { ascending: true }),
      sb
        .from('poi_categories')
        .select('code, poi_category_translations!inner(locale, name)')
        .eq('is_active', true)
        .eq('poi_category_translations.locale', locale)
        .order('sort_order', { ascending: true }),
    ]);

    return {
      pois: (poisRes.data ?? []).map((p: any) => mapPoiSummary(p, locale)),
      categories: (catsRes.data ?? []).map((c: any) => ({
        id: c.code,
        label: c.poi_category_translations?.[0]?.name ?? c.code,
      })),
    };
  }

  @Get('poi/:slug')
  async getPoi(@Param('slug') slug: string, @Query('locale') localeParam?: Locale) {
    const locale = pickLocale(localeParam);
    const sb = getSupabase();

    const { data, error } = await sb
      .from('poi')
      .select(
        'id, slug, latitude, longitude, poi_translations!inner(locale, title, long_description), poi_categories(code, poi_category_translations(locale, name)), poi_media(url, sort_order)',
      )
      .eq('slug', slug)
      .eq('status', 'published')
      .eq('poi_translations.locale', locale)
      .maybeSingle();

    if (error || !data) return { error: 'not_found' };

    const p: any = data;
    const cat = p.poi_categories?.poi_category_translations?.find(
      (t: any) => t.locale === locale,
    );

    return {
      id: p.id,
      slug: p.slug,
      title: p.poi_translations?.[0]?.title ?? '',
      longDescription: p.poi_translations?.[0]?.long_description ?? '',
      category: cat?.name ?? p.poi_categories?.code ?? '',
      latitude: p.latitude,
      longitude: p.longitude,
      imageUrl: pickPoiImage(p.poi_media),
    };
  }
}

function pickLocale(value?: string): Locale {
  if (value === 'vi' || value === 'en') return value;
  return DEFAULT_LOCALE;
}

function mapPoiSummary(p: any, locale: Locale): PoiSummary {
  const cat = p.poi_categories?.poi_category_translations?.find((t: any) => t.locale === locale);
  return {
    id: p.id,
    slug: p.slug,
    title: p.poi_translations?.[0]?.title ?? '',
    shortDescription: p.poi_translations?.[0]?.short_description ?? '',
    category: cat?.name ?? p.poi_categories?.code ?? '',
    imageUrl: pickPoiImage(p.poi_media),
  };
}

function pickPoiImage(media: any[] | null | undefined): string | undefined {
  if (!media?.length) return undefined;
  const sorted = [...media].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return sorted[0]?.url;
}
