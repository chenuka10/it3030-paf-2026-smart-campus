import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const quickActions = [
  {
    title: 'Browse Resources',
    desc: 'Explore facilities, tools, and campus assets available to you.',
    icon: '◫',
    path: '/resources',
  },
  {
    title: 'View Profile',
    desc: 'Check your account details and role information.',
    icon: '◉',
    path: '/profile',
  },
  {
    title: 'Open Tickets',
    desc: 'Track service requests and support activity in one place.',
    icon: '✉',
    path: '/tickets',
  },
];

const overviewCards = [
  {
    label: 'System Status',
    value: 'Operational',
    tone: 'sky',
    note: 'Core services are running normally',
  },
  {
    label: 'Resources',
    value: 'Available',
    tone: 'emerald',
    note: 'Browse current campus resources',
  },
  {
    label: 'Notifications',
    value: 'Live',
    tone: 'amber',
    note: 'Stay updated with announcements',
  },
];

export default function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;

  const firstName = user?.name?.split(' ')[0] || 'there';
  const isTechnician = user?.role === 'TECHNICIAN';

  const roleBadgeClass =
    user?.role === 'TECHNICIAN'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-sky-50 text-sky-700 border-sky-200';

  return (
    <Layout>
      <div className="px-5 md:px-8 py-8 md:py-10">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero */}
          <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-indigo-50 opacity-90" />
            <div className="relative px-6 md:px-8 py-8 md:py-10">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div className="max-w-2xl">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-[0.12em] border ${roleBadgeClass}`}
                    >
                      {user.role}
                    </span>

                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-[0.08em] bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      SYSTEM ONLINE
                    </span>
                  </div>

                  <h1 className="text-[32px] md:text-[42px] font-extrabold tracking-[-0.04em] text-slate-900 leading-tight">
                    Welcome back, <span className="text-sky-600">{firstName}</span>.
                  </h1>

                  <p className="mt-4 text-[15px] md:text-[16px] leading-7 text-slate-600 max-w-xl">
                    {isTechnician
                      ? 'Monitor campus tools, access resources, and stay aligned with operational updates from one place.'
                      : 'Access campus resources, stay informed, and manage your SmartCampus experience from one central dashboard.'}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={() => navigate('/resources')}
                      className="px-4 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition shadow-sm"
                    >
                      Explore Resources
                    </button>

                    <button
                      onClick={() => navigate('/profile')}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
                    >
                      View Profile
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 min-w-[260px]">
                  <div className="rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-4">
                    <div className="text-[11px] font-mono tracking-[0.12em] text-slate-500 uppercase">
                      Role
                    </div>
                    <div className="mt-2 text-xl font-extrabold text-slate-900">
                      {user.role}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4">
                    <div className="text-[11px] font-mono tracking-[0.12em] text-slate-500 uppercase">
                      Access
                    </div>
                    <div className="mt-2 text-xl font-extrabold text-slate-900">
                      Active
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 col-span-2">
                    <div className="text-[11px] font-mono tracking-[0.12em] text-slate-500 uppercase">
                      Today
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-700">
                      Ready for resources, updates, and platform activity
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Overview */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {overviewCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500 font-mono">
                  {card.label}
                </div>
                <div className="mt-3 text-[24px] font-extrabold tracking-[-0.03em] text-slate-900">
                  {card.value}
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  {card.note}
                </div>
              </div>
            ))}
          </section>

          {/* Main content */}
          <section className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-5">
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500 font-mono">
                  Quick Actions
                </div>
                <h2 className="mt-2 text-[24px] font-extrabold tracking-[-0.03em] text-slate-900">
                  Jump back in
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickActions.map((item) => (
                  <button
                    key={item.title}
                    onClick={() => navigate(item.path)}
                    className="text-left rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-sky-200 hover:-translate-y-0.5 transition-all p-5"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center text-lg mb-4">
                      {item.icon}
                    </div>

                    <div className="text-base font-bold text-slate-900">
                      {item.title}
                    </div>

                    <div className="mt-2 text-sm leading-6 text-slate-600">
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500 font-mono">
                Platform Update
              </div>

              <h2 className="mt-2 text-[24px] font-extrabold tracking-[-0.03em] text-slate-900">
                What’s happening
              </h2>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                  <div className="text-sm font-bold text-slate-900">
                    Navigation upgrade completed
                  </div>
                  <div className="mt-1 text-sm text-slate-600 leading-6">
                    Role-based routing is now active, with improved movement between user and admin flows.
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                  <div className="text-sm font-bold text-slate-900">
                    Shared experience improving
                  </div>
                  <div className="mt-1 text-sm text-slate-600 leading-6">
                    Navbar and home experience are being refined to create a cleaner campus platform feel.
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                  <div className="text-sm font-bold text-slate-900">
                    More modules coming next
                  </div>
                  <div className="mt-1 text-sm text-slate-600 leading-6">
                    Tickets, booking flows, and richer technician tooling can plug into this layout later.
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}