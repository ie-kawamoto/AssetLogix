import { useState } from 'react';

interface BorrowerModalProps {
  onClose: () => void;
  onBorrowerCreated: () => void;
  mode: 'new' | 'edit';
  borrower?: {
    id: number;
    name: string;
    type: string;
    departmentId?: number;
    contactInfo?: string;
    notes?: string;
  };
}

function BorrowerModal({ onClose, onBorrowerCreated, mode, borrower }: BorrowerModalProps) {
  const [name, setName] = useState(borrower?.name || '');
  const [type, setType] = useState(borrower?.type || 'INTERNAL_DEPARTMENT');
  const [contactInfo, setContactInfo] = useState(borrower?.contactInfo || '');
  const [notes, setNotes] = useState(borrower?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('貸出先名を入力してください');
      return;
    }

    try {
      setIsSubmitting(true);
      const url = mode === 'new' 
        ? 'http://localhost:3000/api/borrowers'
        : `http://localhost:3000/api/borrowers/${borrower?.id}`;
      
      const method = mode === 'new' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          type,
          contactInfo: contactInfo.trim(),
          notes: notes.trim()
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '貸出先の保存に失敗しました');
      }

      onBorrowerCreated();
    } catch (err: any) {
      console.error('Error saving borrower:', err);
      setError(err.message || '貸出先の保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === 'new' ? '新規貸出先' : '貸出先編集'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="modal-error">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="name">貸出先名 *</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例：営業部、ABC株式会社"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">貸出先タイプ *</label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                <option value="INTERNAL_DEPARTMENT">内部部門</option>
                <option value="EXTERNAL_ORGANIZATION">外部組織</option>
                <option value="INDIVIDUAL">個人</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="contactInfo">連絡先</label>
              <input
                id="contactInfo"
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="例：電話番号またはメールアドレス"
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">備考</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="その他の情報を記入してください"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              キャンセル
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? '保存中...' : (mode === 'new' ? '作成' : '更新')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BorrowerModal;
