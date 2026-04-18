import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TicketForm from '../../components/tickets/TicketForm';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';

const CreateTicket = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const handleSuccess = (createdTicket) => {
    // Navigate to the created ticket detail page
    navigate(`/tickets/${createdTicket.id}`);
  };

  const handleCancel = () => {
    // Navigate back to ticket list
    navigate('/tickets');
  };

  useEffect(() => {
    if (!loading && user?.role !== 'USER') {
      navigate('/tickets');
    }
  }, [loading, user, navigate]);

  if (loading) {
    return null;
  }

  if (user?.role !== 'USER') {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <TicketForm 
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </Layout>
  );
};

export default CreateTicket;
