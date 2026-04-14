import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTicketById, deleteTicket, getAttachmentUrl } from '../../api/ticketApi';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../utils/ticketConstants';
import CommentSection from '../../components/tickets/CommentSection';
import StatusUpdateModal from '../../components/tickets/StatusUpdateModal';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const currentUserId = user?.id;
  const userRole = user?.role || 'USER';

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await getTicketById(id);
      setTicket(data);
    } catch (err) {
      console.error('Failed to fetch ticket:', err);
      setError(err.response?.data?.message || 'Failed to fetch ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteTicket(id);
      navigate('/tickets');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete ticket');
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canUpdateStatus = userRole === 'ADMIN' || userRole === 'TECHNICIAN';
  const canDelete = userRole === 'ADMIN';

  if (loading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading ticket...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
            <button 
              onClick={() => navigate('/tickets')}
              className="mt-3 text-sm underline hover:no-underline"
            >
              Back to Tickets
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">Ticket not found</p>
            <button 
              onClick={() => navigate('/tickets')}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Tickets
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-6">
        <button
          onClick={() => navigate('/tickets')}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
        >
          Back to Tickets
        </button>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Ticket #{ticket.id}
              </h1>
              <p className="text-gray-600">
                Resource ID: {ticket.resourceId}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[ticket.status]}`}>
                {ticket.status.replace('_', ' ')}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                {ticket.priority}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b">
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="font-medium">{ticket.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-medium">{formatDate(ticket.createdAt)}</p>
            </div>
            {ticket.assignedTechnicianId && (
              <div>
                <p className="text-sm text-gray-500">Assigned Technician</p>
                <p className="font-medium">User #{ticket.assignedTechnicianId}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="font-medium">{formatDate(ticket.updatedAt)}</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          <div className="mb-6 pb-6 border-b">
            <h2 className="text-lg font-semibold mb-3">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{ticket.contactEmail}</p>
              </div>
              {ticket.contactPhone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{ticket.contactPhone}</p>
                </div>
              )}
            </div>
          </div>

          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="mb-6 pb-6 border-b">
              <h2 className="text-lg font-semibold mb-3">Attachments ({ticket.attachments.length})</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {ticket.attachments.map((attachment) => (
                  <div key={attachment.id} className="border rounded-lg overflow-hidden">
                    <a 
                      href={getAttachmentUrl(attachment.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={getAttachmentUrl(attachment.fileUrl)}
                        alt={attachment.fileName}
                        className="w-full h-40 object-cover hover:opacity-75 transition"
                      />
                      <p className="p-2 text-xs text-gray-600 truncate">
                        {attachment.fileName}
                      </p>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ticket.resolutionNotes && (
            <div className="mb-6 pb-6 border-b">
              <h2 className="text-lg font-semibold mb-2">Resolution Notes</h2>
              <p className="text-gray-700 whitespace-pre-wrap bg-green-50 p-4 rounded border border-green-200">
                {ticket.resolutionNotes}
              </p>
            </div>
          )}

          {ticket.rejectionReason && (
            <div className="mb-6 pb-6 border-b">
              <h2 className="text-lg font-semibold mb-2">Rejection Reason</h2>
              <p className="text-gray-700 whitespace-pre-wrap bg-red-50 p-4 rounded border border-red-200">
                {ticket.rejectionReason}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            {canUpdateStatus && (
              <button
                onClick={() => setShowStatusModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Update Status
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium disabled:bg-gray-400"
              >
                {deleting ? 'Deleting...' : 'Delete Ticket'}
              </button>
            )}
          </div>
        </div>

        <CommentSection
          ticketId={ticket.id}
          currentUserId={currentUserId}
        />

        {showStatusModal && (
          <StatusUpdateModal
            ticket={ticket}
            onClose={() => setShowStatusModal(false)}
            onSuccess={() => {
              setShowStatusModal(false);
              fetchTicket();
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default TicketDetailPage;
