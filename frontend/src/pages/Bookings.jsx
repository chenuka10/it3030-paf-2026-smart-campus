import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import CreateBookingModal from '../components/bookings/CreateBookingModal';
import ViewBookingDetailsModal from '../components/bookings/BookingDetailsModal';
import { cancelBooking, getMyBookings } from '../api/bookingApi';

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

const fmtTime = (timeString) => {
    if (!timeString) return '—';

    const value = String(timeString).slice(0, 5);
    const [hourText, minute] = value.split(':');
    const hour = Number(hourText);

    if (Number.isNaN(hour)) return value;

    const suffix = hour >= 12 ? 'PM' : 'AM';
    const twelveHour = hour % 12 || 12;

    return `${twelveHour}:${minute} ${suffix}`;
};

const isUpcoming = (dateString, endTimeString) => {
    if (!dateString) return false;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const bookingDate = new Date(`${dateString}T00:00:00`);

    if (bookingDate > today) return true;
    if (bookingDate < today) return false;

    if (!endTimeString) return true;

    const bookingEnd = new Date(`${dateString}T${String(endTimeString).slice(0, 8)}`);
    return bookingEnd >= now;
};

export default function Bookings() {
    const [tab, setTab] = useState('ALL');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [toast, setToast] = useState(null);

    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const handleOpenDetails = (bookingId) => {
        setSelectedBookingId(bookingId);
        setShowDetailsModal(true);
    };

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchBookings = async () => {
        try {
            setLoading(true);
            setPageError('');

            const data = await getMyBookings();
            setBookings(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch bookings:', err);
            setPageError('Failed to load your bookings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const upcomingBookings = useMemo(() => {
        return bookings.filter(
            (booking) =>
                booking.status !== 'CANCELLED' &&
                isUpcoming(booking.bookingDate, booking.endTime)
        );
    }, [bookings]);

    const recentBookings = useMemo(() => {
        return [...bookings]
            .sort(
                (a, b) =>
                    new Date(b.createdAt || b.bookingDate) - new Date(a.createdAt || a.bookingDate)
            )
            .slice(0, 3);
    }, [bookings]);

    const approvedBookings = useMemo(() => {
        return bookings.filter((booking) => booking.status === 'APPROVED');
    }, [bookings]);

    const filteredBookings = useMemo(() => {
        switch (tab) {
            case 'UPCOMING':
                return upcomingBookings;
            case 'RECENT':
                return recentBookings;
            case 'APPROVED':
                return approvedBookings;
            default:
                return bookings;
        }
    }, [tab, bookings, upcomingBookings, recentBookings, approvedBookings]);

    const handleCancelBooking = async (bookingId) => {
        try {
            setActionLoadingId(bookingId);
            await cancelBooking(bookingId);
            showToast('Booking cancelled successfully.');
            await fetchBookings();
        } catch (err) {
            console.error('Failed to cancel booking:', err);

            const backendMessage =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                'Failed to cancel booking.';

            showToast(String(backendMessage), 'error');
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <Layout>
            {toast && <Toast toast={toast} />}

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
                                Create new booking requests, track your latest submissions, and manage
                                upcoming reservations from one place.
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
                            <button
                                className="btn-primary"
                                onClick={() => setShowCreateModal(true)}
                            >
                                + New Booking
                            </button>
                        </div>
                    </div>
                </div>

                {pageError && (
                    <div className="mb-5 rounded-[12px] border border-ui-danger/20 bg-ui-danger/8 px-4 py-3 text-[14px] text-ui-danger">
                        {pageError}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
                    <StatCard
                        label="Total Bookings"
                        value={bookings.length}
                        sub="All requests made by you"
                        icon="◫"
                        tint="var(--gradient-primary)"
                    />
                    <StatCard
                        label="Upcoming"
                        value={upcomingBookings.length}
                        sub="Reservations still ahead"
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
                        label="Approved"
                        value={approvedBookings.length}
                        sub="Approved by admin"
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
                                    Your nearest pending and approved reservations.
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
                            {!loading && upcomingBookings.length > 0 ? (
                                upcomingBookings.slice(0, 3).map((booking) => (
                                    <BookingCard
                                        key={booking.id}
                                        booking={booking}
                                        onCancel={handleCancelBooking}
                                        onViewDetails={handleOpenDetails}
                                        cancelling={actionLoadingId === booking.id}
                                    />
                                ))
                            ) : (
                                <EmptyMiniState text={loading ? 'Loading upcoming bookings...' : 'No upcoming bookings yet.'} />
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <div className="text-[10px] font-bold tracking-[0.15em] text-ui-dim uppercase font-mono mb-2">
                            Recent Activity
                        </div>
                        <h2 className="text-[21px] font-extrabold">Latest Requests</h2>
                        <p className="text-[14px] text-ui-muted mt-1 mb-5">
                            Recently created booking requests.
                        </p>

                        <div className="space-y-3">
                            {!loading && recentBookings.length > 0 ? (
                                recentBookings.map((booking) => {
                                    const style = STATUS_STYLES[booking.status] || STATUS_STYLES.PENDING;

                                    return (
                                        <div
                                            key={booking.id}
                                            className="bg-ui-base border border-ui-sky/10 rounded-[14px] px-4 py-4"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="text-[14px] font-bold text-ui-bright truncate">
                                                        {booking.resourceName}
                                                    </div>
                                                    <div className="text-[12px] text-ui-dim mt-1">
                                                        {fmtDate(booking.bookingDate)} • {fmtTime(booking.startTime)} - {fmtTime(booking.endTime)}
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
                                })
                            ) : (
                                <EmptyMiniState text={loading ? 'Loading recent activity...' : 'No recent bookings yet.'} />
                            )}
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
                        <TabButton active={tab === 'APPROVED'} onClick={() => setTab('APPROVED')}>
                            Approved
                        </TabButton>
                    </div>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="card text-center">
                            <div className="text-[14px] text-ui-muted">Loading your bookings...</div>
                        </div>
                    ) : filteredBookings.length > 0 ? (
                        filteredBookings.map((booking) => (
                            <BookingCard
                                key={booking.id}
                                booking={booking}
                                onCancel={handleCancelBooking}
                                cancelling={actionLoadingId === booking.id}
                            />
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
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        showToast('Booking created successfully.');
                        fetchBookings();
                    }}
                />
            )}

            {showDetailsModal && selectedBookingId && (
                <ViewBookingDetailsModal
                    bookingId={selectedBookingId}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedBookingId(null);
                    }}
                    onCancelSuccess={() => {
                        showToast('Booking cancelled successfully.');
                        fetchBookings();
                        setShowDetailsModal(false);
                        setSelectedBookingId(null);
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
            className={`px-[14px] py-[9px] rounded-[10px] text-[13px] font-semibold transition-all duration-200 ${active
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

function BookingCard({ booking, onCancel, onViewDetails, cancelling }) {
    const statusStyle = STATUS_STYLES[booking.status] || STATUS_STYLES.PENDING;

    return (
        <div className="card">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap mb-2">
                        <h3 className="text-[19px] font-extrabold tracking-[-0.02em] text-ui-bright">
                            {booking.resourceName}
                        </h3>

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
                    </div>

                    <div className="text-[13px] text-ui-dim mb-3">
                        {fmtDate(booking.bookingDate)} • {fmtTime(booking.startTime)} - {fmtTime(booking.endTime)}
                    </div>

                    <p className="text-[14px] text-ui-muted leading-[1.7] mb-4">
                        {booking.purpose}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <MiniField label="Booking ID" value={String(booking.id)} mono />
                        <MiniField
                            label="Attendees"
                            value={booking.attendeesCount != null ? String(booking.attendeesCount) : '0'}
                        />
                        <MiniField label="Resource ID" value={String(booking.resourceId)} />
                    </div>

                    {booking.adminReason && (
                        <div className="mt-4 rounded-[12px] border border-ui-danger/15 bg-ui-danger/6 px-4 py-3">
                            <div className="text-[10px] text-ui-danger tracking-[0.08em] font-mono uppercase mb-1.5">
                                Admin Reason
                            </div>
                            <div className="text-[13px] text-ui-muted leading-[1.6]">
                                {booking.adminReason}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-row xl:flex-col gap-2.5 shrink-0">
                    <button
                        onClick={() => onViewDetails(booking.id)}
                        className="px-[16px] py-[10px] rounded-[10px] border border-ui-sky/20 bg-ui-sky/6 text-ui-sky text-[13px] font-semibold transition-all duration-200 hover:bg-ui-sky/12 hover:border-ui-sky/35"
                    >
                        View Details
                    </button>

                    {booking.status === 'PENDING' && (
                        <button
                            onClick={() => onCancel(booking.id)}
                            disabled={cancelling}
                            className="px-[16px] py-[10px] rounded-[10px] border text-[13px] font-semibold transition-all duration-200 bg-ui-danger/8 text-ui-danger border-ui-danger/20 hover:bg-ui-danger/12 hover:border-ui-danger/30 disabled:opacity-60"
                        >
                            {cancelling ? 'Cancelling...' : 'Cancel'}
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

function EmptyMiniState({ text }) {
    return (
        <div className="bg-ui-base border border-ui-sky/10 rounded-[14px] px-4 py-6 text-[13px] text-ui-muted">
            {text}
        </div>
    );
}

function Toast({ toast }) {
    return (
        <div
            className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-[10px] font-semibold backdrop-blur-md shadow-2xl transition-all ${toast.type === 'error'
                ? 'bg-ui-danger/10 border border-ui-danger/30 text-ui-danger'
                : 'bg-ui-green/10 border border-ui-green/30 text-ui-green'
                }`}
        >
            {toast.type === 'error' ? '✕' : '✓'} {toast.msg}
        </div>
    );
}