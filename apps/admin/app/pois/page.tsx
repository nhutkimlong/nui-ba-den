'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminDelete, adminGet, adminPost, adminPut, adminUpload } from '../../lib/api';

interface PoiTr {
  locale: 'vi' | 'en';
  title: string;
  short_description: string | null;
  long_description: string | null;
}
interface PoiMedia {
  id: string;
  url: string;
  sort_order: number;
}
interface PoiQr {
  id: string;
  qr_value: string;
  is_active: boolean;
}
interface Poi {
  id: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  latitude: number | null;
  longitude: number | null;
  sort_order: number;
  poi_categories: { code: string } | null;
  poi_translations: PoiTr[];
  poi_media: PoiMedia[];
  poi_qr_codes: PoiQr[];
}
interface PoiCategoryRow {
  id: string;
  code: string;
  poi_category_translations: { locale: 'vi' | 'en'; name: string }[];
}

interface Form {
  slug: string;
  categoryCode: string;
  qrCodeValue: string;
  latitude: number;
  longitude: number;
  status: 'draft' | 'published' | 'archived';
  imageUrl: string;
  vi: { title: string; shortDescription: string; longDescription: string };
  en: { title: string; shortDescription: string; longDescription: string };
}

const empty: Form = {
  slug: '',
  categoryCode: 'scenic',
  qrCodeValue: '',
  latitude: 11.37,
  longitude: 106.17,
  status: 'draft',
  imageUrl: '',
  vi: { title: '', shortDescription: '', longDescription: '' },
  en: { title: '', shortDescription: '', longDescription: '' },
};

