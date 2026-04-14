import React, { useEffect, useState } from 'react';
import { updateTicketStatus } from '../../api/ticketApi';
import { VALID_TRANSITIONS } from '../../utils/ticketConstants';
import api from '../../api/axios';

const StatusUpdateModal = ({ ticket, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    assignedTechnicianId: ticket.assignedTechnicianId || '',
    resolutionNotes: '',
    rejectionReason: ''
  });

  // Get valid next statuses
  const validStatuses = VALID_TRANSITIONS[ticket.status] || [];

  useEffect(() => {
    if (formData.status !== 'IN_PROGRESS') {
      setLoadingTechnicians(false);
      return;
    }

    const fetchTechnicians = async () => {
      setLoadingTechnicians(true);
      try {
        const { data } = await api.get('/api/users/technicians');
        setTechnicians(data);
      } catch (error) {
        setTechnicians([]);
      } finally {
        setLoadingTechnicians(false);
      }
    };

    fetchTechnicians();
  }, [formData.status]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        status: formData.status
      };

      if (formData.assignedTechnicianId) {
        updateData.assignedTechnicianId = parseInt(formData.assignedTechnicianId);
      }

      if (formData.status === 'RESOLVED' && formData.resolutionNotes) {
        updateData.resolutionNotes = formData.resolutionNotes;
      }

      if (formData.status === 'REJECTED' && formData.rejectionReason) {
        updateData.rejectionReason = formData.rejectionReason;
      }

      await updateTicketStatus(ticket.id, updateData);
      onSuccess();
      onClose();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to update ticket status';
      alert(message);
      setLoading(false);
    }
  };

  const canSubmit =
    !loading &&
    validStatuses.length > 0 &&
    !(formData.status === 'IN_PROGRESS' && (loadingTechnicians || technicians.length === 0));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Update Ticket Status</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Status <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => {
                const nextStatus = e.target.value;
                setFormData({
                  ...formData,
                  status: nextStatus,
                  resolutionNotes: nextStatus === 'RESOLVED' ? formData.resolutionNotes : '',
                  rejectionReason: nextStatus === 'REJECTED' ? formData.rejectionReason : '',
                  assignedTechnicianId: nextStatus === 'IN_PROGRESS' ? formData.assignedTechnicianId : ''
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select status</option>
              {validStatuses.map(status => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
            {validStatuses.length === 0 && (
              <p className="mt-1 text-xs text-red-500">
                No valid status transitions available from {ticket.status}
              </p>
            )}
          </div>

          {/* Assign Technician */}
          {formData.status === 'IN_PROGRESS' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign Technician
              </label>
              <select
                value={formData.assignedTechnicianId}
                onChange={(e) => setFormData({ ...formData, assignedTechnicianId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select technician</option>
                {technicians.map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.name} (#{technician.id})
                  </option>
                ))}
              </select>
              {loadingTechnicians && (
                <p className="mt-1 text-xs text-gray-500">Loading technicians...</p>
              )}
              {!loadingTechnicians && technicians.length === 0 && (
                <p className="mt-1 text-xs text-red-500">No technicians available</p>
              )}
            </div>
          )}

          {/* Resolution Notes */}
          {formData.status === 'RESOLVED' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resolution Notes
              </label>
              <textarea
                value={formData.resolutionNotes}
                onChange={(e) => setFormData({ ...formData, resolutionNotes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Describe how the issue was resolved..."
                required
              />
            </div>
          )}

          {/* Rejection Reason */}
          {formData.status === 'REJECTED' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.rejectionReason}
                onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Explain why this ticket is being rejected..."
                required
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Updating...' : 'Update Status'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusUpdateModal;
