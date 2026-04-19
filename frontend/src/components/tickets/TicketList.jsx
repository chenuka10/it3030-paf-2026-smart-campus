import React, { useMemo, useState } from 'react';
import { TICKET_STATUS, TICKET_PRIORITY } from '../../utils/ticketConstants';
import TicketCard from './TicketCard';

const TicketList = ({ tickets, loading, onTicketClick, onCreateClick, canCreate = false }) => {
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({ status: '', priority: '', search: '' });
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (filters.status && ticket.status !== filters.status) {
      return false;
    }

    if (filters.priority && ticket.priority !== filters.priority) {
      return false;
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        ticket.description.toLowerCase().includes(searchLower) ||
        ticket.id.toString().includes(searchLower) ||
        ticket.category.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const stats = useMemo(() => {
    const open = tickets.filter((ticket) => ticket.status === 'OPEN').length;
    const inProgress = tickets.filter((ticket) => ticket.status === 'IN_PROGRESS').length;
    const resolved = tickets.filter((ticket) => ticket.status === 'RESOLVED').length;
    const urgent = tickets.filter((ticket) => ticket.priority === 'URGENT').length;

    return [
      { label: 'Total Tickets', value: tickets.length, tone: 'text-ui-sky' },
      { label: 'Open', value: open, tone: 'text-ui-warn' },
      { label: 'In Progress', value: inProgress, tone: 'text-ui-green' },
      { label: 'Urgent', value: urgent, tone: 'text-ui-danger' },
      { label: 'Resolved', value: resolved, tone: 'text-ui-bright' }
    ];
  }, [tickets]);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-ui-sky/12 bg-[linear-gradient(135deg,rgba(232,226,216,0.92),rgba(245,242,236,0.98))] px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] md:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ui-dim font-mono">
              Maintenance Desk
            </div>
            <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.04em] text-ui-surface">
              Maintenance Tickets
            </h1>
            <p className="mt-2 max-w-[680px] text-sm leading-6 text-ui-muted">
              Review campus maintenance requests, filter by urgency or status, and open each ticket for full details and action history.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {canCreate && (
              <button
                onClick={onCreateClick}
                className="rounded-xl bg-ui-sky px-5 py-3 text-sm font-bold text-ui-base transition hover:opacity-95"
              >
                Create Ticket
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-ui-sky/10 bg-ui-base/70 px-4 py-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ui-dim font-mono">
                {stat.label}
              </div>
              <div className={`mt-2 text-[28px] font-extrabold leading-none ${stat.tone}`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] border border-ui-sky/12 bg-ui-base/80 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[20px] font-bold tracking-[-0.02em] text-ui-surface">Filter Tickets</h2>
            <p className="text-sm text-ui-muted">Narrow the list by search term, status, or priority.</p>
          </div>
          {(filters.status || filters.priority || filters.search) && (
            <button
              onClick={clearFilters}
              className="rounded-xl border border-ui-sky/14 px-4 py-2 text-sm font-semibold text-ui-muted transition hover:bg-ui-sky/6 hover:text-ui-bright"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Search">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by ID, category, or description"
              className="w-full rounded-2xl border border-ui-sky/14 bg-ui-base px-4 py-3 text-sm text-ui-bright outline-none transition focus:border-ui-sky/35"
            />
          </Field>

          <Field label="Status">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full rounded-2xl border border-ui-sky/14 bg-ui-base px-4 py-3 text-sm text-ui-bright outline-none transition focus:border-ui-sky/35"
            >
              <option value="">All Statuses</option>
              {Object.values(TICKET_STATUS).map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Priority">
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full rounded-2xl border border-ui-sky/14 bg-ui-base px-4 py-3 text-sm text-ui-bright outline-none transition focus:border-ui-sky/35"
            >
              <option value="">All Priorities</option>
              {Object.values(TICKET_PRIORITY).map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {loading && (
        <div className="rounded-[24px] border border-ui-sky/12 bg-ui-base/80 py-16 text-center shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
          <div className="mx-auto inline-block h-12 w-12 animate-spin rounded-full border-2 border-ui-sky/15 border-t-ui-sky"></div>
          <p className="mt-4 text-sm text-ui-muted">Loading tickets...</p>
        </div>
      )}

      {!loading && filteredTickets.length === 0 && (
        <div className="rounded-[24px] border border-ui-sky/12 bg-ui-base/80 px-6 py-16 text-center shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ui-sky/8 text-2xl text-ui-sky">
            #
          </div>
          <h3 className="text-[20px] font-bold tracking-[-0.02em] text-ui-surface">No tickets found</h3>
          <p className="mt-2 text-sm text-ui-muted">
            {filters.status || filters.priority || filters.search
              ? 'Try adjusting the active filters to broaden the results.'
              : 'There are no tickets to display at the moment.'}
          </p>
          {filters.status || filters.priority || filters.search ? (
            <button
              onClick={clearFilters}
              className="mt-5 rounded-xl border border-ui-sky/14 px-4 py-2 text-sm font-semibold text-ui-muted transition hover:bg-ui-sky/6 hover:text-ui-bright"
            >
              Clear Filters
            </button>
          ) : canCreate ? (
            <button
              onClick={onCreateClick}
              className="mt-5 rounded-xl bg-ui-sky px-5 py-3 text-sm font-bold text-ui-base transition hover:opacity-95"
            >
              Create Ticket
            </button>
          ) : null}
        </div>
      )}

      {!loading && filteredTickets.length > 0 && (
        <>
          <div className="flex items-center justify-between px-1">
            <div className="text-sm text-ui-muted">
              Showing <span className="font-semibold text-ui-bright">{filteredTickets.length}</span> of{' '}
              <span className="font-semibold text-ui-bright">{tickets.length}</span> tickets
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} onClick={onTicketClick} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-semibold text-ui-bright">{label}</div>
      {children}
    </label>
  );
}

export default TicketList;
