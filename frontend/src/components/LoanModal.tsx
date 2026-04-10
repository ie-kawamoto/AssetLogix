import { useState, useEffect } from 'react';

interface Item {
  id: number;
  name: string;
  categoryId: number;
  category: { name: string };
}

interface Instance {
  id: number;
  itemId: number;
  item: Item;
  instanceName?: string;
  serialNumber?: string;
  status: string;
}

interface Borrower {
  id: number;
  name: string;
  type: string;
}

interface LoanModalProps {
  borrowers: Borrower[];
  onClose: () => void;
  onLoanCreated: () => void;
}

function LoanModal({ borrowers, onClose, onLoanCreated }: LoanModalProps) {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | ''>('');
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<number | ''>('');
  const today = new Date();
  const [dueYear, setDueYear] = useState(today.getFullYear());
  const [dueMonth, setDueMonth] = useState(today.getMonth() + 1);
  const [dueDay, setDueDay] = useState(today.getDate());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableInstances();
  }, []);

  const fetchAvailableInstances = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/instances', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      if (!response.ok) {
        throw new Error('アイテム一覧の取得に失敗しました');
      }

      const data = await response.json();
      const availableInstances = data.filter((inst: Instance) => inst.status === 'AVAILABLE');
      setInstances(availableInstances);
    } catch (err: any) {
      console.error('Error fetching instances:', err);
      setError(err.message || 'アイテム一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const paddedMonth = String(dueMonth).padStart(2, '0');
    const paddedDay = String(dueDay).padStart(2, '0');
    const dueDateStr = `${dueYear}-${paddedMonth}-${paddedDay}`;

    if (!selectedInstanceId || !selectedBorrowerId) {
      setError('すべての項目を入力してください');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('http://localhost:3000/api/loans', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceId: parseInt(selectedInstanceId.toString()),
          borrowerId: parseInt(selectedBorrowerId.toString()),
          dueDate: dueDateStr,
          notes
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '貸し出し作成に失敗しました');
      }

      onLoanCreated();
    } catch (err: any) {
      console.error('Error creating loan:', err);
      setError(err.message || '貸し出し作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInstanceLabel = (instance: Instance) => {
    const itemName = instance.item.name;
    const serialPart = instance.serialNumber ? ` (${instance.serialNumber})` : '';
    const namePart = instance.instanceName ? ` - ${instance.instanceName}` : '';
    return `${itemName}${namePart}${serialPart}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>新規貸し出し</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="modal-error">{error}</div>
        )}

        {loading ? (
          <div className="modal-body modal-loading">
            <p>読み込み中...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="instance">アイテム *</label>
                <select
                  id="instance"
                  value={selectedInstanceId}
                  onChange={(e) => setSelectedInstanceId(e.target.value ? parseInt(e.target.value) : '')}
                  required
                >
                  <option value="">-- 選択してください --</option>
                  {instances.map(instance => (
                    <option key={instance.id} value={instance.id}>
                      {getInstanceLabel(instance)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="borrower">貸出先 *</label>
                <select
                  id="borrower"
                  value={selectedBorrowerId}
                  onChange={(e) => setSelectedBorrowerId(e.target.value ? parseInt(e.target.value) : '')}
                  required
                >
                  <option value="">-- 選択してください --</option>
                  {borrowers.map(borrower => (
                    <option key={borrower.id} value={borrower.id}>
                      {borrower.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>返却予定日 *</label>
                <div className="date-selects">
                  <select
                    value={dueYear}
                    onChange={(e) => setDueYear(parseInt(e.target.value))}
                  >
                    {Array.from({ length: 10 }, (_, i) => today.getFullYear() + i).map((y) => (
                      <option key={y} value={y}>{y}年</option>
                    ))}
                  </select>
                  <select
                    value={dueMonth}
                    onChange={(e) => setDueMonth(parseInt(e.target.value))}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>{m}月</option>
                    ))}
                  </select>
                  <select
                    value={dueDay}
                    onChange={(e) => setDueDay(parseInt(e.target.value))}
                  >
                    {Array.from({ length: new Date(dueYear, dueMonth, 0).getDate() }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{d}日</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">備考</label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="貸し出しの詳細などを記入してください"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                キャンセル
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? '作成中...' : '貸し出しを作成'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoanModal;
