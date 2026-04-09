import { useState, useEffect } from 'react';
import '../styles/Assets.scss';
import Header from './Header';
import Sidebar from './Sidebar';
import AssetRegisterModal from './AssetRegisterModal';
import InstanceRegisterModal from './InstanceRegisterModal';
import CategoryModal from './CategoryModal';
import StatusModal from './StatusModal';
import LocationModal from './LocationModal';
import AssetDetailModal from './AssetDetailModal';

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

interface AssetsProps {
  user: any;
  onLogout: () => void;
}

function Assets({ user, onLogout }: AssetsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [groupedItems, setGroupedItems] = useState<GroupedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showInstanceModal, setShowInstanceModal] = useState(false);
  const [selectedItemGroup, setSelectedItemGroup] = useState<GroupedItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [locations, setLocations] = useState<Array<{id: number, name: string}>>([]);

  useEffect(() => {
    fetchItems();
    fetchLocations();
  }, []);

  useEffect(() => {
    const grouped = items.reduce((acc: { [key: string]: Item[] }, item) => {
      if (!acc[item.name]) {
        acc[item.name] = [];
      }
      acc[item.name].push(item);
      return acc;
    }, {});

    const groupedArray: GroupedItem[] = Object.keys(grouped).map(name => ({
      name,
      count: grouped[name].reduce((sum, item) => sum + (item.instances?.length || 0), 0),
      items: grouped[name]
    }));

    setGroupedItems(groupedArray);
  }, [items]);

  useEffect(() => {
    if (!showDetailModal || !selectedItemGroup) {
      return;
    }

    const selectedItemIds = new Set(selectedItemGroup.items.map((item) => item.id));
    const refreshed = groupedItems.find((group) =>
      group.items.some((item) => selectedItemIds.has(item.id))
    );

    if (refreshed) {
      setSelectedItemGroup(refreshed);
    } else if (groupedItems.length > 0) {
      // 品目名変更などでグループ構成が変わった場合でも、モーダル表示を維持して先頭グループへ再同期
      setSelectedItemGroup(groupedItems[0]);
    }
  }, [groupedItems, showDetailModal, selectedItemGroup]);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/items', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/locations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const handleAssetGroupClick = (group: GroupedItem) => {
    setSelectedItemGroup(group);
    setShowDetailModal(true);
  };

  const handleItemUpdate = async (updatedItem: Item) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/items/${updatedItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: updatedItem.name,
          categoryId: updatedItem.categoryId,
          description: updatedItem.description || null,
        }),
      });

      if (response.ok) {
        await fetchItems();
      } else {
        console.error('Failed to update item:', await response.text());
      }
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  const handleItemDelete = async (itemId: number): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchItems();
        return true;
      }

      const errorText = await response.text();
      alert(errorText || '品目の削除に失敗しました');
      return false;
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('品目の削除に失敗しました');
      return false;
    }
  };

  const handleInstanceUpdate = async (instanceId: number, updates: {
    instanceName?: string;
    serialNumber?: string;
    status?: string;
    locationId?: number | null;
    description?: string;
  }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/instances/${instanceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await fetchItems();
      } else {
        console.error('Failed to update instance:', await response.text());
      }
    } catch (error) {
      console.error('Failed to update instance:', error);
    }
  };

  const handleInstanceDelete = async (instanceId: number) => {
    if (!window.confirm('この個体を削除しますか？')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/instances/${instanceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchItems();
      } else {
        console.error('Failed to delete instance:', await response.text());
      }
    } catch (error) {
      console.error('Failed to delete instance:', error);
    }
  };

  const filteredGroupedItems = groupedItems.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="assets-container">
      <Header user={user} onLogout={onLogout} />

      <div className="assets-body">
        <Sidebar currentPage="Assets" />

        <main className="main-content">
          <div className="content-wrapper">
            <h2 className="page-title">資産管理 <span>Assets</span></h2>

            <div className="assets-controls">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="資産名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="action-buttons">
                <button
                  className="action-button register-button"
                  onClick={() => setShowRegisterModal(true)}
                >
                  備品（品目）登録
                </button>
                <button
                  className="action-button category-button"
                  onClick={() => setShowCategoryModal(true)}
                >
                  カテゴリ管理
                </button>
                <button
                  className="action-button location-button"
                  onClick={() => setShowLocationModal(true)}
                >
                  保管場所管理
                </button>
                <button
                  className="action-button status-button"
                  onClick={() => setShowStatusModal(true)}
                >
                  ステータス管理
                </button>
              </div>
            </div>

            <div className="assets-list">
              {loading ? (
                <div className="loading">読み込み中...</div>
              ) : (
                <div className="asset-groups">
                  {filteredGroupedItems.map((group) => (
                    <div key={group.name} className="asset-group-card">
                      <div className="card-header">
                        <div onClick={() => handleAssetGroupClick(group)} style={{ flex: 1, cursor: 'pointer' }}>
                          <h3>{group.name}</h3>
                          <p className="asset-count">{group.count}点</p>
                        </div>
                      </div>
                      <div className="items-list">
                        {group.items.map((item) => (
                          <div key={item.id} className="item-row">
                            <div className="item-info">
                              <div className="item-name">{item.name}</div>
                              <div className="item-category">{item.category?.name || '未分類'}</div>
                              {item.description && <div className="item-description">{item.description}</div>}
                            </div>
                            <button
                              className="instance-register-button"
                              onClick={() => {
                                setSelectedItem(item);
                                setShowInstanceModal(true);
                              }}
                            >
                              個体登録
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {showRegisterModal && (
        <AssetRegisterModal
          onClose={() => setShowRegisterModal(false)}
          onAssetAdded={fetchItems}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          onClose={() => setShowCategoryModal(false)}
        />
      )}

      {showLocationModal && (
        <LocationModal
          onClose={() => setShowLocationModal(false)}
          onLocationChange={fetchLocations}
        />
      )}

      {showStatusModal && (
        <StatusModal
          onClose={() => setShowStatusModal(false)}
        />
      )}

      {showDetailModal && selectedItemGroup && (
        <AssetDetailModal
          itemGroup={selectedItemGroup}
          onClose={() => setShowDetailModal(false)}
          onItemUpdate={handleItemUpdate}
          onItemDelete={handleItemDelete}
          onInstanceUpdate={handleInstanceUpdate}
          onInstanceDelete={handleInstanceDelete}
          locations={locations}
          onOpenInstanceRegister={(item) => {
            setSelectedItem(item);
            setShowInstanceModal(true);
          }}
        />
      )}

      {showInstanceModal && selectedItem && (
        <InstanceRegisterModal
          item={selectedItem}
          onClose={() => {
            setShowInstanceModal(false);
            setSelectedItem(null);
          }}
          onInstanceAdded={fetchItems}
          locations={locations}
        />
      )}
    </div>
  );
}

export default Assets;