import { useEffect, useMemo, useState } from 'react';
import '../styles/Dashboard.scss';
import Header from './Header';
import Sidebar from './Sidebar';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

interface Item {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  instances: Instance[];
}

interface Instance {
  id: number;
  instanceName?: string;
  serialNumber?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Borrower {
  id: number;
  name: string;
}

interface Loan {
  id: number;
  dueDate: string;
  loanDate: string;
  returnDate?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  borrower: Borrower;
  instance: {
    id: number;
    instanceName?: string;
    serialNumber?: string;
    item: {
      name: string;
    };
  };
}

interface Activity {
  date: string;
  action: string;
  item: string;
  user: string;
  overdue?: string;
}

interface CardConfig {
  key: string;
  title: string;
  listTitle: string;
  english: string;
  value: string;
  className: string;
  listClassName: string;
  activities: Activity[];
}

interface ActivityLogEntry {
  id: number;
  date: string;
  action: string;
  targetType: 'ITEM' | 'INSTANCE' | 'LOAN';
  item: string;
  user: string;
}

const ACTIVITY_LIMIT = 8;

const getDateStart = (value: string | Date) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const isPastDue = (value: string) => getDateStart(value) < getDateStart(new Date());

const getOverdueDays = (dueDate: string) => {
  const now = getDateStart(new Date());
  const due = getDateStart(dueDate);
  const diffMs = now.getTime() - due.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatInstanceLabel = (loan: Loan) => {
  if (loan.instance.instanceName && loan.instance.instanceName.trim()) {
    return `${loan.instance.item.name} / ${loan.instance.instanceName}`;
  }

  if (loan.instance.serialNumber && loan.instance.serialNumber.trim()) {
    return `${loan.instance.item.name} / ${loan.instance.serialNumber}`;
  }

  return loan.instance.item.name;
};

function Dashboard({ user, onLogout }: DashboardProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeCardKey, setActiveCardKey] = useState('items');
  const activeLoans = useMemo(
    () => loans.filter((loan) => loan.status !== 'RETURNED'),
    [loans]
  );

  const overdueLoans = useMemo(
    () => activeLoans.filter((loan) => loan.status === 'OVERDUE' || isPastDue(loan.dueDate)),
    [activeLoans]
  );

  const cardData: CardConfig[] = useMemo(() => {
    const totalInstances = items.reduce((sum, item) => sum + (item.instances?.length ?? 0), 0);

    const itemLogActivities = activityLogs
      .filter((log) => log.targetType === 'ITEM' || log.targetType === 'INSTANCE')
      .slice(0, ACTIVITY_LIMIT)
      .map((log) => ({
        date: formatDateTime(log.date),
        action: log.action,
        item: log.item,
        user: log.user,
      }));

    const itemActivitiesFallback = [
      ...items.map((item) => ({
        timestamp: item.createdAt,
        activity: {
          date: formatDateTime(item.createdAt),
          action: '品目登録',
          item: item.name,
          user: '記録なし',
        } as Activity,
      })),
      ...items
        .filter((item) => new Date(item.updatedAt).getTime() !== new Date(item.createdAt).getTime())
        .map((item) => ({
          timestamp: item.updatedAt,
          activity: {
            date: formatDateTime(item.updatedAt),
            action: '品目更新',
            item: item.name,
            user: '記録なし',
          } as Activity,
        })),
      ...items.flatMap((item) =>
        (item.instances || []).map((instance) => ({
          timestamp: instance.createdAt,
          activity: {
            date: formatDateTime(instance.createdAt),
            action: '個体登録',
            item: `${item.name}${instance.instanceName ? ` / ${instance.instanceName}` : ''}`,
            user: '記録なし',
          } as Activity,
        }))
      ),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, ACTIVITY_LIMIT)
      .map((entry) => entry.activity);

    const itemActivities = itemLogActivities.length > 0 ? itemLogActivities : itemActivitiesFallback;

    const inUseActivities = activeLoans
      .slice()
      .sort((a, b) => new Date(b.loanDate).getTime() - new Date(a.loanDate).getTime())
      .slice(0, ACTIVITY_LIMIT)
      .map((loan) => ({
        date: formatDateTime(loan.loanDate),
        action: '利用中',
        item: formatInstanceLabel(loan),
        user: loan.borrower.name,
      }));

    const loanLogActivities = activityLogs
      .filter((log) => log.targetType === 'LOAN')
      .slice(0, ACTIVITY_LIMIT)
      .map((log) => ({
        date: formatDateTime(log.date),
        action: log.action,
        item: log.item,
        user: log.user,
      }));

    const loanActivitiesFallback = [
      ...loans.map((loan) => ({
        timestamp: loan.loanDate,
        activity: {
          date: formatDateTime(loan.loanDate),
          action: '貸し出し',
          item: formatInstanceLabel(loan),
          user: loan.borrower.name,
        } as Activity,
      })),
      ...loans
        .filter((loan) => Boolean(loan.returnDate))
        .map((loan) => ({
          timestamp: loan.returnDate as string,
          activity: {
            date: formatDateTime(loan.returnDate as string),
            action: '返却',
            item: formatInstanceLabel(loan),
            user: loan.borrower.name,
          } as Activity,
        })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, ACTIVITY_LIMIT)
      .map((entry) => entry.activity);

    const loanActivities = loanLogActivities.length > 0 ? loanLogActivities : loanActivitiesFallback;

    const delayedActivities = overdueLoans
      .slice()
      .sort((a, b) => getOverdueDays(b.dueDate) - getOverdueDays(a.dueDate))
      .slice(0, ACTIVITY_LIMIT)
      .map((loan) => ({
        date: formatDateTime(loan.dueDate),
        action: '期限超過',
        item: formatInstanceLabel(loan),
        user: loan.borrower.name,
        overdue: `${getOverdueDays(loan.dueDate)}日`,
      }));

    return [
      {
        key: 'items',
        title: '登録済み 合計点数',
        listTitle: '登録済みアイテム',
        english: 'Items',
        value: totalInstances.toLocaleString('ja-JP'),
        className: 'items-card',
        listClassName: 'items-list',
        activities: itemActivities,
      },
      {
        key: 'in-use',
        title: '自社内利用中',
        listTitle: '自社内利用状況',
        english: 'In use',
        value: activeLoans.length.toLocaleString('ja-JP'),
        className: 'in-use-card',
        listClassName: 'in-use-list',
        activities: inUseActivities,
      },
      {
        key: 'loans',
        title: '貸し出し中',
        listTitle: '貸し出し状況',
        english: 'Loans',
        value: activeLoans.length.toLocaleString('ja-JP'),
        className: 'loans-card',
        listClassName: 'loans-list',
        activities: loanActivities,
      },
      {
        key: 'delayed',
        title: '返却期限超過',
        listTitle: '返却期限超過アイテム',
        english: 'Delayed',
        value: overdueLoans.length.toLocaleString('ja-JP'),
        className: 'delayed-card',
        listClassName: 'delayed-list',
        activities: delayedActivities,
      },
    ];
  }, [activeLoans, activityLogs, items, loans, overdueLoans]);

  const activeCard = cardData.find((card) => card.key === activeCardKey) ?? cardData[0];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [itemsResponse, loansResponse, activityResponse] = await Promise.all([
          fetch('http://localhost:3000/api/items', { headers }),
          fetch('http://localhost:3000/api/loans', { headers }),
          fetch('http://localhost:3000/api/activity-logs?limit=80', { headers }),
        ]);

        if (
          itemsResponse.status === 401 ||
          itemsResponse.status === 403 ||
          loansResponse.status === 401 ||
          loansResponse.status === 403 ||
          activityResponse.status === 401 ||
          activityResponse.status === 403
        ) {
          onLogout();
          throw new Error('認証に失敗しました');
        }

        if (!itemsResponse.ok || !loansResponse.ok) {
          throw new Error(
            `ダッシュボード情報の取得に失敗しました (items: ${itemsResponse.status}, loans: ${loansResponse.status})`
          );
        }

        const [itemsData, loansData] = await Promise.all([
          itemsResponse.json(),
          loansResponse.json(),
        ]);

        setItems(itemsData);
        setLoans(loansData);

        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          setActivityLogs(Array.isArray(activityData) ? activityData : []);
        } else {
          // 履歴APIが未反映でもダッシュボードの主要情報は表示を継続する
          setActivityLogs([]);
        }
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.message || 'ダッシュボード情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [onLogout]);

  const handleCardClick = (key: string) => {
    setActiveCardKey(key);
  };

  return (
    <div className="dashboard-container">
      <Header user={user} onLogout={onLogout} />

      <div className="dashboard-body">
        <Sidebar currentPage="Dashboard" />

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

            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}

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
                    {loading ? (
                      <tr>
                        <td colSpan={activeCard.key === 'delayed' ? 5 : 4}>読み込み中...</td>
                      </tr>
                    ) : activeCard.activities.length === 0 ? (
                      <tr>
                        <td colSpan={activeCard.key === 'delayed' ? 5 : 4}>表示できる履歴がありません</td>
                      </tr>
                    ) : (
                      activeCard.activities.map((activity, index) => (
                        <tr key={`${activeCard.key}-activity-${index}`}>
                          <td className='td-date'>{activity.date}</td>
                          <td>{activity.action}</td>
                          <td>{activity.item}</td>
                          <td>{activity.user}</td>
                          {activeCard.key === 'delayed' && <td>{activity.overdue}</td>}
                        </tr>
                      ))
                    )}
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