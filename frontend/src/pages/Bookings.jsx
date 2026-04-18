import { useMemo, useState } from 'react';
import Layout from '../components/Layout';
import CreateBookingModal from '../components/CreateBookingModal';

const sampleBookings = [
  {
    id: 'BK-1001',
    resource: 'Lecture Hall A401',
    type: 'Hall',
    date: '2026-04-20',
    startTime: '09:00',
    endTime: '11:00',
    purpose: 'PAF project presentation practice',
    attendees: 45,
    status: 'APPROVED',
    checkedIn: false,
  },
  {
    id: 'BK-1002',
    resource: 'Computer Lab B203',
    type: 'Lab',
    date: '2026-04-18',
    startTime: '13:00',
    endTime: '15:00',
    purpose: 'Database practical session',
    attendees: 28,
    status: 'PENDING',
    checkedIn: false,
  },
  {
    id: 'BK-1003',
    resource: 'Meeting Room C102',
    type: 'Meeting Room',
    date: '2026-04-16',
    startTime: '10:00',
    endTime: '11:30',
    purpose: 'Group discussion with supervisor',
    attendees: 6,
    status: 'APPROVED',
    checkedIn: true,
  },
  {
    id: 'BK-1004',
    resource: 'Projector Unit P-12',
    type: 'Equipment',
    date: '2026-04-14',
    startTime: '08:00',
    endTime: '12:00',
    purpose: 'Seminar support',
    attendees: 0,
    status: 'REJECTED',
    checkedIn: false,
  },
  {
    id: 'BK-1005',
    resource: 'Innovation Lab D110',
    type: 'Lab',
    date: '2026-04-22',
    startTime: '14:00',
    endTime: '16:00',
    purpose: 'Prototype testing session',
    attendees: 12,
    status: 'APPROVED',
    checkedIn: false,
  },
  {
    id: 'BK-1006',
    resource: 'Mini Auditorium',
    type: 'Hall',
    date: '2026-04-10',
    startTime: '09:30',
    endTime: '11:00',
    purpose: 'Club orientation',
    attendees: 85,
    status: 'CANCELLED',
    checkedIn: false,
  },
];

const STATUS_STYLES = {
  APPROVED: {
    bg: 'rgba(111,143,114,0.12)',
    text: 'var(--color-ui-green)',
    border: 'rgba(111,143,114,0.25)',
  },
  PENDING: {
    bg: 'rgba(242,166,90,0.12)',
    text: 'var(--color-ui-warn)',
    border: 'rgba(242,166,90,0.25)',
  },
  REJECTED: {
    bg: 'rgba(224,122,95,0.12)',
    text: 'var(--color-ui-danger)',
    border: 'rgba(224,122,95,0.25)',
  },
  CANCELLED: {
    bg: 'rgba(100,116,139,0.10)',
    text: 'var(--color-ui-dim)',
    border: 'rgba(100,116,139,0.20)',
  },
};

const fmtDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const isUpcoming = (dateString) => {
  const today = new Date();
  const d = new Date(dateString);
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d >= today;
};

