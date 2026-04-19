import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { useEffect, useRef, useState } from 'react';

const SECTIONS = [
  {
    label: 'User Management',
    desc: 'View, edit roles, and remove campus members',
    icon: '◉',
    path: '/admin/users',
    stat: 'users',
    statLabel: 'Total Users',
  },
  {
    label: 'Resources',
    desc: 'Add, edit, and manage campus resources',
    icon: '◫',
    path: '/admin/resources',
    stat: 'resources',
    statLabel: 'Total Resources',
  },
  {
    label: 'Notifications',
    desc: 'Broadcast alerts to users or groups',
    icon: '◎',
    path: '/admin/notifications',
    stat: 'notifications',
    statLabel: 'Sent Today',
  },
  {
    label: 'Reports',
    desc: 'Analytics, logs, and activity summaries',
    icon: '◈',
    path: '/admin/reports',
    stat: 'reports',
    statLabel: 'This Month',
  },
  {
    label: 'Bookings',
    desc: 'Approve, reject, and inspect booking requests',
    icon: '◎',
    path: '/admin/bookings',
    stat: 'bookings',
    statLabel: 'Pending Now',
  },
  {
    label: 'Check-In',
    desc: 'Scan booking QR codes and verify attendance',
    icon: '▣',
    path: '/admin/check-in',
    stat: 'checkins',
    statLabel: 'Checked In Today',
  },
  {
    label: 'Resource Intelligence',
    desc:  'Booking utilization, demand peaks, and underused assets',
    icon: '◍', path: '/admin/reports/resource-utilization',
    stat: 'resourceIntel', statLabel: 'Bookings (30d)',
  },
];

export default function AdminHub() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const hasFetched = useRef(false);

 useEffect(() => {
  if (hasFetched.current) return;
  hasFetched.current = true;

  api.get('/api/users')
    .then(({ data }) => {
      setStats((s) => ({ ...s, users: Array.isArray(data) ? data.length : 0 }));
    })
    .catch(console.error);

  api.get('/api/tickets/analytics/resources')
    .then(({ data }) => {
      setStats((s) => ({ ...s, reports: data.summary?.affectedResources ?? 0 }));
    })
    .catch(console.error);

  api.get('/api/bookings/analytics/resources', { params: { days: 30 } })
    .then(({ data }) => {
      setStats((s) => ({ ...s, resourceIntel: data.summary?.totalBookings ?? 0 }));
    })
    .catch(console.error);

  api.get('/api/bookings')
    .then(({ data }) => {
      const pending = Array.isArray(data)
        ? data.filter((booking) => booking.status === 'PENDING').length
        : 0;

      setStats((s) => ({ ...s, bookings: pending }));
    })
    .catch(console.error);
}, []);


  return (
    <Layout adminOnly>
      <div className="px-9 py-9 max-w-[900px] mx-auto">
        <div className="mb-8">
          <div className="text-[10px] font-bold tracking-[0.18em] text-ui-dim font-mono mb-2.5">
            ADMIN CONSOLE
          </div>
          <h1 className="text-[38px] font-extrabold tracking-[-0.04em] font-display mb-2.5">
            Dashboard
          </h1>
          <p className="text-[15px] text-ui-muted">
            Manage all SmartCampus systems from one place
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-7">
          {SECTIONS.map((sec) => (
            <button
              key={sec.path}
              onClick={() => navigate(sec.path)}
              className="flex items-center gap-4 bg-ui-base border border-ui-sky/10 rounded-2xl px-6 py-[22px] cursor-pointer text-left transition-all duration-200 hover:-translate-y-1 hover:border-ui-sky/40 hover:shadow-lg group"
            >
              <div className="w-12 h-12 rounded-[13px] flex items-center justify-center text-[22px] shrink-0 bg-ui-sky/10 text-ui-sky group-hover:bg-brand-accent/10 group-hover:text-ui-warn transition-colors">
                {sec.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-base font-bold text-ui-bright mb-1 tracking-[-0.02em] group-hover:text-ui-surface transition-colors">
                  {sec.label}
                </div>
                <div className="text-[13px] text-ui-muted leading-relaxed">
                  {sec.desc}
                </div>
              </div>

              {stats[sec.stat] !== undefined && (
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[26px] font-extrabold leading-none text-ui-sky group-hover:text-ui-warn transition-colors">
                    {stats[sec.stat]}
                  </span>
                  <span className="text-[10px] text-ui-dim font-mono mt-0.5 uppercase">
                    {sec.statLabel}
                  </span>
                </div>
              )}

              <span className="text-lg shrink-0 text-ui-sky/40 group-hover:text-ui-warn transition-colors">
                →
              </span>
            </button>
          ))}
        </div>

        <div className="bg-ui-sky/5 border border-ui-sky/10 rounded-xl px-6 py-4 flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-ui-sky shrink-0" />
            <span className="text-[13px] text-ui-muted">
              All changes are logged and audited
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-ui-warn shrink-0" />
            <span className="text-[13px] text-ui-muted">
              Role changes take effect immediately
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-ui-danger shrink-0" />
            <span className="text-[13px] text-ui-muted">
              Deletions are permanent and irreversible
            </span>
          </div>
        </div>
      </div>
    </Layout>
  );
}