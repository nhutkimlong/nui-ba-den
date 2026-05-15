'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  HomeIcon,
  InboxIcon,
  MapPinIcon,
  BookOpenIcon,
  TrophyIcon,
  ChatIcon,
} from './icons';
import { adminLogout } from '../lib/api';

const links = [
  { href: '/', label: 'Tổng quan', Icon: HomeIcon },
  { href: '/reports', label: 'Phản ánh', Icon: InboxIcon },
  { href: '/moderation', label: 'Moderation', Icon: InboxIcon },
  { href: '/pois', label: 'POI / Check-in', Icon: MapPinIcon },
  { href: '/banners', label: 'Banners & Hero', Icon: HomeIcon },
  { href: '/alerts', label: 'Thông báo', Icon: ChatIcon },
  { href: '/guides', label: 'Hướng dẫn', Icon: BookOpenIcon },
  { href: '/faqs', label: 'FAQ', Icon: BookOpenIcon },
  { href: '/kb', label: 'KB thủ công', Icon: BookOpenIcon },
  { href: '/badges', label: 'Badges', Icon: TrophyIcon },
  { href: '/settings', label: 'Brand & Hero', Icon: HomeIcon },
  { href: '/admin-users', label: 'Quản trị viên', Icon: HomeIcon },
  { href: '/audit-logs', label: 'Audit logs', Icon: BookOpenIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === '/login') return null;

  async function handleLogout() {
    await adminLogout();
    router.replace('/login');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo" aria-hidden>
          NB
        </span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Núi Bà Đen</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Admin Console</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {links.map((l) => {
          const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
          const Icon = l.Icon;
          return (
            <Link key={l.href} href={l.href} className={`sidebar-link ${active ? 'active' : ''}`}>
              <span className="sidebar-link-icon" aria-hidden>
                <Icon size={18} />
              </span>
              <span>{l.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-foot">
        <button
          type="button"
          onClick={handleLogout}
          className="sidebar-link"
          style={{
            padding: '10px 12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
          }}
        >
          <span className="sidebar-link-icon" aria-hidden>
            <ChatIcon size={18} />
          </span>
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
