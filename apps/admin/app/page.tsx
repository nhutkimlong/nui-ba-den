'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminGet } from '../lib/api';
import { InboxIcon, MapPinIcon, BookOpenIcon, TrophyIcon, ChevronRightIcon } from '../components/icons';

interface Overview {
  reports: number;
  pois: number;
  faqs: number;
  checkins: number;
  latestReport: { code: string; status: string; createdAt: string } | null;
}

const KPIS = [
  { key: 'reports', label: 'Phản ánh', Icon: InboxIcon },
  { key: 'pois', label: 'Điểm POI', Icon: MapPinIcon },
  { key: 'faqs', label: 'KB / FAQ', Icon: BookOpenIcon },
  { key: 'checkins', label: 'Lượt check-in', Icon: TrophyIcon },
] as const;

export default function AdminHomePage() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    adminGet<Overview>('/admin/overview').then(setData).catch(() => setData(null));
  }, []);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Tổng quan</h1>
          <p className="page-subtitle">Dashboard nội dung, phản ánh, KB chatbot và gamification cho Núi Bà Đen.</p>
        </div>
        <Link href="/reports" className="btn btn-secondary">
          Xem inbox phản ánh
        </Link>
      </div>
      {!data && <div className="card">Đang tải...</div>}
      {data && (
        <>
          <div className="kpi-grid">
            {KPIS.map(({ key, label, Icon }) => (
              <div key={key} className="kpi">
                <span className="kpi-icon" aria-hidden>
                  <Icon size={20} />
                </span>
                <div className="kpi-body">
                  <div className="kpi-value">{(data as any)[key]}</div>
                  <div className="kpi-label">{label}</div>
                </div>
              </div>
            ))}
          </div>
          <section className="section">
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 15 }}>Phản ánh mới nhất</h3>
                <Link
                  href="/reports"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--primary)',
                  }}
                >
                  Tất cả <ChevronRightIcon size={14} />
                </Link>
              </div>
              {data.latestReport ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{data.latestReport.code}</strong>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                      {new Date(data.latestReport.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <span className={`pill status-${data.latestReport.status}`}>{data.latestReport.status}</span>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>Chưa có phản ánh nào.</div>
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
