'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppHeader } from '../../../../components/app-header';
import { useLocale } from '../../../../lib/locale';
import { apiGet } from '../../../../lib/api';

interface GuideDetail {
  id: string;
  slug: string;
  title: string;
  summary: string;
  bodyMd: string;
  coverImageUrl?: string | null;
  publishedAt?: string | null;
  error?: string;
}

function renderMarkdown(md: string): string {
  if (!md) return '';
  return md
    .split(/\n{2,}/)
    .map((para) => {
      const trimmed = para.trim();
      if (/^#{1,6}\s/.test(trimmed)) {
        const level = trimmed.match(/^#+/)?.[0].length ?? 1;
        const text = trimmed.replace(/^#+\s*/, '');
        return `<h${Math.min(level, 4)}>${escapeHtml(text)}</h${Math.min(level, 4)}>`;
      }
      if (/^[-*]\s/.test(trimmed)) {
        const items = trimmed
          .split(/\n/)
          .map((l) => l.replace(/^[-*]\s*/, ''))
          .map((l) => `<li>${escapeHtml(l)}</li>`)
          .join('');
        return `<ul>${items}</ul>`;
      }
      return `<p>${escapeHtml(trimmed).replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  );
}

export default function GuideDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const { locale, t } = useLocale();
  const [data, setData] = useState<GuideDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    setLoading(true);
    apiGet<GuideDetail>(`/content/guides/${slug}`, locale)
      .then((d) => alive && setData(d))
      .catch(() => alive && setData({ error: 'not_found' } as GuideDetail))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug, locale]);

  if (loading) {
    return (
      <>
        <AppHeader title="..." showBack />
        <div className="empty">{t('common.loading')}</div>
      </>
    );
  }
  if (!data || data.error) {
    return (
      <>
        <AppHeader title={t('common.error')} showBack />
        <div className="empty">{t('common.empty')}</div>
      </>
    );
  }

  return (
    <>
      <AppHeader title={data.title} showBack />
      {data.coverImageUrl && (
        <div
          style={{
            width: '100%',
            aspectRatio: '16 / 9',
            background: `url(${data.coverImageUrl}) center/cover`,
          }}
        />
      )}
      <article className="section" style={{ lineHeight: 1.6, fontSize: 14 }}>
        {data.summary && (
          <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>{data.summary}</p>
        )}
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(data.bodyMd) }} />
      </article>
    </>
  );
}
