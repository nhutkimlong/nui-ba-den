'use client';

import { useEffect, useState } from 'react';
import { adminGet } from '../../lib/api';

interface AuditLog {
  id: string;
  actor_admin_id: string | null;
  actor_role: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  before_snapshot: any;
  after_snapshot: any;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
  admin_users: { email: string; display_name: string | null } | null;
}

export default function AuditLogsPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [entityType, setEntityType] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    const params = new URLSearchParams();
    if (entityType.trim()) params.set('entityType', entityType.trim());
    const r = await adminGet<{ items: AuditLog[] }>(
      `/admin/audit-logs${params.toString() ? `?${params}` : ''}`,
    );
    setItems(r.items ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Audit logs</h1>
          <p className="page-subtitle">Lịch sử thao tác của admin (mọi mutation).</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="Lọc theo entity_type (vd: poi, faq_items)"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="input"
            style={{ width: 280 }}
          />
          <button className="btn btn-primary" onClick={load}>
            Lọc
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Admin</th>
              <th>Entity</th>
              <th>Action</th>
              <th>IP</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{ textAlign: 'center', padding: 28, color: 'var(--text-muted)' }}
                >
                  Chưa có log.
                </td>
              </tr>
            )}
            {items.map((l) => (
              <>
                <tr key={l.id}>
                  <td style={{ fontSize: 12 }}>{new Date(l.created_at).toLocaleString()}</td>
                  <td>
                    {l.admin_users?.email ?? '—'}
                    {l.actor_role && (
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                        {' '}
                        · {l.actor_role}
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    <strong>{l.entity_type}</strong>
                    {l.entity_id && (
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                        {l.entity_id}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`pill status-${l.action}`}>{l.action}</span>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.ip ?? '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}
                    >
                      {expandedId === l.id ? 'Ẩn' : 'Chi tiết'}
                    </button>
                  </td>
                </tr>
                {expandedId === l.id && (
                  <tr key={`${l.id}-details`}>
                    <td colSpan={6} style={{ background: '#fafafa' }}>
                      <pre
                        style={{
                          margin: 0,
                          fontSize: 11,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {JSON.stringify(
                          { before: l.before_snapshot, after: l.after_snapshot },
                          null,
                          2,
                        )}
                      </pre>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
