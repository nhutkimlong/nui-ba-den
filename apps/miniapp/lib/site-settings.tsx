'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { apiGet } from './api';
import { useLocale } from './locale';
import { applyNavBarColor } from './zmp';

export interface BrandSettings {
  name_vi?: string;
  name_en?: string;
  tagline_vi?: string;
  tagline_en?: string;
  logo_url?: string | null;
  primary_color?: string;
}
export interface HeroSettings {
  image_url?: string | null;
  title_vi?: string;
  title_en?: string;
  subtitle_vi?: string;
  subtitle_en?: string;
}
export interface ContactSettings {
  hotline?: string;
  email?: string;
  address_vi?: string;
  address_en?: string;
}
export interface SiteSettings {
  brand?: BrandSettings;
  hero?: HeroSettings;
  contact?: ContactSettings;
  [k: string]: any;
}

interface Ctx {
  settings: SiteSettings;
  loading: boolean;
}

const SiteSettingsContext = createContext<Ctx>({ settings: {}, loading: true });

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    apiGet<{ settings: SiteSettings }>('/content/site-settings', locale)
      .then((data) => {
        if (alive) setSettings(data.settings ?? {});
      })
      .catch(() => {
        // miniapp boots with empty settings if API down — components must handle.
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [locale]);

  // Apply brand primary color as CSS variable so existing components pick it up.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const c = settings.brand?.primary_color;
    if (c) {
      document.documentElement.style.setProperty('--primary', c);
      // Also paint the Zalo native nav bar inside the mini app shell.
      applyNavBarColor(c);
    }
  }, [settings.brand?.primary_color]);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

export function pickLocalized(
  obj: Record<string, any> | undefined,
  base: string,
  locale: 'vi' | 'en',
): string | undefined {
  if (!obj) return undefined;
  return obj[`${base}_${locale}`] ?? obj[`${base}_vi`];
}
