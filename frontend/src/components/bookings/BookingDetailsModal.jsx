import { useEffect, useMemo, useState } from 'react';
import { cancelBooking, getBookingById } from '../../api/bookingApi';

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

const fmtDateTime = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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

const getBookingEndDateTime = (bookingDate, endTime) => {
  if (!bookingDate || !endTime) return null;
  const normalizedEnd = String(endTime).slice(0, 8);
  return new Date(`${bookingDate}T${normalizedEnd}`);
};

const isPastWithoutCheckIn = (booking) => {
  const bookingEnd = getBookingEndDateTime(booking.bookingDate, booking.endTime);
  if (!bookingEnd) return false;

  return (
    booking.status === 'APPROVED' &&
    !booking.checkedIn &&
    bookingEnd < new Date()
  );
};

export default function BookingDetailsModal({
  bookingId,
  onClose,
  onCancelSuccess,
}) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setPageError('');

        const data = await getBookingById(bookingId);
        setBooking(data);
      } catch (err) {
        console.error('Failed to load booking details:', err);
        setPageError('Failed to load booking details.');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchDetails();
    }
  }, [bookingId]);

  const handleCancel = async () => {
    if (!booking) return;

    try {
      setCancelling(true);
      await cancelBooking(booking.id);
      onCancelSuccess?.();
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      setPageError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Failed to cancel booking.'
      );
    } finally {
      setCancelling(false);
    }
  };

  const checkedIn = !!booking?.checkedIn;
  const missedCheckIn = booking ? isPastWithoutCheckIn(booking) : false;

  const qrImageSrc = useMemo(() => {
    if (!booking) return '';

    if (booking.qrCodeDataUrl) return booking.qrCodeDataUrl;
    if (booking.qrCodeUrl) return booking.qrCodeUrl;
    if (booking.qrCodeBase64) return `data:image/png;base64,${booking.qrCodeBase64}`;

    return '';
  }, [booking]);

  const canShowQr =
    booking &&
    booking.status === 'APPROVED' &&
    (qrImageSrc || booking.qrToken);

  const handleDownloadQr = () => {
    if (!booking) return;

    if (qrImageSrc) {
      const link = document.createElement('a');
      link.href = qrImageSrc;
      link.download = `booking-${booking.id}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (booking.qrToken) {
      const blob = new Blob([`Booking QR Token: ${booking.qrToken}`], {
        type: 'text/plain;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `booking-${booking.id}-qr-token.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0 bg-black/35 backdrop-blur-[3px]"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-[860px] card animate-fade-in-up max-h-[90vh] overflow-y-auto custom-scroll">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-[10px] font-bold tracking-[0.15em] text-ui-dim uppercase font-mono mb-2">
              Booking Details
            </div>
            <h2 className="text-[24px] font-extrabold tracking-[-0.03em]">
              Reservation Overview
            </h2>
            <p className="text-[14px] text-ui-muted mt-2 leading-[1.6]">
              Review booking information, status, QR access, and any required action.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-ui-muted hover:text-ui-bright transition-colors text-[20px] leading-none"
          >
            ✕
          </button>
        </div>

        {pageError && (
          <div className="mb-5 rounded-[12px] border border-ui-danger/20 bg-ui-danger/8 px-4 py-3 text-[14px] text-ui-danger">
            {pageError}
          </div>
        )}

        {loading ? (
          <div className="rounded-[12px] border border-ui-sky/15 bg-ui-sky/4 px-4 py-6 text-[14px] text-ui-muted">
            Loading booking details...
          </div>
        ) : booking ? (
          <>
            <div className="flex flex-wrap items-center gap-2.5 mb-5">
              <span
                className="text-[10px] font-bold tracking-[0.1em] px-[9px] py-[4px] rounded-[7px] border uppercase font-mono"
                style={{
                  background: (STATUS_STYLES[booking.status] || STATUS_STYLES.PENDING).bg,
                  color: (STATUS_STYLES[booking.status] || STATUS_STYLES.PENDING).text,
                  borderColor: (STATUS_STYLES[booking.status] || STATUS_STYLES.PENDING).border,
                }}
              >
                {booking.status}
              </span>

              {checkedIn && (
                <span className="text-[10px] font-bold tracking-[0.1em] px-[9px] py-[4px] rounded-[7px] border uppercase font-mono bg-ui-green/10 text-ui-green border-ui-green/25">
                  CHECKED IN
                </span>
              )}

              {missedCheckIn && (
                <span className="text-[10px] font-bold tracking-[0.1em] px-[9px] py-[4px] rounded-[7px] border uppercase font-mono bg-ui-danger/10 text-ui-danger border-ui-danger/25">
                  MISSED CHECK-IN
                </span>
              )}
            </div>

            {checkedIn && (
              <div className="mb-5 rounded-[14px] border border-ui-green/20 bg-ui-green/8 px-5 py-4">
                <div className="text-[12px] font-bold text-ui-green mb-1">
                  Booking Successfully Checked In
                </div>
                <div className="text-[14px] text-ui-muted leading-[1.7]">
                  This booking has already been successfully checked in.
                  {booking.checkedInAt ? ` Check-in time: ${fmtDateTime(booking.checkedInAt)}.` : ''}
                </div>
              </div>
            )}

            {missedCheckIn && (
              <div className="mb-5 rounded-[14px] border border-ui-danger/20 bg-ui-danger/8 px-5 py-4">
                <div className="text-[12px] font-bold text-ui-danger mb-1">
                  Missed Check-In Alert
                </div>
                <div className="text-[14px] text-ui-muted leading-[1.7]">
                  This booking was approved, but the reserved time has already passed
                  and no check-in was recorded.
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
              <div className="space-y-5">
                <SectionCard title="Booking Summary">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <MiniField label="Booking ID" value={String(booking.id)} mono />
                    <MiniField label="Resource ID" value={String(booking.resourceId)} />
                    <MiniField label="Resource Name" value={booking.resourceName || '—'} />
                    <MiniField label="User Email" value={booking.userEmail || '—'} />
                    <MiniField label="Booking Date" value={fmtDate(booking.bookingDate)} />
                    <MiniField
                      label="Time Range"
                      value={`${fmtTime(booking.startTime)} - ${fmtTime(booking.endTime)}`}
                    />
                    <MiniField
                      label="Attendees"
                      value={
                        booking.attendeesCount != null
                          ? String(booking.attendeesCount)
                          : '0'
                      }
                    />
                    <MiniField label="Status" value={booking.status || '—'} />
                  </div>

                  <div className="mt-4">
                    <div className="text-[10px] text-ui-dim tracking-[0.08em] font-mono uppercase mb-1.5">
                      Purpose
                    </div>
                    <div className="rounded-[12px] border border-ui-sky/10 bg-ui-base px-4 py-3 text-[14px] text-ui-muted leading-[1.7]">
                      {booking.purpose || '—'}
                    </div>
                  </div>

                  {booking.adminReason && (
                    <div className="mt-4">
                      <div className="text-[10px] text-ui-danger tracking-[0.08em] font-mono uppercase mb-1.5">
                        Admin Reason
                      </div>
                      <div className="rounded-[12px] border border-ui-danger/15 bg-ui-danger/6 px-4 py-3 text-[14px] text-ui-muted leading-[1.7]">
                        {booking.adminReason}
                      </div>
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="Activity Timeline">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <MiniField label="Created At" value={fmtDateTime(booking.createdAt)} />
                    <MiniField label="Last Updated" value={fmtDateTime(booking.updatedAt)} />
                    <MiniField
                      label="Checked In At"
                      value={booking.checkedInAt ? fmtDateTime(booking.checkedInAt) : '—'}
                    />
                    <MiniField
                      label="Participant Count"
                      value={
                        Array.isArray(booking.participantIds)
                          ? String(booking.participantIds.length)
                          : '0'
                      }
                    />
                  </div>
                </SectionCard>
              </div>

              <div className="space-y-5">
                <SectionCard title="QR Access">
                  {canShowQr ? (
                    <>
                      {qrImageSrc ? (
                        <div className="rounded-[14px] border border-ui-sky/10 bg-white p-4 flex items-center justify-center">
                          <img
                            src={qrImageSrc}
                            alt="Booking QR"
                            className="w-[220px] h-[220px] object-contain"
                          />
                        </div>
                      ) : (
                        <div className="rounded-[12px] border border-ui-sky/10 bg-ui-base px-4 py-4">
                          <div className="text-[12px] font-bold text-ui-sky mb-2">
                            QR Token Available
                          </div>
                          <div className="text-[13px] text-ui-muted break-all">
                            {booking.qrToken}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col gap-2 mt-4">
                        <button
                          onClick={handleDownloadQr}
                          className="btn-primary"
                        >
                          Download QR Again
                        </button>
                      </div>
                    </>
                  ) : booking.status === 'APPROVED' ? (
                    <div className="rounded-[12px] border border-ui-warn/20 bg-ui-warn/8 px-4 py-4 text-[14px] text-ui-muted">
                      This booking is approved, but no QR data is currently available in the response.
                    </div>
                  ) : (
                    <div className="rounded-[12px] border border-ui-sky/10 bg-ui-base px-4 py-4 text-[14px] text-ui-muted">
                      QR is only available for approved bookings.
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="Actions">
                  <div className="flex flex-col gap-3">
                    {booking.status === 'PENDING' && (
                      <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="px-[16px] py-[10px] rounded-[10px] border text-[13px] font-semibold transition-all duration-200 bg-ui-danger/8 text-ui-danger border-ui-danger/20 hover:bg-ui-danger/12 hover:border-ui-danger/30 disabled:opacity-60"
                      >
                        {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                      </button>
                    )}

                    <button
                      onClick={onClose}
                      className="px-[16px] py-[10px] rounded-[10px] border border-ui-sky/20 bg-ui-sky/6 text-ui-sky text-[13px] font-semibold transition-all duration-200 hover:bg-ui-sky/12 hover:border-ui-sky/35"
                    >
                      Close
                    </button>
                  </div>
                </SectionCard>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-[12px] border border-ui-danger/15 bg-ui-danger/6 px-4 py-6 text-[14px] text-ui-muted">
            No booking data available.
          </div>
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="rounded-[14px] border border-ui-sky/15 bg-ui-sky/4 px-5 py-4">
      <div className="text-[12px] font-bold text-ui-sky mb-4">{title}</div>
      {children}
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