'use client';

import { useEffect, useState } from 'react';
import { adminDelete, adminGet, adminPost, adminPut } from '../../lib/api';

interface Tr {
  locale: 'vi' | 'en';
  title: string;
  body_md: string;
}
interface KbItem {
  id: string;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  created_at: string;
  chatbot_kb_translations: Tr[];
}
interface Form {
  status: 'draft' | 'published' | 'archived';
  tags: string;
  vi: { title: string; body: string };
  en: { title: string; body: string };
}

const blank: Form = {
  status: 'draft',
  tags: '',
  vi: { title: '', body: '' },
  en: { title: '', body: '' },
};

export default function ManualKbPage() {
  const [items, setItems] = useState<KbItem[]>([]);
  const [editing, setEditing] = useState<{ id: string | null; form: Form } | null>(null);

  async function load() {
    const r = await adminGet<{ items: KbItem[] }>('/admin/kb-manual');
    setItems(r.items ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setEditing({ id: null, form: { ...blank, vi: { ...blank.vi }, en: { ...blank.en } } });
  }
  function startEdit(it: KbItem) {
    const vi = it.chatbot_kb_translations.find((t) => t.locale === 'vi');
    const en = it.chatbot_kb_translations.find((t) => t.locale === 'en');
    setEditing({
      id: it.id,
      form: {
        status: it.status,
        tags: it.tags.join(', '),
        vi: { title: vi?.title ?? '', body: vi?.body_md ?? '' },
        en: { title: en?.title ?? '', body: en?.body_md ?? '' },
      },
    });
  }
  async function save() {
    if (!editing) return;
    const body = {
      sourceType: 'manual' as const,
      status: editing.form.status,
      tags: editing.form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      vi: editing.form.vi,
      en: editing.form.en,
    };
    if (editing.id) await adminPut(`/admin/kb-manual/${editing.id}`, body);
    else await adminPost('/admin/kb-manual', body);
    setEditing(null);
    await load();
  }
  async function remove(id: string) {
    if (!confirm('Xoá KB item này?')) return;
    await adminDelete(`/admin/kb-manual/${id}`);
    await load();
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">KB thủ công</h1>
          <p className="page-subtitle">
            Knowledge base ngoài FAQ (số khẩn cấp, thời tiết, hướng dẫn riêng…). Chatbot dùng để trả lời.
          </p>
        </div>
        <button className="btn btn-primary" onClick={startCreate}>
          + Thêm KB item
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Tiêu đề VI</th>
              <th>Title EN</th>
              <th>Tags</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 28, color: 'var(--text-muted)' }}>
                  Chưa có KB thủ công.
                </td>
              </tr>
            )}
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.chatbot_kb_translations.find((t) => t.locale === 'vi')?.title ?? '—'}</td>
                <td>{it.chatbot_kb_translations.find((t) => t.locale === 'en')?.title ?? '—'}</td>
                <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{it.tags.join(', ')}</td>
                <td>
                  <span className={`pill status-${it.status}`}>{it.status}</span>
                </td>
                <td style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => startEdit(it)}>
                    Sửa
                  </button>
                  <button className="btn btn-secondary" onClick={() => remove(it.id)}>
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <ModalOverlay onClose={() => setEditing(null)}>
          <h3 style={{ marginTop: 0 }}>{editing.id ? 'Sửa KB item' : 'Thêm KB item'}</h3>
          <Field label="Tags (cách bằng dấu phẩy)">
            <input
              className="input"
              value={editing.form.tags}
              onChange={(e) =>
                setEditing({ ...editing, form: { ...editing.form, tags: e.target.value } })
              }
            />
          </Field>
          <Field label="Status">
            <select
              className="input"
              value={editing.form.status}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  form: { ...editing.form, status: e.target.value as Form['status'] },
                })
              }
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </Field>
          <h4>Tiếng Việt</h4>
          <input
            className="input"
            placeholder="Tiêu đề VI"
            value={editing.form.vi.title}
            onChange={(e) =>
              setEditing({
                ...editing,
                form: { ...editing.form, vi: { ...editing.form.vi, title: e.target.value } },
              })
            }
          />
          <textarea
            className="textarea"
            placeholder="Nội dung VI (markdown)"
            style={{ minHeight: 100, marginTop: 8 }}
            value={editing.form.vi.body}
            onChange={(e) =>
              setEditing({
                ...editing,
                form: { ...editing.form, vi: { ...editing.form.vi, body: e.target.value } },
              })
            }
          />
          <h4>English</h4>
          <input
            className="input"
            placeholder="Title EN"
            value={editing.form.en.title}
            onChange={(e) =>
              setEditing({
                ...editing,
                form: { ...editing.form, en: { ...editing.form.en, title: e.target.value } },
              })
            }
          />
          <textarea
            className="textarea"
            placeholder="Body EN (markdown)"
            style={{ minHeight: 100, marginTop: 8 }}
            value={editing.form.en.body}
            onChange={(e) =>
              setEditing({
                ...editing,
                form: { ...editing.form, en: { ...editing.form.en, body: e.target.value } },
              })
            }
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={save}>
              Lưu
            </button>
            <button className="btn btn-secondary" onClick={() => setEditing(null)}>
              Huỷ
            </button>
          </div>
        </ModalOverlay>
      )}
    </>
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

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
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
        {children}
      </div>
    </div>
  );
}
