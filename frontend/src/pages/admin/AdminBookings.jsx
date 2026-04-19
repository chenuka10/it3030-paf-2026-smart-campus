import { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import AdminBookingDetailsModal from '../../components/bookings/AdminBookingDetailsModal';
import {
  getAllBookings,
  approveBooking,
  rejectBooking,
} from '../../api/bookingApi';
import RejectBookingModal from '../../components/bookings/RejectBookingModal';

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

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [toast, setToast] = useState(null);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [rejectingId, setRejectingId] = useState(null);
  const [approvalLoadingId, setApprovalLoadingId] = useState(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRejectBookingId, setSelectedRejectBookingId] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setPageError('');
      const data = await getAllBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load all bookings:', err);
      setPageError('Failed to load booking records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const pendingCount = useMemo(
    () => bookings.filter((booking) => booking.status === 'PENDING').length,
    [bookings]
  );

  const approvedCount = useMemo(
    () => bookings.filter((booking) => booking.status === 'APPROVED').length,
    [bookings]
  );

  const rejectedCount = useMemo(
    () => bookings.filter((booking) => booking.status === 'REJECTED').length,
    [bookings]
  );

  const filteredBookings = useMemo(() => {
    let result = [...bookings];

    if (statusFilter !== 'ALL') {
      result = result.filter((booking) => booking.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((booking) =>
        String(booking.id).includes(q) ||
        String(booking.resourceName || '').toLowerCase().includes(q) ||
        String(booking.userEmail || '').toLowerCase().includes(q) ||
        String(booking.purpose || '').toLowerCase().includes(q)
      );
    }

    return result.sort(
      (a, b) =>
        new Date(b.createdAt || b.bookingDate) - new Date(a.createdAt || a.bookingDate)
    );
  }, [bookings, statusFilter, searchTerm]);

  const handleOpenDetails = (bookingId) => {
    setSelectedBookingId(bookingId);
    setShowDetailsModal(true);
  };

  const openRejectModal = (bookingId) => {
    setSelectedRejectBookingId(bookingId);
    setShowRejectModal(true);
  };

  const handleApprove = async (bookingId) => {
    try {
      setApprovalLoadingId(bookingId);
      await approveBooking(bookingId);
      showToast('Booking approved successfully.');
      await fetchBookings();
    } catch (err) {
      console.error('Failed to approve booking:', err);
      showToast(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Failed to approve booking.',
        'error'
      );
    } finally {
      setApprovalLoadingId(null);
    }
  };

  const handleReject = async (bookingId, reason) => {
    if (!reason || !reason.trim()) return;

    try {
      setRejectingId(bookingId);
      await rejectBooking(bookingId, reason.trim());
      showToast('Booking rejected successfully.');
      await fetchBookings();
      setShowRejectModal(false);
      setSelectedRejectBookingId(null);
    } catch (err) {
      console.error('Failed to reject booking:', err);
      showToast(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Failed to reject booking.',
        'error'
      );
    } finally {
      setRejectingId(null);
    }
  };

  return (
    <Layout adminOnly>
      {toast && <Toast toast={toast} />}

      <div className="px-9 py-9 max-w-[1180px] mx-auto">
        <div className="mb-8">
          <div className="text-[10px] font-bold tracking-[0.18em] text-ui-dim font-mono mb-2.5">
            ADMIN BOOKING MANAGEMENT
          </div>
          <h1 className="text-[38px] font-extrabold tracking-[-0.04em] font-display mb-2.5">
            Booking Requests
          </h1>
          <p className="text-[15px] text-ui-muted">
            Review, approve, reject, and inspect all campus booking requests.
          </p>
        </div>

        {pageError && (
          <div className="mb-5 rounded-[12px] border border-ui-danger/20 bg-ui-danger/8 px-4 py-3 text-[14px] text-ui-danger">
            {pageError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
          <StatCard label="Pending" value={pendingCount} icon="◎" />
          <StatCard label="Approved" value={approvedCount} icon="✓" />
          <StatCard label="Rejected" value={rejectedCount} icon="✕" />
        </div>

        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
            <input
              type="text"
              placeholder="Search by booking ID, resource, user email, or purpose"
              className="w-full bg-ui-base border border-ui-sky/20 rounded-[10px] px-[14px] py-[11px] text-ui-bright text-[14px] focus:outline-none focus:border-ui-sky transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="flex flex-wrap gap-2">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-[14px] py-[9px] rounded-[10px] text-[13px] font-semibold transition-all duration-200 ${
                    statusFilter === status
                      ? 'text-white'
                      : 'text-ui-muted border border-ui-sky/15 bg-ui-base hover:bg-ui-sky/8 hover:text-ui-sky'
                  }`}
                  style={
                    statusFilter === status
                      ? {
                          background: 'var(--gradient-accent)',
                          boxShadow: 'var(--shadow-soft)',
                        }
                      : {}
                  }
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="card text-center">
              <div className="text-[14px] text-ui-muted">Loading booking requests...</div>
            </div>
          ) : filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <AdminBookingCard
                key={booking.id}
                booking={booking}
                onViewDetails={handleOpenDetails}
                onApprove={handleApprove}
                onOpenRejectModal={openRejectModal}
                approving={approvalLoadingId === booking.id}
                rejecting={rejectingId === booking.id}
              />
            ))
          ) : (
            <div className="card text-center">
              <div className="text-[36px] text-ui-sky mb-3">◌</div>
              <h3 className="text-[20px] font-extrabold">No booking requests found</h3>
              <p className="text-[14px] text-ui-muted mt-2">
                No booking records match the current filter.
              </p>
            </div>
          )}
        </div>
      </div>

      {showDetailsModal && selectedBookingId && (
        <AdminBookingDetailsModal
          bookingId={selectedBookingId}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedBookingId(null);
          }}
          onActionSuccess={() => {
            fetchBookings();
            setShowDetailsModal(false);
            setSelectedBookingId(null);
          }}
        />
      )}

      <RejectBookingModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedRejectBookingId(null);
        }}
        onConfirm={handleReject}
        bookingId={selectedRejectBookingId}
      />
    </Layout>
  );
}

function StatCard({ label, value, icon }) {
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
        </div>

        <div className="w-[48px] h-[48px] rounded-[14px] flex items-center justify-center text-[18px] text-ui-surface shrink-0 border border-ui-sky/10 bg-ui-sky/6">
          {icon}
        </div>
      </div>
    </div>
  );
}

function AdminBookingCard({
  booking,
  onViewDetails,
  onApprove,
  onOpenRejectModal,
  approving,
  rejecting,
}) {
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

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <MiniField label="Booking ID" value={String(booking.id)} mono />
            <MiniField label="User" value={booking.userEmail || '—'} />
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
            <>
              <button
                onClick={() => onApprove(booking.id)}
                disabled={approving}
                className="px-[16px] py-[10px] rounded-[10px] border text-[13px] font-semibold transition-all duration-200 bg-ui-green/8 text-ui-green border-ui-green/20 hover:bg-ui-green/12 hover:border-ui-green/30 disabled:opacity-60"
              >
                {approving ? 'Approving...' : 'Approve'}
              </button>

              <button
                onClick={() => onOpenRejectModal(booking.id)}
                disabled={rejecting}
                className="px-[16px] py-[10px] rounded-[10px] border text-[13px] font-semibold transition-all duration-200 bg-ui-danger/8 text-ui-danger border-ui-danger/20 hover:bg-ui-danger/12 hover:border-ui-danger/30 disabled:opacity-60"
              >
                {rejecting ? 'Rejecting...' : 'Reject'}
              </button>
            </>
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

function Toast({ toast }) {
  return (
    <div
      className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-[10px] font-semibold backdrop-blur-md shadow-2xl transition-all ${
        toast.type === 'error'
          ? 'bg-ui-danger/10 border border-ui-danger/30 text-ui-danger'
          : 'bg-ui-green/10 border border-ui-green/30 text-ui-green'
      }`}
    >
      {toast.type === 'error' ? '✕' : '✓'} {toast.msg}
    </div>
  );
}