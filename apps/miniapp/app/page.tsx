'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { HomePayload } from '@nui-ba-den/shared';
import { AppHeader } from '../components/app-header';
import { useLocale } from '../lib/locale';
import { apiGet } from '../lib/api';
import { useSiteSettings, pickLocalized } from '../lib/site-settings';
import {
  CompassIcon,
  MegaphoneIcon,
  MessageIcon,
  MapPinIcon,
  BellIcon,
  ChevronRightIcon,
} from '../components/icons';

const shortcuts = [
  { href: '/explore', Icon: CompassIcon, key: 'home.shortcut.explore' },
  { href: '/report', Icon: MegaphoneIcon, key: 'home.shortcut.report' },
  { href: '/support/chat', Icon: MessageIcon, key: 'home.shortcut.chat' },
  { href: '/support/checkin', Icon: MapPinIcon, key: 'home.shortcut.checkin' },
] as const;

const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1570366583862-f91883984fde?auto=format&fit=crop&w=1200&q=70';

export default function HomePage() {
  const { locale, t } = useLocale();
  const { settings } = useSiteSettings();
  const [payload, setPayload] = useState<HomePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setError(null);
    setPayload(null);
    apiGet<HomePayload>('/content/home', locale)
      .then((data) => alive && setPayload(data))
      .catch((err: Error) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [locale]);

  const brandName =
    pickLocalized(settings.brand, 'name', locale) ?? t('app.brand');
  const heroImage =
    settings.hero?.image_url || payload?.banners?.[0]?.imageUrl || HERO_FALLBACK;
  const heroTitle =
    pickLocalized(settings.hero, 'title', locale) ??
    payload?.banners?.[0]?.title ??
    brandName;
  const heroSubtitle =
    pickLocalized(settings.hero, 'subtitle', locale) ??
    payload?.banners?.[0]?.subtitle ??
    '';
  const eyebrow = pickLocalized(settings.brand, 'tagline', locale);

  return (
    <>
      <AppHeader title={brandName} />
      <section className="hero">
        <img
          className="hero-image"
          src={typeof heroImage === 'string' ? heroImage : HERO_FALLBACK}
          alt=""
          aria-hidden
        />
        <div className="hero-overlay">
          {eyebrow && <span className="hero-eyebrow">{eyebrow}</span>}
          <h2 className="hero-title">{heroTitle}</h2>
          {heroSubtitle && <p className="hero-sub">{heroSubtitle}</p>}
        </div>
      </section>
      <section className="section">
        <div className="shortcut-grid">
          {shortcuts.map((s) => {
            const Icon = s.Icon;
            return (
              <Link key={s.href} href={s.href} className="shortcut">
                <span className="shortcut-icon" aria-hidden>
                  <Icon size={20} />
                </span>
                <span>{t(s.key)}</span>
              </Link>
            );
          })}
        </div>
      </section>
      {error && (
        <div className="alert">
          <BellIcon size={18} />
          <span>{t('common.error')}</span>
        </div>
      )}
      {!payload && !error && <div className="empty">{t('common.loading')}</div>}
      {payload && payload.alerts.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h3 className="section-title">{t('home.alerts')}</h3>
          </div>
          {payload.alerts.map((a, i) => (
            <div key={i} className="alert">
              <BellIcon size={18} />
              <span>{a}</span>
            </div>
          ))}
        </section>
      )}
      {payload && payload.featuredPois.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h3 className="section-title">{t('home.featured')}</h3>
            <Link href="/explore" className="section-link">
              {t('common.viewAll')}
            </Link>
          </div>
          {payload.featuredPois.map((poi) => (
            <Link key={poi.id} href={`/explore/${poi.slug}`} className="poi-card">
              <div className="poi-media">
                {poi.imageUrl && <img src={poi.imageUrl} alt={poi.title} loading="lazy" />}
              </div>
              <div className="poi-body">
                <span className="poi-tag">{poi.category}</span>
                <span className="poi-title">{poi.title}</span>
                <span className="poi-desc">{poi.shortDescription}</span>
              </div>
            </Link>
          ))}
        </section>
      )}
    </>
  );
}
