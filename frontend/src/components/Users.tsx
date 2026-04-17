import { useEffect, useMemo, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import '../styles/Users.scss';

type Role = 'ADMIN' | 'USER' | 'GEST' | 'GUEST';

interface CurrentUser {
  id: number;
  name?: string;
  email: string;
  role: Role;
  organizationId: number;
}

interface ManagedUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  organizationId: number;
  organizationName?: string | null;
  createdAt: string;
}

interface Organization {
  id: number;
  name: string;
  email?: string | null;
}

interface UserFormState {
  name: string;
  email: string;
  role: Role;
  password: string;
  organizationId: string;
}

interface OrganizationFormState {
  name: string;
  email: string;
}

interface UsersProps {
  user: CurrentUser;
  onLogout: () => void;
}

const emptyForm: UserFormState = {
  name: '',
  email: '',
  role: 'GEST',
  password: '',
  organizationId: '',
};

const emptyOrgForm: OrganizationFormState = {
  name: '',
  email: '',
};

const normalizeRole = (role: Role): Role => {
  if (role === 'GUEST') return 'GEST';
  return role;
};

const roleLabel = (role: Role) => {
  const normalized = normalizeRole(role);
  switch (normalized) {
    case 'ADMIN':
      return 'admin';
    case 'USER':
      return 'user';
    case 'GEST':
      return 'guest';
    default:
      return normalized;
  }
};

