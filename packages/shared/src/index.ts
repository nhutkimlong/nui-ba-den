export type Locale = 'vi' | 'en';

export const SUPPORTED_LOCALES: Locale[] = ['vi', 'en'];
export const DEFAULT_LOCALE: Locale = 'vi';

export type ReportStatus =
  | 'new'
  | 'triaged'
  | 'in_progress'
  | 'resolved'
  | 'rejected'
  | 'needs_more_info';

export type ReportCategory = 'service' | 'security_order' | 'environment' | 'other';

export const MVP_DEFAULTS = {
  gpsRadiusMeters: 150,
  repeatCheckinWindowMinutes: 60,
  darkModeEnabled: false,
} as const;

export interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
}

export interface PoiSummary {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  category: string;
  imageUrl?: string;
}

export interface HomePayload {
  locale: Locale;
  banners: BannerItem[];
  alerts: string[];
  featuredPois: PoiSummary[];
}
