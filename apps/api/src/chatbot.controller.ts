import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common';
import { DEFAULT_LOCALE, type Locale } from '@nui-ba-den/shared';
import { askLlm, readLlmConfig } from './chatbot-llm';
import { getSupabase } from './supabase';

interface AskBody {
  question: string;
  context?: string;
}

interface FeedbackBody {
  messageId: string;
  feedback: 'helpful' | 'unhelpful';
}

@Controller('chatbot')
export class ChatbotController {
  private readonly logger = new Logger(ChatbotController.name);

  @Get('suggestions')
  async suggestions(@Query('locale') localeParam?: Locale) {
    const locale = pickLocale(localeParam);
    const sb = getSupabase();
    const { data } = await sb
      .from('faq_items')
      .select('id, faq_item_translations!inner(locale, question)')
      .eq('status', 'published')
      .eq('faq_item_translations.locale', locale)
      .order('sort_order', { ascending: true })
      .limit(4);

    return {
      items: (data ?? []).map((f: any) => ({
        id: f.id,
        question: f.faq_item_translations?.[0]?.question ?? '',
      })),
    };
  }

  @Post('ask')
  async ask(@Body() body: AskBody, @Query('locale') localeParam?: Locale) {
    const locale = pickLocale(localeParam);
    const fallback =
      locale === 'vi'
        ? 'Hiện chưa có câu trả lời chính thức. Bạn vui lòng thử FAQ hoặc gọi hotline.'
        : 'No official answer yet. Please try FAQ or contact the hotline.';

    if (!body.question?.trim()) {
      return { answer: fallback, sources: [] };
    }

    const kbContext = await loadKbContext(locale, body.context, body.question);
    const config = readLlmConfig();

    if (config) {
      try {
        const result = await askLlm(config, {
          question: body.question.trim(),
          locale,
          kbContext,
        });
        return result;
      } catch (err) {
        this.logger.warn(`LLM call failed, falling back to KB match: ${(err as Error).message}`);
      }
    }

    return faqFallback(body.question, kbContext, fallback);
  }

  @Post('feedback')
  async feedback(@Body() body: FeedbackBody) {
    const sb = getSupabase();
    await sb.from('chatbot_feedback').insert({
      message_id: body.messageId,
      value: body.feedback,
    });
    return { ok: true };
  }
}

function pickLocale(value?: string): Locale {
  if (value === 'vi' || value === 'en') return value;
  return DEFAULT_LOCALE;
}

async function loadKbContext(locale: Locale, context?: string, question?: string) {
  const sb = getSupabase();
  const items: { id: string; title: string; body: string }[] = [];

  // POI context: prepend the targeted POI long description.
  const poiSlug = context?.startsWith('poi:') ? context.slice(4) : null;
  if (poiSlug) {
    const { data } = await sb
      .from('poi')
      .select('id, poi_translations!inner(locale, title, long_description)')
      .eq('slug', poiSlug)
      .eq('status', 'published')
      .eq('poi_translations.locale', locale)
      .maybeSingle();
    if (data) {
      const t = (data as any).poi_translations?.[0];
      if (t) items.push({ id: (data as any).id, title: `POI: ${t.title}`, body: t.long_description ?? '' });
    }
  }

  // Pull published KB items, in target locale.
  const { data: kb } = await sb
    .from('chatbot_kb_items')
    .select('id, chatbot_kb_translations!inner(locale, title, body_md)')
    .eq('status', 'published')
    .eq('chatbot_kb_translations.locale', locale)
    .limit(50);

  const allKb: { id: string; title: string; body: string }[] = [];
  for (const k of kb ?? []) {
    const t = (k as any).chatbot_kb_translations?.[0];
    if (t) allKb.push({ id: (k as any).id, title: t.title, body: t.body_md });
  }

  // Lightweight keyword scoring so the LLM gets the most relevant 8 items
  // first. We keep all when there is no question.
  const ranked = question ? rankByKeywords(allKb, question) : allKb;
  items.push(...ranked.slice(0, 8));

  return items;
}

const STOPWORDS = new Set([
  'là', 'và', 'của', 'có', 'cho', 'với', 'thì', 'mà', 'này', 'gì', 'nào', 'không', 'được', 'như',
  'the', 'and', 'of', 'is', 'a', 'an', 'to', 'in', 'on', 'for', 'with', 'how', 'what', 'when', 'where',
]);

function rankByKeywords(
  kb: { id: string; title: string; body: string }[],
  question: string,
): { id: string; title: string; body: string }[] {
  const tokens = question
    .toLowerCase()
    .normalize('NFC')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
  if (!tokens.length) return kb;
  return kb
    .map((item) => {
      const hay = (item.title + '\n' + item.body).toLowerCase();
      let score = 0;
      for (const tok of tokens) {
        if (hay.includes(tok)) score += hay.includes(' ' + tok + ' ') ? 3 : 1;
      }
      return { item, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item)
    .concat(kb)
    .filter((it, i, arr) => arr.findIndex((x) => x.id === it.id) === i);
}

function faqFallback(
  question: string,
  kbContext: { id: string; title: string; body: string }[],
  fallback: string,
) {
  const q = question.toLowerCase().slice(0, 6);
  const matched = kbContext.find((k) => k.title.toLowerCase().includes(q));
  if (matched) return { answer: matched.body, sources: [matched.id] };
  return { answer: fallback, sources: [] };
}
