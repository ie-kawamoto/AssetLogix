import { useEffect, useState } from 'react';

type BorrowerType = 'INTERNAL_DEPARTMENT' | 'EXTERNAL_ORGANIZATION' | 'INDIVIDUAL';

interface Borrower {
  id: number;
  name: string;
  type: BorrowerType;
  contactInfo?: string;
  notes?: string;
}

interface BorrowerManageModalProps {
  onClose: () => void;
  onBorrowerChange: () => void;
}

interface BorrowerFormState {
  name: string;
  type: BorrowerType;
  contactInfo: string;
  notes: string;
}

const DEFAULT_FORM: BorrowerFormState = {
  name: '',
  type: 'INTERNAL_DEPARTMENT',
  contactInfo: '',
  notes: '',
};

function BorrowerManageModal({ onClose, onBorrowerChange }: BorrowerManageModalProps) {
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBorrower, setNewBorrower] = useState<BorrowerFormState>(DEFAULT_FORM);
  const [editingBorrowerId, setEditingBorrowerId] = useState<number | null>(null);
  const [editingBorrower, setEditingBorrower] = useState<BorrowerFormState>(DEFAULT_FORM);

  useEffect(() => {
    fetchBorrowers();
  }, []);

  const fetchBorrowers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/borrowers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('貸出先一覧の取得に失敗しました');
      }

      const data = await response.json();
      setBorrowers(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching borrowers:', err);
      setError(err.message || '貸出先一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: BorrowerType) => {
    switch (type) {
      case 'INTERNAL_DEPARTMENT':
        return '内部部門';
      case 'EXTERNAL_ORGANIZATION':
        return '外部組織';
      case 'INDIVIDUAL':
        return '個人';
      default:
        return type;
    }
  };

  const handleCreateBorrower = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newBorrower.name.trim()) {
      setError('貸出先名を入力してください');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('http://localhost:3000/api/borrowers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newBorrower.name.trim(),
          type: newBorrower.type,
          contactInfo: newBorrower.contactInfo.trim(),
          notes: newBorrower.notes.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || '貸出先の作成に失敗しました');
      }

      setNewBorrower(DEFAULT_FORM);
      await fetchBorrowers();
      onBorrowerChange();
    } catch (err: any) {
      console.error('Error creating borrower:', err);
      setError(err.message || '貸出先の作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (borrower: Borrower) => {
    setEditingBorrowerId(borrower.id);
    setEditingBorrower({
      name: borrower.name,
      type: borrower.type,
      contactInfo: borrower.contactInfo || '',
      notes: borrower.notes || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingBorrowerId(null);
    setEditingBorrower(DEFAULT_FORM);
  };

  const handleUpdateBorrower = async (borrowerId: number) => {
    if (!editingBorrower.name.trim()) {
      setError('貸出先名を入力してください');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`http://localhost:3000/api/borrowers/${borrowerId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingBorrower.name.trim(),
          type: editingBorrower.type,
          contactInfo: editingBorrower.contactInfo.trim(),
          notes: editingBorrower.notes.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || '貸出先の更新に失敗しました');
      }

      handleCancelEdit();
      await fetchBorrowers();
      onBorrowerChange();
    } catch (err: any) {
      console.error('Error updating borrower:', err);
      setError(err.message || '貸出先の更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBorrower = async (borrowerId: number) => {
    if (!window.confirm('この貸出先を削除しますか？')) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`http://localhost:3000/api/borrowers/${borrowerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || '貸出先の削除に失敗しました');
      }

      await fetchBorrowers();
      onBorrowerChange();
    } catch (err: any) {
      console.error('Error deleting borrower:', err);
      setError(err.message || '貸出先の削除に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content borrower-manage-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>貸出先管理</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <div className="modal-body">
          <section className="borrower-section">
            <h3>現在の貸出先</h3>
            {loading ? (
              <p className="borrower-loading">読み込み中...</p>
            ) : borrowers.length === 0 ? (
              <p className="borrower-empty">貸出先が登録されていません</p>
            ) : (
              <div className="borrower-list">
                {borrowers.map((borrower) => (
                  <div key={borrower.id} className="borrower-row">
                    {editingBorrowerId === borrower.id ? (
                      <>
                        <div className="borrower-edit-fields">
                          <input
                            type="text"
                            value={editingBorrower.name}
                            onChange={(e) => setEditingBorrower((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="貸出先名"
                            disabled={isSubmitting}
                          />
                          <select
                            value={editingBorrower.type}
                            onChange={(e) => setEditingBorrower((prev) => ({ ...prev, type: e.target.value as BorrowerType }))}
                            disabled={isSubmitting}
                          >
                            <option value="INTERNAL_DEPARTMENT">内部部門</option>
                            <option value="EXTERNAL_ORGANIZATION">外部組織</option>
                            <option value="INDIVIDUAL">個人</option>
                          </select>
                          <input
                            type="text"
                            value={editingBorrower.contactInfo}
                            onChange={(e) => setEditingBorrower((prev) => ({ ...prev, contactInfo: e.target.value }))}
                            placeholder="連絡先"
                            disabled={isSubmitting}
                          />
                          <input
                            type="text"
                            value={editingBorrower.notes}
                            onChange={(e) => setEditingBorrower((prev) => ({ ...prev, notes: e.target.value }))}
                            placeholder="備考"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="borrower-row-actions">
                          <button
                            className="btn-save"
                            onClick={() => handleUpdateBorrower(borrower.id)}
                            disabled={isSubmitting}
                          >
                            保存
                          </button>
                          <button
                            className="btn-cancel"
                            onClick={handleCancelEdit}
                            disabled={isSubmitting}
                          >
                            取消
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="borrower-row-main">
                          <p className="borrower-name">{borrower.name}</p>
                          <p className="borrower-meta">
                            {getTypeLabel(borrower.type)}
                            {borrower.contactInfo ? ` / ${borrower.contactInfo}` : ''}
                            {borrower.notes ? ` / ${borrower.notes}` : ''}
                          </p>
                        </div>
                        <div className="borrower-row-actions">
                          <button
                            className="btn-edit"
                            onClick={() => handleStartEdit(borrower)}
                            disabled={isSubmitting}
                          >
                            編集
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteBorrower(borrower.id)}
                            disabled={isSubmitting}
                          >
                            削除
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="borrower-section">
            <h3>貸出先を追加</h3>
            <form className="borrower-create-form" onSubmit={handleCreateBorrower}>
              <div className="borrower-create-grid">
                <input
                  type="text"
                  value={newBorrower.name}
                  onChange={(e) => setNewBorrower((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="貸出先名 *"
                  required
                  disabled={isSubmitting}
                />
                <select
                  value={newBorrower.type}
                  onChange={(e) => setNewBorrower((prev) => ({ ...prev, type: e.target.value as BorrowerType }))}
                  disabled={isSubmitting}
                >
                  <option value="INTERNAL_DEPARTMENT">内部部門</option>
                  <option value="EXTERNAL_ORGANIZATION">外部組織</option>
                  <option value="INDIVIDUAL">個人</option>
                </select>
                <input
                  type="text"
                  value={newBorrower.contactInfo}
                  onChange={(e) => setNewBorrower((prev) => ({ ...prev, contactInfo: e.target.value }))}
                  placeholder="連絡先"
                  disabled={isSubmitting}
                />
                <input
                  type="text"
                  value={newBorrower.notes}
                  onChange={(e) => setNewBorrower((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="備考"
                  disabled={isSubmitting}
                />
              </div>
              <div className="borrower-create-actions">
                <button type="submit" className="btn-add" disabled={isSubmitting}>
                  追加
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

export default BorrowerManageModal;