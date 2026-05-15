'use client';

import { useEffect, useState } from 'react';
import { AppHeader } from '../../../components/app-header';
import { useLocale } from '../../../lib/locale';
import { apiGet } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';
import { useToast } from '../../../lib/toast';
import { CheckIcon, TrophyIcon, UserIcon } from '../../../components/icons';

interface ProfilePayload {
  user: { name: string; locale: string };
  stats: { checkins: number; reports: number; badges: number };
  badges: { id: string; name: string; achieved: boolean }[];
  recentCheckins: { id: string; poiTitle: string; at: string }[];
}

export default function ProfilePage() {
  const { locale, t } = useLocale();
  const { user, signIn, signOut, loading: authLoading } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState<ProfilePayload | null>(null);

  useEffect(() => {
    let alive = true;
    apiGet<ProfilePayload>('/profile', locale)
      .then((data) => {
        if (alive) setProfile(data);
      })
      .catch(() => {
        if (alive) setProfile(null);
      });
    return () => {
      alive = false;
    };
  }, [locale]);

  const handleSignIn = async () => {
    try {
      await signIn('/support/profile');
    } catch {
      toast.show(locale === 'vi' ? 'Không thể đăng nhập' : 'Sign-in failed', 'error');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.show(locale === 'vi' ? 'Đã đăng xuất' : 'Signed out', 'info');
  };

  if (!profile) {
    return (
      <>
        <AppHeader title={t('support.profile')} showBack />
        <div className="empty">{t('common.loading')}</div>
      </>
    );
  }

  return (
    <>
      <AppHeader title={t('support.profile')} showBack />
      <div className="card" style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              style={{ width: 44, height: 44, borderRadius: 22 }}
            />
          ) : (
            <span className="list-row-icon" aria-hidden>
              <UserIcon size={22} />
            </span>
          )}
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: 16 }}>
              {user?.display_name || profile.user.name}
            </strong>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              {user
                ? locale === 'vi'
                  ? 'Đã đăng nhập bằng Zalo'
                  : 'Signed in with Zalo'
                : t('profile.signedAs')}
            </div>
          </div>
          {!authLoading &&
            (user ? (
              <button
                type="button"
                onClick={handleSignOut}
                style={signOutBtn}
              >
                {locale === 'vi' ? 'Đăng xuất' : 'Sign out'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignIn}
                style={signInBtn}
              >
                {locale === 'vi' ? 'Đăng nhập Zalo' : 'Sign in with Zalo'}
              </button>
            ))}
        </div>
        <div className="stat-row">
          <Stat label={t('support.checkins')} value={profile.stats.checkins} />
          <Stat label={t('tab.report')} value={profile.stats.reports} />
          <Stat label={t('support.badges')} value={profile.stats.badges} />
        </div>
      </div>
      <h3 className="section-title">{t('support.badges')}</h3>
      <div className="card" style={{ marginBottom: 16 }}>
        {profile.badges.map((b, i) => (
          <div
            key={b.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 0',
              borderBottom: i === profile.badges.length - 1 ? 'none' : '1px solid var(--border)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                className="list-row-icon"
                style={{
                  background: b.achieved ? '#fff7ed' : 'var(--surface-2)',
                  color: b.achieved ? '#d97706' : 'var(--text-muted)',
                }}
              >
                <TrophyIcon size={18} />
              </span>
              <span>{b.name}</span>
            </span>
            <span style={{ color: b.achieved ? 'var(--success)' : 'var(--text-muted)' }}>
              {b.achieved ? <CheckIcon size={18} /> : <span style={{ fontSize: 12 }}>—</span>}
            </span>
          </div>
        ))}
      </div>
      <h3 className="section-title">{t('profile.history')}</h3>
      <div className="card">
        {profile.recentCheckins.length === 0 && <div className="empty">{t('common.empty')}</div>}
        {profile.recentCheckins.map((c, i) => (
          <div
            key={c.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 0',
              borderBottom: i === profile.recentCheckins.length - 1 ? 'none' : '1px solid var(--border)',
            }}
          >
            <span>{c.poiTitle}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(c.at).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-cell">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

const signInBtn: React.CSSProperties = {
  background: 'var(--primary, #1F6E43)',
  color: '#fff',
  border: 'none',
  borderRadius: 999,
  padding: '8px 14px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};

const signOutBtn: React.CSSProperties = {
  background: 'var(--surface-2, #f1f5f9)',
  color: 'var(--text-secondary)',
  border: 'none',
  borderRadius: 999,
  padding: '8px 14px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};
