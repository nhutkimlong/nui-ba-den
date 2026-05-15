'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppHeader } from '../../../components/app-header';
import { useLocale } from '../../../lib/locale';
import { apiGet } from '../../../lib/api';
import { MapPinIcon, MessageIcon } from '../../../components/icons';

interface PoiDetail {
  id: string;
  slug: string;
  title: string;
  longDescription: string;
  category: string;
  qrCodeValue: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
}

const FALLBACK: Record<string, string> = {
  'ba-den-peak':
    'https://images.unsplash.com/photo-1604275689235-fdc4202c1c1d?auto=format&fit=crop&w=1400&q=80',
  'linh-son-pagoda':
    'https://images.unsplash.com/photo-1545569310-e6e1cc89bb6f?auto=format&fit=crop&w=1400&q=80',
  'cable-car-station':
    'https://images.unsplash.com/photo-1496564203457-11bb12075d90?auto=format&fit=crop&w=1400&q=80',
};

export default function PoiDetailPage() {
  const params = useParams<{ slug: string }>();
  const { locale, t } = useLocale();
  const [poi, setPoi] = useState<PoiDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!params?.slug) return;
    setPoi(null);
    setNotFound(false);
    apiGet<PoiDetail>(`/content/poi/${params.slug}`, locale)
      .then((data) => {
        if (!alive) return;
        if ((data as any).error) setNotFound(true);
        else setPoi(data);
      })
      .catch(() => {
        if (alive) setNotFound(true);
      });
    return () => {
      alive = false;
    };
  }, [params?.slug, locale]);

  if (notFound) {
    return (
      <>
        <AppHeader title={t('tab.explore')} showBack />
        <div className="empty">{t('common.empty')}</div>
      </>
    );
  }

  if (!poi) {
    return (
      <>
        <AppHeader title={t('tab.explore')} showBack />
        <div className="empty">{t('common.loading')}</div>
      </>
    );
  }

  const imgSrc = poi.imageUrl || FALLBACK[poi.slug] || FALLBACK['ba-den-peak'];

  return (
    <>
      <AppHeader title={poi.title} showBack />
      <div className="poi-card" style={{ marginBottom: 16 }}>
        <div className="poi-media" style={{ aspectRatio: '4/3' }}>
          <img src={imgSrc} alt={poi.title} />
        </div>
        <div className="poi-body">
          <span className="poi-tag">{poi.category}</span>
          <h2 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700 }}>{poi.title}</h2>
          <p className="poi-desc" style={{ marginTop: 6 }}>{poi.longDescription}</p>
          <p className="poi-desc" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <MapPinIcon size={14} />
            <span>{poi.latitude.toFixed(4)}, {poi.longitude.toFixed(4)}</span>
          </p>
        </div>
      </div>
      <Link href={`/support/checkin?poi=${poi.slug}`} className="btn">
        <MapPinIcon size={18} />
        <span>{t('explore.cta.checkin')}</span>
      </Link>
      <div style={{ height: 10 }} />
      <Link href={`/support/chat?context=poi:${poi.slug}`} className="btn btn-secondary">
        <MessageIcon size={18} />
        <span>{t('explore.cta.ask')}</span>
      </Link>
    </>
  );
}
