import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const NAV_LINKS = [
  { label: 'Home', path: '/home', icon: '⌂' },
  { label: 'Resources', path: '/resources', icon: '◫' },
  { label: 'Bookings', path: '/bookings', icon: '🗓' },
  { label: 'Profile', path: '/profile', icon: '◉' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="flex items-center gap-2 px-7 h-[60px] bg-white border-b border-gray-200 backdrop-blur-md sticky top-0 z-[200] font-sans">

      {/* Brand */}
      <div
        onClick={() => navigate('/home')}
        className="flex items-center gap-2.5 cursor-pointer mr-4 shrink-0"
      >
        <div className="w-[34px] h-[34px] rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center">
          <div className="w-[14px] h-[14px] rounded-sm bg-gradient-to-br from-sky-400 to-sky-600 rotate-45" />
        </div>

        <div>
          <div className="text-[14px] font-extrabold text-gray-900 leading-tight tracking-tight">
            SmartCampus
          </div>
          <div className="text-[10px] text-gray-500 tracking-widest font-mono">
            SLIIT
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="flex items-center gap-1 flex-1">
        {NAV_LINKS.map(link => {
          const active =
            pathname === link.path ||
            pathname.startsWith(link.path + '/');

          return (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`
                relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold tracking-tight transition
                ${active
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-blue-500'}
              `}
            >
              <span className="text-[13px] opacity-80">{link.icon}</span>
              {link.label}

              {active && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sky-500" />
              )}
            </button>
          );
        })}

        {/* Admin */}
        {user?.role === 'ADMIN' && (
          <button
            onClick={() => navigate('/admin')}
            className={`
              relative flex items-center gap-1.5 px-3 py-1.5 ml-2 rounded-lg text-[13px] font-semibold
              border transition
              ${pathname.startsWith('/admin')
                ? 'text-rose-500 border-rose-300 bg-rose-50'
                : 'text-rose-500 border-rose-200 bg-rose-50 hover:bg-rose-100'}
            `}
          >
            <span className="text-[13px]">⚙</span>
            Admin

            {pathname.startsWith('/admin') && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-500" />
            )}
          </button>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 ml-auto">
        <NotificationBell />

        {/* User */}
        {user && (
          <div
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg cursor-pointer"
          >
            {user.imageUrl ? (
              <img
                src={user.imageUrl}
                alt=""
                className="w-[26px] h-[26px] rounded-full border border-blue-300"
              />
            ) : (
              <div className="w-[26px] h-[26px] rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-[11px] font-extrabold text-white">
                {user.name?.[0]?.toUpperCase()}
              </div>
            )}

            <div className="leading-tight">
              <div className="text-[12px] font-bold text-blue-900">
                {user.name?.split(' ')[0]}
              </div>
              <div className="text-[10px] text-gray-500 font-mono tracking-wide">
                {user.role}
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-300 transition"
          title="Sign out"
        >
          ⏻
        </button>
      </div>
    </nav>
  );
}