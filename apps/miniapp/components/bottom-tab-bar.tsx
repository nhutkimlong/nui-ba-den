'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '../lib/locale';
import { HomeIcon, CompassIcon, MegaphoneIcon, MessageIcon } from './icons';

const tabs = [
  { href: '/', key: 'tab.home', Icon: HomeIcon },
  { href: '/explore', key: 'tab.explore', Icon: CompassIcon },
  { href: '/report', key: 'tab.report', Icon: MegaphoneIcon },
  { href: '/support', key: 'tab.support', Icon: MessageIcon },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();
  const { t } = useLocale();
  return (
    <nav className="tabbar" aria-label="Main navigation">
      {tabs.map((tab) => {
        const active =
          pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));
        const Icon = tab.Icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`tab ${active ? 'tab-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="tab-icon" aria-hidden>
              <Icon size={22} strokeWidth={active ? 2 : 1.6} />
            </span>
            <span className="tab-label">{t(tab.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
