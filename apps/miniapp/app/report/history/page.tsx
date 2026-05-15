'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '../../../components/app-header';
import { useLocale } from '../../../lib/locale';
import { apiGet } from '../../../lib/api';
import { ChevronRightIcon } from '../../../components/icons';

interface ReportItem {
  id: string;
  code: string;
  category: string;
  status: string;
  createdAt: string;
}

export default function ReportHistoryPage() {
  const { locale, t } = useLocale();
  const [items, setItems] = useState<ReportItem[] | null>(null);

  useEffect(() => {
    let alive = true;
    apiGet<{ items: ReportItem[] }>('/reports/history', locale)
      .then((data) => {
        if (alive) setItems(data.items);
      })
      .catch(() => {
        if (alive) setItems([]);
      });
    return () => {
      alive = false;
    };
  }, [locale]);

  return (
    <>
      <AppHeader title={t('report.history')} showBack />
      {!items && <div className="empty">{t('common.loading')}</div>}
      {items && items.length === 0 && <div className="empty">{t('common.empty')}</div>}
      {items?.map((r) => (
        <Link key={r.id} href={`/report/history/${r.code}`} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: 14 }}>{r.code}</strong>
            <span className={`status-pill status-${r.status}`}>{t(`status.${r.status}` as any)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
            <span>{r.category}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
              {new Date(r.createdAt).toLocaleString()}
              <ChevronRightIcon size={14} />
            </span>
          </div>
        </Link>
      ))}
    </>
  );
}
