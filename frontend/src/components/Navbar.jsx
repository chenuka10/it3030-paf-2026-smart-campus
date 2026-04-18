import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const NAV_LINKS = [
  { label: 'Home', path: '/home', icon: '⌂' },
  { label: 'Resources', path: '/resources', icon: '◫' },
  { label: 'Profile', path: '/profile', icon: '◉' },
  { label: 'Tickets', path: '/tickets', icon: '✉' },
];

const ROLE_STYLES = {
  ADMIN: 'bg-rose-50 text-rose-600 border border-rose-200',
  TECHNICIAN: 'bg-amber-50 text-amber-700 border border-amber-200',
  USER: 'bg-sky-50 text-sky-700 border border-sky-200',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const homePath = user?.role === 'ADMIN' ? '/admin' : '/home';

  const isActive = (path) => pathname === path || pathname.startsWith(path + '/');

  return (
    <nav className="sticky top-0 z-[200] h-[68px] border-b border-slate-200 bg-white/85 backdrop-blur-md">
      <div className="h-full max-w-[1600px] mx-auto px-4 md:px-6 flex items-center gap-3">
        {/* Brand */}
        <div
          onClick={() => navigate(homePath)}
          className="flex items-center gap-3 cursor-pointer shrink-0 pr-2"
        >
          <div className="w-10 h-10 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center shadow-sm">
            <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-sky-400 to-sky-600 rotate-45" />
          </div>

          <div className="leading-tight">
            <div className="text-[15px] font-extrabold text-slate-900 tracking-tight">
              SmartCampus
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-mono">
              Campus Operations
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-1.5 flex-1 ml-2">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.path);

            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition border
                  ${
                    active
                      ? 'bg-sky-50 text-sky-700 border-sky-200 shadow-sm'
                      : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900'
                  }`}
              >
                <span className="text-[13px] opacity-80">{link.icon}</span>
                {link.label}
              </button>
            );
          })}

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => navigate('/admin')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition border ml-1
                ${
                  pathname.startsWith('/admin')
                    ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm'
                    : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
                }`}
            >
              <span className="text-[13px]">⚙</span>
              Admin Hub
            </button>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <NotificationBell />

          {user && (
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-3 px-2.5 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition"
            >
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt=""
                  className="w-9 h-9 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-[13px] font-extrabold text-white">
                  {user.name?.[0]?.toUpperCase()}
                </div>
              )}

              <div className="hidden sm:block text-left leading-tight">
                <div className="text-[13px] font-bold text-slate-900">
                  {user.name?.split(' ')[0]}
                </div>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                      ROLE_STYLES[user.role] || ROLE_STYLES.USER
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>
            </button>
          )}

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition"
            title="Sign out"
          >
            ⏻
          </button>
        </div>
      </div>
    </nav>
  );
}