'use client';

import Link from 'next/link';
import { AppHeader } from '../../components/app-header';
import { useLocale } from '../../lib/locale';
import { useSiteSettings } from '../../lib/site-settings';
import {
  MessageIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  HelpIcon,
  ChevronRightIcon,
} from '../../components/icons';

const items = [
  { href: '/support/chat', Icon: MessageIcon, key: 'support.chatbot' },
  { href: '/support/checkin', Icon: MapPinIcon, key: 'home.shortcut.checkin' },
  { href: '/support/guides', Icon: HelpIcon, key: 'support.guides' },
  { href: '/support/profile', Icon: UserIcon, key: 'support.profile' },
] as const;

export default function SupportPage() {
  const { t, locale } = useLocale();
  const { settings } = useSiteSettings();
  const hotline = settings.contact?.hotline?.trim() || '0276 3900 000';
  const telHref = `tel:${hotline.replace(/\s+/g, '')}`;
  return (
    <>
      <AppHeader title={t('support.title')} />
      <section className="section">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="list-row-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <PhoneIcon size={22} />
          </span>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: 14 }}>{t('support.hotline')}</strong>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{hotline}</div>
          </div>
          <a
            className="btn-secondary"
            style={{ padding: '8px 14px', borderRadius: 12, fontWeight: 600, fontSize: 13 }}
            href={telHref}
          >
            {t('common.call')}
          </a>
        </div>
      </section>
      <section className="section">
        <div className="section-header">
          <h3 className="section-title">{t('tab.support')}</h3>
        </div>
        {items.map((it) => {
          const Icon = it.Icon;
          return (
            <Link key={it.href} href={it.href} className="list-row">
              <span className="list-row-icon" aria-hidden>
                <Icon size={20} />
              </span>
              <div className="list-row-body">
                <div className="list-row-title">{t(it.key as any)}</div>
              </div>
              <span className="list-row-cta" aria-hidden>
                <ChevronRightIcon size={18} />
              </span>
            </Link>
          );
        })}
      </section>
      <section className="section">
        <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span className="list-row-icon" aria-hidden>
            <HelpIcon size={20} />
          </span>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>
              {locale === 'vi' ? 'Cần trợ giúp khẩn cấp?' : 'Need urgent help?'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {locale === 'vi'
                ? 'Liên hệ ngay đội an ninh / y tế tại điểm gần nhất hoặc sử dụng hotline.'
                : 'Contact the nearest security / medical team or use the hotline.'}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