function Users({ user, onLogout }: UsersProps) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState<number | ''>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [formState, setFormState] = useState<UserFormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [isOrgFormOpen, setIsOrgFormOpen] = useState(false);
  const [orgFormState, setOrgFormState] = useState<OrganizationFormState>(emptyOrgForm);
  const [orgSubmitting, setOrgSubmitting] = useState(false);

  const isSystemAdmin = normalizeRole(user.role) === 'ADMIN';
  const isOrganizationAdmin = normalizeRole(user.role) === 'USER';
  const canManage = isSystemAdmin || isOrganizationAdmin;

  const availableRoles: Role[] = useMemo(() => {
    if (isSystemAdmin) return ['ADMIN', 'USER', 'GEST'];
    if (isOrganizationAdmin) return ['USER', 'GEST'];
    return ['GEST'];
  }, [isSystemAdmin, isOrganizationAdmin]);

  const getRoleDescription = (role: Role) => {
    const normalized = normalizeRole(role);
    if (normalized === 'ADMIN') {
      return 'システム管理者（全体管理）';
    }
    if (normalized === 'USER') {
      return 'お客様組織の管理者';
    }
    return 'お客様組織の一般社員';
  };

  const canOperateTarget = (target: ManagedUser) => {
    if (!canManage) return false;

    if (isSystemAdmin) return true;

    if (target.organizationId !== user.organizationId) return false;

    return normalizeRole(target.role) !== 'ADMIN';
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        setError('ユーザー管理の権限がありません');
        setUsers([]);
        return;
      }

      if (!response.ok) {
        throw new Error('ユーザー一覧の取得に失敗しました');
      }

      const data: ManagedUser[] = await response.json();
      setUsers(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ユーザー一覧の取得に失敗しました';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    if (!isSystemAdmin) {
      setOrganizations([]);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/organizations', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('組織一覧の取得に失敗しました');
      }

      const data: Organization[] = await response.json();
      setOrganizations(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : '組織一覧の取得に失敗しました';
      setError(message);
    }
  };

  const openOrgModal = () => {
    setIsOrgModalOpen(true);
  };

  const openOrgCreateForm = () => {
    setEditingOrg(null);
    setOrgFormState(emptyOrgForm);
    setIsOrgFormOpen(true);
  };

  const openOrgEditForm = (org: Organization) => {
    setEditingOrg(org);
    setOrgFormState({
      name: org.name,
      email: org.email || '',
    });
    setIsOrgFormOpen(true);
  };

  const closeOrgModal = () => {
    setIsOrgModalOpen(false);
  };

  const closeOrgFormModal = () => {
    setIsOrgFormOpen(false);
    setEditingOrg(null);
    setOrgFormState(emptyOrgForm);
  };

  const handleOrgSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isSystemAdmin) {
      setError('組織管理の権限がありません');
      return;
    }

    const normalizedName = orgFormState.name.trim();
    const normalizedEmail = orgFormState.email.trim();

    if (!normalizedName) {
      setError('組織名を入力してください');
      return;
    }

    try {
      setOrgSubmitting(true);
      setError(null);

      const payload: Record<string, string | null> = {
        name: normalizedName,
      };

      // 空文字を null で送って既存メールをクリアできるようにする
      payload.email = normalizedEmail || null;

      const targetUrl = editingOrg
        ? `http://localhost:3000/api/organizations/${editingOrg.id}`
        : 'http://localhost:3000/api/organizations';
      const method = editingOrg ? 'PUT' : 'POST';

      const response = await fetch(targetUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || '保存に失敗しました');
      }

      closeOrgFormModal();
      await fetchOrganizations();
      await fetchUsers(); // 組織が変わるとユーザー一覧も更新
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存に失敗しました';
      setError(message);
    } finally {
      setOrgSubmitting(false);
    }
  };

  const handleOrgDelete = async (org: Organization) => {
    if (!isSystemAdmin) {
      setError('組織管理の権限がありません');
      return;
    }

    if (!window.confirm(`組織「${org.name}」を削除しますか？\n注意: この組織に所属するユーザーがいる場合は削除できません。`)) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`http://localhost:3000/api/organizations/${org.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || '削除に失敗しました');
      }

      await fetchOrganizations();
      await fetchUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : '削除に失敗しました';
      setError(message);
    }
  };

  useEffect(() => {
    void fetchUsers();
    void fetchOrganizations();
  }, []);

  const openCreateForm = () => {
    const defaultOrganizationId = isSystemAdmin ? String(organizations[0]?.id || '') : String(user.organizationId);
    setEditingUser(null);
    setFormState({
      ...emptyForm,
      role: availableRoles[0],
      organizationId: defaultOrganizationId,
    });
    setIsFormOpen(true);
  };

  const openEditForm = (target: ManagedUser) => {
    setEditingUser(target);
    setFormState({
      name: target.name,
      email: target.email,
      role: normalizeRole(target.role),
      password: '',
      organizationId: String(target.organizationId),
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingUser(null);
    setFormState(emptyForm);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canManage) {
      setError('ユーザー管理の権限がありません');
      return;
    }

    if (!formState.name || !formState.email) {
      setError('名前とメールアドレスを入力してください');
      return;
    }

    if (!editingUser && !formState.password) {
      setError('新規作成時はパスワードが必須です');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: Record<string, string | number> = {
        name: formState.name,
        email: formState.email,
        role: normalizeRole(formState.role),
      };

      if (formState.password) {
        payload.password = formState.password;
      }

      if (isSystemAdmin && !editingUser) {
        payload.organizationId = Number(formState.organizationId);
      }

      const targetUrl = editingUser
        ? `http://localhost:3000/api/users/${editingUser.id}`
        : 'http://localhost:3000/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const response = await fetch(targetUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || '保存に失敗しました');
      }

      closeForm();
      await fetchUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存に失敗しました';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (target: ManagedUser) => {
    if (!canOperateTarget(target)) {
      setError('このユーザーは削除できません');
      return;
    }

    if (target.id === user.id) {
      setError('自分自身は削除できません');
      return;
    }

    if (!window.confirm(`ユーザー「${target.name}」を削除しますか？`)) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`http://localhost:3000/api/users/${target.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || '削除に失敗しました');
      }

      await fetchUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : '削除に失敗しました';
      setError(message);
    }
  };

  const filteredUsers = users.filter((entry) => {
    const search = searchTerm.trim().toLowerCase();
    if (search && !(
      entry.name.toLowerCase().includes(search) ||
      entry.email.toLowerCase().includes(search) ||
      roleLabel(entry.role).includes(search) ||
      (entry.organizationName || '').toLowerCase().includes(search)
    )) {
      return false;
    }

    if (organizationFilter !== '' && entry.organizationId !== organizationFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="users-container">
      <Header user={user} onLogout={onLogout} />
      <div className="users-body">
        <Sidebar currentPage="Users" />

        <main className="main-content">
          <div className="content-wrapper">
            <h2 className="page-title">ユーザー管理 <span>Users</span></h2>

            <div className="role-description-grid">
              {(['ADMIN', 'USER', 'GEST'] as Role[]).map((role) => (
                <div key={role} className={`role-card role-${role.toLowerCase()}`}>
                  <h3>{roleLabel(role)}</h3>
                  <p>{getRoleDescription(role)}</p>
                </div>
              ))}
            </div>

            <div className="users-controls">
              <div className="search-filter-group">
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="名前・メール・権限で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>

                {isSystemAdmin && (
                  <div className="filter-container">
                    <select
                      value={organizationFilter}
                      onChange={(e) => setOrganizationFilter(e.target.value === '' ? '' : Number(e.target.value))}
                      className="org-filter-select"
                    >
                      <option value="">すべての組織</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="action-buttons">
                {canManage && (
                  <button className="action-button create-button" onClick={openCreateForm}>
                    ユーザー追加
                  </button>
                )}

                {isSystemAdmin && (
                  <button className="action-button org-button" onClick={openOrgModal}>
                    組織管理
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="error-message">
                <p>{error}</p>
                <button onClick={() => setError(null)}>閉じる</button>
              </div>
            )}

            <div className="users-list">
              {loading ? (
                <div className="loading">読み込み中...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="empty-state">表示できるユーザーがいません</div>
              ) : (
                <div className="users-table-card">
                  <table>
                    <thead>
                      <tr>
                        <th>名前</th>
                        <th>メール</th>
                        <th>権限</th>
                        {isSystemAdmin && <th>組織</th>}
                        <th>登録日</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((entry) => {
                        const canOperate = canOperateTarget(entry);
                        const isSelf = entry.id === user.id;

                        return (
                          <tr key={entry.id}>
                            <td>{entry.name}</td>
                            <td>{entry.email}</td>
                            <td>
                              <span className={`role-badge role-${roleLabel(entry.role)}`}>
                                {roleLabel(entry.role)}
                              </span>
                            </td>
                            {isSystemAdmin && <td>{entry.organizationName || `#${entry.organizationId}`}</td>}
                            <td>{new Date(entry.createdAt).toLocaleDateString('ja-JP')}</td>
                            <td>
                              {canOperate ? (
                                <>
                                  <button className="table-action edit" onClick={() => openEditForm(entry)}>
                                    編集
                                  </button>
                                  <button
                                    className="table-action delete"
                                    onClick={() => handleDelete(entry)}
                                    disabled={isSelf}
                                  >
                                    削除
                                  </button>
                                </>
                              ) : (
                                <span className="no-permission">閲覧のみ</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {isFormOpen && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingUser ? 'ユーザー編集' : 'ユーザー追加'}</h3>
              <button className="modal-close" onClick={closeForm}>×</button>
            </div>

            <form className="user-form" onSubmit={handleSubmit}>
              <label>
                名前
                <input
                  type="text"
                  value={formState.name}
                  onChange={(e) => setFormState((prev: UserFormState) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </label>

              <label>
                メールアドレス
                <input
                  type="email"
                  value={formState.email}
                  onChange={(e) => setFormState((prev: UserFormState) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </label>

              <label>
                権限
                <select
                  value={formState.role}
                  onChange={(e) => setFormState((prev: UserFormState) => ({ ...prev, role: e.target.value as Role }))}
                  required
                >
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {roleLabel(role)}
                    </option>
                  ))}
                </select>
              </label>

              {isSystemAdmin && !editingUser && (
                <label>
                  組織
                  <select
                    value={formState.organizationId}
                    onChange={(e) => setFormState((prev: UserFormState) => ({ ...prev, organizationId: e.target.value }))}
                    required
                  >
                    <option value="">選択してください</option>
                    {organizations.map((organization) => (
                      <option key={organization.id} value={organization.id}>
                        {organization.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {isSystemAdmin && editingUser && (
                <label>
                  組織
                  <input
                    type="text"
                    value={organizations.find((org) => org.id === Number(formState.organizationId))?.name || `#${formState.organizationId}`}
                    disabled
                  />
                </label>
              )}

              <label>
                パスワード {editingUser ? '(変更時のみ入力)' : ''}
                <input
                  type="password"
                  value={formState.password}
                  onChange={(e) => setFormState((prev: UserFormState) => ({ ...prev, password: e.target.value }))}
                  required={!editingUser}
                />
              </label>

              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={closeForm} disabled={submitting}>
                  キャンセル
                </button>
                <button type="submit" className="submit-button" disabled={submitting}>
                  {submitting ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isOrgModalOpen && (
        <div className="modal-overlay" onClick={closeOrgModal}>
          <div className="modal-content org-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>組織管理</h3>
              <button className="modal-close" onClick={closeOrgModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="org-list">
                <div className="org-list-header">
                  <h4>組織一覧</h4>
                  <button className="action-button org-button" onClick={openOrgCreateForm}>
                    組織追加
                  </button>
                </div>

                <div className="org-table-card">
                  <table>
                    <thead>
                      <tr>
                        <th>組織名</th>
                        <th>メール</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {organizations.map((org) => (
                        <tr key={org.id}>
                          <td>{org.name}</td>
                          <td>{org.email || '-'}</td>
                          <td>
                            <button className="table-action edit" onClick={() => openOrgEditForm(org)}>
                              編集
                            </button>
                            <button
                              className="table-action delete"
                              onClick={() => handleOrgDelete(org)}
                            >
                              削除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>


            </div>
          </div>
        </div>
      )}

      {isOrgFormOpen && (
        <div className="modal-overlay org-form-overlay" onClick={closeOrgFormModal}>
          <div className="modal-content org-form-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingOrg ? '組織編集' : '組織追加'}</h3>
              <button className="modal-close" onClick={closeOrgFormModal}>×</button>
            </div>

            <form className="org-form-content" onSubmit={handleOrgSubmit}>
              <label>
                組織名
                <input
                  type="text"
                  value={orgFormState.name}
                  onChange={(e) => setOrgFormState((prev: OrganizationFormState) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </label>

              <label>
                メールアドレス (任意)
                <input
                  type="email"
                  value={orgFormState.email}
                  onChange={(e) => setOrgFormState((prev: OrganizationFormState) => ({ ...prev, email: e.target.value }))}
                />
              </label>

              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={closeOrgFormModal} disabled={orgSubmitting}>
                  キャンセル
                </button>
                <button type="submit" className="submit-button" disabled={orgSubmitting}>
                  {orgSubmitting ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
