import { useState } from 'react';

interface Item {
  id: number;
  name: string;
  categoryId: number;
  category: { name: string };
  description?: string;
  instances: Instance[];
  createdAt: string;
  updatedAt: string;
}

interface Instance {
  id: number;
  itemId: number;
  item: Item;
  instanceName?: string;
  serialNumber?: string;
  status: string;
  locationId?: number;
  location?: { name: string };
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface InstanceRegisterModalProps {
  item: Item;
  onClose: () => void;
  onInstanceAdded: () => void;
  locations: Array<{id: number, name: string}>;
}

function InstanceRegisterModal({ item, onClose, onInstanceAdded, locations }: InstanceRegisterModalProps) {
  const [formData, setFormData] = useState({
    instanceName: '',
    serialNumber: '',
    status: 'AVAILABLE',
    locationId: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('認証情報がありません。再ログインしてください。');
        return;
      }

      const response = await fetch('http://localhost:3000/api/instances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          itemId: item.id,
          instanceName: formData.instanceName || null,
          serialNumber: formData.serialNumber || null,
          status: formData.status,
          locationId: formData.locationId ? parseInt(formData.locationId) : null,
          description: formData.description || null,
        }),
      });

      if (!response.ok) {
        let message = '個体登録に失敗しました';
        try {
          const errorData = await response.json();
          if (errorData?.error) {
            message = errorData.error;
          }
        } catch {
          if (response.status === 401 || response.status === 403) {
            message = '認証エラーです。再ログインしてください。';
          }
        }
        setError(message);
        return;
      }

      onInstanceAdded();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay instance-modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>個体登録</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {error && <div className="error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>品目</label>
              <input
                type="text"
                value={item.name}
                disabled
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>個体名</label>
              <input
                type="text"
                name="instanceName"
                value={formData.instanceName}
                onChange={handleInputChange}
                placeholder="例: 開発部貸与機-01"
              />
            </div>

            <div className="form-group">
              <label>シリアル番号</label>
              <input
                type="text"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleInputChange}
                placeholder="シリアル番号を入力"
              />
            </div>

            <div className="form-group">
              <label>ステータス</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="AVAILABLE">利用可能</option>
                <option value="RENTED">貸出中</option>
                <option value="BROKEN">故障中</option>
              </select>
            </div>

            <div className="form-group">
              <label>保管場所</label>
              <select
                name="locationId"
                value={formData.locationId}
                onChange={handleInputChange}
              >
                <option value="">選択してください</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>備考</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="備考を入力"
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-button" onClick={onClose}>
                キャンセル
              </button>
              <button type="submit" className="submit-button" disabled={loading || !item?.id}>
                {loading ? '登録中...' : '登録'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default InstanceRegisterModal;
