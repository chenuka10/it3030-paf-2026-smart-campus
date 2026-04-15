import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllTickets, getMyTickets } from '../../api/ticketApi';
import TicketList from '../../components/tickets/TicketList';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';

const TicketListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    setLoading(true);
    setError('');
    
    try {
      let data;

      if (user?.role === 'USER') {
        data = await getMyTickets();
      } else if (user?.role === 'TECHNICIAN') {
        data = await getAllTickets({ assignedTechnicianId: user.id });
      } else {
        data = await getAllTickets();
      }

      setTickets(data);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      setError(err.response?.data?.message || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleTicketClick = (ticketId) => {
    navigate(`/tickets/${ticketId}`);
  };

  const handleCreateClick = () => {
    navigate('/tickets/new');
  };

  const canCreate = user?.role === 'USER';

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button 
              onClick={fetchTickets}
              className="ml-4 text-sm underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        <TicketList
          tickets={tickets}
          loading={loading}
          onTicketClick={handleTicketClick}
          onCreateClick={handleCreateClick}
          canCreate={canCreate}
        />
      </div>
    </Layout>
  );
};

export default TicketListPage;
