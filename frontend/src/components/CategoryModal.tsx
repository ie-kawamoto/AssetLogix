import { useState } from 'react';

interface CategoryModalProps {
  onClose: () => void;
}

const categories = [
  { id: 1, name: '電子機器' },
  { id: 2, name: '家具' },
  { id: 3, name: '文房具' },
  { id: 4, name: 'その他' },
];

function CategoryModal({ onClose }: CategoryModalProps) {
  const [newCategory, setNewCategory] = useState('');

  const handleAddCategory = () => {
    // 将来的に課金ユーザーのみ編集可能にするため、今は無効
    alert('カテゴリの編集は現在利用できません。将来的に課金ユーザー向け機能となります。');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>カテゴリ管理</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p style={{ color: '#6b6375', marginBottom: '1rem' }}>
            カテゴリは現在決めうちとなっており、編集はできません。将来的に課金ユーザー向けに編集機能を追加予定です。
          </p>

          <div className="category-list">
            <h4>現在のカテゴリ</h4>
            <ul style={{ paddingLeft: '1.5rem' }}>
              {categories.map(category => (
                <li key={category.id} style={{ marginBottom: '0.5rem' }}>
                  {category.name}
                </li>
              ))}
            </ul>
          </div>

          <div className="form-group" style={{ marginTop: '2rem' }}>
            <label>新しいカテゴリを追加（現在無効）</label>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="新しいカテゴリ名"
              disabled
            />
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              閉じる
            </button>
            <button type="button" className="submit-button" onClick={handleAddCategory} disabled>
              追加（無効）
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategoryModal;