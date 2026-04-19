import { useEffect, useMemo, useRef, useState } from 'react';
import Layout from '../../components/Layout';
import { Html5Qrcode } from 'html5-qrcode';
import { checkInBooking, getAllBookings } from '../../api/bookingApi';

const SCAN_MODES = {
    CAMERA: 'CAMERA',
    UPLOAD: 'UPLOAD',
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

const normalizeQrToken = (rawValue = '') => {
    const value = String(rawValue).trim();

    if (!value) return '';

    if (value.startsWith('BOOKING_TOKEN:')) {
        return value.replace('BOOKING_TOKEN:', '').trim();
    }

    try {
        const maybeUrl = new URL(value);
        const tokenParam = maybeUrl.searchParams.get('token');
        if (tokenParam) return tokenParam.trim();
    } catch {
        // not a URL, ignore
    }

    return value;
};

export default function AdminCheckIn() {
    const [scanMode, setScanMode] = useState(SCAN_MODES.CAMERA);
    const [result, setResult] = useState(null);
    const [pageError, setPageError] = useState('');
    const [toast, setToast] = useState(null);

    const [scanLoading, setScanLoading] = useState(false);
    const [scannerRunning, setScannerRunning] = useState(false);
    const [startingScanner, setStartingScanner] = useState(false);

    const [bookings, setBookings] = useState([]);
    const [statsLoading, setStatsLoading] = useState(true);

    const qrRegionId = 'admin-checkin-reader';
    const qrScannerRef = useRef(null);
    const fileInputRef = useRef(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        window.clearTimeout(window.__checkInToastTimer);
        window.__checkInToastTimer = window.setTimeout(() => {
            setToast(null);
        }, 3500);
    };

    const fetchBookingStats = async () => {
        try {
            setStatsLoading(true);
            const data = await getAllBookings();
            setBookings(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load bookings for check-in stats:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookingStats();

        return () => {
            stopScanner(true);
            window.clearTimeout(window.__checkInToastTimer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const approvedTodayCount = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);

        return bookings.filter(
            (booking) =>
                booking.status === 'APPROVED' &&
                booking.bookingDate === today
        ).length;
    }, [bookings]);

    const checkedInTodayCount = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);

        return bookings.filter(
            (booking) =>
                booking.checkedIn === true &&
                booking.bookingDate === today
        ).length;
    }, [bookings]);

    const pendingCheckInTodayCount = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);

        return bookings.filter(
            (booking) =>
                booking.status === 'APPROVED' &&
                booking.bookingDate === today &&
                booking.checkedIn !== true
        ).length;
    }, [bookings]);

    const stopScanner = async (silent = false) => {
        try {
            if (qrScannerRef.current) {
                const state = qrScannerRef.current.getState?.();
                if (state === 2 || state === 1) {
                    await qrScannerRef.current.stop();
                }
                await qrScannerRef.current.clear();
                qrScannerRef.current = null;
            }
        } catch (err) {
            if (!silent) {
                console.error('Failed to stop scanner:', err);
            }
        } finally {
            setScannerRunning(false);
            setStartingScanner(false);
        }
    };

    const processDecodedValue = async (decodedValue) => {
        const cleanedToken = normalizeQrToken(decodedValue);

        if (!cleanedToken) {
            showToast('Could not extract a valid QR token.', 'error');
            return;
        }

        try {
            setScanLoading(true);
            setPageError('');
            setResult(null);

            const data = await checkInBooking(cleanedToken);
            setResult(data);
            showToast(data?.message || 'Check-in successful.');
            await fetchBookingStats();
        } catch (err) {
            console.error('Check-in failed:', err);

            const backendMessage =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                'Failed to process check-in.';

            setPageError(String(backendMessage));
            showToast(String(backendMessage), 'error');
        } finally {
            setScanLoading(false);
        }
    };

    const handleStartScanner = async () => {
        try {
            setPageError('');
            setResult(null);
            setStartingScanner(true);

            await stopScanner(true);

            await new Promise((resolve) => setTimeout(resolve, 150));

            const qrCodeScanner = new Html5Qrcode(qrRegionId);
            qrScannerRef.current = qrCodeScanner;

            await qrCodeScanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 240, height: 240 },
                    aspectRatio: 1.0,
                },
                async (decodedText) => {
                    await stopScanner(true);
                    await processDecodedValue(decodedText);
                },
                () => { }
            );

            setScannerRunning(true);
        } catch (err) {
            console.error('Failed to start camera scanner:', err);

            const message =
                err?.message ||
                'Could not access the camera. Make sure camera permission is allowed and try again.';

            setPageError(message);
            showToast(message, 'error');
            await stopScanner(true);
        } finally {
            setStartingScanner(false);
        }
    };

    const handleStopScanner = async () => {
        await stopScanner();
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';

        if (!file) return;

        try {
            setPageError('');
            setResult(null);
            setScanLoading(true);

            const fileScanner = new Html5Qrcode('hidden-file-scanner');
            const decodedText = await fileScanner.scanFile(file, true);
            await fileScanner.clear();

            await processDecodedValue(decodedText);
        } catch (err) {
            console.error('Failed to scan QR image:', err);

            const msg =
                'Could not read a valid QR code from the selected image. Please try a clearer image.';

            setPageError(msg);
            showToast(msg, 'error');
        } finally {
            setScanLoading(false);
        }
    };

    return (
        <Layout adminOnly>
            {toast && <Toast toast={toast} />}

            <div className="px-9 py-9 max-w-[1180px] mx-auto">
                <div className="mb-8">
                    <div className="text-[10px] font-bold tracking-[0.18em] text-ui-dim font-mono mb-2.5">
                        ADMIN CHECK-IN
                    </div>
                    <h1 className="text-[38px] font-extrabold tracking-[-0.04em] font-display mb-2.5">
                        QR Booking Check-In
                    </h1>
                    <p className="text-[15px] text-ui-muted max-w-[780px]">
                        Scan an approved booking QR using the device camera or upload a QR image
                        to mark the booking as checked in. Only approved bookings for the valid
                        time window can be checked in.
                    </p>
                </div>

                {pageError && (
                    <div className="mb-5 rounded-[12px] border border-ui-danger/20 bg-ui-danger/8 px-4 py-3 text-[14px] text-ui-danger">
                        {pageError}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
                    <StatCard
                        label="Approved Today"
                        value={statsLoading ? '—' : approvedTodayCount}
                        icon="◎"
                    />
                    <StatCard
                        label="Checked In Today"
                        value={statsLoading ? '—' : checkedInTodayCount}
                        icon="✓"
                    />
                    <StatCard
                        label="Pending Check-In"
                        value={statsLoading ? '—' : pendingCheckInTodayCount}
                        icon="◌"
                    />
                </div>

                <div className="card mb-6">
                    <div className="flex flex-wrap items-center gap-3 mb-5">
                        <button
                            onClick={() => {
                                setScanMode(SCAN_MODES.CAMERA);
                                setPageError('');
                                setResult(null);
                            }}
                            className={`px-[14px] py-[10px] rounded-[10px] text-[13px] font-semibold transition-all duration-200 ${scanMode === SCAN_MODES.CAMERA
                                ? 'text-white'
                                : 'text-ui-muted border border-ui-sky/15 bg-ui-base hover:bg-ui-sky/8 hover:text-ui-sky'
                                }`}
                            style={
                                scanMode === SCAN_MODES.CAMERA
                                    ? {
                                        background: 'var(--gradient-accent)',
                                        boxShadow: 'var(--shadow-soft)',
                                    }
                                    : {}
                            }
                        >
                            Use Camera
                        </button>

                        <button
                            onClick={async () => {
                                setScanMode(SCAN_MODES.UPLOAD);
                                setPageError('');
                                setResult(null);
                                await stopScanner(true);
                            }}
                            className={`px-[14px] py-[10px] rounded-[10px] text-[13px] font-semibold transition-all duration-200 ${scanMode === SCAN_MODES.UPLOAD
                                ? 'text-white'
                                : 'text-ui-muted border border-ui-sky/15 bg-ui-base hover:bg-ui-sky/8 hover:text-ui-sky'
                                }`}
                            style={
                                scanMode === SCAN_MODES.UPLOAD
                                    ? {
                                        background: 'var(--gradient-accent)',
                                        boxShadow: 'var(--shadow-soft)',
                                    }
                                    : {}
                            }
                        >
                            Upload QR Image
                        </button>
                    </div>

                    {scanMode === SCAN_MODES.CAMERA ? (
                        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
                            <div className="rounded-[18px] border border-ui-sky/10 bg-ui-base/70 p-4">
                                <div className="flex items-center justify-between gap-3 mb-4">
                                    <div>
                                        <div className="text-[12px] font-bold tracking-[0.12em] text-ui-dim uppercase font-mono mb-1">
                                            Camera Scanner
                                        </div>
                                        <div className="text-[14px] text-ui-muted">
                                            Place the booking QR code clearly inside the frame.
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {!scannerRunning ? (
                                            <button
                                                onClick={handleStartScanner}
                                                disabled={startingScanner || scanLoading}
                                                className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                {startingScanner ? 'Starting...' : 'Start Camera'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleStopScanner}
                                                className="px-[14px] py-[10px] rounded-[10px] text-[13px] font-semibold border border-ui-danger/20 bg-ui-danger/8 text-ui-danger hover:bg-ui-danger/12 transition-colors"
                                            >
                                                Stop Camera
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-[16px] border border-dashed border-ui-sky/20 bg-slate-50 overflow-hidden">
                                    {!scannerRunning && !startingScanner && (
                                        <div className="text-center px-6 py-10 border-b border-ui-sky/10">
                                            <div className="text-[42px] text-ui-sky mb-3">▣</div>
                                            <h3 className="text-[18px] font-extrabold text-ui-bright">
                                                Camera ready
                                            </h3>
                                            <p className="text-[14px] text-ui-muted mt-2 max-w-[360px] mx-auto">
                                                Click <span className="font-semibold">Start Camera</span> to begin
                                                scanning booking QR codes for check-in.
                                            </p>
                                        </div>
                                    )}

                                    <div
                                        id={qrRegionId}
                                        className="w-full min-h-[360px] flex items-center justify-center bg-black/5"
                                    />
                                </div>
                            </div>

                            <div className="rounded-[18px] border border-ui-sky/10 bg-ui-sky/5 p-5">
                                <div className="text-[11px] font-bold tracking-[0.15em] text-ui-dim uppercase font-mono mb-3">
                                    Check-In Notes
                                </div>

                                <div className="space-y-3 text-[14px] text-ui-muted leading-relaxed">
                                    <div className="flex items-start gap-3">
                                        <span className="mt-1 text-ui-sky">•</span>
                                        <span>Only approved bookings can be checked in.</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="mt-1 text-ui-sky">•</span>
                                        <span>Bookings are valid only on the correct date and within the booked time range.</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="mt-1 text-ui-sky">•</span>
                                        <span>Each booking can only be checked in once.</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="mt-1 text-ui-sky">•</span>
                                        <span>
                                            This scanner automatically handles QR values like
                                            <span className="font-mono ml-1">BOOKING_TOKEN:xxxxx</span>.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-[18px] border border-ui-sky/10 bg-ui-base/70 p-5">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <div className="text-[12px] font-bold tracking-[0.12em] text-ui-dim uppercase font-mono mb-1">
                                        Upload QR Image
                                    </div>
                                    <div className="text-[14px] text-ui-muted">
                                        Select a screenshot or photo containing the booking QR code.
                                    </div>
                                </div>

                                <button
                                    onClick={handleUploadClick}
                                    disabled={scanLoading}
                                    className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {scanLoading ? 'Processing...' : 'Choose Image'}
                                </button>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />

                            <div className="mt-5 rounded-[16px] border border-dashed border-ui-sky/20 bg-slate-50 px-6 py-10 text-center">
                                <div className="text-[42px] text-ui-sky mb-3">▤</div>
                                <h3 className="text-[18px] font-extrabold text-ui-bright">
                                    Upload a QR image
                                </h3>
                                <p className="text-[14px] text-ui-muted mt-2 max-w-[420px] mx-auto">
                                    Use this option if the booking QR is saved as an image, screenshot,
                                    or photo instead of scanning with the camera.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {scanLoading && (
                    <div className="card mb-6 text-center">
                        <div className="text-[14px] text-ui-muted">Processing check-in...</div>
                    </div>
                )}

                {result && (
                    <div className="card">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                            <div>
                                <div className="text-[10px] font-bold tracking-[0.15em] text-ui-dim uppercase font-mono mb-2">
                                    Check-In Result
                                </div>
                                <h2 className="text-[28px] font-extrabold tracking-[-0.03em] text-ui-bright mb-2">
                                    Booking checked in successfully
                                </h2>
                                <p className="text-[14px] text-ui-muted max-w-[640px]">
                                    The booking has been validated and marked as checked in through the
                                    admin check-in console.
                                </p>
                            </div>

                            <span
                                className="inline-flex items-center rounded-[10px] px-[12px] py-[8px] text-[12px] font-bold border"
                                style={{
                                    background: 'rgba(111,143,114,0.12)',
                                    color: 'var(--color-ui-green)',
                                    borderColor: 'rgba(111,143,114,0.25)',
                                }}
                            >
                                ✓ CHECKED IN
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-7">
                            <InfoCard label="Booking ID" value={`#${result.bookingId ?? '—'}`} />
                            <InfoCard label="Resource" value={result.resourceName || '—'} />
                            <InfoCard label="User Email" value={result.userEmail || '—'} />
                            <InfoCard label="Booking Date" value={fmtDate(result.bookingDate)} />
                            <InfoCard label="Start Time" value={fmtTime(result.startTime)} />
                            <InfoCard label="End Time" value={fmtTime(result.endTime)} />
                            <InfoCard label="Checked In" value={result.checkedIn ? 'Yes' : 'No'} />
                            <InfoCard
                                label="Checked In At"
                                value={
                                    result.checkedInAt
                                        ? new Date(result.checkedInAt).toLocaleString()
                                        : '—'
                                }
                            />
                        </div>

                        {result.message && (
                            <div className="mt-6 rounded-[12px] border border-ui-green/20 bg-ui-green/8 px-4 py-3 text-[14px] text-ui-green">
                                {result.message}
                            </div>
                        )}
                    </div>
                )}

                <style>{`
  #${qrRegionId} {
    width: 100%;
    min-height: 360px;
    position: relative;
    overflow: hidden;
    border-radius: 12px;
  }

  #${qrRegionId} video {
    width: 100% !important;
    height: 360px !important;
    object-fit: cover !important;
    border-radius: 12px;
    display: block !important;
  }

  #${qrRegionId} canvas {
    border-radius: 12px;
  }

  #${qrRegionId} img {
    display: none !important;
  }

  #${qrRegionId} > div {
    width: 100% !important;
  }
`}</style>

                <div id="hidden-file-scanner" className="hidden" />
            </div>
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

                <div className="w-11 h-11 rounded-[14px] flex items-center justify-center bg-ui-sky/10 text-ui-sky text-[20px]">
                    {icon}
                </div>
            </div>
        </div>
    );
}

function InfoCard({ label, value }) {
    return (
        <div className="rounded-[16px] border border-ui-sky/10 bg-ui-base px-4 py-4">
            <div className="text-[10px] font-bold tracking-[0.14em] text-ui-dim uppercase font-mono mb-2">
                {label}
            </div>
            <div className="text-[15px] font-semibold text-ui-bright break-words">
                {value}
            </div>
        </div>
    );
}

function Toast({ toast }) {
    return (
        <div className="fixed right-5 top-20 z-[9999] animate-[fadeIn_0.2s_ease]">
            <div
                className={`min-w-[260px] max-w-[360px] rounded-[14px] border px-4 py-3 shadow-xl ${toast.type === 'error'
                    ? 'border-ui-danger/20 bg-white text-ui-danger'
                    : 'border-ui-green/20 bg-white text-ui-green'
                    }`}
            >
                <div className="text-[13px] font-bold mb-1">
                    {toast.type === 'error' ? 'Action failed' : 'Success'}
                </div>
                <div className="text-[13px] leading-relaxed">{toast.msg}</div>
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}