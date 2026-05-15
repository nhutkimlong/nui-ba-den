'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from '../lib/locale';
import { ArrowLeftIcon, GlobeIcon } from './icons';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  rightSlot?: React.ReactNode;
}

export function AppHeader({ title, showBack, rightSlot }: AppHeaderProps) {
  const { locale, setLocale } = useLocale();
  const router = useRouter();
  return (
    <header className="appbar">
      <div className="appbar-left">
        {showBack ? (
          <button
            className="appbar-icon-btn"
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
          >
            <ArrowLeftIcon size={20} />
          </button>
        ) : (
          <Link href="/" className="appbar-brand" aria-label="Home">
            <span className="appbar-logo" aria-hidden>NB</span>
          </Link>
        )}
        <h1 className="appbar-title">{title}</h1>
      </div>
      <div className="appbar-right">
        {rightSlot}
        <button
          className="appbar-locale"
          onClick={() => setLocale(locale === 'vi' ? 'en' : 'vi')}
          aria-label="Toggle language"
          type="button"
        >
          <GlobeIcon size={14} />
          <span>{locale === 'vi' ? 'VI' : 'EN'}</span>
        </button>
      </div>
    </header>
  );
}
