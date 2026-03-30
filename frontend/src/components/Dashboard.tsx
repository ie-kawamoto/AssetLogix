import { useState } from 'react';
import '../styles/Dashboard.scss';
import Header from './Header';
import Sidebar from './Sidebar';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

interface Activity {
  date: string;
  action: string;
  item: string;
  user: string;
  overdue?: string;
}

function Dashboard({ user, onLogout }: DashboardProps) {

  const cardData: Array<{
    key: string;
    title: string;
    listTitle: string;
    english: string;
    value: string;
    className: string;
    listClassName: string;
    activities: Activity[];
  }> = [
      {
        key: 'items',
        title: '登録済み 合計点数',
        listTitle: '登録済みアイテム',
        english: 'Items',
        value: '1,234',
        className: 'items-card',
        listClassName: 'items-list',
        activities: [
          { date: '2026-03-30 10:30', action: '追加', item: 'Laptop A', user: 'Admin' },
          { date: '2026-03-29 14:15', action: '監査', item: 'Printer C', user: 'Auditor' },
          { date: '2026-03-28 09:45', action: 'タグ付け', item: 'Monitor E', user: 'Manager' },
        ],
      },
      {
        key: 'in-use',
        title: '自社内利用中',
        listTitle: '自社内利用状況',
        english: 'In use',
        value: '567',
        className: 'in-use-card',
        listClassName: 'in-use-list',
        activities: [
          { date: '2026-03-30 11:20', action: 'チェックアウト', item: 'Tablet F', user: 'Yamada' },
          { date: '2026-03-29 16:30', action: '割り当て', item: 'Phone D', user: 'System' },
          { date: '2026-03-28 13:10', action: '転送', item: 'Desk G', user: 'Sato' },
        ],
      },
      {
        key: 'loans',
        title: '貸し出し中',
        listTitle: '貸し出し状況',
        english: 'Loans',
        value: '89',
        className: 'loans-card',
        listClassName: 'loans-list',
        activities: [
          { date: '2026-03-30 08:45', action: '承認', item: 'Projector H', user: 'Manager' },
          { date: '2026-03-29 17:20', action: '返却', item: 'Camera I', user: 'Yamada' },
          { date: '2026-03-28 12:30', action: '延長', item: 'Laptop J', user: 'Sato' },
        ],
      },
      {
        key: 'delayed',
        title: '返却期限超過',
        listTitle: '返却期限超過アイテム',
        english: 'Delayed',
        value: '89',
        className: 'delayed-card',
        listClassName: 'delayed-list',
        activities: [
          { date: '2026-03-30 09:15', action: '期限超過', item: 'Monitor B', user: 'System', overdue: '2日' },
          { date: '2026-03-29 15:40', action: '期限超過', item: 'Conference Mic', user: 'System', overdue: '1日' },
          { date: '2026-03-28 10:25', action: 'リマインダー送信', item: 'Headset K', user: 'System', overdue: '3日' },
        ],
      },
    ];

  const [activeCardKey, setActiveCardKey] = useState('items');
  const activeCard = cardData.find((card) => card.key === activeCardKey) ?? cardData[0];

  const handleCardClick = (key: string) => {
    setActiveCardKey(key);
  };


  const handleNavClick = (label: string) => {
    console.log('Nav clicked:', label);
    // TODO: ナビゲーションのロジックを実装
  };

  return (
    <div className="dashboard-container">
      <Header user={user} onLogout={onLogout} />

      <div className="dashboard-body">
        <Sidebar onNavClick={handleNavClick} />

        <main className="main-content">
          <div className="content-wrapper">
            <h2 className="page-title">ダッシュボード <span>Dashboard</span></h2>
            <div className="stats-grid">
              {cardData.map((card) => (
                <div
                  key={card.key}
                  className={`stat-card ${card.className} ${activeCardKey === card.key ? 'active' : ''}`}
                  onClick={() => handleCardClick(card.key)}
                >
                  <h3>{card.title}</h3>
                  <p className="english-title">{card.english}</p>
                  <p className="stat-number">{card.value}</p>
                </div>
              ))}
            </div>
            <div className={`recent-activities ${activeCard.listClassName}`}>
              <h3 className='p-2'>最近のアクティビティ（{activeCard.listTitle}）</h3>
              <div className="activity-table-container p-2">
                <table className="activity-table">
                  <thead>
                    <tr>
                      <th>日時</th>
                      <th>アクション</th>
                      <th>アイテム</th>
                      <th>ユーザー</th>
                      {activeCard.key === 'delayed' && <th>超過日数</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {activeCard.activities.map((activity, index) => (
                      <tr key={`${activeCard.key}-activity-${index}`}>
                        <td className='td-date'>{activity.date}</td>
                        <td>{activity.action}</td>
                        <td>{activity.item}</td>
                        <td>{activity.user}</td>
                        {activeCard.key === 'delayed' && <td>{activity.overdue}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;