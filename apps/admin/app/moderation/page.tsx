'use client';

import { useEffect, useState } from 'react';
import { adminGet, adminPut } from '../../lib/api';

interface ModerationItem {
  id: string;
  target_type: string;
  target_id: string;
  flag_reason: string | null;
  severity: 'low' | 'medium' | 'high';
  decision: 'pending' | 'approved' | 'rejected' | 'escalated';
  reviewer_admin_id: string | null;
  decided_at: string | null;
  notes: string | null;
  created_at: string;
}

const FILTERS = ['pending', 'approved', 'rejected', 'escalated'] as const;

export default function ModerationPage() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('pending');
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const r = await adminGet<{ items: ModerationItem[] }>(
      `/admin/moderation?decision=${filter}`,
    );
    setItems(r.items ?? []);
  }
  useEffect(() => {
    load();
  }, [filter]);

  async function decide(
    id: string,
    decision: 'approved' | 'rejected' | 'escalated',
  ) {
    const note = prompt('Ghi chú (tuỳ chọn):') ?? undefined;
    setBusy(id);
    try {
      await adminPut(`/admin/moderation/${id}`, { decision, notes: note });
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Moderation queue</h1>
          <p className="page-subtitle">
            Phản ánh / chatbot message / attachment chờ duyệt.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={filter === f ? 'btn btn-primary' : 'btn btn-secondary'}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Loại</th>
              <th>Target</th>
              <th>Lý do</th>
              <th>Severity</th>
              <th>Decision</th>
              <th>Thời gian</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 28 }}
                >
                  Không có mục nào.
                </td>
              </tr>
            )}
            {items.map((m) => (
              <tr key={m.id}>
                <td>{m.target_type}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{m.target_id}</td>
                <td>{m.flag_reason ?? '—'}</td>
                <td>
                  <span className={`pill status-${m.severity}`}>{m.severity}</span>
                </td>
                <td>
                  <span className={`pill status-${m.decision}`}>{m.decision}</span>
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {new Date(m.created_at).toLocaleString()}
                </td>
                <td style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                  {m.decision === 'pending' && (
                    <>
                      <button
                        className="btn btn-secondary"
                        disabled={busy === m.id}
                        onClick={() => decide(m.id, 'approved')}
                      >
                        Duyệt
                      </button>
                      <button
                        className="btn btn-secondary"
                        disabled={busy === m.id}
                        onClick={() => decide(m.id, 'rejected')}
                      >
                        Từ chối
                      </button>
                      <button
                        className="btn btn-secondary"
                        disabled={busy === m.id}
                        onClick={() => decide(m.id, 'escalated')}
                      >
                        Báo cáo
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
