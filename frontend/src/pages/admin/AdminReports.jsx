import { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { getResourceIssueAnalytics } from '../../api/adminReportsApi';

const STATUS_TONES = {
  OPEN: 'bg-ui-warn/12 text-ui-warn border-ui-warn/20',
  IN_PROGRESS: 'bg-ui-sky/12 text-ui-sky border-ui-sky/20',
  RESOLVED: 'bg-ui-green/12 text-ui-green border-ui-green/20',
  CLOSED: 'bg-ui-green/8 text-ui-green border-ui-green/15',
  REJECTED: 'bg-ui-danger/10 text-ui-danger border-ui-danger/20'
};

export default function AdminReports() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [issuesChartType, setIssuesChartType] = useState('bar');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getResourceIssueAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const peakTicketCount = useMemo(() => {
    if (!analytics?.topProblemResources?.length) return 1;
    return Math.max(...analytics.topProblemResources.map((resource) => resource.totalTickets), 1);
  }, [analytics]);

  const issuesByType = useMemo(() => {
    if (!analytics?.issuesByResourceType?.length) return [];
    return [...analytics.issuesByResourceType].sort((a, b) => b.ticketCount - a.ticketCount);
  }, [analytics]);

  if (loading) {
    return (
      <Layout adminOnly>
        <div className="flex min-h-[420px] flex-col items-center justify-center gap-4">
          <div
            className="h-10 w-10 rounded-full border-[3px] border-ui-sky/15"
            style={{ borderTopColor: 'var(--color-ui-sky)', animation: 'spin 0.8s linear infinite' }}
          />
          <p className="text-sm text-ui-muted">Loading analytics dashboard...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </Layout>
    );
  }

  return (
    <Layout adminOnly>
      <div className="mx-auto max-w-[1320px] px-8 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ui-warn font-mono">
              REPORTS
            </div>
            <h1 className="text-[36px] font-extrabold tracking-[-0.04em] text-ui-surface">
              Resource Issue Analytics
            </h1>
            <p className="mt-2 max-w-2xl text-[15px] text-ui-muted">
              Turn maintenance tickets into campus insights by seeing which resources create the most
              operational load, urgency, and downtime.
            </p>
          </div>

          <button
            onClick={fetchAnalytics}
            className="rounded-xl border border-ui-sky/20 bg-ui-base px-5 py-3 text-sm font-bold text-ui-sky transition hover:border-ui-sky/35 hover:bg-ui-sky/6"
          >
            Refresh Insights
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-ui-danger/18 bg-ui-danger/8 px-5 py-4 text-sm text-ui-danger">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Total Tickets" value={analytics?.summary?.totalTickets || 0} tone="sky" />
          <MetricCard label="Open / In Progress" value={analytics?.summary?.openTickets || 0} tone="warn" />
          <MetricCard label="Resolved / Closed" value={analytics?.summary?.resolvedTickets || 0} tone="green" />
          <MetricCard label="High Priority Load" value={analytics?.summary?.urgentTickets || 0} tone="danger" />
          <MetricCard label="Affected Resources" value={analytics?.summary?.affectedResources || 0} tone="bright" />
        </div>

        <div className="mt-7 grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
          <section className="rounded-[24px] border border-ui-sky/12 bg-ui-base/82 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-[22px] font-bold tracking-[-0.02em] text-ui-surface">Most Problematic Resources</h2>
                <p className="mt-1 text-sm text-ui-muted">
                  Ranked using ticket volume, unresolved load, and urgency score.
                </p>
              </div>
              <div className="rounded-full border border-ui-sky/12 bg-ui-sky/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ui-muted">
                Top 8 resources
              </div>
            </div>

            {!analytics?.topProblemResources?.length ? (
              <EmptyState text="No ticket analytics available yet. Create resource-linked tickets to populate this dashboard." />
            ) : (
              <div className="space-y-4">
                {analytics.topProblemResources.map((resource, index) => (
                  <div key={resource.resourceId} className="rounded-[20px] border border-ui-sky/10 bg-ui-panel/30 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-ui-dim font-mono">
                          Rank {index + 1}
                        </div>
                        <h3 className="mt-1 text-lg font-bold text-ui-bright">{resource.resourceName}</h3>
                        <div className="mt-1 text-sm text-ui-muted">
                          {formatLabel(resource.resourceType)} · {resource.location}
                        </div>
                        <div className="mt-2 text-xs text-ui-dim">
                          Last reported: {formatDateTime(resource.lastReportedAt)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-ui-dim font-mono">
                          Risk Score
                        </div>
                        <div className="mt-1 text-[28px] font-extrabold text-ui-danger">{resource.riskScore}</div>
                      </div>
                    </div>

                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-ui-sky/8">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-ui-danger),var(--color-ui-warn))]"
                        style={{ width: `${Math.max((resource.totalTickets / peakTicketCount) * 100, 12)}%` }}
                      />
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      <InsightPill label="Tickets" value={resource.totalTickets} />
                      <InsightPill label="Open" value={resource.openTickets} />
                      <InsightPill label="Urgent" value={resource.urgentTickets} />
                      <InsightPill label="Resolved" value={resource.resolvedTickets} />
                      <InsightPill label="Avg Fix Time" value={resource.averageResolutionHours ? `${resource.averageResolutionHours}h` : 'N/A'} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="space-y-6">
            <section className="rounded-[24px] border border-ui-sky/12 bg-ui-base/82 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-[20px] font-bold tracking-[-0.02em] text-ui-surface">Issues by Resource Type</h2>
                  <p className="mt-1 text-sm text-ui-muted">Highlights which kinds of campus assets generate the most tickets.</p>
                </div>

                <div className="inline-flex rounded-xl border border-ui-sky/14 bg-ui-panel/30 p-1">
                  <button
                    type="button"
                    onClick={() => setIssuesChartType('bar')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] transition ${issuesChartType === 'bar' ? 'bg-ui-sky text-white' : 'text-ui-muted hover:text-ui-bright'}`}
                  >
                    Bar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIssuesChartType('pie')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] transition ${issuesChartType === 'pie' ? 'bg-ui-sky text-white' : 'text-ui-muted hover:text-ui-bright'}`}
                  >
                    Pie
                  </button>
                </div>
              </div>

              <div className="mt-5">
                {issuesByType.length ? (
                  issuesChartType === 'bar'
                    ? <ResourceTypeBarChart data={issuesByType} />
                    : <ResourceTypePieChart data={issuesByType} />
                ) : <EmptyState text="No resource type insights available yet." compact />}
              </div>
            </section>

            <section className="rounded-[24px] border border-ui-sky/12 bg-ui-base/82 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
              <h2 className="text-[20px] font-bold tracking-[-0.02em] text-ui-surface">Status Distribution</h2>
              <p className="mt-1 text-sm text-ui-muted">Gives admins a quick view of workload, backlog, and closures.</p>

              <div className="mt-5 space-y-3">
                {analytics?.statusBreakdown?.length ? analytics.statusBreakdown.map((entry) => (
                  <div key={entry.status} className="flex items-center justify-between rounded-2xl border border-ui-sky/10 bg-ui-panel/25 px-4 py-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_TONES[entry.status] || 'border-ui-sky/15 bg-ui-sky/6 text-ui-muted'}`}>
                      {formatLabel(entry.status)}
                    </span>
                    <span className="text-sm font-bold text-ui-bright">{entry.ticketCount}</span>
                  </div>
                )) : <EmptyState text="No status data available yet." compact />}
              </div>
            </section>
          </div>
        </div>
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

function BarRow({ label, value, max }) {
  const width = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="rounded-2xl border border-ui-sky/10 bg-ui-panel/25 px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-ui-bright">{label}</span>
        <span className="text-ui-muted">{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-ui-sky/8">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-ui-sky),var(--color-ui-green))]"
          style={{ width: `${Math.max(width, value > 0 ? 10 : 0)}%` }}
        />
      </div>
    </div>
  );
}

function ResourceTypeBarChart({ data }) {
  const max = data[0]?.ticketCount || 1;

  return (
    <div className="space-y-3">
      {data.map((entry) => (
        <BarRow
          key={entry.resourceType}
          label={formatLabel(entry.resourceType)}
          value={entry.ticketCount}
          max={max}
        />
      ))}
    </div>
  );
}

function ResourceTypePieChart({ data }) {
  const total = data.reduce((sum, entry) => sum + entry.ticketCount, 0);
  const palette = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6', '#f43f5e', '#6366f1'];

  const stops = [];
  let cursor = 0;
  data.forEach((entry, index) => {
    const percent = total > 0 ? (entry.ticketCount / total) * 100 : 0;
    const color = palette[index % palette.length];
    const start = cursor;
    const end = cursor + percent;
    stops.push(`${color} ${start}% ${end}%`);
    cursor = end;
  });

  const chartStyle = {
    background: `conic-gradient(${stops.join(', ')})`
  };

  return (
    <div className="grid gap-4 md:grid-cols-[180px_1fr] md:items-start">
      <div className="mx-auto flex h-[180px] w-[180px] items-center justify-center rounded-full" style={chartStyle}>
        <div className="h-[88px] w-[88px] rounded-full bg-ui-base/95" />
      </div>

      <div className="space-y-2.5">
        {data.map((entry, index) => {
          const color = palette[index % palette.length];
          const percentage = total > 0 ? ((entry.ticketCount / total) * 100).toFixed(1) : '0.0';
          return (
            <div key={entry.resourceType} className="flex items-center justify-between rounded-xl border border-ui-sky/10 bg-ui-panel/25 px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-sm font-semibold text-ui-bright">{formatLabel(entry.resourceType)}</span>
              </div>
              <span className="text-xs font-semibold text-ui-muted">{entry.ticketCount} ({percentage}%)</span>
            </div>
          );
        })}
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
  if (!value) return 'N/A';
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
