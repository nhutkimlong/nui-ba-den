export type Tab = 'home' | 'explore' | 'report' | 'support';
export type SupportView = 'menu' | 'chat' | 'checkin' | 'guides' | 'profile';
export type SupportParams = { poiSlug?: string; qrValue?: string; chatContext?: string };

export type Poi = {
  id: string;
  slug: string;
  title: string;
  category: string;
  shortDescription?: string;
  longDescription?: string;
  qrCodeValue?: string;
  latitude?: number | null;
  longitude?: number | null;
  imageUrl?: string | null;
};

export type HomePayload = {
  alerts?: string[];
  featuredPois?: Poi[];
  banners?: { title?: string; subtitle?: string; imageUrl?: string }[];
};

export type ExplorePayload = {
  pois?: Poi[];
  categories?: { id: string; label: string }[];
};

export type ReportItem = {
  id: string;
  code: string;
  category: string;
  status: string;
  createdAt: string;
};

export type ReportDetail = ReportItem & {
  description?: string;
  location?: string;
  timeline?: { at: string; status: string; note?: string }[];
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'bot';
  content: string;
  feedback?: 'helpful' | 'unhelpful';
};

export type GuideItem = { id: string; slug?: string; title: string; summary?: string; coverImageUrl?: string | null };
export type GuideDetail = GuideItem & { bodyMd?: string; content?: string; publishedAt?: string | null; error?: string };

export type AppUser = {
  id: string;
  display_name?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  avatar?: string | null;
  preferred_locale?: 'vi' | 'en';
  zalo_user_id?: string | null;
};

export type ProfilePayload = {
  user?: AppUser | null;
  stats?: { checkins?: number; reports?: number; badges?: number };
  badges?: { id: string; name: string; achieved?: boolean }[];
  recentCheckins?: { id: string; poiTitle: string; at: string }[];
};

export type CheckinResult = { ok: boolean; message: string; badge?: string };
