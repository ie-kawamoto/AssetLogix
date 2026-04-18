import '../styles/Sidebar.scss';
import { Link } from 'react-router-dom';
import dashboardIcon from '../assets/icons/dashboard.png';
import assetIcon from '../assets/icons/asset.png';
import listIcon from '../assets/icons/list.png';
import userIcon from '../assets/icons/user.png';

interface NavItem {
  icon: string;
  label: string;
  active?: boolean;
}

interface SidebarProps {
  currentPage?: string;
}

const defaultNavItems: NavItem[] = [
  { icon: dashboardIcon, label: 'Dashboard' },
  { icon: assetIcon, label: 'Assets' },
  { icon: listIcon, label: 'Loans' },
  { icon: userIcon, label: 'Users' },
];

function Sidebar({ currentPage = 'Dashboard' }: SidebarProps) {
  const navItems = defaultNavItems.map(item => ({
    ...item,
    active: item.label === currentPage,
  }));
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item, index) => {
            let path = '#';
            if (item.label === 'Dashboard') path = '/dashboard';
            else if (item.label === 'Assets') path = '/assets';
            else if (item.label === 'Loans') path = '/loans';
            else if (item.label === 'Users') path = '/users';
            
            return (
              <li
                key={index}
                className={`nav-item ${item.active ? 'active' : ''}`}
              >
                {path !== '#' ? (
                  <Link to={path} className="nav-link">
                    <img src={item.icon} alt={item.label} className="nav-icon" />
                    <span className="nav-label">{item.label}</span>
                  </Link>
                ) : (
                  <div className="nav-link">
                    <img src={item.icon} alt={item.label} className="nav-icon" />
                    <span className="nav-label">{item.label}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
