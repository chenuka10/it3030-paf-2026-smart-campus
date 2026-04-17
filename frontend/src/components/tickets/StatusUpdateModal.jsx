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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4">
      <div className="w-full max-w-lg overflow-hidden rounded-[24px] border border-ui-sky/14 bg-ui-base/95 shadow-[0_28px_70px_rgba(15,23,42,0.30)] backdrop-blur-sm">
        <div className="border-b border-ui-sky/10 bg-[linear-gradient(135deg,rgba(111,143,114,0.08),rgba(232,226,216,0.85))] px-6 py-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-ui-dim font-mono">
            Workflow Action
          </div>
          <h2 className="mt-2 text-[24px] font-extrabold tracking-[-0.03em] text-ui-surface">Update Ticket Status</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
          {/* Status */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-ui-bright">
              New Status <span className="text-ui-danger">*</span>
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
              className="w-full rounded-xl border border-ui-sky/14 bg-ui-base px-4 py-3 text-sm text-ui-bright outline-none transition focus:border-ui-sky/35"
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
              <p className="mt-2 text-xs font-medium text-ui-danger">
                No valid status transitions available from {ticket.status}
              </p>
            )}
          </div>

          {/* Assign Technician */}
          {formData.status === 'IN_PROGRESS' && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-ui-bright">
                Assign Technician
              </label>
              <select
                value={formData.assignedTechnicianId}
                onChange={(e) => setFormData({ ...formData, assignedTechnicianId: e.target.value })}
                className="w-full rounded-xl border border-ui-sky/14 bg-ui-base px-4 py-3 text-sm text-ui-bright outline-none transition focus:border-ui-sky/35"
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
                <p className="mt-2 text-xs text-ui-dim">Loading technicians...</p>
              )}
              {!loadingTechnicians && technicians.length === 0 && (
                <p className="mt-2 text-xs font-medium text-ui-danger">No technicians available</p>
              )}
            </div>
          )}

          {/* Resolution Notes */}
          {formData.status === 'RESOLVED' && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-ui-bright">
                Resolution Notes
              </label>
              <textarea
                value={formData.resolutionNotes}
                onChange={(e) => setFormData({ ...formData, resolutionNotes: e.target.value })}
                className="w-full rounded-xl border border-ui-sky/14 bg-ui-base px-4 py-3 text-sm text-ui-bright outline-none transition focus:border-ui-sky/35"
                rows="3"
                placeholder="Describe how the issue was resolved..."
                required
              />
            </div>
          )}

          {/* Rejection Reason */}
          {formData.status === 'REJECTED' && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-ui-bright">
                Rejection Reason <span className="text-ui-danger">*</span>
              </label>
              <textarea
                value={formData.rejectionReason}
                onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
                className="w-full rounded-xl border border-ui-sky/14 bg-ui-base px-4 py-3 text-sm text-ui-bright outline-none transition focus:border-ui-sky/35"
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
              className="flex-1 rounded-xl bg-[linear-gradient(135deg,var(--color-ui-sky),var(--color-ui-green))] py-3 text-sm font-bold text-ui-base transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Updating...' : 'Update Status'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-ui-sky/14 px-4 py-3 text-sm font-semibold text-ui-muted transition hover:bg-ui-sky/6 hover:text-ui-bright disabled:cursor-not-allowed disabled:opacity-60"
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
