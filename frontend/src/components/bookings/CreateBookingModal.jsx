import { useEffect, useMemo, useState } from 'react';
import FormField from '../FormField';
import {
  createBooking,
  getAllResources,
  getResourceAvailability,
} from '../../api/bookingApi';

export default function CreateBookingModal({ onClose, onSuccess }) {
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [availability, setAvailability] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');

  const [form, setForm] = useState({
    resourceType: '',
    resourceId: '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    attendeesCount: '',
    purpose: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoadingResources(true);
        const data = await getAllResources();

        const activeResources = (data || []).filter(
          (resource) => resource.status === 'ACTIVE'
        );

        setResources(activeResources);
      } catch (err) {
        console.error('Failed to fetch resources:', err);
        setFormError('Failed to load resources.');
      } finally {
        setLoadingResources(false);
      }
    };

    fetchResources();
  }, []);

  const resourceTypes = useMemo(() => {
    const types = [
      ...new Set(resources.map((resource) => resource.type).filter(Boolean)),
    ];
    return types.sort((a, b) => a.localeCompare(b));
  }, [resources]);

  const filteredResources = useMemo(() => {
    if (!form.resourceType) return [];
    return resources.filter((resource) => resource.type === form.resourceType);
  }, [resources, form.resourceType]);

  const selectedResource = useMemo(() => {
    return resources.find(
      (resource) => String(resource.id) === String(form.resourceId)
    );
  }, [resources, form.resourceId]);

  const isEquipmentType = useMemo(() => {
    return String(form.resourceType || '').toUpperCase() === 'EQUIPMENT';
  }, [form.resourceType]);

  const today = useMemo(() => new Date(), []);
  const minDate = useMemo(() => today.toISOString().split('T')[0], [today]);

  const maxDate = useMemo(() => {
    const maxDateObj = new Date();
    maxDateObj.setMonth(maxDateObj.getMonth() + 2);
    return maxDateObj.toISOString().split('T')[0];
  }, []);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!form.resourceId || !form.bookingDate) {
        setAvailability([]);
        setAvailabilityError('');
        return;
      }

      try {
        setLoadingAvailability(true);
        setAvailabilityError('');

        const data = await getResourceAvailability(
          form.resourceId,
          form.bookingDate
        );

        setAvailability(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch availability:', err);
        setAvailability([]);
        setAvailabilityError('Failed to load booked time slots.');
      } finally {
        setLoadingAvailability(false);
      }
    };

    fetchAvailability();
  }, [form.resourceId, form.bookingDate]);

  const normalizeTime = (timeValue) => String(timeValue || '').slice(0, 5);

  const timeToMinutes = (timeValue) => {
    const normalized = normalizeTime(timeValue);
    if (!normalized || !normalized.includes(':')) return null;

    const [hourText, minuteText] = normalized.split(':');
    const hour = Number(hourText);
    const minute = Number(minuteText);

    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
    return hour * 60 + minute;
  };

  const minutesToTime = (minutes) => {
    if (minutes == null || Number.isNaN(minutes)) return '—';
    const safeMinutes = Math.max(0, minutes);
    const hour = Math.floor(safeMinutes / 60);
    const minute = safeMinutes % 60;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  const formatDisplayTime = (timeValue) => {
    const normalized = normalizeTime(timeValue);
    if (!normalized) return '—';

    const [hourText, minute] = normalized.split(':');
    const hour = Number(hourText);
    if (Number.isNaN(hour)) return normalized;

    const suffix = hour >= 12 ? 'PM' : 'AM';
    const twelveHour = hour % 12 || 12;
    return `${twelveHour}:${minute} ${suffix}`;
  };

  const bookedSlots = useMemo(() => {
    return availability
      .map((item) => ({
        id: item.id,
        startTime: normalizeTime(item.startTime),
        endTime: normalizeTime(item.endTime),
        startMinutes: timeToMinutes(item.startTime),
        endMinutes: timeToMinutes(item.endTime),
        status: item.status,
      }))
      .filter(
        (slot) =>
          slot.startMinutes != null &&
          slot.endMinutes != null &&
          slot.startMinutes < slot.endMinutes
      )
      .sort((a, b) => a.startMinutes - b.startMinutes);
  }, [availability]);

  const selectedStartMinutes = useMemo(
    () => timeToMinutes(form.startTime),
    [form.startTime]
  );

  const selectedEndMinutes = useMemo(
    () => timeToMinutes(form.endTime),
    [form.endTime]
  );

  const selectedDurationMinutes = useMemo(() => {
    if (selectedStartMinutes == null || selectedEndMinutes == null) return 0;
    return selectedEndMinutes - selectedStartMinutes;
  }, [selectedStartMinutes, selectedEndMinutes]);

  const maxBookingHours = selectedResource?.maxBookingHours ?? null;
  const maxBookingMinutes =
    maxBookingHours != null ? Number(maxBookingHours) * 60 : null;

  const timeConflict = useMemo(() => {
    if (selectedStartMinutes == null || selectedEndMinutes == null) return null;
    if (selectedStartMinutes >= selectedEndMinutes) return null;

    return (
      bookedSlots.find(
        (slot) =>
          selectedStartMinutes < slot.endMinutes &&
          selectedEndMinutes > slot.startMinutes
      ) || null
    );
  }, [bookedSlots, selectedStartMinutes, selectedEndMinutes]);

  const nextBookingAfterStart = useMemo(() => {
    if (selectedStartMinutes == null) return null;
    return (
      bookedSlots.find((slot) => slot.startMinutes > selectedStartMinutes) || null
    );
  }, [bookedSlots, selectedStartMinutes]);

  const latestValidEndBeforeNextBooking = useMemo(() => {
    if (!nextBookingAfterStart) return null;
    return nextBookingAfterStart.startMinutes;
  }, [nextBookingAfterStart]);

  const exceedsMaxDuration = useMemo(() => {
    if (maxBookingMinutes == null) return false;
    if (selectedDurationMinutes <= 0) return false;
    return selectedDurationMinutes > maxBookingMinutes;
  }, [maxBookingMinutes, selectedDurationMinutes]);

  const maxDurationMessage = useMemo(() => {
    if (!exceedsMaxDuration || maxBookingHours == null) return '';
    return `This resource can only be booked for up to ${maxBookingHours} hour(s).`;
  }, [exceedsMaxDuration, maxBookingHours]);

  const conflictMessage = useMemo(() => {
    if (!timeConflict) return '';
    return `This time slot conflicts with an existing booking from ${formatDisplayTime(
      timeConflict.startTime
    )} to ${formatDisplayTime(timeConflict.endTime)}.`;
  }, [timeConflict]);

  const latestValidEndMessage = useMemo(() => {
    if (!timeConflict && latestValidEndBeforeNextBooking == null) return '';

    if (timeConflict) {
      return `Latest valid end time before the next booking is ${formatDisplayTime(
        minutesToTime(timeConflict.startMinutes)
      )}.`;
    }

    if (
      latestValidEndBeforeNextBooking != null &&
      selectedStartMinutes != null &&
      latestValidEndBeforeNextBooking > selectedStartMinutes
    ) {
      return `Latest available end time before the next booking is ${formatDisplayTime(
        minutesToTime(latestValidEndBeforeNextBooking)
      )}.`;
    }

    return '';
  }, [timeConflict, latestValidEndBeforeNextBooking, selectedStartMinutes]);

  const selectedDateHasPastTimeIssue = useMemo(() => {
    if (!form.bookingDate || selectedStartMinutes == null) return false;

    const now = new Date();
    const selectedDate = new Date(`${form.bookingDate}T00:00:00`);
    const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (selectedDate.getTime() !== todayOnly.getTime()) return false;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return selectedStartMinutes < currentMinutes;
  }, [form.bookingDate, selectedStartMinutes]);

  const validate = () => {
    const nextErrors = {};

    if (!form.resourceType) nextErrors.resourceType = 'Resource type is required';
    if (!form.resourceId) nextErrors.resourceId = 'Resource is required';
    if (!form.bookingDate) nextErrors.bookingDate = 'Booking date is required';
    if (!form.startTime) nextErrors.startTime = 'Start time is required';
    if (!form.endTime) nextErrors.endTime = 'End time is required';
    if (!form.purpose.trim()) nextErrors.purpose = 'Purpose is required';

    if (!isEquipmentType) {
      if (!form.attendeesCount) {
        nextErrors.attendeesCount = 'Attendee count is required';
      } else if (Number(form.attendeesCount) < 1) {
        nextErrors.attendeesCount = 'Attendee count must be at least 1';
      }

      if (
        selectedResource?.capacity != null &&
        Number(form.attendeesCount) > Number(selectedResource.capacity)
      ) {
        nextErrors.attendeesCount = 'Attendee count exceeds resource capacity';
      }
    }

    const selectedDate = form.bookingDate
      ? new Date(`${form.bookingDate}T00:00:00`)
      : null;

    const todayOnly = new Date();
    todayOnly.setHours(0, 0, 0, 0);

    const maxAllowedDate = new Date();
    maxAllowedDate.setMonth(maxAllowedDate.getMonth() + 2);
    maxAllowedDate.setHours(0, 0, 0, 0);

    if (selectedDate) {
      if (selectedDate < todayOnly) {
        nextErrors.bookingDate = 'Past dates are not allowed';
      }
      if (selectedDate > maxAllowedDate) {
        nextErrors.bookingDate =
          'Bookings can only be made up to 2 months ahead';
      }
    }

    if (
      selectedStartMinutes != null &&
      selectedEndMinutes != null &&
      selectedStartMinutes >= selectedEndMinutes
    ) {
      nextErrors.endTime = 'End time must be later than start time';
    }

    if (selectedDateHasPastTimeIssue) {
      nextErrors.startTime = 'Past time slots are not allowed for today';
    }

    if (timeConflict) {
      nextErrors.endTime = 'Selected time range overlaps with an existing booking';
    }

    if (exceedsMaxDuration) {
      nextErrors.endTime =
        'Selected duration exceeds the maximum allowed booking time for this resource';
    }

    return nextErrors;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: '',
    }));

    setFormError('');
  };

  const handleTypeChange = (value) => {
    const nextIsEquipment = String(value || '').toUpperCase() === 'EQUIPMENT';

    setForm((prev) => ({
      ...prev,
      resourceType: value,
      resourceId: '',
      bookingDate: '',
      startTime: '',
      endTime: '',
      attendeesCount: nextIsEquipment ? '0' : '',
    }));

    setAvailability([]);
    setAvailabilityError('');

    setErrors((prev) => ({
      ...prev,
      resourceType: '',
      resourceId: '',
      bookingDate: '',
      startTime: '',
      endTime: '',
      attendeesCount: '',
    }));

    setFormError('');
  };

  const handleResourceChange = (value) => {
    setForm((prev) => ({
      ...prev,
      resourceId: value,
      bookingDate: '',
      startTime: '',
      endTime: '',
      attendeesCount: isEquipmentType ? '0' : prev.attendeesCount,
    }));

    setAvailability([]);
    setAvailabilityError('');

    setErrors((prev) => ({
      ...prev,
      resourceId: '',
      bookingDate: '',
      startTime: '',
      endTime: '',
      attendeesCount: '',
    }));

    setFormError('');
  };

  const toBackendTime = (timeValue) => {
    if (!timeValue) return '';
    return timeValue.length === 5 ? `${timeValue}:00` : timeValue;
  };

  const canSubmit = useMemo(() => {
    return !submitting && !loadingResources && !timeConflict && !exceedsMaxDuration;
  }, [submitting, loadingResources, timeConflict, exceedsMaxDuration]);

  const handleSubmit = async () => {
    const validationErrors = validate();

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      const payload = {
        resourceId: Number(form.resourceId),
        bookingDate: form.bookingDate,
        startTime: toBackendTime(form.startTime),
        endTime: toBackendTime(form.endTime),
        purpose: form.purpose.trim(),
        attendeesCount: isEquipmentType ? 0 : Number(form.attendeesCount),
      };

      await createBooking(payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to create booking:', err);

      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to create booking.';

      setFormError(String(backendMessage));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0 bg-black/35 backdrop-blur-[3px]"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-[820px] card animate-fade-in-up max-h-[90vh] overflow-y-auto custom-scroll">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-[10px] font-bold tracking-[0.15em] text-ui-dim uppercase font-mono mb-2">
              New Booking
            </div>
            <h2 className="text-[24px] font-extrabold tracking-[-0.03em]">
              Create a Booking Request
            </h2>
            <p className="text-[14px] text-ui-muted mt-2 leading-[1.6]">
              Select a resource type first, then choose the exact resource, date,
              and an available time slot.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-ui-muted hover:text-ui-bright transition-colors text-[20px] leading-none"
          >
            ✕
          </button>
        </div>

        {formError && (
          <div className="mb-5 rounded-[12px] border border-ui-danger/20 bg-ui-danger/8 px-4 py-3 text-[14px] text-ui-danger">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
          <FormField label="Resource Type" required error={errors.resourceType}>
            <div className="relative">
              <select
                className={`w-full appearance-none bg-ui-base border rounded-[10px] px-[14px] py-[11px] pr-12 text-ui-bright text-[14px] focus:outline-none focus:border-ui-sky transition-colors ${
                  errors.resourceType ? 'border-ui-danger' : 'border-ui-sky/20'
                }`}
                value={form.resourceType}
                onChange={(e) => handleTypeChange(e.target.value)}
                disabled={loadingResources || submitting}
              >
                <option value="">
                  {loadingResources ? 'Loading resource types...' : 'Select resource type'}
                </option>

                {resourceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-ui-dim">
                ▾
              </span>
            </div>
          </FormField>

          <FormField label="Specific Resource" required error={errors.resourceId}>
            <div className="relative">
              <select
                className={`w-full appearance-none bg-ui-base border rounded-[10px] px-[14px] py-[11px] pr-12 text-ui-bright text-[14px] focus:outline-none focus:border-ui-sky transition-colors ${
                  errors.resourceId ? 'border-ui-danger' : 'border-ui-sky/20'
                }`}
                value={form.resourceId}
                onChange={(e) => handleResourceChange(e.target.value)}
                disabled={!form.resourceType || submitting || loadingResources}
              >
                <option value="">
                  {!form.resourceType
                    ? 'Select resource type first'
                    : filteredResources.length
                    ? 'Select a resource'
                    : 'No resources available'}
                </option>

                {filteredResources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name} • {resource.location}
                  </option>
                ))}
              </select>

              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-ui-dim">
                ▾
              </span>
            </div>
          </FormField>
        </div>

        {selectedResource && (
          <div className="mt-6 bg-ui-sky/4 border border-ui-sky/15 rounded-[14px] px-5 py-4">
            <div className="text-[12px] font-bold text-ui-sky mb-4">
              Selected Resource Details
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MiniInfo label="Name" value={selectedResource.name} />
              <MiniInfo label="Type" value={selectedResource.type} />
              <MiniInfo label="Location" value={selectedResource.location} />
              <MiniInfo
                label="Capacity"
                value={
                  selectedResource.capacity != null
                    ? String(selectedResource.capacity)
                    : '—'
                }
              />
              <MiniInfo
                label="Max Booking Hours"
                value={
                  selectedResource.maxBookingHours != null
                    ? String(selectedResource.maxBookingHours)
                    : '—'
                }
              />
              <MiniInfo
                label="Availability Window"
                value={`${selectedResource.availableFrom || '—'} - ${
                  selectedResource.availableTo || '—'
                }`}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] mt-6">
          <FormField label="Booking Date" required error={errors.bookingDate}>
            <input
              type="date"
              min={minDate}
              max={maxDate}
              className={`w-full bg-ui-base border rounded-[10px] px-[14px] py-[11px] text-ui-bright text-[14px] focus:outline-none focus:border-ui-sky transition-colors ${
                errors.bookingDate ? 'border-ui-danger' : 'border-ui-sky/20'
              }`}
              value={form.bookingDate}
              onChange={(e) => handleChange('bookingDate', e.target.value)}
              disabled={submitting || !form.resourceId}
            />
          </FormField>

          <div className="rounded-[12px] border border-ui-sky/15 bg-ui-sky/4 px-4 py-3">
            <div className="text-[10px] text-ui-dim tracking-[0.08em] font-mono uppercase mb-1.5">
              Booking Window
            </div>
            <div className="text-[14px] font-semibold text-ui-bright">
              {minDate} to {maxDate}
            </div>
            <div className="text-[12px] text-ui-muted mt-1">
              Past dates and dates beyond 2 months are blocked.
            </div>
          </div>
        </div>

        {(form.resourceId || form.bookingDate) && (
          <div className="mt-6 rounded-[14px] border border-ui-sky/15 bg-ui-sky/4 px-5 py-4">
            <div className="text-[12px] font-bold text-ui-sky mb-2">
              Availability for Selected Day
            </div>

            {loadingAvailability ? (
              <div className="text-[13px] text-ui-muted">
                Loading booked time slots...
              </div>
            ) : availabilityError ? (
              <div className="text-[13px] text-ui-danger">
                {availabilityError}
              </div>
            ) : bookedSlots.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {bookedSlots.map((slot) => (
                  <span
                    key={slot.id || `${slot.startTime}-${slot.endTime}`}
                    className="text-[11px] font-semibold rounded-[8px] px-[10px] py-[6px] border bg-ui-danger/8 text-ui-danger border-ui-danger/15"
                  >
                    Booked: {formatDisplayTime(slot.startTime)} -{' '}
                    {formatDisplayTime(slot.endTime)}
                  </span>
                ))}
              </div>
            ) : form.resourceId && form.bookingDate ? (
              <div className="text-[13px] text-ui-green">
                No existing bookings found for this resource on the selected date.
              </div>
            ) : (
              <div className="text-[13px] text-ui-muted">
                Select a resource and date to view booked slots.
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] mt-6">
          <FormField label="Start Time" required error={errors.startTime}>
            <input
              type="time"
              className={`w-full bg-ui-base border rounded-[10px] px-[14px] py-[11px] text-ui-bright text-[14px] focus:outline-none focus:border-ui-sky transition-colors ${
                errors.startTime ? 'border-ui-danger' : 'border-ui-sky/20'
              }`}
              value={form.startTime}
              onChange={(e) => handleChange('startTime', e.target.value)}
              disabled={submitting || !form.bookingDate}
            />
          </FormField>

          <FormField label="End Time" required error={errors.endTime}>
            <input
              type="time"
              className={`w-full bg-ui-base border rounded-[10px] px-[14px] py-[11px] text-ui-bright text-[14px] focus:outline-none focus:border-ui-sky transition-colors ${
                errors.endTime ? 'border-ui-danger' : 'border-ui-sky/20'
              }`}
              value={form.endTime}
              onChange={(e) => handleChange('endTime', e.target.value)}
              disabled={submitting || !form.bookingDate}
            />
          </FormField>
        </div>

        {(form.startTime || form.endTime) && (
          <div className="mt-4 space-y-3">
            {selectedDateHasPastTimeIssue && (
              <InlineNotice type="error">
                Past time slots are not allowed for today.
              </InlineNotice>
            )}

            {timeConflict && (
              <InlineNotice type="error">
                {conflictMessage}
              </InlineNotice>
            )}

            {latestValidEndMessage && (
              <InlineNotice type="warn">
                {latestValidEndMessage}
              </InlineNotice>
            )}

            {exceedsMaxDuration && (
              <InlineNotice type="error">
                {maxDurationMessage}
              </InlineNotice>
            )}

            {!selectedDateHasPastTimeIssue &&
              !timeConflict &&
              !exceedsMaxDuration &&
              selectedStartMinutes != null &&
              selectedEndMinutes != null &&
              selectedStartMinutes < selectedEndMinutes && (
                <InlineNotice type="success">
                  Selected time range looks available.
                </InlineNotice>
              )}
          </div>
        )}

        <div className="mt-6">
          {!isEquipmentType && (
            <FormField label="Attendee Count" required error={errors.attendeesCount}>
              <input
                type="number"
                min="1"
                className={`w-full bg-ui-base border rounded-[10px] px-[14px] py-[11px] text-ui-bright text-[14px] focus:outline-none focus:border-ui-sky transition-colors ${
                  errors.attendeesCount ? 'border-ui-danger' : 'border-ui-sky/20'
                }`}
                value={form.attendeesCount}
                onChange={(e) => handleChange('attendeesCount', e.target.value)}
                placeholder="Enter number of attendees"
                disabled={submitting}
              />
            </FormField>
          )}

          {isEquipmentType && (
            <div className="mb-4 rounded-[12px] border border-ui-sky/15 bg-ui-sky/4 px-4 py-3 text-[13px] text-ui-muted">
              This is an equipment booking, so attendee count is automatically set to 0.
            </div>
          )}

          <FormField
            label="Purpose"
            required
            error={errors.purpose}
          >
            <textarea
              className={`w-full bg-ui-base border rounded-[10px] px-[14px] py-[11px] text-ui-bright resize-y min-h-[110px] focus:outline-none focus:border-ui-sky transition-colors ${
                errors.purpose ? 'border-ui-danger' : 'border-ui-sky/20'
              }`}
              value={form.purpose}
              onChange={(e) => handleChange('purpose', e.target.value)}
              placeholder="Briefly describe why you need this booking"
              disabled={submitting}
            />
          </FormField>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-[16px] py-[10px] rounded-[10px] border border-ui-sky/20 bg-ui-base text-ui-muted text-[13px] font-semibold transition-all duration-200 hover:bg-ui-sky/8 hover:text-ui-sky disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="btn-primary disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : '+ Submit Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="bg-ui-base border border-ui-sky/10 rounded-[12px] px-4 py-3">
      <div className="text-[10px] text-ui-dim tracking-[0.08em] font-mono uppercase mb-1.5">
        {label}
      </div>
      <div className="text-[14px] font-semibold text-ui-bright">
        {value}
      </div>
    </div>
  );
}

function InlineNotice({ type, children }) {
  const styles =
    type === 'error'
      ? 'bg-ui-danger/8 border-ui-danger/20 text-ui-danger'
      : type === 'warn'
      ? 'bg-ui-warn/8 border-ui-warn/20 text-ui-warn'
      : 'bg-ui-green/8 border-ui-green/20 text-ui-green';

  return (
    <div className={`rounded-[12px] border px-4 py-3 text-[13px] font-medium ${styles}`}>
      {children}
    </div>
  );
}