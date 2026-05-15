'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppHeader } from '../../../../components/app-header';
import { useLocale } from '../../../../lib/locale';
import { apiGet } from '../../../../lib/api';
import { MapPinIcon } from '../../../../components/icons';

interface ReportTimelineEntry {
  at: string;
  status: string;
  note: string;
}

interface ReportDetail {
  id: string;
  code: string;
  category: string;
  description: string;
  location: string;
  status: string;
  createdAt: string;
  timeline: ReportTimelineEntry[];
}

export default function ReportDetailPage() {
  const params = useParams<{ code: string }>();
  const { locale, t } = useLocale();
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!params?.code) return;
    setDetail(null);
    setNotFound(false);
    apiGet<ReportDetail>(`/reports/by-code/${params.code}`, locale)
      .then((data) => {
        if (!alive) return;
        if ((data as any).error) setNotFound(true);
        else setDetail(data);
      })
      .catch(() => {
        if (alive) setNotFound(true);
      });
    return () => {
      alive = false;
    };
  }, [params?.code, locale]);

  if (notFound) {
    return (
      <>
        <AppHeader title={t('report.history')} showBack />
        <div className="empty">{t('common.empty')}</div>
      </>
    );
  }
  if (!detail) {
    return (
      <>
        <AppHeader title={t('report.history')} showBack />
        <div className="empty">{t('common.loading')}</div>
      </>
    );
  }

  return (
    <>
      <AppHeader title={detail.code} showBack />
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <strong>{detail.category}</strong>
          <span className={`status-pill status-${detail.status}`}>{t(`status.${detail.status}` as any)}</span>
        </div>
        <p className="poi-desc" style={{ margin: 0 }}>{detail.description}</p>
        {detail.location && (
          <p className="poi-desc" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <MapPinIcon size={14} />
            <span>{detail.location}</span>
          </p>
        )}
      </div>
      <h3 className="section-title">{t('report.status')}</h3>
      <div className="card">
        {detail.timeline.map((entry, i) => (
          <div
            key={i}
            style={{
              paddingBottom: 10,
              marginBottom: 10,
              borderBottom: i === detail.timeline.length - 1 ? 'none' : '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className={`status-pill status-${entry.status}`}>{t(`status.${entry.status}` as any)}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(entry.at).toLocaleString()}</span>
            </div>
            {entry.note && <p className="poi-desc" style={{ marginTop: 6 }}>{entry.note}</p>}
          </div>
        ))}
      </div>
    </>
  );
}
