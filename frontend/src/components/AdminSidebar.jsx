import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const ADMIN_SECTIONS = [
  { label: 'Overview', path: '/admin', exact: true, icon: '▦', desc: 'Dashboard hub' },
  { label: 'Users', path: '/admin/users', icon: '◉', desc: 'Manage members' },
  { label: 'Resources', path: '/admin/resources', icon: '◫', desc: 'Campus resources' },
  { label: 'Bookings', path: '/admin/bookings', icon: '◎', desc: 'Review requests' },
  { label: 'Check-In', path: '/admin/check-in', icon: '▣', desc: 'QR scan & verify' },
  { label: 'Reports', path: '/admin/reports', exact: true, icon: '◈', desc: 'Analytics & logs' },
  { label: 'Resource IQ', path: '/admin/reports/resource-utilization', exact: true, icon: '◍', desc: 'Booking intelligence' },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  const isActive = (item) =>
    item.exact ? pathname === item.path : pathname.startsWith(item.path);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-[220px] shrink-0 bg-ui-base/60 border-r border-ui-sky/10 backdrop-blur-md flex flex-col h-[calc(100vh-60px)] sticky top-[60px] overflow-visible relative z-40">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-ui-sky/8 shrink-0 relative z-50 overflow-visible">
        <div className="text-[9px] font-bold tracking-[0.18em] text-ui-danger font-mono mb-1">
          ADMIN PANEL
        </div>

        <div className="text-[13px] font-bold text-ui-bright">
          Management Console
        </div>

        {/* Real notifications */}
        <div className="mt-4 flex items-center justify-between relative overflow-visible">
          <div>
            <div className="text-[11px] font-semibold text-ui-muted">
              Notifications
            </div>
            <div className="text-[10px] text-ui-dim/70 font-mono">
              Live alerts & updates
            </div>
          </div>

          <div className="relative z-[9999] overflow-visible">
            <NotificationBell variant="sidebar" />
          </div>
        </div>
      </div>

      {/* Scrollable middle section */}
      <div className="flex-1 overflow-y-auto overflow-x-visible relative">
        <nav className="px-2.5 py-3 flex flex-col gap-0.5">
          {ADMIN_SECTIONS.map((item) => {
            const active = isActive(item);

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] relative border-none cursor-pointer text-left transition-colors duration-150 w-full
                  ${active ? 'bg-ui-sky/8' : 'bg-transparent hover:bg-ui-sky/5'}`}
              >
                <span
                  className={`text-[16px] shrink-0 transition-colors duration-200 ${
                    active ? 'text-ui-sky' : 'text-ui-dim'
                  }`}
                >
                  {item.icon}
                </span>

                <div className="flex-1 min-w-0">
                  <div
                    className={`text-[13px] font-semibold tracking-[-0.01em] ${
                      active ? 'text-ui-bright' : 'text-ui-muted'
                    }`}
                  >
                    {item.label}
                  </div>

                  <div className="text-[10px] text-ui-dim/70 mt-px font-mono">
                    {item.desc}
                  </div>
                </div>

                {active && (
                  <div className="absolute right-0 top-[20%] bottom-[20%] w-[3px] rounded-sm bg-ui-sky" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-ui-sky/8 space-y-3 shrink-0">
        {user && (
          <div
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] bg-ui-sky/6 hover:bg-ui-sky/10 cursor-pointer transition-colors duration-150"
            title="Go to profile"
          >
            {user.imageUrl ? (
              <img
                src={user.imageUrl}
                alt=""
                className="w-9 h-9 rounded-full object-cover border border-ui-sky/20"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-[13px] font-extrabold text-white">
                {user.name?.[0]?.toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <div className="text-[12px] font-bold text-ui-bright truncate">
                {user.name}
              </div>
              <div className="text-[10px] text-ui-dim font-mono tracking-wide">
                {user.role}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 text-[13px] font-semibold text-ui-danger bg-transparent border-none cursor-pointer px-3 py-2 rounded-[8px] transition-colors duration-150 hover:bg-ui-danger/10"
        >
          ⏻ Logout
        </button>
      </div>
    </aside>
  );
}