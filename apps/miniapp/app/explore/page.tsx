'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '../../components/app-header';
import { useLocale } from '../../lib/locale';
import { apiGet } from '../../lib/api';
import type { PoiSummary } from '@nui-ba-den/shared';

interface ExplorePayload {
  pois: (PoiSummary & { imageUrl?: string })[];
  categories: { id: string; label: string }[];
}

const POI_FALLBACK: Record<string, string> = {
  'ba-den-peak':
    'https://images.unsplash.com/photo-1604275689235-fdc4202c1c1d?auto=format&fit=crop&w=1000&q=70',
  'linh-son-pagoda':
    'https://images.unsplash.com/photo-1545569310-e6e1cc89bb6f?auto=format&fit=crop&w=1000&q=70',
  'cable-car-station':
    'https://images.unsplash.com/photo-1496564203457-11bb12075d90?auto=format&fit=crop&w=1000&q=70',
};

function poiImage(poi: { slug: string; imageUrl?: string }) {
  return poi.imageUrl || POI_FALLBACK[poi.slug] || POI_FALLBACK['ba-den-peak'];
}

export default function ExplorePage() {
  const { locale, t } = useLocale();
  const [payload, setPayload] = useState<ExplorePayload | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setError(null);
    setPayload(null);
    apiGet<ExplorePayload>('/content/explore', locale)
      .then((data) => {
        if (alive) setPayload(data);
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      });
    return () => {
      alive = false;
    };
  }, [locale]);

  const filtered =
    payload?.pois.filter((p) => (active ? p.category === active : true)) ?? [];

  return (
    <>
      <AppHeader title={t('tab.explore')} />
      {payload && (
        <section className="section">
          <div className="chip-row">
            <button
              className={`chip ${active === null ? 'chip-active' : ''}`}
              onClick={() => setActive(null)}
            >
              {locale === 'vi' ? 'Tất cả' : 'All'}
            </button>
            {payload.categories.map((c) => (
              <button
                key={c.id}
                className={`chip ${active === c.id ? 'chip-active' : ''}`}
                onClick={() => setActive(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>
      )}
      {error && <div className="empty">{t('common.error')}</div>}
      {!payload && !error && <div className="empty">{t('common.loading')}</div>}
      {payload && filtered.length === 0 && <div className="empty">{t('common.empty')}</div>}
      {filtered.map((poi) => (
        <Link key={poi.id} href={`/explore/${poi.slug}`} className="poi-card">
          <div className="poi-media">
            <img src={poiImage(poi)} alt={poi.title} loading="lazy" />
          </div>
          <div className="poi-body">
            <span className="poi-tag">{poi.category}</span>
            <span className="poi-title">{poi.title}</span>
            <span className="poi-desc">{poi.shortDescription}</span>
          </div>
        </Link>
      ))}
    </>
  );
}
