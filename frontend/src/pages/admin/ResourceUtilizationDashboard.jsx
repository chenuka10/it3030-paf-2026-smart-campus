import { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { getResourceUtilizationAnalytics } from '../../api/adminReportsApi';

const RANGE_OPTIONS = [7, 30, 90];
const STATUS_TONES = {
  APPROVED: 'bg-ui-green/12 text-ui-green border-ui-green/20',
  PENDING: 'bg-ui-warn/12 text-ui-warn border-ui-warn/20',
  CANCELLED: 'bg-ui-danger/10 text-ui-danger border-ui-danger/20',
  REJECTED: 'bg-ui-danger/6 text-ui-danger border-ui-danger/12'
};

export default function ResourceUtilizationDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchAnalytics(days);
  }, [days]);

  const fetchAnalytics = async (range = days) => {
    setLoading(true);
    setError('');

    try {
      const data = await getResourceUtilizationAnalytics(range);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load resource utilization analytics:', err);
      setError(err.response?.data?.message || 'Failed to load resource utilization analytics');
    } finally {
      setLoading(false);
    }
  };

  const topBookedHours = useMemo(() => {
    if (!analytics?.topResources?.length) return 1;
    return Math.max(...analytics.topResources.map((resource) => resource.bookedHours), 1);
  }, [analytics]);

  const peakHourlyCount = useMemo(() => {
    if (!analytics?.hourlyDistribution?.length) return 1;
    return Math.max(...analytics.hourlyDistribution.map((slot) => slot.bookingCount), 1);
  }, [analytics]);

  const peakDailyBookings = useMemo(() => {
    if (!analytics?.dailyTrend?.length) return 1;
    return Math.max(...analytics.dailyTrend.map((day) => day.totalBookings), 1);
  }, [analytics]);

  if (loading) {
    return (
      <Layout adminOnly>
        <div className="flex min-h-[420px] flex-col items-center justify-center gap-4">
          <div
            className="h-10 w-10 rounded-full border-[3px] border-ui-sky/15"
            style={{ borderTopColor: 'var(--color-ui-sky)', animation: 'spin 0.8s linear infinite' }}
          />
          <p className="text-sm text-ui-muted">Loading resource intelligence dashboard...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </Layout>
    );
  }

  return (
    <Layout adminOnly>
      <div className="mx-auto max-w-[1380px] px-8 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ui-warn font-mono">
              RESOURCE INTELLIGENCE
            </div>
            <h1 className="text-[36px] font-extrabold tracking-[-0.04em] text-ui-surface">
              Resource Utilization Dashboard
            </h1>
            <p className="mt-2 max-w-3xl text-[15px] text-ui-muted">
              Understand how campus resources are being booked, where demand peaks, which assets are underused,
              and how efficiently your inventory is being utilized.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-xl border border-ui-sky/14 bg-ui-panel/30 p-1">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDays(option)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] transition ${
                    days === option ? 'bg-ui-sky text-white' : 'text-ui-muted hover:text-ui-bright'
                  }`}
                >
                  {option}d
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchAnalytics(days)}
              className="rounded-xl border border-ui-sky/20 bg-ui-base px-5 py-3 text-sm font-bold text-ui-sky transition hover:border-ui-sky/35 hover:bg-ui-sky/6"
            >
              Refresh Insights
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-ui-danger/18 bg-ui-danger/8 px-5 py-4 text-sm text-ui-danger">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total Bookings" value={analytics?.summary?.totalBookings || 0} tone="sky" />
          <MetricCard label="Approved Bookings" value={analytics?.summary?.approvedBookings || 0} tone="green" />
          <MetricCard label="Booked Hours" value={`${analytics?.summary?.bookedHours || 0}h`} tone="bright" />
          <MetricCard label="Approval Rate" value={`${analytics?.summary?.approvalRate || 0}%`} tone="warn" />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Utilization Rate" value={`${analytics?.summary?.utilizationRate || 0}%`} tone="sky" />
          <MetricCard label="Active Resources" value={analytics?.summary?.activeResources || 0} tone="bright" />
          <MetricCard label="Resources Used" value={analytics?.summary?.resourcesUsed || 0} tone="green" />
          <MetricCard label="Pending Bookings" value={analytics?.summary?.pendingBookings || 0} tone="warn" />
        </div>

        <div className="mt-7 grid gap-6 xl:grid-cols-[1.4fr_0.95fr]">
          <section className="rounded-[24px] border border-ui-sky/12 bg-ui-base/82 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-[22px] font-bold tracking-[-0.02em] text-ui-surface">Top Utilized Resources</h2>
                <p className="mt-1 text-sm text-ui-muted">
                  See which assets carry the heaviest booking load and where demand concentrates.
                </p>
              </div>
              <div className="rounded-full border border-ui-sky/12 bg-ui-sky/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ui-muted">
                Top 6 resources
              </div>
            </div>

            {!analytics?.topResources?.length ? (
              <EmptyState text="No booking activity is available for this time window yet." />
            ) : (
              <div className="space-y-4">
                {analytics.topResources.map((resource, index) => (
                  <div key={resource.resourceId} className="rounded-[20px] border border-ui-sky/10 bg-ui-panel/30 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-ui-dim font-mono">
                          Rank {index + 1}
                        </div>
                        <h3 className="mt-1 text-lg font-bold text-ui-bright">{resource.resourceName}</h3>
                        <div className="mt-1 text-sm text-ui-muted">
                          {formatLabel(resource.resourceType)} | {resource.location}
                        </div>
                        <div className="mt-2 text-xs text-ui-dim">
                          Peak start window: {resource.peakHourLabel} | Last booking: {formatDateTime(resource.lastBookedAt)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-ui-dim font-mono">
                          Utilization
                        </div>
                        <div className="mt-1 text-[28px] font-extrabold text-ui-sky">{resource.utilizationRate}%</div>
                      </div>
                    </div>

                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-ui-sky/8">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-ui-sky),var(--color-ui-green))]"
                        style={{ width: `${Math.max((resource.bookedHours / topBookedHours) * 100, 10)}%` }}
                      />
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      <InsightPill label="Bookings" value={resource.bookingCount} />
                      <InsightPill label="Approved" value={resource.approvedCount} />
                      <InsightPill label="Pending" value={resource.pendingCount} />
                      <InsightPill label="Rejected / Cancelled" value={resource.cancelledCount} />
                      <InsightPill label="Booked Hours" value={`${resource.bookedHours}h`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="space-y-6">
            <section className="rounded-[24px] border border-ui-sky/12 bg-ui-base/82 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
              <div>
                <h2 className="text-[20px] font-bold tracking-[-0.02em] text-ui-surface">Utilization by Resource Type</h2>
                <p className="mt-1 text-sm text-ui-muted">Compare demand and consumed booking hours across resource categories.</p>
              </div>

              <div className="mt-5 space-y-3">
                {analytics?.typeBreakdown?.length ? (
                  analytics.typeBreakdown.map((entry) => (
                    <BarRow
                      key={entry.resourceType}
                      label={formatLabel(entry.resourceType)}
                      value={`${entry.bookedHours}h`}
                      helper={`${entry.bookingCount} approved bookings | ${entry.utilizationRate}% utilization`}
                      width={entry.utilizationRate}
                    />
                  ))
                ) : <EmptyState text="No type-level utilization data available yet." compact />}
              </div>
            </section>

            <section className="rounded-[24px] border border-ui-sky/12 bg-ui-base/82 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
              <h2 className="text-[20px] font-bold tracking-[-0.02em] text-ui-surface">Booking Status Mix</h2>
              <p className="mt-1 text-sm text-ui-muted">A quick pulse on approval flow, pending load, and booking outcomes.</p>

              <div className="mt-5 space-y-3">
                {analytics?.statusBreakdown?.length ? analytics.statusBreakdown.map((entry) => (
                  <div key={entry.status} className="flex items-center justify-between rounded-2xl border border-ui-sky/10 bg-ui-panel/25 px-4 py-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_TONES[entry.status] || 'border-ui-sky/15 bg-ui-sky/6 text-ui-muted'}`}>
                      {formatLabel(entry.status)}
                    </span>
                    <span className="text-sm font-bold text-ui-bright">{entry.bookingCount}</span>
                  </div>
                )) : <EmptyState text="No booking status data available yet." compact />}
              </div>
            </section>
          </div>
        </div>

        <div className="mt-7 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[24px] border border-ui-sky/12 bg-ui-base/82 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
            <div className="mb-5">
              <h2 className="text-[20px] font-bold tracking-[-0.02em] text-ui-surface">Daily Booking Trend</h2>
              <p className="mt-1 text-sm text-ui-muted">Track how booking demand evolves across the selected time range.</p>
            </div>

            {analytics?.dailyTrend?.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {analytics.dailyTrend.map((day) => (
                  <TrendCard
                    key={day.date}
                    label={formatDate(day.date)}
                    primary={`${day.totalBookings} total`}
                    secondary={`${day.approvedBookings} approved | ${day.bookedHours}h`}
                    width={(day.totalBookings / peakDailyBookings) * 100}
                  />
                ))}
              </div>
            ) : <EmptyState text="No daily trend data available yet." />}
          </section>

          <section className="rounded-[24px] border border-ui-sky/12 bg-ui-base/82 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
            <div className="mb-5">
              <h2 className="text-[20px] font-bold tracking-[-0.02em] text-ui-surface">Peak Booking Hours</h2>
              <p className="mt-1 text-sm text-ui-muted">Helps explain when booking demand clusters during the day.</p>
            </div>

            <div className="space-y-3">
              {analytics?.hourlyDistribution?.length ? (
                analytics.hourlyDistribution.map((entry) => (
                  <BarRow
                    key={entry.hourLabel}
                    label={entry.hourLabel}
                    value={entry.bookingCount}
                    helper="Approved bookings starting in this hour"
                    width={(entry.bookingCount / peakHourlyCount) * 100}
                  />
                ))
              ) : <EmptyState text="No hourly demand data available yet." compact />}
            </div>
          </section>
        </div>

        <section className="mt-7 rounded-[24px] border border-ui-sky/12 bg-ui-base/82 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-[22px] font-bold tracking-[-0.02em] text-ui-surface">Underutilized Opportunities</h2>
              <p className="mt-1 text-sm text-ui-muted">
                Identify resources that are active but attracting low booking demand.
              </p>
            </div>
            <div className="rounded-full border border-ui-green/15 bg-ui-green/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ui-green">
              Optimization targets
            </div>
          </div>

          {!analytics?.underutilizedResources?.length ? (
            <EmptyState text="No underutilized resources to show for this time range." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {analytics.underutilizedResources.map((resource) => (
                <div key={resource.resourceId} className="rounded-[20px] border border-ui-sky/10 bg-ui-panel/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-ui-bright">{resource.resourceName}</h3>
                      <div className="mt-1 text-sm text-ui-muted">
                        {formatLabel(resource.resourceType)} | {resource.location}
                      </div>
                    </div>
                    <span className="rounded-full border border-ui-green/20 bg-ui-green/8 px-3 py-1 text-xs font-semibold text-ui-green">
                      {resource.utilizationRate}%
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <InsightPill label="Bookings" value={resource.bookingCount} />
                    <InsightPill label="Booked Hours" value={`${resource.bookedHours}h`} />
                    <InsightPill label="Pending" value={resource.pendingCount} />
                    <InsightPill label="Peak Window" value={resource.peakHourLabel} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

function MetricCard({ label, value, tone }) {
  const tones = {
    sky: 'text-ui-sky',
    warn: 'text-ui-warn',
    green: 'text-ui-green',
    danger: 'text-ui-danger',
    bright: 'text-ui-bright'
  };

  return (
    <div className="rounded-[22px] border border-ui-sky/12 bg-ui-base/82 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-ui-dim font-mono">{label}</div>
      <div className={`mt-3 text-[34px] font-extrabold tracking-[-0.04em] ${tones[tone] || tones.sky}`}>{value}</div>
    </div>
  );
}

function InsightPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-ui-sky/10 bg-ui-base/70 px-3 py-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-ui-dim font-mono">{label}</div>
      <div className="mt-1 text-sm font-semibold text-ui-bright">{value}</div>
    </div>
  );
}

function BarRow({ label, value, helper, width }) {
  return (
    <div className="rounded-2xl border border-ui-sky/10 bg-ui-panel/25 px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-ui-bright">{label}</span>
        <span className="text-ui-muted">{value}</span>
      </div>
      {helper && <div className="mb-2 text-xs text-ui-dim">{helper}</div>}
      <div className="h-2.5 overflow-hidden rounded-full bg-ui-sky/8">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-ui-sky),var(--color-ui-green))]"
          style={{ width: `${Math.max(width || 0, width > 0 ? 10 : 0)}%` }}
        />
      </div>
    </div>
  );
}

function TrendCard({ label, primary, secondary, width }) {
  return (
    <div className="rounded-2xl border border-ui-sky/10 bg-ui-panel/25 p-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-ui-dim font-mono">{label}</div>
      <div className="mt-2 text-base font-bold text-ui-bright">{primary}</div>
      <div className="mt-1 text-sm text-ui-muted">{secondary}</div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-ui-sky/8">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-ui-warn),var(--color-ui-sky))]"
          style={{ width: `${Math.max(width || 0, width > 0 ? 12 : 0)}%` }}
        />
      </div>
    </div>
  );
}

function EmptyState({ text, compact = false }) {
  return (
    <div className={`rounded-2xl border border-dashed border-ui-sky/14 bg-ui-sky/4 text-center text-ui-muted ${compact ? 'px-4 py-6 text-sm' : 'px-6 py-10 text-sm'}`}>
      {text}
    </div>
  );
}

function formatLabel(value) {
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value) {
  if (!value) return 'No activity yet';
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}
