import '../styles/Sidebar.scss';

interface NavItem {
  icon: string;
  label: string;
  active?: boolean;
}

interface SidebarProps {
  navItems: NavItem[];
  onNavClick?: (label: string) => void;
}

function Sidebar({ navItems, onNavClick }: SidebarProps) {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item, index) => (
            <li
              key={index}
              className={`nav-item ${item.active ? 'active' : ''}`}
              onClick={() => onNavClick?.(item.label)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;