export default function PoiAdminPage() {
  const [items, setItems] = useState<Poi[]>([]);
  const [cats, setCats] = useState<PoiCategoryRow[]>([]);
  const [editing, setEditing] = useState<{ id: string | null; form: Form } | null>(null);
  const [qrModal, setQrModal] = useState<{
    slug: string;
    qrValue: string;
    deepLink: string;
    dataUrl: string;
  } | null>(null);

  async function load() {
    const [pois, c] = await Promise.all([
      adminGet<{ items: Poi[] }>('/admin/pois'),
      adminGet<{ items: PoiCategoryRow[] }>('/admin/categories/poi'),
    ]);
    setItems(pois.items ?? []);
    setCats(c.items ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setEditing({ id: null, form: { ...empty, vi: { ...empty.vi }, en: { ...empty.en } } });
  }
  function startEdit(p: Poi) {
    const vi = p.poi_translations.find((t) => t.locale === 'vi');
    const en = p.poi_translations.find((t) => t.locale === 'en');
    setEditing({
      id: p.id,
      form: {
        slug: p.slug,
        categoryCode: p.poi_categories?.code ?? 'scenic',
        qrCodeValue: p.poi_qr_codes?.[0]?.qr_value ?? '',
        latitude: p.latitude ?? 0,
        longitude: p.longitude ?? 0,
        status: p.status,
        imageUrl: p.poi_media?.[0]?.url ?? '',
        vi: {
          title: vi?.title ?? '',
          shortDescription: vi?.short_description ?? '',
          longDescription: vi?.long_description ?? '',
        },
        en: {
          title: en?.title ?? '',
          shortDescription: en?.short_description ?? '',
          longDescription: en?.long_description ?? '',
        },
      },
    });
  }
  async function save() {
    if (!editing) return;
    const body = {
      ...editing.form,
      latitude: Number(editing.form.latitude),
      longitude: Number(editing.form.longitude),
    };
    if (editing.id) await adminPut(`/admin/pois/${editing.id}`, body);
    else await adminPost('/admin/pois', body);
    setEditing(null);
    await load();
  }
  async function remove(id: string) {
    if (!confirm('Xoá POI này (cùng dịch và media)?')) return;
    await adminDelete(`/admin/pois/${id}`);
    await load();
  }
  async function showQr(id: string) {
    const r = await adminGet<{
      slug?: string;
      qrValue?: string;
      deepLink?: string;
      dataUrl?: string;
      error?: string;
    }>(`/admin/pois/${id}/qr`);
    if (r.error || !r.dataUrl) {
      alert(r.error ?? 'Không lấy được mã QR');
      return;
    }
    setQrModal({
      slug: r.slug ?? '',
      qrValue: r.qrValue ?? '',
      deepLink: r.deepLink ?? '',
      dataUrl: r.dataUrl,
    });
  }
  async function uploadImage(file: File) {
    if (!editing) return;
    const r = await adminUpload<{ publicUrl?: string; error?: string }>(
      '/admin/uploads/poi',
      file,
    );
    if (r.publicUrl) {
      setEditing({ ...editing, form: { ...editing.form, imageUrl: r.publicUrl } });
    } else alert(r.error ?? 'upload failed');
  }

  const categoryOptions = useMemo(
    () =>
      cats.map((c) => ({
        code: c.code,
        label: c.poi_category_translations.find((t) => t.locale === 'vi')?.name ?? c.code,
      })),
    [cats],
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">POI &amp; Check-in</h1>
          <p className="page-subtitle">Điểm tham quan, mã QR, ảnh, mô tả song ngữ.</p>
        </div>
        <button className="btn btn-primary" onClick={startCreate}>
          + Thêm POI
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Slug</th>
              <th>Tiêu đề VI</th>
              <th>Status</th>
              <th>QR</th>
              <th>GPS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.slug}</strong>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                    {p.poi_categories?.code}
                  </div>
                </td>
                <td>{p.poi_translations.find((t) => t.locale === 'vi')?.title ?? '—'}</td>
                <td>
                  <span className={`pill status-${p.status}`}>{p.status}</span>
                </td>
                <td style={{ fontSize: 12 }}>{p.poi_qr_codes?.[0]?.qr_value ?? '—'}</td>
                <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {p.latitude?.toFixed(4)}, {p.longitude?.toFixed(4)}
                </td>
                <td style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => showQr(p.id)}>
                    QR
                  </button>
                  <button className="btn btn-secondary" onClick={() => startEdit(p)}>
                    Sửa
                  </button>
                  <button className="btn btn-secondary" onClick={() => remove(p.id)}>
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <PoiEditModal
          form={editing.form}
          isEdit={!!editing.id}
          categories={categoryOptions}
          onChange={(form) => setEditing({ ...editing, form })}
          onUpload={uploadImage}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}

      {qrModal && <QrModal data={qrModal} onClose={() => setQrModal(null)} />}
    </>
  );
}

