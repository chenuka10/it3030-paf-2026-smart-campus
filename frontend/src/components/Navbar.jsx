import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { label: 'Home',      path: '/home',      icon: '⌂' },
  { label: 'Resources', path: '/resources', icon: '◫' },
  { label: 'Profile',   path: '/profile',   icon: '◉' },
  { label: 'Tickets',   path: '/tickets',   icon: '✉' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [logoutHovered, setLogoutHovered] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="flex items-center gap-2 px-7 h-[60px] bg-ui-base/95 border-b border-ui-sky/10 backdrop-blur-md sticky top-0 z-[200]">

      {/* Brand */}
      <div
        className="flex items-center gap-2.5 cursor-pointer mr-4 shrink-0"
        onClick={() => navigate('/home')}
      >
        <div className="w-[34px] h-[34px] rounded-[9px] bg-ui-sky/10 border border-ui-sky/25 flex items-center justify-center">
          <div
            className="w-3.5 h-3.5 rounded-[3px] rotate-45"
            style={{ background: 'var(--gradient-primary)' }}
          />
        </div>
        <div>
          <div className="text-[14px] font-extrabold text-ui-surface tracking-tight leading-[1.1]">
            SmartCampus
          </div>
          <div className="text-[10px] text-ui-dim font-mono tracking-[0.1em]">
            SLIIT
          </div>
        </div>
      </div>

      {/* Nav links */}
      <div className="flex items-center gap-0.5 flex-1">
        {NAV_LINKS.map(link => {
          const active = pathname === link.path || pathname.startsWith(link.path + '/');
          return (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`
                flex items-center gap-1.5 relative bg-transparent border-none
                text-[13px] font-semibold cursor-pointer px-3 py-1.5 rounded-lg
                tracking-[-0.01em] transition-colors duration-200
                ${active ? 'text-ui-surface' : 'text-ui-muted hover:text-ui-bright'}
              `}
            >
              <span className="text-[13px] opacity-80">{link.icon}</span>
              {link.label}
              {active && (
                <div className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-ui-sky" />
              )}
            </button>
          );
        })}

        {user?.role === 'ADMIN' && (
          <button
            onClick={() => navigate('/admin')}
            className={`
              flex items-center gap-1.5 relative text-[13px] font-semibold cursor-pointer
              px-3 py-1.5 rounded-lg tracking-[-0.01em] transition-colors duration-200
              text-ui-danger border border-ui-danger/15 bg-ui-danger/5
              hover:bg-ui-danger/10 ml-2
              ${pathname.startsWith('/admin') ? 'text-ui-danger' : ''}
            `}
          >
            <span className="text-[13px] opacity-80">⚙</span>
            Admin
            {pathname.startsWith('/admin') && (
              <div className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-ui-danger" />
            )}
          </button>
        )}
      </div>

      {/* Right — avatar + logout */}
      <div className="flex items-center gap-2.5 ml-auto">
        {user && (
          <div
            className="flex items-center gap-2 py-[5px] pr-3 pl-1.5 bg-ui-sky/5 border border-ui-sky/12 rounded-[10px] cursor-pointer"
            onClick={() => navigate('/profile')}
          >
            {user.imageUrl
              ? <img src={user.imageUrl} alt="" className="w-[26px] h-[26px] rounded-full border border-ui-sky/30 block" />
              : (
                <div
                  className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-extrabold text-ui-surface"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  {user.name?.[0]?.toUpperCase()}
                </div>
              )
            }
            <div className="leading-[1.2]">
              <div className="text-[12px] font-bold text-ui-bright">{user.name?.split(' ')[0]}</div>
              <div className="text-[10px] text-ui-dim font-mono tracking-[0.06em]">{user.role}</div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          onMouseEnter={() => setLogoutHovered(true)}
          onMouseLeave={() => setLogoutHovered(false)}
          className={`
            w-8 h-8 rounded-lg border flex items-center justify-center
            cursor-pointer text-[14px] transition-all duration-200 bg-transparent
            ${logoutHovered
              ? 'bg-ui-danger/10 text-ui-danger border-ui-danger/30'
              : 'text-ui-dim border-ui-sky/12'}
          `}
        >
          ⏻
        </button>
      </div>
    </nav>
  );
}