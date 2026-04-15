import React from 'react';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../utils/ticketConstants';

const formatTicketCode = (ticketId) => `ID-${String(ticketId).padStart(3, '0')}`;

const TicketCard = ({ ticket, onClick }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <button
      type="button"
      onClick={() => onClick && onClick(ticket.id)}
      className="group w-full rounded-[24px] border border-ui-sky/12 bg-ui-base/85 p-5 text-left shadow-[0_14px_34px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:border-ui-sky/24 hover:shadow-[0_20px_44px_rgba(15,23,42,0.10)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-ui-dim font-mono">
            Ticket
          </div>
          <h3 className="mt-2 text-[22px] font-extrabold tracking-[-0.03em] text-ui-surface">
            {formatTicketCode(ticket.id)}
          </h3>
          <p className="mt-1 text-sm text-ui-muted">
            Resource ID: <span className="font-semibold text-ui-bright">{ticket.resourceId}</span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[ticket.status]}`}>
            {ticket.status.replace('_', ' ')}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PRIORITY_COLORS[ticket.priority]}`}>
            {ticket.priority}
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <span className="rounded-full border border-ui-sky/10 bg-ui-sky/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ui-muted">
          {ticket.category.replace('_', ' ')}
        </span>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-ui-muted">
        {ticket.description}
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-ui-sky/10 pt-4">
        <div className="flex items-center gap-4 text-xs text-ui-muted">
          <span>{ticket.attachments?.length || 0} attachments</span>
          <span>{ticket.commentCount || 0} comments</span>
        </div>
        <span className="text-xs text-ui-dim">{formatDate(ticket.createdAt)}</span>
      </div>
    </button>
  );
};

export default TicketCard;
