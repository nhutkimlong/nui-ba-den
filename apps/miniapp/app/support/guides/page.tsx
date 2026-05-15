'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppHeader } from '../../../components/app-header';
import { useLocale } from '../../../lib/locale';
import { apiGet } from '../../../lib/api';
import { ChevronRightIcon } from '../../../components/icons';

interface GuideItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverImageUrl?: string | null;
  publishedAt?: string | null;
}

export default function GuidesPage() {
  const { locale, t } = useLocale();
  const [items, setItems] = useState<GuideItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiGet<{ items: GuideItem[] }>('/content/guides', locale)
      .then((d) => alive && setItems(d.items ?? []))
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [locale]);

  return (
    <>
      <AppHeader title={t('guides.title')} />
      <section className="section">
        {loading ? (
          <div className="empty">{t('common.loading')}</div>
        ) : items.length === 0 ? (
          <div className="empty">{t('guides.empty')}</div>
        ) : (
          items.map((g) => (
            <Link key={g.id} href={`/support/guides/${g.slug}`} className="list-row">
              {g.coverImageUrl ? (
                <span
                  aria-hidden
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: `url(${g.coverImageUrl}) center/cover`,
                    flexShrink: 0,
                  }}
                />
              ) : (
                <span className="list-row-icon" aria-hidden />
              )}
              <div className="list-row-body">
                <div className="list-row-title">{g.title}</div>
                {g.summary && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      marginTop: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {g.summary}
                  </div>
                )}
              </div>
              <span className="list-row-cta" aria-hidden>
                <ChevronRightIcon size={18} />
              </span>
            </Link>
          ))
        )}
      </section>
    </>
  );
}
