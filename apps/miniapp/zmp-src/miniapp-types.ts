export type Tab = 'home' | 'explore' | 'report' | 'support';
export type SupportView = 'menu' | 'chat' | 'checkin' | 'guides' | 'profile';

export type Poi = {
  id: string;
  slug: string;
  title: string;
  category: string;
  shortDescription?: string;
  longDescription?: string;
  qrCodeValue?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
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

export type GuideItem = { id: string; slug?: string; title: string; summary?: string; coverImageUrl?: string };
export type GuideDetail = GuideItem & { content?: string };
