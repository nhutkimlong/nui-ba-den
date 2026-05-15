'use client';

import { useEffect, useState } from 'react';
import { adminDelete, adminGet, adminPost, adminPut } from '../../lib/api';

interface AlertTr {
  locale: 'vi' | 'en';
  title: string;
  body_md: string | null;
}
interface AlertItem {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  alert_translations: AlertTr[];
}

interface Form {
  severity: 'info' | 'warning' | 'critical';
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  vi: { title: string; body: string };
  en: { title: string; body: string };
}

const empty: Form = {
  severity: 'info',
  isActive: true,
  startsAt: '',
  endsAt: '',
  vi: { title: '', body: '' },
  en: { title: '', body: '' },
};

export default function AlertsPage() {
  const [items, setItems] = useState<AlertItem[]>([]);
  const [editing, setEditing] = useState<{ id: string | null; form: Form } | null>(null);

  async function load() {
    const r = await adminGet<{ items: AlertItem[] }>('/admin/alerts');
    setItems(r.items ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setEditing({ id: null, form: { ...empty, vi: { ...empty.vi }, en: { ...empty.en } } });
  }
  function startEdit(a: AlertItem) {
    const vi = a.alert_translations.find((t) => t.locale === 'vi');
    const en = a.alert_translations.find((t) => t.locale === 'en');
    setEditing({
      id: a.id,
      form: {
        severity: a.severity,
        isActive: a.is_active,
        startsAt: a.starts_at?.slice(0, 16) ?? '',
        endsAt: a.ends_at?.slice(0, 16) ?? '',
        vi: { title: vi?.title ?? '', body: vi?.body_md ?? '' },
        en: { title: en?.title ?? '', body: en?.body_md ?? '' },
      },
    });
  }
  async function save() {
    if (!editing) return;
    const body = {
      severity: editing.form.severity,
      isActive: editing.form.isActive,
      startsAt: editing.form.startsAt ? new Date(editing.form.startsAt).toISOString() : null,
      endsAt: editing.form.endsAt ? new Date(editing.form.endsAt).toISOString() : null,
      vi: editing.form.vi,
      en: editing.form.en,
    };
    if (editing.id) await adminPut(`/admin/alerts/${editing.id}`, body);
    else await adminPost('/admin/alerts', body);
    setEditing(null);
    await load();
  }
  async function remove(id: string) {
    if (!confirm('Xoá thông báo này?')) return;
    await adminDelete(`/admin/alerts/${id}`);
    await load();
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Thông báo (Alerts)</h1>
          <p className="page-subtitle">Cảnh báo / nhắc nhở hiển thị trên trang chủ.</p>
        </div>
        <button className="btn btn-primary" onClick={startCreate}>
          + Thêm thông báo
        </button>
      </div>

      <div className="card">
        {items.length === 0 && <div style={{ color: 'var(--text-muted)' }}>Chưa có thông báo.</div>}
        {items.map((a) => (
          <div
            key={a.id}
            style={{ padding: '10px 0', borderBottom: '1px solid #eee', display: 'flex', gap: 12 }}
          >
            <span className={`pill status-${a.severity}`}>{a.severity}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>
                {a.alert_translations.find((t) => t.locale === 'vi')?.title ?? '(no title)'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                {a.is_active ? 'active' : 'inactive'}
                {a.starts_at && ` · ${new Date(a.starts_at).toLocaleString()}`}
                {a.ends_at && ` → ${new Date(a.ends_at).toLocaleString()}`}
              </div>
            </div>
            <button className="btn btn-secondary" onClick={() => startEdit(a)}>
              Sửa
            </button>
            <button className="btn btn-secondary" onClick={() => remove(a.id)}>
              Xoá
            </button>
          </div>
        ))}
      </div>

      {editing && (
        <div
          onClick={() => setEditing(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            justifyContent: 'center',
            padding: '40px 16px',
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 20,
              maxWidth: 520,
              width: '100%',
              maxHeight: 'calc(100vh - 80px)',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ marginTop: 0 }}>{editing.id ? 'Sửa thông báo' : 'Thêm thông báo'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 12 }}>
                Mức độ
                <select
                  value={editing.form.severity}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      form: { ...editing.form, severity: e.target.value as Form['severity'] },
                    })
                  }
                  style={inputStyle}
                >
                  <option value="info">info</option>
                  <option value="warning">warning</option>
                  <option value="critical">critical</option>
                </select>
              </label>
              <label style={{ fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={editing.form.isActive}
                  onChange={(e) =>
                    setEditing({ ...editing, form: { ...editing.form, isActive: e.target.checked } })
                  }
                />{' '}
                Đang hoạt động
              </label>
              <label style={{ fontSize: 12 }}>
                Bắt đầu (optional)
                <input
                  type="datetime-local"
                  value={editing.form.startsAt}
                  onChange={(e) =>
                    setEditing({ ...editing, form: { ...editing.form, startsAt: e.target.value } })
                  }
                  style={inputStyle}
                />
              </label>
              <label style={{ fontSize: 12 }}>
                Kết thúc (optional)
                <input
                  type="datetime-local"
                  value={editing.form.endsAt}
                  onChange={(e) =>
                    setEditing({ ...editing, form: { ...editing.form, endsAt: e.target.value } })
                  }
                  style={inputStyle}
                />
              </label>
              <h4 style={{ margin: '8px 0 0' }}>Tiếng Việt</h4>
              <input
                placeholder="Tiêu đề VI"
                value={editing.form.vi.title}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    form: { ...editing.form, vi: { ...editing.form.vi, title: e.target.value } },
                  })
                }
                style={inputStyle}
              />
              <textarea
                placeholder="Nội dung VI (markdown)"
                value={editing.form.vi.body}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    form: { ...editing.form, vi: { ...editing.form.vi, body: e.target.value } },
                  })
                }
                style={{ ...inputStyle, minHeight: 80 }}
              />
              <h4 style={{ margin: '8px 0 0' }}>English</h4>
              <input
                placeholder="Title EN"
                value={editing.form.en.title}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    form: { ...editing.form, en: { ...editing.form.en, title: e.target.value } },
                  })
                }
                style={inputStyle}
              />
              <textarea
                placeholder="Body EN (markdown)"
                value={editing.form.en.body}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    form: { ...editing.form, en: { ...editing.form.en, body: e.target.value } },
                  })
                }
                style={{ ...inputStyle, minHeight: 80 }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary" onClick={save}>
                  Lưu
                </button>
                <button className="btn btn-secondary" onClick={() => setEditing(null)}>
                  Huỷ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid #d0d0d0',
  fontSize: 14,
  marginTop: 4,
};
