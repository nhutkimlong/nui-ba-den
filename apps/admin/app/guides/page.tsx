'use client';

import { useEffect, useState } from 'react';
import { adminDelete, adminGet, adminPost, adminPut, adminUpload } from '../../lib/api';

interface Tr {
  locale: 'vi' | 'en';
  title: string;
  summary: string | null;
  body_md: string | null;
}
interface Guide {
  id: string;
  slug: string;
  cover_image_url: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  created_at: string;
  guide_article_translations: Tr[];
}
interface Form {
  slug: string;
  status: 'draft' | 'published' | 'archived';
  coverImageUrl: string;
  publishedAt: string;
  vi: { title: string; summary: string; bodyMd: string };
  en: { title: string; summary: string; bodyMd: string };
}

const blank: Form = {
  slug: '',
  status: 'draft',
  coverImageUrl: '',
  publishedAt: '',
  vi: { title: '', summary: '', bodyMd: '' },
  en: { title: '', summary: '', bodyMd: '' },
};

export default function GuidesPage() {
  const [items, setItems] = useState<Guide[]>([]);
  const [editing, setEditing] = useState<{ id: string | null; form: Form } | null>(null);

  async function load() {
    const r = await adminGet<{ items: Guide[] }>('/admin/guides');
    setItems(r.items ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setEditing({ id: null, form: { ...blank, vi: { ...blank.vi }, en: { ...blank.en } } });
  }
  function startEdit(g: Guide) {
    const vi = g.guide_article_translations.find((t) => t.locale === 'vi');
    const en = g.guide_article_translations.find((t) => t.locale === 'en');
    setEditing({
      id: g.id,
      form: {
        slug: g.slug,
        status: g.status,
        coverImageUrl: g.cover_image_url ?? '',
        publishedAt: g.published_at?.slice(0, 16) ?? '',
        vi: {
          title: vi?.title ?? '',
          summary: vi?.summary ?? '',
          bodyMd: vi?.body_md ?? '',
        },
        en: {
          title: en?.title ?? '',
          summary: en?.summary ?? '',
          bodyMd: en?.body_md ?? '',
        },
      },
    });
  }
  async function save() {
    if (!editing) return;
    const body = {
      slug: editing.form.slug,
      status: editing.form.status,
      coverImageUrl: editing.form.coverImageUrl || null,
      publishedAt: editing.form.publishedAt
        ? new Date(editing.form.publishedAt).toISOString()
        : null,
      vi: editing.form.vi,
      en: editing.form.en,
    };
    if (editing.id) await adminPut(`/admin/guides/${editing.id}`, body);
    else await adminPost('/admin/guides', body);
    setEditing(null);
    await load();
  }
  async function remove(id: string) {
    if (!confirm('Xoá guide article?')) return;
    await adminDelete(`/admin/guides/${id}`);
    await load();
  }
  async function uploadCover(file: File) {
    if (!editing) return;
    const r = await adminUpload<{ publicUrl?: string; error?: string }>(
      '/admin/uploads/branding',
      file,
    );
    if (r.publicUrl) {
      setEditing({ ...editing, form: { ...editing.form, coverImageUrl: r.publicUrl } });
    } else alert(r.error ?? 'upload failed');
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Hướng dẫn (Guides)</h1>
          <p className="page-subtitle">Bài viết hướng dẫn dài hiển thị ở tab Hỗ trợ.</p>
        </div>
        <button className="btn btn-primary" onClick={startCreate}>
          + Thêm guide
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Slug</th>
              <th>Tiêu đề VI</th>
              <th>Status</th>
              <th>Published</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 28, color: 'var(--text-muted)' }}>
                  Chưa có guide nào.
                </td>
              </tr>
            )}
            {items.map((g) => (
              <tr key={g.id}>
                <td>
                  <strong>{g.slug}</strong>
                </td>
                <td>
                  {g.guide_article_translations.find((t) => t.locale === 'vi')?.title ?? '—'}
                </td>
                <td>
                  <span className={`pill status-${g.status}`}>{g.status}</span>
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {g.published_at ? new Date(g.published_at).toLocaleString() : '—'}
                </td>
                <td style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => startEdit(g)}>
                    Sửa
                  </button>
                  <button className="btn btn-secondary" onClick={() => remove(g.id)}>
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <h3 style={{ marginTop: 0 }}>{editing.id ? 'Sửa guide' : 'Thêm guide'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="Slug">
              <input
                className="input"
                value={editing.form.slug}
                onChange={(e) =>
                  setEditing({ ...editing, form: { ...editing.form, slug: e.target.value } })
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
          </div>
          <Field label="Published at (optional)">
            <input
              type="datetime-local"
              className="input"
              value={editing.form.publishedAt}
              onChange={(e) =>
                setEditing({ ...editing, form: { ...editing.form, publishedAt: e.target.value } })
              }
            />
          </Field>
          <Field label="Cover image">
            {editing.form.coverImageUrl && (
              <img src={editing.form.coverImageUrl} alt="" style={{ maxHeight: 100, borderRadius: 8 }} />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])}
            />
            <input
              className="input"
              placeholder="hoặc URL trực tiếp"
              value={editing.form.coverImageUrl}
              onChange={(e) =>
                setEditing({ ...editing, form: { ...editing.form, coverImageUrl: e.target.value } })
              }
            />
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
          <input
            className="input"
            placeholder="Tóm tắt VI"
            value={editing.form.vi.summary}
            onChange={(e) =>
              setEditing({
                ...editing,
                form: { ...editing.form, vi: { ...editing.form.vi, summary: e.target.value } },
              })
            }
            style={{ marginTop: 8 }}
          />
          <textarea
            className="textarea"
            placeholder="Nội dung VI (markdown)"
            style={{ minHeight: 160, marginTop: 8 }}
            value={editing.form.vi.bodyMd}
            onChange={(e) =>
              setEditing({
                ...editing,
                form: { ...editing.form, vi: { ...editing.form.vi, bodyMd: e.target.value } },
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
          <input
            className="input"
            placeholder="Summary EN"
            value={editing.form.en.summary}
            onChange={(e) =>
              setEditing({
                ...editing,
                form: { ...editing.form, en: { ...editing.form.en, summary: e.target.value } },
              })
            }
            style={{ marginTop: 8 }}
          />
          <textarea
            className="textarea"
            placeholder="Body EN (markdown)"
            style={{ minHeight: 160, marginTop: 8 }}
            value={editing.form.en.bodyMd}
            onChange={(e) =>
              setEditing({
                ...editing,
                form: { ...editing.form, en: { ...editing.form.en, bodyMd: e.target.value } },
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
        </Modal>
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

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
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
          maxWidth: 640,
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
