import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { label: 'Home',      path: '/home',    icon: '⌂' },
  { label: 'Resources', path: '/resources', icon: '◫' },
  { label: 'Profile',   path: '/profile', icon: '◉' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav style={s.nav}>
      {/* Brand */}
      <div style={s.brand} onClick={() => navigate('/home')}>
        <div style={s.logoRing}>
          <div style={s.logoDiamond} />
        </div>
        <div>
          <div style={s.brandName}>SmartCampus</div>
          <div style={s.brandSub}>SLIIT</div>
        </div>
      </div>

      {/* Nav links */}
      <div style={s.links}>
        {NAV_LINKS.map(link => {
          const active = pathname === link.path || pathname.startsWith(link.path + '/');
          return (
            <button key={link.path}
              style={{ ...s.link, ...(active ? s.linkActive : {}) }}
              onClick={() => navigate(link.path)}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#d0e8ff'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#7a9ab5'; }}>
              <span style={s.linkIcon}>{link.icon}</span>
              {link.label}
              {active && <div style={s.activePip} />}
            </button>
          );
        })}

        {user?.role === 'ADMIN' && (
          <button
            style={{ ...s.link, ...(pathname.startsWith('/admin') ? s.linkActive : {}), ...s.adminLink }}
            onClick={() => navigate('/admin')}
            onMouseEnter={e => { if (!pathname.startsWith('/admin')) { e.currentTarget.style.color = '#fb7185'; e.currentTarget.style.background = 'rgba(251,113,133,0.08)'; } }}
            onMouseLeave={e => { if (!pathname.startsWith('/admin')) { e.currentTarget.style.color = '#fb7185'; e.currentTarget.style.background = 'rgba(251,113,133,0.06)'; } }}>
            <span style={s.linkIcon}>⚙</span>
            Admin
            {pathname.startsWith('/admin') && <div style={{ ...s.activePip, background: '#fb7185' }} />}
          </button>
        )}
      </div>

      {/* Right — avatar + logout */}
      <div style={s.right}>
        {user && (
          <div style={s.userChip} onClick={() => navigate('/profile')}>
            {user.imageUrl
              ? <img src={user.imageUrl} alt="" style={s.avatar} />
              : <div style={s.avatarFallback}>{user.name?.[0]?.toUpperCase()}</div>}
            <div style={s.userInfo}>
              <div style={s.userName}>{user.name?.split(' ')[0]}</div>
              <div style={s.userRole}>{user.role}</div>
            </div>
          </div>
        )}
        <button style={s.logoutBtn} onClick={handleLogout}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(251,113,133,0.12)'; e.currentTarget.style.color = '#fb7185'; e.currentTarget.style.borderColor = 'rgba(251,113,133,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3d5a70'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.12)'; }}>
          ⏻
        </button>
      </div>
    </nav>
  );
}

const s = {
  nav: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '0 28px', height: 60,
    background: 'rgba(5,11,24,0.95)',
    borderBottom: '1px solid rgba(56,189,248,0.1)',
    backdropFilter: 'blur(16px)',
    position: 'sticky', top: 0, zIndex: 200,
    fontFamily: "'DM Sans', sans-serif",
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: 10,
    cursor: 'pointer', marginRight: 16, flexShrink: 0,
  },
  logoRing: {
    width: 34, height: 34, borderRadius: 9,
    background: 'rgba(56,189,248,0.1)',
    border: '1px solid rgba(56,189,248,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoDiamond: {
    width: 14, height: 14, borderRadius: 3,
    background: 'linear-gradient(135deg,#38bdf8,#0ea5e9)',
    transform: 'rotate(45deg)',
  },
  brandName: { fontSize: 14, fontWeight: 800, color: '#f0f6ff', letterSpacing: '-0.02em', lineHeight: 1.1 },
  brandSub:  { fontSize: 10, color: '#3d5a70', letterSpacing: '0.1em', fontFamily: "'Geist Mono',monospace" },
  links: { display: 'flex', alignItems: 'center', gap: 2, flex: 1 },
  link: {
    display: 'flex', alignItems: 'center', gap: 6, position: 'relative',
    background: 'none', border: 'none', color: '#7a9ab5',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    padding: '6px 12px', borderRadius: 8,
    fontFamily: 'inherit', transition: 'color 0.2s',
    letterSpacing: '-0.01em',
  },
  linkActive: { color: '#f0f6ff' },
  linkIcon:   { fontSize: 13, opacity: 0.8 },
  activePip: {
    position: 'absolute', bottom: -2, left: '50%',
    transform: 'translateX(-50%)',
    width: 4, height: 4, borderRadius: '50%', background: '#38bdf8',
  },
  adminLink: {
    color: '#fb7185',
    background: 'rgba(251,113,133,0.06)',
    border: '1px solid rgba(251,113,133,0.15)',
    marginLeft: 8,
  },
  right: { display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' },
  userChip: {
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '5px 12px 5px 6px',
    background: 'rgba(56,189,248,0.05)',
    border: '1px solid rgba(56,189,248,0.12)',
    borderRadius: 10, cursor: 'pointer',
  },
  avatar:        { width: 26, height: 26, borderRadius: '50%', border: '1px solid rgba(56,189,248,0.3)', display: 'block' },
  avatarFallback:{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#38bdf8,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#050b18' },
  userInfo: { lineHeight: 1.2 },
  userName: { fontSize: 12, fontWeight: 700, color: '#d0e8ff' },
  userRole: { fontSize: 10, color: '#3d5a70', fontFamily: "'Geist Mono',monospace", letterSpacing: '0.06em' },
  logoutBtn: {
    background: 'transparent', border: '1px solid rgba(56,189,248,0.12)',
    borderRadius: 8, color: '#3d5a70', width: 32, height: 32,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: 14, transition: 'all 0.2s', fontFamily: 'inherit',
  },
};