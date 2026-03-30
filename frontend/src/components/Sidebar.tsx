import '../styles/Sidebar.scss';
import dashboardIcon from '../assets/icons/dashboard.png';
import assetIcon from '../assets/icons/asset.png';
import userIcon from '../assets/icons/user.png';
import settingIcon from '../assets/icons/setting.png';

interface NavItem {
  icon: string;
  label: string;
  active?: boolean;
}

interface SidebarProps {
  onNavClick?: (label: string) => void;
}

const defaultNavItems: NavItem[] = [
  { icon: dashboardIcon, label: 'Dashboard', active: true },
  { icon: assetIcon, label: 'Assets' },
  { icon: userIcon, label: 'Users' },
  { icon: settingIcon, label: 'Settings' },
];

function Sidebar({ onNavClick }: SidebarProps) {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul>
          {defaultNavItems.map((item, index) => (
            <li
              key={index}
              className={`nav-item ${item.active ? 'active' : ''}`}
              onClick={() => onNavClick?.(item.label)}
            >
              <img src={item.icon} alt={item.label} className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
