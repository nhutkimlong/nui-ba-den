'use client';

import { useEffect, useState } from 'react';
import { adminGet, adminPut } from '../../lib/api';
import { RefreshIcon } from '../../components/icons';

interface ReportItem {
  id: string;
  code: string;
  category: string;
  description: string;
  location: string;
  status: string;
  createdAt: string;
}

const STATUS_OPTIONS = [
  'new',
  'triaged',
  'in_progress',
  'resolved',
  'rejected',
  'needs_more_info',
] as const;

const STATUS_LABEL: Record<string, string> = {
  new: 'Mới tiếp nhận',
  triaged: 'Đã phân loại',
  in_progress: 'Đang xử lý',
  resolved: 'Đã xử lý',
  rejected: 'Từ chối',
  needs_more_info: 'Cần bổ sung',
};

export default function ReportsAdminPage() {
  const [items, setItems] = useState<ReportItem[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const reload = () => {
    adminGet<{ items: ReportItem[] }>('/admin/reports').then((d) => setItems(d.items));
  };

  useEffect(() => {
    reload();
  }, []);

  const updateStatus = async (code: string, status: string) => {
    setBusy(code);
    try {
      await adminPut(`/admin/reports/${code}/status`, { status, note: 'Cập nhật từ admin' });
      reload();
    } finally {
      setBusy(null);
    }
  };

  const filtered = items.filter((r) => (filter === 'all' ? true : r.status === filter));

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Phản ánh</h1>
          <p className="page-subtitle">Inbox phản ánh từ du khách. Cập nhật trạng thái xử lý ở cột bên phải.</p>
        </div>
        <button className="btn btn-secondary" onClick={reload}>
          <RefreshIcon size={16} />
          <span>Tải lại</span>
        </button>
      </div>
      <div className="card" style={{ padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 12, marginRight: 6 }}>Lọc theo trạng thái:</span>
        {['all', ...STATUS_OPTIONS].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            style={{
              padding: '5px 11px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              border: filter === s ? '1px solid var(--primary)' : '1px solid var(--border)',
              background: filter === s ? 'var(--primary-soft)' : 'var(--surface)',
              color: filter === s ? 'var(--primary)' : 'var(--text-secondary)',
            }}
          >
            {s === 'all' ? 'Tất cả' : STATUS_LABEL[s] ?? s}
          </button>
        ))}
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Loại</th>
              <th>Mô tả</th>
              <th>Trạng thái</th>
              <th>Thời gian</th>
              <th style={{ width: 200 }}>Cập nhật</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                  Chưa có phản ánh phù hợp
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.code}</strong></td>
                <td>{r.category}</td>
                <td style={{ maxWidth: 320, color: 'var(--text-secondary)' }}>{r.description}</td>
                <td><span className={`pill status-${r.status}`}>{STATUS_LABEL[r.status] ?? r.status}</span></td>
                <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(r.createdAt).toLocaleString()}</td>
                <td>
                  <select
                    className="select"
                    value={r.status}
                    onChange={(e) => updateStatus(r.code, e.target.value)}
                    disabled={busy === r.code}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
