import FormField from './FormField';

export default function CreateBookingModal({ form, setForm, onClose, onSubmit }) {
  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0 bg-black/35 backdrop-blur-[3px]"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-[760px] card animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-[10px] font-bold tracking-[0.15em] text-ui-dim uppercase font-mono mb-2">
              New Booking
            </div>
            <h2 className="text-[24px] font-extrabold tracking-[-0.03em]">
              Create a Booking Request
            </h2>
            <p className="text-[14px] text-ui-muted mt-2 leading-[1.6]">
              Fill in the booking details to request a campus resource.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-ui-muted hover:text-ui-bright transition-colors text-[20px] leading-none"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
          <FormField label="Resource" required>
            <select
              className="w-full bg-ui-base border border-ui-sky/20 rounded-[10px] px-[14px] py-[11px] text-ui-bright text-[14px] focus:outline-none focus:border-ui-sky transition-colors"
              value={form.resource}
              onChange={(e) => handleChange('resource', e.target.value)}
            >
              <option value="">Select a resource</option>
              <option value="Lecture Hall A401">Lecture Hall A401</option>
              <option value="Computer Lab B203">Computer Lab B203</option>
              <option value="Meeting Room C102">Meeting Room C102</option>
              <option value="Innovation Lab D110">Innovation Lab D110</option>
              <option value="Mini Auditorium">Mini Auditorium</option>
            </select>
          </FormField>

          <FormField label="Booking Date" required>
            <input
              type="date"
              className="w-full bg-ui-base border border-ui-sky/20 rounded-[10px] px-[14px] py-[11px] text-ui-bright text-[14px] focus:outline-none focus:border-ui-sky transition-colors"
              value={form.date}
              onChange={(e) => handleChange('date', e.target.value)}
            />
          </FormField>

          <FormField label="Start Time" required>
            <input
              type="time"
              className="w-full bg-ui-base border border-ui-sky/20 rounded-[10px] px-[14px] py-[11px] text-ui-bright text-[14px] focus:outline-none focus:border-ui-sky transition-colors"
              value={form.startTime}
              onChange={(e) => handleChange('startTime', e.target.value)}
            />
          </FormField>

          <FormField label="End Time" required>
            <input
              type="time"
              className="w-full bg-ui-base border border-ui-sky/20 rounded-[10px] px-[14px] py-[11px] text-ui-bright text-[14px] focus:outline-none focus:border-ui-sky transition-colors"
              value={form.endTime}
              onChange={(e) => handleChange('endTime', e.target.value)}
            />
          </FormField>

          <FormField label="Expected Attendees">
            <input
              type="number"
              min="0"
              className="w-full bg-ui-base border border-ui-sky/20 rounded-[10px] px-[14px] py-[11px] text-ui-bright text-[14px] focus:outline-none focus:border-ui-sky transition-colors"
              value={form.attendees}
              onChange={(e) => handleChange('attendees', e.target.value)}
              placeholder="Enter attendee count"
            />
          </FormField>

          <div className="hidden md:block" />

          <FormField label="Purpose" required className="md:col-span-2">
            <textarea
              className="w-full bg-ui-base border border-ui-sky/20 rounded-[10px] px-[14px] py-[11px] text-ui-bright resize-y min-h-[110px] focus:outline-none focus:border-ui-sky transition-colors"
              value={form.purpose}
              onChange={(e) => handleChange('purpose', e.target.value)}
              placeholder="Briefly describe why you need this booking"
            />
          </FormField>
        </div>

        <div className="mt-6 bg-ui-sky/4 border border-ui-sky/15 rounded-[14px] px-5 py-4">
          <div className="text-[12px] font-bold text-ui-sky mb-1">
            Booking Note
          </div>
          <div className="text-[13px] text-ui-muted leading-[1.6]">
            Your request will be reviewed based on resource availability,
            booking conflicts, and admin approval rules.
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-[16px] py-[10px] rounded-[10px] border border-ui-sky/20 bg-ui-base text-ui-muted text-[13px] font-semibold transition-all duration-200 hover:bg-ui-sky/8 hover:text-ui-sky"
          >
            Cancel
          </button>

          <button
            onClick={onSubmit}
            className="btn-primary"
          >
            + Submit Booking
          </button>
        </div>
      </div>
    </div>
  );
}