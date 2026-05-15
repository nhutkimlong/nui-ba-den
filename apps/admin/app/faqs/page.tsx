'use client';

import { useEffect, useState } from 'react';
import { adminDelete, adminGet, adminPost, adminPut } from '../../lib/api';

interface FaqTr {
  locale: 'vi' | 'en';
  question: string;
  answer_md: string;
}
interface FaqItem {
  id: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  sort_order: number;
  faq_item_translations: FaqTr[];
}

interface Form {
  tags: string;
  status: 'draft' | 'published' | 'archived';
  vi: { question: string; answer: string };
  en: { question: string; answer: string };
}

const blank: Form = {
  tags: '',
  status: 'draft',
  vi: { question: '', answer: '' },
  en: { question: '', answer: '' },
};

export default function FaqAdminPage() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [editing, setEditing] = useState<{ id: string | null; form: Form } | null>(null);

  async function load() {
    const r = await adminGet<{ items: FaqItem[] }>('/admin/faqs');
    setItems(r.items ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setEditing({ id: null, form: { ...blank, vi: { ...blank.vi }, en: { ...blank.en } } });
  }
  function startEdit(it: FaqItem) {
    const vi = it.faq_item_translations.find((t) => t.locale === 'vi');
    const en = it.faq_item_translations.find((t) => t.locale === 'en');
    setEditing({
      id: it.id,
      form: {
        tags: it.tags.join(', '),
        status: it.status,
        vi: { question: vi?.question ?? '', answer: vi?.answer_md ?? '' },
        en: { question: en?.question ?? '', answer: en?.answer_md ?? '' },
      },
    });
  }
  async function save() {
    if (!editing) return;
    const body = {
      tags: editing.form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      status: editing.form.status,
      vi: editing.form.vi,
      en: editing.form.en,
    };
    if (editing.id) await adminPut(`/admin/faqs/${editing.id}`, body);
    else await adminPost('/admin/faqs', body);
    setEditing(null);
    await load();
  }
  async function remove(id: string) {
    if (!confirm('Xoá KB item này?')) return;
    await adminDelete(`/admin/faqs/${id}`);
    await load();
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">KB Chatbot / FAQ</h1>
          <p className="page-subtitle">Knowledge base chatbot Núi Bà Đen dùng để trả lời.</p>
        </div>
        <button className="btn btn-primary" onClick={startCreate}>
          + Thêm KB item
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Câu hỏi VI</th>
              <th>Question EN</th>
              <th>Tags</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.faq_item_translations.find((t) => t.locale === 'vi')?.question ?? '—'}</td>
                <td>{it.faq_item_translations.find((t) => t.locale === 'en')?.question ?? '—'}</td>
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
              maxWidth: 560,
              width: '100%',
              maxHeight: 'calc(100vh - 80px)',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ marginTop: 0 }}>{editing.id ? 'Sửa KB item' : 'Thêm KB item'}</h3>
            <div className="field" style={{ marginTop: 8 }}>
              <label className="field-label">Tags (cách bằng dấu phẩy)</label>
              <input
                className="input"
                value={editing.form.tags}
                onChange={(e) =>
                  setEditing({ ...editing, form: { ...editing.form, tags: e.target.value } })
                }
              />
            </div>
            <div className="field" style={{ marginTop: 8 }}>
              <label className="field-label">Status</label>
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
            </div>
            <h4 style={{ margin: '12px 0 4px' }}>Tiếng Việt</h4>
            <input
              className="input"
              placeholder="Câu hỏi VI"
              value={editing.form.vi.question}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  form: { ...editing.form, vi: { ...editing.form.vi, question: e.target.value } },
                })
              }
            />
            <textarea
              className="textarea"
              placeholder="Trả lời VI (markdown)"
              value={editing.form.vi.answer}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  form: { ...editing.form, vi: { ...editing.form.vi, answer: e.target.value } },
                })
              }
              style={{ minHeight: 100, marginTop: 8 }}
            />
            <h4 style={{ margin: '12px 0 4px' }}>English</h4>
            <input
              className="input"
              placeholder="Question EN"
              value={editing.form.en.question}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  form: { ...editing.form, en: { ...editing.form.en, question: e.target.value } },
                })
              }
            />
            <textarea
              className="textarea"
              placeholder="Answer EN (markdown)"
              value={editing.form.en.answer}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  form: { ...editing.form, en: { ...editing.form.en, answer: e.target.value } },
                })
              }
              style={{ minHeight: 100, marginTop: 8 }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={save}>
                Lưu
              </button>
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
