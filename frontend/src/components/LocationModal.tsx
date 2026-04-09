import { useState, useEffect } from 'react';

interface LocationModalProps {
  onClose: () => void;
  onLocationChange: () => void;
}

function LocationModal({ onClose, onLocationChange }: LocationModalProps) {
  const [locations, setLocations] = useState<Array<{id: number, name: string}>>([]);
  const [newLocation, setNewLocation] = useState('');
  const [editingLocation, setEditingLocation] = useState<{id: number, name: string} | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchLocations();
  }, []);

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
      } else {
        console.error('Failed to fetch locations:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const handleAddLocation = async () => {
    if (!newLocation.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newLocation.trim() }),
      });

      if (response.ok) {
        setNewLocation('');
        fetchLocations();
        onLocationChange();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || '保管場所の追加に失敗しました');
      }
    } catch (error) {
      console.error('Failed to add location:', error);
      alert('エラーが発生しました');
    }
  };

  const handleEditLocation = (location: {id: number, name: string}) => {
    setEditingLocation(location);
    setEditName(location.name);
  };

  const handleSaveEdit = async () => {
    if (!editingLocation || !editName.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/locations/${editingLocation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editName.trim() }),
      });

      if (response.ok) {
        setEditingLocation(null);
        setEditName('');
        fetchLocations();
        onLocationChange();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || '保管場所の更新に失敗しました');
      }
    } catch (error) {
      console.error('Failed to update location:', error);
      alert('エラーが発生しました');
    }
  };

  const handleDeleteLocation = async (id: number) => {
    if (!window.confirm('この保管場所を削除しますか？')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/locations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchLocations();
        onLocationChange();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || '保管場所の削除に失敗しました');
      }
    } catch (error) {
      console.error('Failed to delete location:', error);
      alert('エラーが発生しました');
    }
  };

  const handleCancelEdit = () => {
    setEditingLocation(null);
    setEditName('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>保管場所管理</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="location-list">
            <h4>現在の保管場所</h4>
            <div style={{ marginBottom: '1rem' }}>
              {locations.map(location => (
                <div key={location.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  padding: '0.5rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem'
                }}>
                  {editingLocation?.id === location.id ? (
                    <>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '0.25rem',
                          border: '2px solid #e2e8f0',
                          borderRadius: '0.5rem',
                          background: 'white',
                          color: '#1a202c',
                          fontSize: '1rem'
                        }}
                      />
                      <button
                        onClick={handleSaveEdit}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: '#1db8a0',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        保存
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: '#6b6375',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <span style={{ flex: 1 }}>{location.name}</span>
                      <button
                        onClick={() => handleEditLocation(location)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: '#4f46e5',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(location.id)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: '#fc8484',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        削除
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '2rem' }}>
            <label>新しい保管場所を追加</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="新しい保管場所名"
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  background: 'white',
                  color: '#1a202c',
                  fontSize: '1rem'
                }}
              />
              <button
                onClick={handleAddLocation}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#1db8a0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                追加
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LocationModal;