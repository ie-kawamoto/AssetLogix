import { useState } from 'react';

interface Instance {
  id: number;
  item: { name: string };
  instanceName?: string;
  serialNumber?: string;
}

interface Borrower {
  id: number;
  name: string;
}

interface Loan {
  id: number;
  dueDate: string;
  status: string;
  notes?: string;
  instance: Instance;
  borrower: Borrower;
}

interface LoanEditModalProps {
  loan: Loan;
  onClose: () => void;
  onLoanUpdated: () => void;
}

function LoanEditModal({ loan, onClose, onLoanUpdated }: LoanEditModalProps) {
  const parseDue = (iso: string) => {
    const d = new Date(iso);
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  };

  const getDateStart = (date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const initial = parseDue(loan.dueDate);
  const today = new Date();

  const [dueYear, setDueYear] = useState(initial.year);
  const [dueMonth, setDueMonth] = useState(initial.month);
  const [dueDay, setDueDay] = useState(initial.day);
  const [status, setStatus] = useState(loan.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const daysInMonth = new Date(dueYear, dueMonth, 0).getDate();
  const clampedDay = Math.min(dueDay, daysInMonth);
  const selectedDueDate = new Date(dueYear, dueMonth - 1, clampedDay);
  const isPastDue = getDateStart(selectedDueDate) < getDateStart(new Date());
  const effectiveStatus = status === 'RETURNED' ? 'RETURNED' : (isPastDue ? 'OVERDUE' : status);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const paddedMonth = String(dueMonth).padStart(2, '0');
    const paddedDay = String(clampedDay).padStart(2, '0');
    const dueDateStr = `${dueYear}-${paddedMonth}-${paddedDay}`;

    try {
      setIsSubmitting(true);
      const response = await fetch(`http://localhost:3000/api/loans/${loan.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: effectiveStatus, dueDate: dueDateStr }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || '更新に失敗しました');
      }

      onLoanUpdated();
    } catch (err: any) {
      console.error('Error updating loan:', err);
      setError(err.message || '更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    { value: 'ACTIVE', label: '貸出中' },
    { value: 'RETURNED', label: '返却済み' },
    { value: 'OVERDUE', label: '返却期限超過' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content loan-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>貸し出し情報を編集</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="loan-edit-info">
              <div className="loan-edit-info-row">
                <span className="loan-edit-info-label">アイテム</span>
                <span className="loan-edit-info-value">{loan.instance.item.name}</span>
              </div>
              {loan.instance.instanceName && (
                <div className="loan-edit-info-row">
                  <span className="loan-edit-info-label">個体名</span>
                  <span className="loan-edit-info-value">{loan.instance.instanceName}</span>
                </div>
              )}
              {loan.instance.serialNumber && (
                <div className="loan-edit-info-row">
                  <span className="loan-edit-info-label">シリアル番号</span>
                  <span className="loan-edit-info-value">{loan.instance.serialNumber}</span>
                </div>
              )}
              <div className="loan-edit-info-row">
                <span className="loan-edit-info-label">貸出先</span>
                <span className="loan-edit-info-value">{loan.borrower.name}</span>
              </div>
            </div>

            <div className="form-group">
              <label>返却予定日</label>
              <div className="date-selects">
                <select
                  value={dueYear}
                  onChange={(e) => setDueYear(parseInt(e.target.value))}
                  disabled={isSubmitting}
                >
                  {Array.from({ length: 10 }, (_, i) => today.getFullYear() + i).map((y) => (
                    <option key={y} value={y}>{y}年</option>
                  ))}
                </select>
                <select
                  value={dueMonth}
                  onChange={(e) => setDueMonth(parseInt(e.target.value))}
                  disabled={isSubmitting}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{m}月</option>
                  ))}
                </select>
                <select
                  value={clampedDay}
                  onChange={(e) => setDueDay(parseInt(e.target.value))}
                  disabled={isSubmitting}
                >
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}日</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>ステータス</label>
              <select
                value={effectiveStatus}
                onChange={(e) => setStatus(e.target.value)}
                disabled={isSubmitting || isPastDue}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {isPastDue && effectiveStatus !== 'RETURNED' && (
                <small>返却予定日が今日より前のため、ステータスは返却期限超過で固定されます。</small>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoanEditModal;
