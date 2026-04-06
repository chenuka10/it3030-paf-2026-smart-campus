import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // ✅ import auth

const ADMIN_SECTIONS = [
  { label: 'Overview', path: '/admin', exact: true, icon: '▦', desc: 'Dashboard hub' },
  { label: 'Users', path: '/admin/users', icon: '◉', desc: 'Manage members' },
  { label: 'Resources', path: '/resourceslist', icon: '◫', desc: 'Campus resources' },
  { label: 'Notifications', path: '/admin/notifications', icon: '◎', desc: 'Send alerts' },
  { label: 'Reports', path: '/admin/reports', icon: '◈', desc: 'Analytics & logs' },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout } = useAuth(); // ✅ get logout

  const isActive = (item) =>
    item.exact ? pathname === item.path : pathname.startsWith(item.path);

  const handleLogout = () => {
    logout();            // remove token / user
    navigate('/login');   // redirect to login
  };

  return (
    <aside style={s.sidebar}>
      <div style={s.sideHeader}>
        <div style={s.sideLabel}>ADMIN PANEL</div>
        <div style={s.sideSub}>Management Console</div>
      </div>

      <nav style={s.nav}>
        {ADMIN_SECTIONS.map(item => {
          const active = isActive(item);
          return (
            <button key={item.path}
              style={{ ...s.item, ...(active ? s.itemActive : {}) }}
              onClick={() => navigate(item.path)}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(56,189,248,0.05)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
              <span style={{ ...s.icon, ...(active ? s.iconActive : {}) }}>{item.icon}</span>
              <div style={s.itemText}>
                <div style={{ ...s.itemLabel, ...(active ? s.itemLabelActive : {}) }}>{item.label}</div>
                <div style={s.itemDesc}>{item.desc}</div>
              </div>
              {active && <div style={s.activeBar} />}
            </button>
          );
        })}
      </nav>

      {/* Footer with logout */}
      <div style={s.sideFooter}>
        <button 
          style={{ ...s.footerButton }} 
          onClick={handleLogout}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(251,113,133,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          ⏻ Logout
        </button>
      </div>
    </aside>
  );
}

const s = {
  sidebar: {
    width: 220, flexShrink: 0,
    background: 'rgba(8,16,32,0.6)',
    borderRight: '1px solid rgba(56,189,248,0.1)',
    backdropFilter: 'blur(12px)',
    display: 'flex', flexDirection: 'column',
    minHeight: 'calc(100vh - 60px)',
    position: 'sticky', top: 60,
    fontFamily: "'DM Sans', sans-serif",
  },
  sideHeader: {
    padding: '24px 20px 16px',
    borderBottom: '1px solid rgba(56,189,248,0.08)',
  },
  sideLabel: {
    fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
    color: '#fb7185', fontFamily: "'Geist Mono',monospace",
    marginBottom: 4,
  },
  sideSub: { fontSize: 13, fontWeight: 700, color: '#d0e8ff' },
  nav: { padding: '12px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 },
  item: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 12px', borderRadius: 10, position: 'relative',
    background: 'transparent', border: 'none', cursor: 'pointer',
    textAlign: 'left', transition: 'background 0.15s', width: '100%',
  },
  itemActive: { background: 'rgba(56,189,248,0.08)' },
  icon: { fontSize: 16, color: '#3d5a70', flexShrink: 0, transition: 'color 0.2s' },
  iconActive: { color: '#38bdf8' },
  itemText: { flex: 1, minWidth: 0 },
  itemLabel: { fontSize: 13, fontWeight: 600, color: '#7a9ab5', letterSpacing: '-0.01em' },
  itemLabelActive: { color: '#f0f6ff' },
  itemDesc: { fontSize: 10, color: '#2d4a60', marginTop: 1, fontFamily: "'Geist Mono',monospace" },
  activeBar: {
    position: 'absolute', right: 0, top: '20%', bottom: '20%',
    width: 3, borderRadius: 2, background: '#38bdf8',
  },
  sideFooter: {
    padding: '16px 20px',
    borderTop: '1px solid rgba(56,189,248,0.08)',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  footerDot: { width: 7, height: 7, borderRadius: '50%', background: '#22c55e', flexShrink: 0 },
  footerText: { fontSize: 11, color: '#3d5a70', fontFamily: "'Geist Mono',monospace" },
};