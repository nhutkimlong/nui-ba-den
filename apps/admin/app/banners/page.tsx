'use client';

import { useEffect, useState } from 'react';
import { adminDelete, adminGet, adminPost, adminPut, adminUpload } from '../../lib/api';

interface BannerTr {
  locale: 'vi' | 'en';
  title: string | null;
  subtitle: string | null;
}
interface Banner {
  id: string;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  banner_translations: BannerTr[];
}

const empty: BannerForm = {
  imageUrl: '',
  linkUrl: '',
  sortOrder: 0,
  isActive: true,
  vi: { title: '', subtitle: '' },
  en: { title: '', subtitle: '' },
};

interface BannerForm {
  imageUrl: string;
  linkUrl: string;
  sortOrder: number;
  isActive: boolean;
  vi: { title: string; subtitle: string };
  en: { title: string; subtitle: string };
}

export default function BannersPage() {
  const [items, setItems] = useState<Banner[]>([]);
  const [editing, setEditing] = useState<{ id: string | null; form: BannerForm } | null>(null);

  async function load() {
    const r = await adminGet<{ items: Banner[] }>('/admin/banners');
    setItems(r.items ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setEditing({ id: null, form: { ...empty, vi: { ...empty.vi }, en: { ...empty.en } } });
  }
  function startEdit(b: Banner) {
    const vi = b.banner_translations.find((t) => t.locale === 'vi');
    const en = b.banner_translations.find((t) => t.locale === 'en');
    setEditing({
      id: b.id,
      form: {
        imageUrl: b.image_url,
        linkUrl: b.link_url ?? '',
        sortOrder: b.sort_order,
        isActive: b.is_active,
        vi: { title: vi?.title ?? '', subtitle: vi?.subtitle ?? '' },
        en: { title: en?.title ?? '', subtitle: en?.subtitle ?? '' },
      },
    });
  }
  async function save() {
    if (!editing) return;
    const body = {
      imageUrl: editing.form.imageUrl,
      linkUrl: editing.form.linkUrl || null,
      sortOrder: Number(editing.form.sortOrder) || 0,
      isActive: editing.form.isActive,
      vi: editing.form.vi,
      en: editing.form.en,
    };
    if (editing.id) await adminPut(`/admin/banners/${editing.id}`, body);
    else await adminPost('/admin/banners', body);
    setEditing(null);
    await load();
  }
  async function remove(id: string) {
    if (!confirm('Xoá banner này?')) return;
    await adminDelete(`/admin/banners/${id}`);
    await load();
  }
  async function uploadImage(file: File) {
    if (!editing) return;
    const r = await adminUpload<{ publicUrl?: string; error?: string }>(
      '/admin/uploads/branding',
      file,
    );
    if (r.publicUrl) {
      setEditing({ ...editing, form: { ...editing.form, imageUrl: r.publicUrl } });
    } else alert(r.error ?? 'upload failed');
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Banners & Hero</h1>
          <p className="page-subtitle">Banner trang chủ mini app, ảnh hero.</p>
        </div>
        <button className="btn btn-primary" onClick={startCreate}>
          + Thêm banner
        </button>
      </div>

      <div className="card">
        {items.length === 0 && <div style={{ color: 'var(--text-muted)' }}>Chưa có banner.</div>}
        {items.map((b) => (
          <div
            key={b.id}
            style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #eee' }}
          >
            <img
              src={b.image_url}
              alt=""
              style={{ width: 96, height: 64, objectFit: 'cover', borderRadius: 8 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>
                {b.banner_translations.find((t) => t.locale === 'vi')?.title ?? '(no title vi)'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                sort {b.sort_order} · {b.is_active ? 'active' : 'inactive'}
              </div>
            </div>
            <button className="btn btn-secondary" onClick={() => startEdit(b)}>
              Sửa
            </button>
            <button className="btn btn-secondary" onClick={() => remove(b.id)}>
              Xoá
            </button>
          </div>
        ))}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? 'Sửa banner' : 'Thêm banner'}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {editing.form.imageUrl && (
              <img
                src={editing.form.imageUrl}
                alt=""
                style={{ maxHeight: 120, borderRadius: 8 }}
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
            />
            <Field label="Image URL">
              <input
                value={editing.form.imageUrl}
                onChange={(e) =>
                  setEditing({ ...editing, form: { ...editing.form, imageUrl: e.target.value } })
                }
                style={inputStyle}
              />
            </Field>
            <Field label="Link URL">
              <input
                value={editing.form.linkUrl}
                onChange={(e) =>
                  setEditing({ ...editing, form: { ...editing.form, linkUrl: e.target.value } })
                }
                style={inputStyle}
              />
            </Field>
            <Field label="Sort">
              <input
                type="number"
                value={editing.form.sortOrder}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    form: { ...editing.form, sortOrder: Number(e.target.value) },
                  })
                }
                style={inputStyle}
              />
            </Field>
            <label style={{ fontSize: 13 }}>
              <input
                type="checkbox"
                checked={editing.form.isActive}
                onChange={(e) =>
                  setEditing({ ...editing, form: { ...editing.form, isActive: e.target.checked } })
                }
              />{' '}
              Hiện trên trang chủ
            </label>
            <h4 style={{ margin: '8px 0 0' }}>Tiếng Việt</h4>
            <Field label="Title VI">
              <input
                value={editing.form.vi.title}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    form: { ...editing.form, vi: { ...editing.form.vi, title: e.target.value } },
                  })
                }
                style={inputStyle}
              />
            </Field>
            <Field label="Subtitle VI">
              <input
                value={editing.form.vi.subtitle}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    form: {
                      ...editing.form,
                      vi: { ...editing.form.vi, subtitle: e.target.value },
                    },
                  })
                }
                style={inputStyle}
              />
            </Field>
            <h4 style={{ margin: '8px 0 0' }}>English</h4>
            <Field label="Title EN">
              <input
                value={editing.form.en.title}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    form: { ...editing.form, en: { ...editing.form.en, title: e.target.value } },
                  })
                }
                style={inputStyle}
              />
            </Field>
            <Field label="Subtitle EN">
              <input
                value={editing.form.en.subtitle}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    form: {
                      ...editing.form,
                      en: { ...editing.form.en, subtitle: e.target.value },
                    },
                  })
                }
                style={inputStyle}
              />
            </Field>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary" onClick={save}>
                Lưu
              </button>
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>
                Huỷ
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 12, display: 'block' }}>
      <div style={{ marginBottom: 4, color: 'var(--text-muted)' }}>{label}</div>
      {children}
    </label>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
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
        alignItems: 'flex-start',
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
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid #d0d0d0',
  fontSize: 14,
};
