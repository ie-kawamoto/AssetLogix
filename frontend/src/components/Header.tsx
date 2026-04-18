import '../styles/Header.scss';
import serviceLogo from '../assets/logo.png';
import { Link } from 'react-router-dom';

interface HeaderProps {
  user: any;
  onLogout: () => void;
}

function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="dashboard-header">
      <div className="header-left">
        <Link to="/dashboard" className="header-logo-link" aria-label="ダッシュボードへ移動">
          <img src={serviceLogo} alt="logo" className="header-logo" />
        </Link>
      </div>
      <div className="header-right">
        <span className="user-info">ログイン中： {user?.name || user?.email}</span>
        <button onClick={onLogout} className="logout-button">Logout</button>
      </div>
    </header>
  );
}

export default Header;