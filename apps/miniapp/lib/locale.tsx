'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LOCALE, type Locale, SUPPORTED_LOCALES } from '@nui-ba-den/shared';

type Dict = Record<string, { vi: string; en: string }>;

const dict: Dict = {
  'app.brand': { vi: 'Núi Bà Đen', en: 'Ba Den Mountain' },
  'tab.home': { vi: 'Trang chủ', en: 'Home' },
  'tab.explore': { vi: 'Khám phá', en: 'Explore' },
  'tab.report': { vi: 'Phản ánh', en: 'Report' },
  'tab.support': { vi: 'Hỗ trợ', en: 'Support' },
  'common.loading': { vi: 'Đang tải...', en: 'Loading...' },
  'common.error': { vi: 'Có lỗi xảy ra', en: 'Something went wrong' },
  'common.retry': { vi: 'Thử lại', en: 'Retry' },
  'common.empty': { vi: 'Chưa có dữ liệu', en: 'No data yet' },
  'common.send': { vi: 'Gửi', en: 'Send' },
  'common.cancel': { vi: 'Hủy', en: 'Cancel' },
  'common.back': { vi: 'Quay lại', en: 'Back' },
  'common.viewAll': { vi: 'Xem tất cả', en: 'View all' },
  'common.call': { vi: 'Gọi', en: 'Call' },
  'home.alerts': { vi: 'Lưu ý hôm nay', en: "Today's alerts" },
  'home.featured': { vi: 'Điểm nổi bật', en: 'Featured' },
  'home.shortcut.explore': { vi: 'Khám phá', en: 'Explore' },
  'home.shortcut.report': { vi: 'Phản ánh', en: 'Report' },
  'home.shortcut.chat': { vi: 'Chatbot', en: 'Chatbot' },
  'home.shortcut.checkin': { vi: 'Check-in', en: 'Check-in' },
  'explore.title': { vi: 'Khám phá điểm đến', en: 'Discover POIs' },
  'explore.cta.checkin': { vi: 'Check-in tại đây', en: 'Check in here' },
  'explore.cta.ask': { vi: 'Hỏi về điểm này', en: 'Ask about this POI' },
  'report.title': { vi: 'Gửi phản ánh', en: 'Send a report' },
  'report.history': { vi: 'Lịch sử phản ánh', en: 'Report history' },
  'report.category': { vi: 'Loại phản ánh', en: 'Report category' },
  'report.description': { vi: 'Mô tả ngắn', en: 'Short description' },
  'report.location': { vi: 'Vị trí liên quan', en: 'Related location' },
  'report.submit': { vi: 'Gửi phản ánh', en: 'Submit report' },
  'report.submitted': { vi: 'Đã gửi phản ánh', en: 'Report submitted' },
  'report.code': { vi: 'Mã phản ánh', en: 'Report code' },
  'report.status': { vi: 'Trạng thái', en: 'Status' },
  'report.cat.service': { vi: 'Dịch vụ', en: 'Service' },
  'report.cat.security_order': { vi: 'An ninh trật tự', en: 'Security & order' },
  'report.cat.environment': { vi: 'Môi trường', en: 'Environment' },
  'report.cat.other': { vi: 'Khác', en: 'Other' },
  'status.new': { vi: 'Mới tiếp nhận', en: 'New' },
  'status.triaged': { vi: 'Đã phân loại', en: 'Triaged' },
  'status.in_progress': { vi: 'Đang xử lý', en: 'In progress' },
  'status.resolved': { vi: 'Đã xử lý', en: 'Resolved' },
  'status.rejected': { vi: 'Từ chối', en: 'Rejected' },
  'status.needs_more_info': { vi: 'Cần bổ sung', en: 'Needs more info' },
  'support.title': { vi: 'Trung tâm hỗ trợ', en: 'Support center' },
  'support.hotline': { vi: 'Hotline khẩn', en: 'Emergency hotline' },
  'support.faq': { vi: 'Câu hỏi thường gặp', en: 'Frequently asked' },
  'support.guides': { vi: 'Cẩm nang du lịch', en: 'Travel guides' },
  'support.chatbot': { vi: 'Chatbot du lịch', en: 'Tourism chatbot' },
  'support.profile': { vi: 'Hồ sơ của bạn', en: 'Your profile' },
  'support.badges': { vi: 'Danh hiệu', en: 'Badges' },
  'support.checkins': { vi: 'Check-in', en: 'Check-ins' },
  'guides.title': { vi: 'Cẩm nang du lịch', en: 'Travel guides' },
  'guides.empty': { vi: 'Chưa có cẩm nang nào', en: 'No guides yet' },
  'report.attach': { vi: 'Đính kèm ảnh', en: 'Attach photos' },
  'report.attaching': { vi: 'Đang tải ảnh lên...', en: 'Uploading photos...' },
  'report.attach_done': { vi: 'Đã tải ảnh kèm theo', en: 'Attachments uploaded' },
  'report.attach_fail': { vi: 'Không tải được ảnh', en: 'Could not upload photos' },
  'chat.placeholder': { vi: 'Nhập câu hỏi...', en: 'Type a question...' },
  'chat.helpful': { vi: 'Hữu ích', en: 'Helpful' },
  'chat.unhelpful': { vi: 'Chưa hữu ích', en: 'Not helpful' },
  'chat.fallback': {
    vi: 'Xin lỗi, chưa có dữ liệu chính thức. Vui lòng thử FAQ hoặc hotline.',
    en: 'Sorry, no official data yet. Please try FAQ or hotline.',
  },
  'checkin.title': { vi: 'Check-in tại điểm', en: 'Check in at POI' },
  'checkin.scan': { vi: 'Mã QR tại điểm', en: 'POI QR code' },
  'checkin.success': { vi: 'Check-in thành công', en: 'Check-in success' },
  'checkin.fail': { vi: 'Check-in thất bại', en: 'Check-in failed' },
  'profile.signedAs': { vi: 'Đăng nhập bằng Zalo', en: 'Signed in via Zalo' },
  'profile.history': { vi: 'Lịch sử check-in', en: 'Check-in history' },
};

interface LocaleContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: keyof typeof dict) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('locale');
    if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) setLocale(stored as Locale);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: (next) => {
        setLocale(next);
        try {
          window.localStorage.setItem('locale', next);
        } catch {}
      },
      t: (key) => dict[key]?.[locale] ?? dict[key]?.vi ?? key,
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
