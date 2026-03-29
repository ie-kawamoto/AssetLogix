import '../styles/Dashboard.scss';
import serviceLogo from '../assets/logo.png';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

function Dashboard({ user, onLogout }: DashboardProps) {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <img src={serviceLogo} alt="logo" className="header-logo" />
          <h1>AssetLogix Dashboard</h1>
        </div>
        <div className="header-right">
          <span className="user-info">Welcome, {user?.name || user?.email}</span>
          <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
      </header>

      <div className="dashboard-body">
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <ul>
              <li className="nav-item active">
                <span className="nav-icon">📊</span>
                Dashboard
              </li>
              <li className="nav-item">
                <span className="nav-icon">📦</span>
                Assets
              </li>
              <li className="nav-item">
                <span className="nav-icon">👥</span>
                Users
              </li>
              <li className="nav-item">
                <span className="nav-icon">⚙️</span>
                Settings
              </li>
            </ul>
          </nav>
        </aside>

        <main className="main-content">
          <div className="content-wrapper">
            <h2>Dashboard Overview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Assets</h3>
                <p className="stat-number">1,234</p>
              </div>
              <div className="stat-card">
                <h3>Active Users</h3>
                <p className="stat-number">567</p>
              </div>
              <div className="stat-card">
                <h3>Recent Activities</h3>
                <p className="stat-number">89</p>
              </div>
            </div>
            <div className="recent-activities">
              <h3>Recent Activities</h3>
              <ul className="activity-list">
                <li>Asset "Laptop A" was added</li>
                <li>User "John Doe" logged in</li>
                <li>Asset "Server B" was updated</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;