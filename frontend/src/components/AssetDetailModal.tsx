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

interface GroupedItem {
  name: string;
  count: number;
  items: Item[];
}

interface AssetDetailModalProps {
  itemGroup: GroupedItem;
  onClose: () => void;
  onItemUpdate: (item: Item) => Promise<void>;
  onItemDelete: (itemId: number) => Promise<boolean>;
  onInstanceUpdate: (instanceId: number, updates: {
    instanceName?: string;
    serialNumber?: string;
    status?: string;
    locationId?: number | null;
    description?: string;
  }) => Promise<void>;
  onInstanceDelete: (instanceId: number) => Promise<void>;
  locations: Array<{ id: number; name: string }>;
  onOpenInstanceRegister: (item: Item) => void;
}

function AssetDetailModal({ itemGroup, onClose, onItemUpdate, onItemDelete, onInstanceUpdate, onInstanceDelete, locations, onOpenInstanceRegister }: AssetDetailModalProps) {
  const targetItem = itemGroup.items[0] || null;
  const itemRemarks = Array.from(
    new Set(
      itemGroup.items
        .map((item) => item.description?.trim())
        .filter((remark): remark is string => !!remark)
    )
  );

  const instances = itemGroup.items.flatMap((item) =>
    (item.instances || []).map((instance) => ({
      ...instance,
      itemName: item.name,
    }))
  );

  const [editingId, setEditingId] = useState<number | null>(null);
  const [showItemEditModal, setShowItemEditModal] = useState(false);
  const [itemEditForm, setItemEditForm] = useState({
    name: '',
    description: '',
  });
  const [editForm, setEditForm] = useState({
    instanceName: '',
    serialNumber: '',
    status: 'AVAILABLE',
    locationId: '',
    description: '',
  });

  const getStatusLabel = (status: string) => {
    if (status === 'AVAILABLE') return '利用可能';
    if (status === 'RENTED') return '貸出中';
    if (status === 'BROKEN') return '故障中';
    return status;
  };

  const startEdit = (instance: Instance) => {
    setEditingId(instance.id);
    setEditForm({
      instanceName: instance.instanceName || '',
      serialNumber: instance.serialNumber || '',
      status: instance.status || 'AVAILABLE',
      locationId: instance.locationId ? String(instance.locationId) : '',
      description: instance.description || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;

    await onInstanceUpdate(editingId, {
      instanceName: editForm.instanceName || undefined,
      serialNumber: editForm.serialNumber || undefined,
      status: editForm.status,
      locationId: editForm.locationId ? parseInt(editForm.locationId, 10) : null,
      description: editForm.description || undefined,
    });
    setEditingId(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const openItemEditModal = () => {
    if (!targetItem) {
      return;
    }
    setItemEditForm({
      name: targetItem.name,
      description: targetItem.description || '',
    });
    setShowItemEditModal(true);
  };

  const saveItemEdit = async () => {
    if (!targetItem) {
      return;
    }

    await onItemUpdate({
      ...targetItem,
      name: itemEditForm.name,
      description: itemEditForm.description,
    });
    setShowItemEditModal(false);
  };

  const deleteItem = async () => {
    if (!targetItem) {
      return;
    }

    if (!window.confirm('この品目を削除しますか？')) {
      return;
    }

    const deleted = await onItemDelete(targetItem.id);
    if (deleted) {
      setShowItemEditModal(false);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content asset-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>資産詳細</h3>
          <div className="modal-header-actions">
            <button
              type="button"
              className="edit-item-button"
              onClick={openItemEditModal}
              disabled={!targetItem}
            >
              品目編集
            </button>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="modal-body">
          <div className="asset-info">
            <div className="asset-name">{itemGroup.name}</div>
            <div className="asset-meta">
              <div className="meta-item">
                <div className="meta-label">総数</div>
                <div className="meta-value">{itemGroup.count}点</div>
              </div>
              <div className="meta-item">
                <div className="meta-label">カテゴリ</div>
                <div className="meta-value">{itemGroup.items[0]?.category?.name || '不明'}</div>
              </div>
              <div className="meta-item">
                <div className="meta-label">品目の備考</div>
                <div className="meta-value">
                  {itemRemarks.length > 0 ? itemRemarks.join(' / ') : '-'}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="register-instance-button d-block ms-auto"
            onClick={() => targetItem && onOpenInstanceRegister(targetItem)}
            disabled={!targetItem}
          >
            個体登録
          </button>

          <div className="asset-list">
            <h4>個体一覧</h4>
            <table className="asset-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>個体名</th>
                  <th>シリアル番号</th>
                  <th>品目</th>
                  <th>ステータス</th>
                  <th>保管場所</th>
                  <th>備考</th>
                  <th>作成日</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {instances.length === 0 ? (
                  <tr>
                    <td colSpan={9}>個体はまだ登録されていません</td>
                  </tr>
                ) : (
                  instances.map((instance) => (
                    <tr key={instance.id}>
                      <td>{instance.id}</td>
                      <td>
                        {editingId === instance.id ? (
                          <input name="instanceName" value={editForm.instanceName} onChange={handleChange} />
                        ) : (
                          instance.instanceName || '-'
                        )}
                      </td>
                      <td>
                        {editingId === instance.id ? (
                          <input name="serialNumber" value={editForm.serialNumber} onChange={handleChange} />
                        ) : (
                          instance.serialNumber || '-'
                        )}
                      </td>
                      <td>{instance.itemName}</td>
                      <td>
                        {editingId === instance.id ? (
                          <select name="status" value={editForm.status} onChange={handleChange}>
                            <option value="AVAILABLE">利用可能</option>
                            <option value="RENTED">貸出中</option>
                            <option value="BROKEN">故障中</option>
                          </select>
                        ) : (
                          getStatusLabel(instance.status)
                        )}
                      </td>
                      <td>
                        {editingId === instance.id ? (
                          <select name="locationId" value={editForm.locationId} onChange={handleChange}>
                            <option value="">未設定</option>
                            {locations.map((location) => (
                              <option key={location.id} value={location.id}>{location.name}</option>
                            ))}
                          </select>
                        ) : (
                          instance.location?.name || '-'
                        )}
                      </td>
                      <td>
                        {editingId === instance.id ? (
                          <input name="description" value={editForm.description} onChange={handleChange} />
                        ) : (
                          instance.description || '-'
                        )}
                      </td>
                      <td>{new Date(instance.createdAt).toLocaleDateString('ja-JP')}</td>
                      <td>
                        <div className="action-buttons">
                          {editingId === instance.id ? (
                            <>
                              <button className="save-button" onClick={saveEdit}>保存</button>
                              <button className="cancel-edit-button" onClick={cancelEdit}>取消</button>
                            </>
                          ) : (
                            <>
                              <button className="edit-button" onClick={() => startEdit(instance)}>編集</button>
                              <button className="delete-button" onClick={() => onInstanceDelete(instance.id)}>削除</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showItemEditModal && targetItem && (
        <div className="modal-overlay instance-modal-overlay" onClick={() => setShowItemEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>品目編集</h3>
              <button className="close-button" onClick={() => setShowItemEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="edit-item-name">品目名</label>
                <input
                  id="edit-item-name"
                  type="text"
                  value={itemEditForm.name}
                  onChange={(e) => setItemEditForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-item-description">備考</label>
                <textarea
                  id="edit-item-description"
                  value={itemEditForm.description}
                  onChange={(e) => setItemEditForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="delete-button" onClick={deleteItem}>
                  削除
                </button>
                <button type="button" className="cancel-button" onClick={() => setShowItemEditModal(false)}>
                  キャンセル
                </button>
                <button type="button" className="submit-button" onClick={saveItemEdit}>
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssetDetailModal;