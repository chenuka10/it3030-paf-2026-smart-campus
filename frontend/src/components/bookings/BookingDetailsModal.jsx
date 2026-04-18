import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { cancelBooking, getBookingById } from '../../api/bookingApi';

export default function BookingDetailsModal({
  bookingId,
  onClose,
  onRefresh,
  onToast,
}) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const loadBooking = async () => {
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
      loadBooking();
    }
  }, [bookingId]);

  const fmtDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const fmtDateTime = (dateTimeString) => {
    if (!dateTimeString) return '—';
    return new Date(dateTimeString).toLocaleString('en-US', {
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

  const statusStyles = {
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

  const handleCancelBooking = async () => {
    if (!booking) return;

    try {
      setCancelling(true);
      await cancelBooking(booking.id);
      onToast?.('Booking cancelled successfully.', 'success');
      onRefresh?.();
      onClose?.();
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to cancel booking.';
      onToast?.(String(backendMessage), 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadQr = () => {
    const svg = document.getElementById('booking-qr-svg');
    if (!svg || !booking?.id) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `booking-${booking.id}-qr.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const qrValue =
    booking?.qrToken ? `BOOKING_TOKEN:${booking.qrToken}` : null;

  const statusStyle =
    booking?.status ? statusStyles[booking.status] || statusStyles.PENDING : null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0 bg-black/35 backdrop-blur-[3px]"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-[920px] card animate-fade-in-up max-h-[92vh] overflow-y-auto custom-scroll">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-[10px] font-bold tracking-[0.15em] text-ui-dim uppercase font-mono mb-2">
              Booking Details
            </div>
            <h2 className="text-[24px] font-extrabold tracking-[-0.03em]">
              Booking Information
            </h2>
            <p className="text-[14px] text-ui-muted mt-2 leading-[1.6]">
              View full booking details, QR availability, and manage the booking.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-ui-muted hover:text-ui-bright transition-colors text-[20px] leading-none"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="rounded-[12px] border border-ui-sky/15 bg-ui-sky/4 px-4 py-4 text-[14px] text-ui-muted">
            Loading booking details...
          </div>
        ) : pageError ? (
          <div className="rounded-[12px] border border-ui-danger/20 bg-ui-danger/8 px-4 py-4 text-[14px] text-ui-danger">
            {pageError}
          </div>
        ) : booking ? (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h3 className="text-[22px] font-extrabold text-ui-bright">
                {booking.resourceName}
              </h3>

              <span
                className="text-[10px] font-bold tracking-[0.1em] px-[9px] py-[4px] rounded-[7px] border uppercase font-mono"
                style={{
                  background: statusStyle?.bg,
                  color: statusStyle?.text,
                  borderColor: statusStyle?.border,
                }}
              >
                {booking.status}
              </span>

              {booking.checkedIn && (
                <span className="text-[10px] font-bold tracking-[0.1em] px-[9px] py-[4px] rounded-[7px] border uppercase font-mono bg-ui-green/10 text-ui-green border-ui-green/25">
                  Checked In
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-6">
              <div className="space-y-6">
                <div className="bg-ui-sky/4 border border-ui-sky/15 rounded-[14px] px-5 py-4">
                  <div className="text-[12px] font-bold text-ui-sky mb-4">
                    Booking Summary
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoCard label="Booking ID" value={`#${booking.id}`} mono />
                    <InfoCard label="Resource ID" value={String(booking.resourceId)} />
                    <InfoCard label="Booking Date" value={fmtDate(booking.bookingDate)} />
                    <InfoCard
                      label="Time"
                      value={`${fmtTime(booking.startTime)} - ${fmtTime(booking.endTime)}`}
                    />
                    <InfoCard
                      label="Attendees"
                      value={
                        booking.attendeesCount != null
                          ? String(booking.attendeesCount)
                          : '0'
                      }
                    />
                    <InfoCard label="User Email" value={booking.userEmail || '—'} />
                  </div>
                </div>

                <div className="bg-ui-sky/4 border border-ui-sky/15 rounded-[14px] px-5 py-4">
                  <div className="text-[12px] font-bold text-ui-sky mb-3">
                    Purpose
                  </div>
                  <div className="text-[14px] text-ui-muted leading-[1.7]">
                    {booking.purpose || '—'}
                  </div>
                </div>

                <div className="bg-ui-sky/4 border border-ui-sky/15 rounded-[14px] px-5 py-4">
                  <div className="text-[12px] font-bold text-ui-sky mb-4">
                    System Timeline
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoCard label="Created At" value={fmtDateTime(booking.createdAt)} />
                    <InfoCard label="Updated At" value={fmtDateTime(booking.updatedAt)} />
                    <InfoCard label="QR Generated At" value={fmtDateTime(booking.qrGeneratedAt)} />
                    <InfoCard label="QR Email Sent At" value={fmtDateTime(booking.qrEmailSentAt)} />
                    <InfoCard label="Checked In At" value={fmtDateTime(booking.checkedInAt)} />
                    <InfoCard
                      label="Participants"
                      value={
                        Array.isArray(booking.participantIds) && booking.participantIds.length
                          ? booking.participantIds.join(', ')
                          : '—'
                      }
                    />
                  </div>
                </div>

                {booking.adminReason && (
                  <div className="rounded-[14px] border border-ui-danger/20 bg-ui-danger/8 px-5 py-4">
                    <div className="text-[12px] font-bold text-ui-danger mb-2">
                      Admin Reason
                    </div>
                    <div className="text-[14px] text-ui-muted leading-[1.7]">
                      {booking.adminReason}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-ui-sky/4 border border-ui-sky/15 rounded-[14px] px-5 py-4">
                  <div className="text-[12px] font-bold text-ui-sky mb-4">
                    QR Code
                  </div>

                  {qrValue ? (
                    <>
                      <div className="flex justify-center mb-4">
                        <div className="rounded-[14px] bg-white p-4 border border-ui-sky/10 shadow-sm">
                          <QRCodeSVG
                            id="booking-qr-svg"
                            value={qrValue}
                            size={220}
                            includeMargin
                          />
                        </div>
                      </div>

                      <div className="text-[13px] text-ui-muted leading-[1.6] mb-4 text-center">
                        This QR is available because the booking has already been approved.
                      </div>

                      <button
                        onClick={handleDownloadQr}
                        className="w-full px-[16px] py-[11px] rounded-[10px] border border-ui-sky/20 bg-ui-sky/6 text-ui-sky text-[13px] font-semibold transition-all duration-200 hover:bg-ui-sky/12 hover:border-ui-sky/35"
                      >
                        Download QR Again
                      </button>
                    </>
                  ) : (
                    <div className="rounded-[12px] border border-ui-warn/20 bg-ui-warn/8 px-4 py-4 text-[13px] text-ui-warn">
                      QR is not available yet. It will appear after the booking is approved.
                    </div>
                  )}
                </div>

                <div className="bg-ui-sky/4 border border-ui-sky/15 rounded-[14px] px-5 py-4">
                  <div className="text-[12px] font-bold text-ui-sky mb-4">
                    Actions
                  </div>

                  <div className="space-y-3">
                    {booking.status === 'PENDING' && (
                      <button
                        onClick={handleCancelBooking}
                        disabled={cancelling}
                        className="w-full px-[16px] py-[11px] rounded-[10px] border text-[13px] font-semibold transition-all duration-200 bg-ui-danger/8 text-ui-danger border-ui-danger/20 hover:bg-ui-danger/12 hover:border-ui-danger/30 disabled:opacity-60"
                      >
                        {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                      </button>
                    )}

                    {booking.status === 'APPROVED' && (
                      <div className="rounded-[12px] border border-ui-green/20 bg-ui-green/8 px-4 py-4 text-[13px] text-ui-green">
                        This booking is approved and active.
                      </div>
                    )}

                    {booking.status === 'REJECTED' && (
                      <div className="rounded-[12px] border border-ui-danger/20 bg-ui-danger/8 px-4 py-4 text-[13px] text-ui-danger">
                        This booking was rejected.
                      </div>
                    )}

                    {booking.status === 'CANCELLED' && (
                      <div className="rounded-[12px] border border-ui-sky/15 bg-ui-sky/4 px-4 py-4 text-[13px] text-ui-muted">
                        This booking has already been cancelled.
                      </div>
                    )}

                    <button
                      onClick={onClose}
                      className="w-full px-[16px] py-[11px] rounded-[10px] border border-ui-sky/20 bg-ui-base text-ui-muted text-[13px] font-semibold transition-all duration-200 hover:bg-ui-sky/8 hover:text-ui-sky"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function InfoCard({ label, value, mono }) {
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