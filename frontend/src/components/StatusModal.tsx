import { useState } from 'react';

interface StatusModalProps {
  onClose: () => void;
}

const statuses = [
  { key: 'AVAILABLE', name: '利用可能', description: '貸出可能な状態' },
  { key: 'RENTED', name: '貸出中', description: '現在貸出されている状態' },
  { key: 'BROKEN', name: '故障中', description: '修理中または使用不可の状態' },
];

function StatusModal({ onClose }: StatusModalProps) {
  const [newStatus, setNewStatus] = useState('');

  const handleAddStatus = () => {
    // 将来的に課金ユーザーのみ編集可能にするため、今は無効
    alert('ステータスの編集は現在利用できません。課金ユーザー向け機能となります。');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>ステータス管理</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p style={{ color: '#6b6375', marginBottom: '1rem' }}>
            ステータスの編集はできません。課金ユーザー様限定の編集機能を追加予定です。
          </p>

          <div className="status-list">
            <h4>現在のステータス</h4>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {statuses.map(status => (
                <div key={status.key} style={{
                  padding: '1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.7rem',
                  background: '#f4f3ec'
                }}>
                  <h5 style={{ margin: '0 0 0.5rem 0', color: '#1a202c' }}>
                    {status.name}
                  </h5>
                  <p style={{ margin: 0, color: '#6b6375', fontSize: '0.9rem' }}>
                    {status.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '2rem' }}>
            <label>新しいステータスを追加（現在無効）</label>
            <input
              type="text"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              placeholder="新しいステータス名"
              disabled
            />
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              閉じる
            </button>
            <button type="button" className="submit-button" onClick={handleAddStatus} disabled>
              追加（無効）
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatusModal;