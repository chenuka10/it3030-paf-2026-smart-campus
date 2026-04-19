import { useState, useEffect } from 'react';

export default function RejectBookingModal({
  isOpen,
  onClose,
  onConfirm,
  bookingId,
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      setSubmitting(true);
      await onConfirm(bookingId, reason.trim());
      onClose();
    } catch (err) {
      setError('Failed to reject booking');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      
      {/* Modal */}
      <div className="w-full max-w-md card animate-fade-in-up">
        
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-[20px] font-semibold text-ui-surface">
            Reject Booking
          </h2>
          <p className="text-[13px] text-ui-muted mt-1">
            Please provide a reason for rejecting this booking.
          </p>
        </div>

        {/* Textarea */}
        <div className="mb-4">
          <textarea
            rows={4}
            placeholder="Enter rejection reason..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError('');
            }}
            className={`w-full px-4 py-3 rounded-[12px] border text-[14px] bg-ui-base text-ui-bright focus:outline-none ${
              error ? 'border-ui-danger' : 'border-ui-sky/20'
            }`}
            disabled={submitting}
          />
          {error && (
            <p className="text-[12px] text-ui-danger mt-1">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          
          {/* Cancel */}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[10px] text-[14px] text-ui-muted hover:bg-ui-sky/10 transition"
            disabled={submitting}
          >
            Cancel
          </button>

          {/* Reject */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 rounded-[10px] text-white font-semibold bg-ui-danger hover:opacity-90 transition"
          >
            {submitting ? 'Rejecting...' : 'Reject Booking'}
          </button>

        </div>
      </div>
    </div>
  );
}