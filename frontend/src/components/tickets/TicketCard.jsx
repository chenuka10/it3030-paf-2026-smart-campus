import React from 'react';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../utils/ticketConstants';

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
    <div
      onClick={() => onClick && onClick(ticket.id)}
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-5 border border-gray-200"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Ticket #{ticket.id}
          </h3>
          <p className="text-sm text-gray-500">
            Resource ID: {ticket.resourceId}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
            {ticket.status.replace('_', ' ')}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
            {ticket.priority}
          </span>
        </div>
      </div>

      {/* Category */}
      <div className="mb-3">
        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
          {ticket.category}
        </span>
      </div>

      {/* Description - Truncated */}
      <p className="text-gray-700 mb-4 line-clamp-2">
        {ticket.description}
      </p>

      {/* Footer */}
      <div className="flex justify-between items-center text-sm text-gray-500 border-t pt-3">
        <div className="flex items-center gap-3">
          <span>📎 {ticket.attachments?.length || 0}</span>
          <span>💬 {ticket.commentCount || 0}</span>
        </div>
        <span className="text-xs">{formatDate(ticket.createdAt)}</span>
      </div>
    </div>
  );
};

export default TicketCard;