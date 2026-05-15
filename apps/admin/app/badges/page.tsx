'use client';

import { useEffect, useState } from 'react';
import { adminDelete, adminGet, adminPost, adminPut, adminUpload } from '../../lib/api';

interface BadgeTr {
  locale: 'vi' | 'en';
  name: string;
  description: string | null;
}
interface BadgeRule {
  kind: string;
  params: Record<string, any>;
}
interface Badge {
  id: string;
  code: string;
  icon_url: string | null;
  is_active: boolean;
  sort_order: number;
  badge_translations: BadgeTr[];
  badge_rules: BadgeRule | BadgeRule[] | null;
}

interface Form {
  code: string;
  iconUrl: string;
  isActive: boolean;
  sortOrder: number;
  vi: { name: string; description: string };
  en: { name: string; description: string };
  rule: { kind: string; params: string };
}

const blank: Form = {
  code: '',
  iconUrl: '',
  isActive: true,
  sortOrder: 0,
  vi: { name: '', description: '' },
  en: { name: '', description: '' },
  rule: { kind: 'first_checkin', params: '{}' },
};

const RULE_KINDS = [
  { value: 'first_checkin', help: 'Lần check-in đầu tiên (params: {})' },
  { value: 'n_checkins', help: 'N lần check-in (params: {"n": 3})' },
  { value: 'visit_poi', help: 'Thăm POI cụ thể (params: {"poi_id": "uuid"})' },
  { value: 'visit_all_in_category', help: 'Thăm hết POI trong danh mục (params: {"category_id": "uuid"})' },
  { value: 'manual', help: 'Thủ công, admin trao' },
];

