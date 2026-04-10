import { useState, useEffect } from 'react';
import '../styles/Loans.scss';
import Header from './Header';
import Sidebar from './Sidebar';
import LoanModal from './LoanModal';
import BorrowerManageModal from './BorrowerManageModal';
import LoanEditModal from './LoanEditModal';

interface Item {
  id: number;
  name: string;
  categoryId: number;
  category: { name: string };
  description?: string;
}

interface Instance {
  id: number;
  itemId: number;
  item: Item;
  instanceName?: string;
  serialNumber?: string;
  status: string;
  locationId?: number;
}

interface Borrower {
  id: number;
  name: string;
  type: string;
  contactInfo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Loan {
  id: number;
  instanceId: number;
  borrowerId: number;
  loanDate: string;
  dueDate: string;
  returnDate?: string;
  status: string;
  notes?: string;
  instance: Instance;
  borrower: Borrower;
  createdAt: string;
  updatedAt: string;
}

interface LoansProps {
  user: any;
  onLogout: () => void;
}

function Loans({ user, onLogout }: LoansProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showBorrowerManageModal, setShowBorrowerManageModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [returnConfirmLoan, setReturnConfirmLoan] = useState<Loan | null>(null);
  const [isReturning, setIsReturning] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/loans', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      if (response.status === 401 || response.status === 403) {
        onLogout();
        throw new Error('認証に失敗しました');
      }

      if (!response.ok) {
        throw new Error('貸し出し一覧の取得に失敗しました');
      }

