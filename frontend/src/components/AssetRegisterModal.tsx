import { useState, useEffect } from 'react';

interface Category {
  id: number;
  name: string;
}

interface AssetRegisterModalProps {
  onClose: () => void;
  onAssetAdded: () => void;
}

function AssetRegisterModal({ onClose, onAssetAdded }: AssetRegisterModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setCategoryLoading(true);
    setCategoryError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        if (data.length > 0) {
          setFormData(prev => ({
            ...prev,
            categoryId: data[0].id.toString()
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            categoryId: ''
          }));
        }
      } else {
        if (response.status === 401 || response.status === 403) {
          setCategoryError('認証エラーです。再ログインしてください。');
        } else {
          setCategoryError('カテゴリの取得に失敗しました');
        }
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategoryError('カテゴリの取得に失敗しました');
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          categoryId: parseInt(formData.categoryId),
          description: formData.description || null,
        }),
      });

      if (response.ok) {
        onAssetAdded();
        onClose();
      } else {
        alert('品目の登録に失敗しました');
      }
    } catch (error) {
      console.error('Failed to create item:', error);
      alert('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>品目登録</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">品目名 *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="例: MacBook Pro 14インチ"
            />
          </div>

          <div className="form-group">
            <label htmlFor="categoryId">カテゴリ *</label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              required
              disabled={categoryLoading || categories.length === 0}
            >
              <option value="">選択してください</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {categoryLoading && (
              <p style={{ color: '#6b6375', marginTop: '0.5rem' }}>カテゴリを読み込み中...</p>
            )}
            {!categoryLoading && categories.length === 0 && (
              <p style={{ color: '#6b6375', marginTop: '0.5rem' }}>
                カテゴリが未登録です。管理者が初期カテゴリを登録してください。
              </p>
            )}
            {categoryError && (
              <p style={{ color: '#c53030', marginTop: '0.5rem' }}>{categoryError}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">備考</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="品目の備考を入力してください"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              キャンセル
            </button>
            <button type="submit" className="submit-button" disabled={loading || categories.length === 0 || !formData.categoryId}>
              {loading ? '登録中...' : '登録'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssetRegisterModal;