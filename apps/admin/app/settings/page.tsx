'use client';

import { useEffect, useState } from 'react';
import { adminGet, adminPut, adminUpload } from '../../lib/api';

interface SettingRow {
  key: string;
  value: any;
}

export default function SettingsPage() {
  const [items, setItems] = useState<SettingRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await adminGet<{ items: SettingRow[] }>('/admin/site-settings');
    setItems(res.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(key: string, value: any) {
    await adminPut(`/admin/site-settings/${key}`, { value });
    await load();
  }

  async function uploadAndStore(key: string, field: string, file: File) {
    const r = await adminUpload<{ publicUrl?: string; error?: string }>(
      '/admin/uploads/branding',
      file,
    );
    if (!r.publicUrl) {
      alert(r.error ?? 'upload failed');
      return;
    }
    const current = items.find((i) => i.key === key)?.value ?? {};
    await save(key, { ...current, [field]: r.publicUrl });
  }

  if (loading) return <div className="card">Đang tải…</div>;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Brand & Hero</h1>
          <p className="page-subtitle">Logo, hero image, màu thương hiệu, hotline.</p>
        </div>
      </div>

      {items.map((row) => (
        <SettingEditor
          key={row.key}
          row={row}
          onSave={(value) => save(row.key, value)}
          onUpload={(field, file) => uploadAndStore(row.key, field, file)}
        />
      ))}
    </>
  );
}

function SettingEditor({
  row,
  onSave,
  onUpload,
}: {
  row: SettingRow;
  onSave: (value: any) => Promise<void>;
  onUpload: (field: string, file: File) => Promise<void>;
}) {
  const [draft, setDraft] = useState(JSON.stringify(row.value, null, 2));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    let parsed: any;
    try {
      parsed = JSON.parse(draft);
    } catch {
      setError('JSON không hợp lệ');
      return;
    }
    setSaving(true);
    await onSave(parsed);
    setSaving(false);
  }

  const imageFields = guessImageFields(row.value);

  return (
    <section className="card" style={{ marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>{row.key}</h3>

      {imageFields.length > 0 && (
        <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {imageFields.map((field) => (
            <div
              key={field}
              style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}
            >
              <strong style={{ minWidth: 120 }}>{field}</strong>
              {row.value?.[field] && (
                <img
                  src={row.value[field]}
                  alt={field}
                  style={{ height: 48, borderRadius: 6, border: '1px solid #eee' }}
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUpload(field, file);
                }}
              />
            </div>
          ))}
        </div>
      )}

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={Math.min(20, draft.split('\n').length + 2)}
        style={{
          width: '100%',
          fontFamily: 'monospace',
          fontSize: 13,
          padding: 8,
          borderRadius: 6,
          border: '1px solid #d0d0d0',
        }}
      />
      {error && <div style={{ color: '#c33', fontSize: 13, marginTop: 6 }}>{error}</div>}
      <div style={{ marginTop: 8 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Đang lưu…' : 'Lưu'}
        </button>
      </div>
    </section>
  );
}

function guessImageFields(value: any): string[] {
  if (!value || typeof value !== 'object') return [];
  return Object.keys(value).filter(
    (k) => /image|logo|icon|cover|background/i.test(k),
  );
}