export default function Bookings() {
  const [tab, setTab] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    resource: '',
    date: '',
    startTime: '',
    endTime: '',
    attendees: '',
    purpose: '',
  });

  const upcomingBookings = useMemo(
    () =>
      sampleBookings.filter(
        (b) => isUpcoming(b.date) && b.status !== 'CANCELLED'
      ),
    []
  );

  const recentBookings = useMemo(() => sampleBookings.slice(0, 3), []);
  const checkedInBookings = useMemo(
    () => sampleBookings.filter((b) => b.checkedIn),
    []
  );

  const filteredBookings = useMemo(() => {
    switch (tab) {
      case 'UPCOMING':
        return upcomingBookings;
      case 'RECENT':
        return recentBookings;
      case 'CHECKED_IN':
        return checkedInBookings;
      default:
        return sampleBookings;
    }
  }, [tab, upcomingBookings, recentBookings, checkedInBookings]);

  return (
    <Layout>
      <div className="max-w-[1180px] mx-auto px-6 py-9">
        <div className="card mb-7 overflow-hidden relative">
          <div
            className="absolute right-[-40px] top-[-30px] w-[180px] h-[180px] organic-shape opacity-30"
            style={{ background: 'var(--gradient-primary)' }}
          />
          <div
            className="absolute left-[-30px] bottom-[-50px] w-[140px] h-[140px] organic-shape opacity-20"
            style={{ background: 'var(--gradient-accent)' }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-[760px]">
              <div className="text-[10px] font-bold tracking-[0.15em] text-ui-dim uppercase font-mono mb-3">
                Booking Management
              </div>

              <h1 className="text-[30px] md:text-[36px] font-extrabold tracking-[-0.03em]">
                My Bookings
              </h1>

              <p className="text-[15px] text-ui-muted mt-3 leading-[1.7] max-w-[680px]">
                Track your upcoming reservations, review your recent requests,
                check approved sessions, and keep an eye on bookings you have
                already checked in for.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 mt-5">
                <span className="text-[11px] text-ui-sky bg-ui-sky/8 border border-ui-sky/15 rounded-[8px] px-[10px] py-[5px] font-semibold">
                  Smart Campus
                </span>
                <span className="text-[11px] text-ui-green bg-ui-green/8 border border-ui-green/15 rounded-[8px] px-[10px] py-[5px] font-semibold">
                  Live Booking Overview
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button className="px-5 py-3 rounded-[12px] border border-ui-sky/20 bg-ui-sky/6 text-ui-sky text-[14px] font-semibold transition-all duration-200 hover:bg-ui-sky/12 hover:border-ui-sky/35">
                ⌕ View Calendar
              </button>

              <button
                className="btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                + New Booking
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
          <StatCard
            label="Total Bookings"
            value={sampleBookings.length}
            sub="All requests made by you"
            icon="◫"
            tint="var(--gradient-primary)"
          />
          <StatCard
            label="Upcoming"
            value={upcomingBookings.length}
            sub="Bookings still ahead"
            icon="↗"
            tint="linear-gradient(135deg, rgba(37,99,235,0.12), rgba(111,143,114,0.12))"
          />
          <StatCard
            label="Recent"
            value={recentBookings.length}
            sub="Latest booking activity"
            icon="◎"
            tint="linear-gradient(135deg, rgba(191,198,196,0.45), rgba(245,242,236,0.75))"
          />
          <StatCard
            label="Checked In"
            value={checkedInBookings.length}
            sub="Verified on-site bookings"
            icon="✓"
            tint="linear-gradient(135deg, rgba(111,143,114,0.14), rgba(255,255,255,0.7))"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.55fr_1fr] gap-5 mb-7">
          <div className="card">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <div className="text-[10px] font-bold tracking-[0.15em] text-ui-dim uppercase font-mono mb-2">
                  Priority View
                </div>
                <h2 className="text-[21px] font-extrabold">Upcoming Bookings</h2>
                <p className="text-[14px] text-ui-muted mt-1">
                  Your nearest approved and pending reservations.
                </p>
              </div>

              <button
                onClick={() => setTab('UPCOMING')}
                className="text-[13px] font-semibold text-ui-sky hover:opacity-80 transition-opacity"
              >
                Show all →
              </button>
            </div>

            <div className="space-y-3">
              {upcomingBookings.slice(0, 3).map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          </div>

          <div className="card">
            <div className="text-[10px] font-bold tracking-[0.15em] text-ui-dim uppercase font-mono mb-2">
              Recent Activity
            </div>
            <h2 className="text-[21px] font-extrabold">Latest Requests</h2>
            <p className="text-[14px] text-ui-muted mt-1 mb-5">
              Recently created bookings and updates.
            </p>

            <div className="space-y-3">
              {recentBookings.map((booking) => {
                const style = STATUS_STYLES[booking.status] || STATUS_STYLES.PENDING;

                return (
                  <div
                    key={booking.id}
                    className="bg-ui-base border border-ui-sky/10 rounded-[14px] px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[14px] font-bold text-ui-bright truncate">
                          {booking.resource}
                        </div>
                        <div className="text-[12px] text-ui-dim mt-1">
                          {fmtDate(booking.date)} • {booking.startTime} - {booking.endTime}
                        </div>
                      </div>

                      <span
                        className="text-[10px] font-bold tracking-[0.08em] px-[9px] py-[4px] rounded-[7px] border uppercase font-mono shrink-0"
                        style={{
                          background: style.bg,
                          color: style.text,
                          borderColor: style.border,
                        }}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div className="text-[13px] text-ui-muted mt-3 leading-[1.6]">
                      {booking.purpose}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mb-5">
          <div className="text-[10px] font-bold tracking-[0.15em] text-ui-dim uppercase font-mono mb-3">
            Booking Collections
          </div>

          <div className="flex flex-wrap gap-2.5">
            <TabButton active={tab === 'ALL'} onClick={() => setTab('ALL')}>
              All Bookings
            </TabButton>
            <TabButton active={tab === 'UPCOMING'} onClick={() => setTab('UPCOMING')}>
              Upcoming
            </TabButton>
            <TabButton active={tab === 'RECENT'} onClick={() => setTab('RECENT')}>
              Recent
            </TabButton>
            <TabButton active={tab === 'CHECKED_IN'} onClick={() => setTab('CHECKED_IN')}>
              Checked In
            </TabButton>
          </div>
        </div>

        <div className="space-y-4">
          {filteredBookings.length ? (
            filteredBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          ) : (
            <div className="card text-center">
              <div className="text-[36px] text-ui-sky mb-3">◌</div>
              <h3 className="text-[20px] font-extrabold">No bookings found</h3>
              <p className="text-[14px] text-ui-muted mt-2">
                There are no booking records in this category right now.
              </p>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateBookingModal
          form={bookingForm}
          setForm={setBookingForm}
          onClose={() => setShowCreateModal(false)}
          onSubmit={() => {
            console.log('Booking form submitted:', bookingForm);
            setShowCreateModal(false);
          }}
        />
      )}
    </Layout>
  );
}

function StatCard({ label, value, sub, icon, tint }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold tracking-[0.15em] text-ui-dim uppercase font-mono mb-2">
            {label}
          </div>
          <div className="text-[32px] font-extrabold tracking-[-0.03em] text-ui-bright">
            {value}
          </div>
          <div className="text-[13px] text-ui-muted mt-1 leading-[1.5]">
            {sub}
          </div>
        </div>

        <div
          className="w-[48px] h-[48px] rounded-[14px] flex items-center justify-center text-[18px] text-ui-surface shrink-0 border border-ui-sky/10"
          style={{ background: tint }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-[14px] py-[9px] rounded-[10px] text-[13px] font-semibold transition-all duration-200 ${
        active
          ? 'text-white border-transparent'
          : 'text-ui-muted border border-ui-sky/15 bg-ui-base hover:bg-ui-sky/8 hover:text-ui-sky'
      }`}
      style={
        active
          ? {
              background: 'var(--gradient-accent)',
              boxShadow: 'var(--shadow-soft)',
            }
          : {}
      }
    >
      {children}
    </button>
  );
}

function BookingCard({ booking }) {
  const statusStyle = STATUS_STYLES[booking.status] || STATUS_STYLES.PENDING;

  return (
    <div className="card">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap mb-2">
            <h3 className="text-[19px] font-extrabold tracking-[-0.02em] text-ui-bright">
              {booking.resource}
            </h3>

            <span className="text-[10px] font-bold tracking-[0.1em] px-[9px] py-[4px] rounded-[7px] border uppercase font-mono text-ui-sky bg-ui-sky/8 border-ui-sky/15">
              {booking.type}
            </span>

            <span
              className="text-[10px] font-bold tracking-[0.1em] px-[9px] py-[4px] rounded-[7px] border uppercase font-mono"
              style={{
                background: statusStyle.bg,
                color: statusStyle.text,
                borderColor: statusStyle.border,
              }}
            >
              {booking.status}
            </span>

            {booking.checkedIn && (
              <span className="text-[10px] font-bold tracking-[0.1em] px-[9px] py-[4px] rounded-[7px] border uppercase font-mono bg-ui-green/10 text-ui-green border-ui-green/25">
                CHECKED IN
              </span>
            )}
          </div>

          <div className="text-[13px] text-ui-dim mb-3">
            {fmtDate(booking.date)} • {booking.startTime} - {booking.endTime}
          </div>

          <p className="text-[14px] text-ui-muted leading-[1.7] mb-4">
            {booking.purpose}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MiniField label="Booking ID" value={booking.id} mono />
            <MiniField label="Attendees" value={String(booking.attendees)} />
            <MiniField label="Session Type" value={booking.type} />
          </div>
        </div>

        <div className="flex flex-row xl:flex-col gap-2.5 shrink-0">
          <button className="px-[16px] py-[10px] rounded-[10px] border border-ui-sky/20 bg-ui-sky/6 text-ui-sky text-[13px] font-semibold transition-all duration-200 hover:bg-ui-sky/12 hover:border-ui-sky/35">
            View Details
          </button>

          {booking.status === 'APPROVED' && !booking.checkedIn && (
            <button className="btn-primary">
              QR / Check-In
            </button>
          )}

          {booking.status === 'PENDING' && (
            <button className="px-[16px] py-[10px] rounded-[10px] border text-[13px] font-semibold transition-all duration-200 bg-ui-danger/8 text-ui-danger border-ui-danger/20 hover:bg-ui-danger/12 hover:border-ui-danger/30">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniField({ label, value, mono }) {
  return (
    <div className="bg-ui-base border border-ui-sky/10 rounded-[12px] px-4 py-3">
      <div className="text-[10px] text-ui-dim tracking-[0.08em] font-mono uppercase mb-1.5">
        {label}
      </div>
      <div className={`text-[14px] font-semibold text-ui-bright ${mono ? 'font-mono' : ''}`}>
        {value}
      </div>
    </div>
  );
}