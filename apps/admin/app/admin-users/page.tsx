'use client';

import { useEffect, useState } from 'react';
import { adminDelete, adminGet, adminPost, adminPut } from '../../lib/api';

interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  admin_role_bindings: { admin_roles: { code: string; name: string } | null }[];
}
interface Role {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

interface CreateForm {
  email: string;
  password: string;
  displayName: string;
  roleCodes: string[];
}

interface EditForm {
  id: string;
  email: string;
  displayName: string;
  password: string;
  isActive: boolean;
  roleCodes: string[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [createForm, setCreateForm] = useState<CreateForm | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  async function load() {
    const [u, r] = await Promise.all([
      adminGet<{ items: AdminUser[] }>('/admin/users'),
      adminGet<{ items: Role[] }>('/admin/users/roles'),
    ]);
    setUsers(u.items ?? []);
    setRoles(r.items ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function create() {
    if (!createForm) return;
    const r = await adminPost<{ ok?: boolean; error?: string }>('/admin/users', {
      email: createForm.email,
      password: createForm.password,
      displayName: createForm.displayName,
      roleCodes: createForm.roleCodes,
    });
    if (r.error) {
      alert(r.error);
      return;
    }
    setCreateForm(null);
    await load();
  }

  async function saveEdit() {
    if (!editForm) return;
    const body: any = {
      isActive: editForm.isActive,
      displayName: editForm.displayName,
      roleCodes: editForm.roleCodes,
    };
    if (editForm.password) body.password = editForm.password;
    const r = await adminPut<{ ok?: boolean; error?: string }>(
      `/admin/users/${editForm.id}`,
      body,
    );
    if (r.error) {
      alert(r.error);
      return;
    }
    setEditForm(null);
    await load();
  }

  async function deactivate(id: string) {
    if (!confirm('Vô hiệu hoá admin này?')) return;
    const r = await adminDelete<{ ok?: boolean; error?: string }>(`/admin/users/${id}`);
    if (r.error) alert(r.error);
    await load();
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Quản trị viên</h1>
          <p className="page-subtitle">Tài khoản admin + role bindings.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() =>
            setCreateForm({ email: '', password: '', displayName: '', roleCodes: ['editor'] })
          }
        >
          + Thêm admin
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Tên hiển thị</th>
              <th>Roles</th>
              <th>Active</th>
              <th>Login gần nhất</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{ textAlign: 'center', padding: 28, color: 'var(--text-muted)' }}
                >
                  Chưa có admin.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.email}</strong>
                </td>
                <td>{u.display_name ?? '—'}</td>
                <td style={{ fontSize: 11 }}>
                  {u.admin_role_bindings
                    .map((b) => b.admin_roles?.code)
                    .filter(Boolean)
                    .join(', ') || '—'}
                </td>
                <td>{u.is_active ? '✓' : '—'}</td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : '—'}
                </td>
                <td style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      setEditForm({
                        id: u.id,
                        email: u.email,
                        displayName: u.display_name ?? '',
                        password: '',
                        isActive: u.is_active,
                        roleCodes: u.admin_role_bindings
                          .map((b) => b.admin_roles?.code)
                          .filter(Boolean) as string[],
                      })
                    }
                  >
                    Sửa
                  </button>
                  <button className="btn btn-secondary" onClick={() => deactivate(u.id)}>
                    Vô hiệu
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {createForm && (
        <Modal onClose={() => setCreateForm(null)} title="Thêm admin">
          <Field label="Email">
            <input
              className="input"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            />
          </Field>
          <Field label="Mật khẩu">
            <input
              className="input"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            />
          </Field>
          <Field label="Tên hiển thị">
            <input
              className="input"
              value={createForm.displayName}
              onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })}
            />
          </Field>
          <Field label="Roles">
            <RoleSelector
              all={roles}
              selected={createForm.roleCodes}
              onChange={(codes) => setCreateForm({ ...createForm, roleCodes: codes })}
            />
          </Field>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={create}>
              Tạo
            </button>
            <button className="btn btn-secondary" onClick={() => setCreateForm(null)}>
              Huỷ
            </button>
          </div>
        </Modal>
      )}

      {editForm && (
        <Modal onClose={() => setEditForm(null)} title={`Sửa: ${editForm.email}`}>
          <Field label="Tên hiển thị">
            <input
              className="input"
              value={editForm.displayName}
              onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
            />
          </Field>
          <Field label="Mật khẩu mới (để trống nếu không đổi)">
            <input
              className="input"
              type="password"
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
            />
          </Field>
          <label style={{ fontSize: 13 }}>
            <input
              type="checkbox"
              checked={editForm.isActive}
              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
            />{' '}
            Đang hoạt động
          </label>
          <Field label="Roles">
            <RoleSelector
              all={roles}
              selected={editForm.roleCodes}
              onChange={(codes) => setEditForm({ ...editForm, roleCodes: codes })}
            />
          </Field>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={saveEdit}>
              Lưu
            </button>
            <button className="btn btn-secondary" onClick={() => setEditForm(null)}>
              Huỷ
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function RoleSelector({
  all,
  selected,
  onChange,
}: {
  all: Role[];
  selected: string[];
  onChange: (codes: string[]) => void;
}) {
  function toggle(code: string) {
    if (selected.includes(code)) onChange(selected.filter((c) => c !== code));
    else onChange([...selected, code]);
  }
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {all.map((r) => (
        <label
          key={r.code}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            fontSize: 12,
          }}
        >
          <input
            type="checkbox"
            checked={selected.includes(r.code)}
            onChange={() => toggle(r.code)}
          />
          <span>
            {r.code}
            <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>({r.name})</span>
          </span>
        </label>
      ))}
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
          maxWidth: 480,
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
