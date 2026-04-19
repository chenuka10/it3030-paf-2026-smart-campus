import { useEffect, useMemo, useState } from 'react';
import { getAllResources, getResourceAvailability, updateBooking } from '../../api/bookingApi';

const fmtTime = (timeString) => {
  if (!timeString) return '';

  const value = String(timeString).slice(0, 5);
  const [hourText, minute] = value.split(':');
  const hour = Number(hourText);

  if (Number.isNaN(hour)) return value;

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const twelveHour = hour % 12 || 12;

  return `${twelveHour}:${minute} ${suffix}`;
};

const normalizeTimeForInput = (timeValue) => {
  if (!timeValue) return '';
  return String(timeValue).slice(0, 5);
};

const getToday = () => {
  return new Date().toISOString().slice(0, 10);
};

export default function EditBookingModal({ booking, onClose, onSuccess }) {
  const [resources, setResources] = useState([]);
  const [availability, setAvailability] = useState([]);

  const [form, setForm] = useState({
    resourceId: booking?.resourceId ?? '',
    bookingDate: booking?.bookingDate ?? '',
    startTime: normalizeTimeForInput(booking?.startTime),
    endTime: normalizeTimeForInput(booking?.endTime),
    purpose: booking?.purpose ?? '',
    attendeesCount: booking?.attendeesCount ?? 1,
  });

  const [loadingResources, setLoadingResources] = useState(true);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadResources = async () => {
      try {
        setLoadingResources(true);
        const data = await getAllResources();
        setResources(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load resources:', err);
        setError('Failed to load resources.');
      } finally {
        setLoadingResources(false);
      }
    };

    loadResources();
  }, []);

  useEffect(() => {
    const loadAvailability = async () => {
      if (!form.resourceId || !form.bookingDate) {
        setAvailability([]);
        return;
      }

      try {
        setLoadingAvailability(true);
        const data = await getResourceAvailability(form.resourceId, form.bookingDate);
        setAvailability(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load availability:', err);
      } finally {
        setLoadingAvailability(false);
      }
    };

    loadAvailability();
  }, [form.resourceId, form.bookingDate]);

  const selectedResource = useMemo(() => {
    return resources.find((r) => String(r.id) === String(form.resourceId));
  }, [resources, form.resourceId]);

  const attendeesLabel = selectedResource?.type === 'EQUIPMENT' ? 'Quantity / Units' : 'Attendees';

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validate = () => {
    if (!form.resourceId) return 'Please select a resource.';
    if (!form.bookingDate) return 'Please select a booking date.';
    if (!form.startTime) return 'Please select a start time.';
    if (!form.endTime) return 'Please select an end time.';
    if (!form.purpose.trim()) return 'Please enter a purpose.';
    if (!form.attendeesCount || Number(form.attendeesCount) <= 0) {
      return 'Attendees count must be greater than 0.';
    }
    if (form.startTime >= form.endTime) {
      return 'Start time must be before end time.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        resourceId: Number(form.resourceId),
        bookingDate: form.bookingDate,
        startTime: form.startTime,
        endTime: form.endTime,
        purpose: form.purpose.trim(),
        attendeesCount: Number(form.attendeesCount),
      };

      await updateBooking(booking.id, payload);
      onSuccess?.();
    } catch (err) {
      console.error('Failed to update booking:', err);

      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to update booking.';

      setError(String(backendMessage));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-[760px] max-h-[90vh] overflow-y-auto rounded-[24px] bg-white border border-ui-sky/10 shadow-2xl">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-ui-sky/10 px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold tracking-[0.15em] text-ui-dim uppercase font-mono mb-2">
              Edit Booking
            </div>
            <h2 className="text-[28px] font-extrabold tracking-[-0.03em] text-ui-bright">
              Update booking details
            </h2>
            <p className="text-[14px] text-ui-muted mt-2">
              Modify the pending booking and save the updated details.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-ui-sky/15 bg-ui-base hover:bg-ui-sky/8 text-ui-muted hover:text-ui-sky transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6">
          {error && (
            <div className="mb-5 rounded-[12px] border border-ui-danger/20 bg-ui-danger/8 px-4 py-3 text-[14px] text-ui-danger">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Resource">
              <select
                value={form.resourceId}
                onChange={(e) => handleChange('resourceId', e.target.value)}
                className="input-base"
                disabled={loadingResources || saving}
              >
                <option value="">Select resource</option>
                {resources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name} {resource.location ? `• ${resource.location}` : ''}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Booking Date">
              <input
                type="date"
                min={getToday()}
                value={form.bookingDate}
                onChange={(e) => handleChange('bookingDate', e.target.value)}
                className="input-base"
                disabled={saving}
              />
            </Field>

            <Field label="Start Time">
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                className="input-base"
                disabled={saving}
              />
            </Field>

            <Field label="End Time">
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                className="input-base"
                disabled={saving}
              />
            </Field>

            <Field label={attendeesLabel}>
              <input
                type="number"
                min="1"
                value={form.attendeesCount}
                onChange={(e) => handleChange('attendeesCount', e.target.value)}
                className="input-base"
                disabled={saving}
              />
            </Field>

            <div className="rounded-[16px] border border-ui-sky/10 bg-ui-sky/5 px-4 py-4">
              <div className="text-[10px] font-bold tracking-[0.14em] text-ui-dim uppercase font-mono mb-2">
                Selected Resource
              </div>
              <div className="text-[15px] font-semibold text-ui-bright">
                {selectedResource?.name || 'No resource selected'}
              </div>
              <div className="text-[13px] text-ui-muted mt-1">
                {selectedResource?.location || 'Location unavailable'}
              </div>
              <div className="text-[13px] text-ui-muted mt-1">
                Capacity: {selectedResource?.capacity ?? '—'}
              </div>
            </div>

            <div className="md:col-span-2">
              <Field label="Purpose">
                <textarea
                  rows="4"
                  value={form.purpose}
                  onChange={(e) => handleChange('purpose', e.target.value)}
                  className="input-base min-h-[120px] resize-y"
                  placeholder="Describe why this booking is needed"
                  disabled={saving}
                />
              </Field>
            </div>
          </div>

          <div className="mt-6 rounded-[16px] border border-ui-sky/10 bg-ui-base px-5 py-5">
            <div className="text-[10px] font-bold tracking-[0.14em] text-ui-dim uppercase font-mono mb-2">
              Availability Snapshot
            </div>

            {loadingAvailability ? (
              <div className="text-[14px] text-ui-muted">Loading availability...</div>
            ) : availability.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {availability.map((slot, index) => (
                  <span
                    key={index}
                    className="text-[12px] font-semibold px-[10px] py-[6px] rounded-[8px] border border-ui-sky/15 bg-ui-sky/6 text-ui-sky"
                  >
                    {fmtTime(slot.startTime)} - {fmtTime(slot.endTime)}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-[14px] text-ui-muted">
                No availability data to show for this date/resource.
              </div>
            )}
          </div>

          <div className="mt-7 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-[16px] py-[11px] rounded-[10px] border border-ui-sky/15 bg-ui-base text-ui-muted text-[14px] font-semibold hover:bg-ui-sky/8 hover:text-ui-sky transition-all"
              disabled={saving}
            >
              Close
            </button>

            <button
              type="submit"
              className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? 'Saving Changes...' : 'Save Booking Changes'}
            </button>
          </div>
        </form>

        <style>{`
          .input-base {
            width: 100%;
            border: 1px solid rgba(37, 99, 235, 0.12);
            background: rgba(255,255,255,0.96);
            border-radius: 14px;
            padding: 12px 14px;
            font-size: 14px;
            color: var(--color-ui-bright);
            outline: none;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
          }

          .input-base:focus {
            border-color: rgba(37, 99, 235, 0.32);
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
          }
        `}</style>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-[11px] font-bold tracking-[0.12em] text-ui-dim uppercase font-mono mb-2">
        {label}
      </div>
      {children}
    </label>
  );
}