      const data = await response.json();
      setLoans(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching loans:', err);
      setError(err.message || '貸し出し一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchBorrowers = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/borrowers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      if (!response.ok) {
        throw new Error('貸出先一覧の取得に失敗しました');
      }

      const data = await response.json();
      setBorrowers(data);
    } catch (err: any) {
      console.error('Error fetching borrowers:', err);
    }
  };

  useEffect(() => {
    fetchLoans();
    fetchBorrowers();
  }, []);

  const handleReturnLoan = async () => {
    if (!returnConfirmLoan) return;
    try {
      setIsReturning(true);
      const response = await fetch(`http://localhost:3000/api/loans/${returnConfirmLoan.id}/return`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('返却処理に失敗しました');
      }

      setReturnConfirmLoan(null);
      await fetchLoans();
    } catch (err: any) {
      console.error('Error returning loan:', err);
      alert(err.message || '返却処理に失敗しました');
    } finally {
      setIsReturning(false);
    }
  };

  const handleLoanCreated = () => {
    setShowLoanModal(false);
    fetchLoans();
  };

  const handleBorrowerChanged = () => {
    setShowBorrowerManageModal(false);
    fetchBorrowers();
    fetchLoans();
  };

  const filteredLoans = loans.filter(loan =>
    (loan.instance.item.name.includes(searchTerm) ||
    loan.borrower.name.includes(searchTerm)) &&
    (statusFilter === '' || loan.status === statusFilter)
  );

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '貸出中';
      case 'RETURNED':
        return '返却済み';
      case 'OVERDUE':
        return '返却期限超過';
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'status-active';
      case 'RETURNED':
        return 'status-returned';
      case 'OVERDUE':
        return 'status-overdue';
      default:
        return '';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  return (
    <div className="loans-container">
      <Header user={user} onLogout={onLogout} />
      <div className="loans-body">
        <Sidebar currentPage="Loans" />
        <main className="main-content">
          <div className="content-wrapper">
            <h2 className="page-title">貸し出し管理 <span>Loans</span></h2>

            <div className="loans-controls">
              <div className="search-filter-group">
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="アイテムまたは貸出先で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="status-filter-container">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="status-filter-select"
                  >
                    <option value="">すべてのステータス</option>
                    <option value="ACTIVE">貸出中</option>
                    <option value="RETURNED">返却済み</option>
                    <option value="OVERDUE">返却期限超過</option>
                  </select>
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className="action-button register-button"
                  onClick={() => setShowLoanModal(true)}
                >
                  新規貸し出し
                </button>
                <button
                  className="action-button borrower-button"
                  onClick={() => setShowBorrowerManageModal(true)}
                >
                  貸出先管理
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <p>{error}</p>
                <button onClick={() => { setError(null); fetchLoans(); }}>再試行</button>
              </div>
            )}

            <div className="loans-list">
              {loading ? (
                <div className="loading">読み込み中...</div>
              ) : filteredLoans.length === 0 ? (
                <div className="empty-state">
                  <p>貸し出し記録がありません</p>
                </div>
              ) : (
                <div className="loan-records-card">
                  <table>
                    <thead>
                      <tr>
                        <th>アイテム / 個体名</th>
                        <th>シリアル番号</th>
                        <th>貸出先</th>
                        <th>貸出日</th>
                        <th>返却予定日</th>
                        <th>返却日</th>
                        <th>ステータス</th>
                        <th>アクション</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLoans.map((loan) => (
                        <tr key={loan.id}>
                          <td title={loan.instance.item.name}>
                            <span className="loan-item-name">{loan.instance.item.name}</span>
                            {loan.instance.instanceName && (
                              <span className="loan-instance-name">{loan.instance.instanceName}</span>
                            )}
                          </td>
                          <td>{loan.instance.serialNumber || '-'}</td>
                          <td>{loan.borrower.name}</td>
                          <td>{formatDate(loan.loanDate)}</td>
                          <td>{formatDate(loan.dueDate)}</td>
                          <td>{loan.returnDate ? formatDate(loan.returnDate) : '-'}</td>
                          <td>
                            <span className={`status-badge ${getStatusClass(loan.status)}`}>
                              {getStatusLabel(loan.status)}
                            </span>
                          </td>
                          <td>
                            {loan.status !== 'RETURNED' && (
                              <button
                                className="action-button return-button"
                                onClick={() => setReturnConfirmLoan(loan)}
                              >
                                返却
                              </button>
                            )}
                            {loan.status === 'RETURNED' && (
                              <span className="text-muted">-</span>
                            )}
                            <button
                              className="action-button edit-button"
                              onClick={() => setEditingLoan(loan)}
                            >
                              編集
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {showLoanModal && (
        <LoanModal
          borrowers={borrowers}
          onClose={() => setShowLoanModal(false)}
          onLoanCreated={handleLoanCreated}
        />
      )}

      {showBorrowerManageModal && (
        <BorrowerManageModal
          onClose={() => setShowBorrowerManageModal(false)}
          onBorrowerChange={handleBorrowerChanged}
        />
      )}

      {editingLoan && (
        <LoanEditModal
          loan={editingLoan}
          onClose={() => setEditingLoan(null)}
          onLoanUpdated={() => {
            setEditingLoan(null);
            fetchLoans();
          }}
        />
      )}

      {returnConfirmLoan && (
        <div className="modal-overlay" onClick={() => setReturnConfirmLoan(null)}>
          <div className="modal-content return-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>返却確認</h2>
              <button className="modal-close" onClick={() => setReturnConfirmLoan(null)}>×</button>
            </div>
            <div className="modal-body">
              <p className="return-confirm-message">以下のアイテムを返却しますか？</p>
              <div className="return-confirm-detail">
                <div className="return-confirm-row">
                  <span className="return-confirm-label">アイテム</span>
                  <span className="return-confirm-value">{returnConfirmLoan.instance.item.name}</span>
                </div>
                {returnConfirmLoan.instance.serialNumber && (
                  <div className="return-confirm-row">
                    <span className="return-confirm-label">シリアル番号</span>
                    <span className="return-confirm-value">{returnConfirmLoan.instance.serialNumber}</span>
                  </div>
                )}
                <div className="return-confirm-row">
                  <span className="return-confirm-label">貸出先</span>
                  <span className="return-confirm-value">{returnConfirmLoan.borrower.name}</span>
                </div>
                <div className="return-confirm-row">
                  <span className="return-confirm-label">貸出日</span>
                  <span className="return-confirm-value">{formatDate(returnConfirmLoan.loanDate)}</span>
                </div>
                <div className="return-confirm-row">
                  <span className="return-confirm-label">返却予定日</span>
                  <span className="return-confirm-value">{formatDate(returnConfirmLoan.dueDate)}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setReturnConfirmLoan(null)}
                disabled={isReturning}
              >
                キャンセル
              </button>
              <button
                className="btn btn-primary"
                onClick={handleReturnLoan}
                disabled={isReturning}
              >
                {isReturning ? '処理中...' : '返却する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Loans;
