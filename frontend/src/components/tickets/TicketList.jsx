import React, { useState } from 'react';
import { TICKET_STATUS, TICKET_PRIORITY } from '../../utils/ticketConstants';
import TicketCard from './TicketCard';

const TicketList = ({ tickets, loading, onTicketClick, onCreateClick }) => {
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({ status: '', priority: '', search: '' });
  };

  // Apply filters to tickets
  const filteredTickets = tickets.filter(ticket => {
    // Status filter
    if (filters.status && ticket.status !== filters.status) {
      return false;
    }
    
    // Priority filter
    if (filters.priority && ticket.priority !== filters.priority) {
      return false;
    }
    
    // Search filter
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

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Maintenance Tickets</h1>
        <button
          onClick={onCreateClick}
          className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          + Create Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by ID, description, category..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {Object.values(TICKET_STATUS).map(status => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              {Object.values(TICKET_PRIORITY).map(priority => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(filters.status || filters.priority || filters.search) && (
          <div className="mt-3">
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading tickets...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredTickets.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg mb-2">No tickets found</p>
          {filters.status || filters.priority || filters.search ? (
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear filters
            </button>
          ) : (
            <button
              onClick={onCreateClick}
              className="mt-3 px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Your First Ticket
            </button>
          )}
        </div>
      )}

      {/* Tickets Grid */}
      {!loading && filteredTickets.length > 0 && (
        <>
          <div className="mb-3 text-sm text-gray-600">
            Showing {filteredTickets.length} of {tickets.length} tickets
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTickets.map(ticket => (
              <TicketCard 
                key={ticket.id} 
                ticket={ticket} 
                onClick={onTicketClick}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TicketList;