function QrModal({
  data,
  onClose,
}: {
  data: { slug: string; qrValue: string; deepLink: string; dataUrl: string };
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
        alignItems: 'flex-start',
        padding: '40px 16px',
        zIndex: 60,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 20,
          maxWidth: 420,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <h3 style={{ margin: '0 0 6px' }}>Mã QR check-in</h3>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          Slug: <strong>{data.slug}</strong>
        </div>
        <img
          src={data.dataUrl}
          alt="QR"
          style={{
            width: 280,
            height: 280,
            maxWidth: '100%',
            border: '1px solid var(--border)',
            borderRadius: 8,
          }}
        />
        <div
          style={{
            marginTop: 12,
            padding: 10,
            background: 'var(--surface-2, #f1f5f9)',
            borderRadius: 8,
            fontSize: 12,
            wordBreak: 'break-all',
          }}
        >
          <div>
            <strong>Value:</strong> {data.qrValue}
          </div>
          <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>{data.deepLink}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
          <a
            className="btn btn-primary"
            href={data.dataUrl}
            download={`qr-${data.slug || 'poi'}.png`}
          >
            Tải PNG
          </a>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            In
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function PoiEditModal({
  form,
  isEdit,
  categories,
  onChange,
  onUpload,
  onSave,
  onClose,
}: {
  form: Form;
  isEdit: boolean;
  categories: { code: string; label: string }[];
  onChange: (f: Form) => void;
  onUpload: (file: File) => Promise<void>;
  onSave: () => Promise<void>;
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
          maxWidth: 640,
          width: '100%',
          maxHeight: 'calc(100vh - 80px)',
          overflowY: 'auto',
        }}
      >
        <h3 style={{ marginTop: 0 }}>{isEdit ? 'Sửa POI' : 'Thêm POI'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Slug">
            <input
              className="input"
              value={form.slug}
              onChange={(e) => onChange({ ...form, slug: e.target.value })}
              disabled={isEdit}
            />
          </Field>
          <Field label="Danh mục">
            <select
              className="input"
              value={form.categoryCode}
              onChange={(e) => onChange({ ...form, categoryCode: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Latitude">
            <input
              type="number"
              step="0.0001"
              className="input"
              value={form.latitude}
              onChange={(e) => onChange({ ...form, latitude: Number(e.target.value) })}
            />
          </Field>
          <Field label="Longitude">
            <input
              type="number"
              step="0.0001"
              className="input"
              value={form.longitude}
              onChange={(e) => onChange({ ...form, longitude: Number(e.target.value) })}
            />
          </Field>
          <Field label="QR value">
            <input
              className="input"
              value={form.qrCodeValue}
              onChange={(e) => onChange({ ...form, qrCodeValue: e.target.value })}
            />
          </Field>
          <Field label="Status">
            <select
              className="input"
              value={form.status}
              onChange={(e) => onChange({ ...form, status: e.target.value as Form['status'] })}
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </Field>
        </div>

        <Field label="Hình ảnh hero">
          {form.imageUrl && (
            <img src={form.imageUrl} alt="" style={{ maxHeight: 140, borderRadius: 8 }} />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
          />
          <input
            className="input"
            placeholder="hoặc URL ảnh trực tiếp"
            value={form.imageUrl}
            onChange={(e) => onChange({ ...form, imageUrl: e.target.value })}
          />
        </Field>

        <h4 style={{ margin: '12px 0 4px' }}>Tiếng Việt</h4>
        <Field label="Tiêu đề VI">
          <input
            className="input"
            value={form.vi.title}
            onChange={(e) => onChange({ ...form, vi: { ...form.vi, title: e.target.value } })}
          />
        </Field>
        <Field label="Mô tả ngắn VI">
          <textarea
            className="textarea"
            value={form.vi.shortDescription}
            onChange={(e) =>
              onChange({ ...form, vi: { ...form.vi, shortDescription: e.target.value } })
            }
          />
        </Field>
        <Field label="Mô tả dài VI">
          <textarea
            className="textarea"
            value={form.vi.longDescription}
            onChange={(e) =>
              onChange({ ...form, vi: { ...form.vi, longDescription: e.target.value } })
            }
            style={{ minHeight: 100 }}
          />
        </Field>

        <h4 style={{ margin: '12px 0 4px' }}>English</h4>
        <Field label="Title EN">
          <input
            className="input"
            value={form.en.title}
            onChange={(e) => onChange({ ...form, en: { ...form.en, title: e.target.value } })}
          />
        </Field>
        <Field label="Short EN">
          <textarea
            className="textarea"
            value={form.en.shortDescription}
            onChange={(e) =>
              onChange({ ...form, en: { ...form.en, shortDescription: e.target.value } })
            }
          />
        </Field>
        <Field label="Long EN">
          <textarea
            className="textarea"
            value={form.en.longDescription}
            onChange={(e) =>
              onChange({ ...form, en: { ...form.en, longDescription: e.target.value } })
            }
            style={{ minHeight: 100 }}
          />
        </Field>

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
    <div className="field" style={{ marginTop: 8 }}>
      <label className="field-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