export default function BadgesPage() {
  const [items, setItems] = useState<Badge[]>([]);
  const [editing, setEditing] = useState<{ id: string | null; form: Form } | null>(null);

  async function load() {
    const r = await adminGet<{ items: Badge[] }>('/admin/badges');
    setItems(r.items ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setEditing({
      id: null,
      form: { ...blank, vi: { ...blank.vi }, en: { ...blank.en }, rule: { ...blank.rule } },
    });
  }
  function startEdit(b: Badge) {
    const vi = b.badge_translations.find((t) => t.locale === 'vi');
    const en = b.badge_translations.find((t) => t.locale === 'en');
    const ruleArr = Array.isArray(b.badge_rules)
      ? b.badge_rules
      : b.badge_rules
      ? [b.badge_rules]
      : [];
    const rule = ruleArr[0];
    setEditing({
      id: b.id,
      form: {
        code: b.code,
        iconUrl: b.icon_url ?? '',
        isActive: b.is_active,
        sortOrder: b.sort_order,
        vi: { name: vi?.name ?? '', description: vi?.description ?? '' },
        en: { name: en?.name ?? '', description: en?.description ?? '' },
        rule: {
          kind: rule?.kind ?? 'first_checkin',
          params: rule ? JSON.stringify(rule.params ?? {}) : '{}',
        },
      },
    });
  }
  async function save() {
    if (!editing) return;
    let parsedParams: Record<string, any>;
    try {
      parsedParams = JSON.parse(editing.form.rule.params || '{}');
    } catch {
      alert('Params không phải JSON hợp lệ');
      return;
    }
    const body = {
      code: editing.form.code,
      iconUrl: editing.form.iconUrl || null,
      isActive: editing.form.isActive,
      sortOrder: Number(editing.form.sortOrder) || 0,
      vi: editing.form.vi,
      en: editing.form.en,
      rule: { kind: editing.form.rule.kind, params: parsedParams },
    };
    if (editing.id) await adminPut(`/admin/badges/${editing.id}`, body);
    else await adminPost('/admin/badges', body);
    setEditing(null);
    await load();
  }
  async function remove(id: string) {
    if (!confirm('Xoá badge?')) return;
    await adminDelete(`/admin/badges/${id}`);
    await load();
  }
  async function uploadIcon(file: File) {
    if (!editing) return;
    const r = await adminUpload<{ publicUrl?: string; error?: string }>(
      '/admin/uploads/branding',
      file,
    );
    if (r.publicUrl) {
      setEditing({ ...editing, form: { ...editing.form, iconUrl: r.publicUrl } });
    } else alert(r.error ?? 'upload failed');
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Badges</h1>
          <p className="page-subtitle">Danh hiệu gamification, gán rule tự động.</p>
        </div>
        <button className="btn btn-primary" onClick={startCreate}>
          + Thêm badge
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Icon</th>
              <th>Code</th>
              <th>Tên VI</th>
              <th>Rule</th>
              <th>Active</th>
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
                  Chưa có badge.
                </td>
              </tr>
            )}
            {items.map((b) => {
              const ruleArr = Array.isArray(b.badge_rules)
                ? b.badge_rules
                : b.badge_rules
                ? [b.badge_rules]
                : [];
              const rule = ruleArr[0];
              return (
                <tr key={b.id}>
                  <td>
                    {b.icon_url ? (
                      <img
                        src={b.icon_url}
                        alt=""
                        style={{ width: 32, height: 32, borderRadius: 6 }}
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <strong>{b.code}</strong>
                  </td>
                  <td>{b.badge_translations.find((t) => t.locale === 'vi')?.name ?? '—'}</td>
                  <td style={{ fontSize: 11 }}>
                    {rule ? (
                      <>
                        <strong>{rule.kind}</strong>{' '}
                        <span style={{ color: 'var(--text-muted)' }}>
                          {JSON.stringify(rule.params)}
                        </span>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{b.is_active ? '✓' : '—'}</td>
                  <td style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={() => startEdit(b)}>
                      Sửa
                    </button>
                    <button className="btn btn-secondary" onClick={() => remove(b.id)}>
                      Xoá
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <BadgeModal
          form={editing.form}
          isEdit={!!editing.id}
          onChange={(form) => setEditing({ ...editing, form })}
          onUpload={uploadIcon}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function BadgeModal({
  form,
  isEdit,
  onChange,
  onUpload,
  onSave,
  onClose,
}: {
  form: Form;
  isEdit: boolean;
  onChange: (f: Form) => void;
  onUpload: (file: File) => Promise<void>;
  onSave: () => Promise<void>;
  onClose: () => void;
}) {
  const ruleHelp = RULE_KINDS.find((r) => r.value === form.rule.kind)?.help;
  return (
    <div
      onClick={onClose}
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
          maxWidth: 560,
          width: '100%',
          maxHeight: 'calc(100vh - 80px)',
          overflowY: 'auto',
        }}
      >
        <h3 style={{ marginTop: 0 }}>{isEdit ? 'Sửa badge' : 'Thêm badge'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="Code (unique)">
            <input
              className="input"
              value={form.code}
              onChange={(e) => onChange({ ...form, code: e.target.value })}
              disabled={isEdit}
            />
          </Field>
          <Field label="Sort">
            <input
              type="number"
              className="input"
              value={form.sortOrder}
              onChange={(e) => onChange({ ...form, sortOrder: Number(e.target.value) })}
            />
          </Field>
        </div>
        <Field label="Icon">
          {form.iconUrl && (
            <img src={form.iconUrl} alt="" style={{ height: 48, borderRadius: 6 }} />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
          />
          <input
            className="input"
            placeholder="hoặc URL icon"
            value={form.iconUrl}
            onChange={(e) => onChange({ ...form, iconUrl: e.target.value })}
          />
        </Field>
        <label style={{ fontSize: 13 }}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => onChange({ ...form, isActive: e.target.checked })}
          />{' '}
          Đang hoạt động
        </label>

        <h4>Rule (cách trao tự động)</h4>
        <Field label="Kind">
          <select
            className="input"
            value={form.rule.kind}
            onChange={(e) => onChange({ ...form, rule: { ...form.rule, kind: e.target.value } })}
          >
            {RULE_KINDS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.value}
              </option>
            ))}
          </select>
        </Field>
        <Field label={`Params (JSON) — ${ruleHelp ?? ''}`}>
          <textarea
            className="textarea"
            value={form.rule.params}
            onChange={(e) =>
              onChange({ ...form, rule: { ...form.rule, params: e.target.value } })
            }
            style={{ fontFamily: 'monospace', fontSize: 12 }}
          />
        </Field>

        <h4>Tiếng Việt</h4>
        <input
          className="input"
          placeholder="Tên VI"
          value={form.vi.name}
          onChange={(e) => onChange({ ...form, vi: { ...form.vi, name: e.target.value } })}
        />
        <input
          className="input"
          placeholder="Mô tả VI"
          value={form.vi.description}
          onChange={(e) =>
            onChange({ ...form, vi: { ...form.vi, description: e.target.value } })
          }
          style={{ marginTop: 8 }}
        />

        <h4>English</h4>
        <input
          className="input"
          placeholder="Name EN"
          value={form.en.name}
          onChange={(e) => onChange({ ...form, en: { ...form.en, name: e.target.value } })}
        />
        <input
          className="input"
          placeholder="Description EN"
          value={form.en.description}
          onChange={(e) =>
            onChange({ ...form, en: { ...form.en, description: e.target.value } })
          }
          style={{ marginTop: 8 }}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn btn-primary" onClick={onSave}>
            Lưu
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Huỷ
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
      <div style={{ marginBottom: 4, color: 'var(--text-muted)' }}>{label}</div>
      {children}
    </label>
  );
}
