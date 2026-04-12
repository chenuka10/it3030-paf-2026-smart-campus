import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ADMIN_SECTIONS = [
  { label: 'Overview',      path: '/admin',                exact: true, icon: '▦', desc: 'Dashboard hub'   },
  { label: 'Users',         path: '/admin/users',                       icon: '◉', desc: 'Manage members'  },
  { label: 'Resources',     path: '/admin/resources',                   icon: '◫', desc: 'Campus resources' },
  { label: 'Notifications', path: '/admin/notifications',               icon: '◎', desc: 'Send alerts'     },
  { label: 'Reports',       path: '/admin/reports',                     icon: '◈', desc: 'Analytics & logs' },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout } = useAuth();

  const isActive = (item) =>
    item.exact ? pathname === item.path : pathname.startsWith(item.path);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="w-[220px] shrink-0 bg-ui-base/60 border-r border-ui-sky/10 backdrop-blur-md flex flex-col min-h-[calc(100vh-60px)] sticky top-[60px]">

      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-ui-sky/8">
        <div className="text-[9px] font-bold tracking-[0.18em] text-ui-danger font-mono mb-1">
          ADMIN PANEL
        </div>
        <div className="text-[13px] font-bold text-ui-bright">
          Management Console
        </div>
      </div>

      {/* Nav */}
      <nav className="px-2.5 py-3 flex-1 flex flex-col gap-0.5">
        {ADMIN_SECTIONS.map(item => {
          const active = isActive(item);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] relative border-none cursor-pointer text-left transition-colors duration-150 w-full
                ${active ? 'bg-ui-sky/8' : 'bg-transparent hover:bg-ui-sky/5'}`}
            >
              <span className={`text-[16px] shrink-0 transition-colors duration-200 ${active ? 'text-ui-sky' : 'text-ui-dim'}`}>
                {item.icon}
              </span>

              <div className="flex-1 min-w-0">
                <div className={`text-[13px] font-semibold tracking-[-0.01em] ${active ? 'text-ui-bright' : 'text-ui-muted'}`}>
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

      {/* Footer */}
      <div className="px-5 py-4 border-t border-ui-sky/8">
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