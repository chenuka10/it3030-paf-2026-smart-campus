import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import Layout from "../../components/Layout";

const RESOURCE_TYPES  = ["LECTURE_ROOM", "LAB", "MEETING_ROOM", "EQUIPMENT", "EVENT_SPACE", "SPORTS"];
const RESOURCE_STATUS = ["ACTIVE", "OUT_OF_SERVICE"];
const RESOURCE_LIST_PATH = "/admin/resources";

export default function EditResourcePage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const { id }    = useParams();

  const [formData, setFormData] = useState({
    name:            "",
    type:            "LECTURE_HALL",
    description:     "",
    location:        "",
    capacity:        "",
    status:          "ACTIVE",
    availableFrom:   "",
    availableTo:     "",
    maxBookingHours: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchResource();
  }, [user, navigate, id]);

  const fetchResource = async () => {
    try {
      const { data } = await api.get(`/api/resources/${id}`);
      setFormData({
        ...data,
        capacity:        data.capacity        || "",
        maxBookingHours: data.maxBookingHours || "",
      });
    } catch {
      setError("Failed to load resource");
      setTimeout(() => navigate(RESOURCE_LIST_PATH, { replace: true }), 2000);
    } finally { setLoading(false); }
  };

  const validateForm = () => {
    // Name validation
    if (!formData.name.trim()) {
      setError("Resource name is required");
      return false;
    }

    // Location validation (optional but validate if provided)
    if (formData.location && formData.location.trim().length > 200) {
      setError("Location cannot exceed 200 characters");
      return false;
    }

    // Capacity validation
    if (formData.capacity !== "") {
      const capacityNum = Number(formData.capacity);
      if (isNaN(capacityNum) || capacityNum < 0 || !Number.isInteger(capacityNum)) {
        setError("Capacity must be a positive whole number");
        return false;
      }
      if (capacityNum > 9999) {
        setError("Capacity cannot exceed 9999");
        return false;
      }
    }

    // Time validation (only if both times are provided)
    if (formData.availableFrom && formData.availableTo) {
      if (formData.availableFrom >= formData.availableTo) {
        setError("Available To time must be after Available From time");
        return false;
      }
    }

    // Max booking hours validation
    if (formData.maxBookingHours !== "") {
      const maxHours = Number(formData.maxBookingHours);
      if (isNaN(maxHours) || maxHours < 1) {
        setError("Max booking hours must be at least 1");
        return false;
      }
      if (maxHours > 72) {
        setError("Max booking hours cannot exceed 72");
        return false;
      }
      if (!Number.isInteger(maxHours)) {
        setError("Max booking hours must be a whole number");
        return false;
      }
    }

    // Description validation (optional but limit length)
    if (formData.description && formData.description.length > 500) {
      setError("Description cannot exceed 500 characters");
      return false;
    }

    // Name length validation
    if (formData.name.length > 100) {
      setError("Resource name cannot exceed 100 characters");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    
    // Validate form before submission
    if (!validateForm()) {
      setSaving(false);
      return;
    }
    
    setSaving(true);
    
    try {
      const payload = {
        ...formData,
        name:            formData.name.trim(),
        description:     formData.description ? formData.description.trim() : "",
        location:        formData.location ? formData.location.trim() : "",
        capacity:        formData.capacity ? Number(formData.capacity) : null,
        maxBookingHours: formData.maxBookingHours ? Number(formData.maxBookingHours) : null,
      };
      await api.put(`/api/resources/${id}`, payload);
      navigate(RESOURCE_LIST_PATH, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update resource");
      setSaving(false);
    }
  };

  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  if (!user) return null;

  const inputClass = "w-full bg-ui-base border border-ui-sky/15 rounded-lg px-3.5 py-2.5 text-ui-bright text-[14px] outline-none transition-all duration-200 box-border focus:border-ui-sky";
  const labelClass = "text-[12px] font-semibold text-ui-muted tracking-[0.05em] font-mono uppercase";

  if (loading) {
    return (
      <Layout adminOnly>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div
            className="w-10 h-10 rounded-full border-[3px] border-ui-sky/15"
            style={{ borderTopColor: 'var(--color-ui-sky)', animation: 'spin 0.8s linear infinite' }}
          />
          <p className="text-ui-muted text-[14px]">Loading resource...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout adminOnly>
      <div
        className="px-9 py-8 max-w-[900px] mx-auto w-full"
        style={{ animation: 'fadeUp 0.4s ease' }}
      >

        {/* Header */}
        <div className="flex justify-between items-end mb-8 flex-wrap gap-4">
          <div>
            <div className="text-[10px] font-bold tracking-[0.15em] text-ui-warn font-mono uppercase mb-2">
              RESOURCE MANAGEMENT
            </div>
            <h1 className="text-[34px] font-extrabold m-0 mb-2 tracking-[-0.04em]">
              Edit Resource
            </h1>
            <p className="text-ui-muted text-[15px] m-0">
              Update resource information
            </p>
          </div>
          <button
            className="bg-ui-sky/8 border border-ui-sky/20 rounded-[10px] text-ui-sky px-5 py-2.5 text-[13px] font-semibold cursor-pointer transition-all duration-200 hover:bg-ui-sky/15 hover:border-ui-sky/40"
            onClick={() => navigate(RESOURCE_LIST_PATH)}
          >
            ← Back to Resources
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-ui-danger/10 border border-ui-danger/30 rounded-xl text-ui-danger px-5 py-3 mb-6 text-[14px]">
            ❌ {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-ui-base/60 border border-ui-sky/12 rounded-2xl p-8 backdrop-blur-md"
        >
          <div className="grid grid-cols-2 gap-5">

            {/* Name */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Name *</label>
              <input
                type="text" required
                value={formData.name} onChange={set('name')}
                placeholder="e.g., Main Lecture Hall A"
                maxLength="100"
                className={inputClass}
              />
              <span className="text-[11px] text-ui-muted">
                {formData.name.length}/100 characters
              </span>
            </div>

            {/* Type */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Type *</label>
              <select value={formData.type} onChange={set('type')} className={inputClass}>
                {RESOURCE_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Description — full width */}
            <div className="flex flex-col gap-2 col-span-2">
              <label className={labelClass}>Description</label>
              <textarea
                rows={4}
                value={formData.description} onChange={set('description')}
                placeholder="Describe the resource... (max 500 characters)"
                maxLength="500"
                className={`${inputClass} resize-y`}
              />
              <span className="text-[11px] text-ui-muted">
                {formData.description.length}/500 characters
              </span>
            </div>

            {/* Location */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Location</label>
              <input
                type="text"
                value={formData.location} onChange={set('location')}
                placeholder="e.g., Building C, Floor 1"
                maxLength="200"
                className={inputClass}
              />
              <span className="text-[11px] text-ui-muted">
                {formData.location.length}/200 characters
              </span>
            </div>

            {/* Capacity */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Capacity</label>
              <input
                type="number"
                value={formData.capacity} onChange={set('capacity')}
                placeholder="e.g., 60"
                min="0"
                max="9999"
                step="1"
                className={inputClass}
              />
              <span className="text-[11px] text-ui-muted">
                Positive whole number (0-9999)
              </span>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Status</label>
              <select value={formData.status} onChange={set('status')} className={inputClass}>
                {RESOURCE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Available From */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Available From</label>
              <input
                type="time"
                value={formData.availableFrom || ""} onChange={set('availableFrom')}
                className={inputClass}
              />
            </div>

            {/* Available To */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Available To</label>
              <input
                type="time"
                value={formData.availableTo || ""} onChange={set('availableTo')}
                className={inputClass}
              />
              {formData.availableFrom && formData.availableTo && (
                <span className="text-[11px] text-ui-muted">
                  Must be after "Available From" time
                </span>
              )}
            </div>

            {/* Max Booking Hours */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Max Booking Hours</label>
              <input
                type="number"
                value={formData.maxBookingHours} onChange={set('maxBookingHours')}
                placeholder="e.g., 4"
                min="1"
                max="72"
                step="1"
                className={inputClass}
              />
              <span className="text-[11px] text-ui-muted">
                1-72 hours
              </span>
            </div>

          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end mt-8 pt-6 border-t border-ui-sky/8">
            <button
              type="button"
              className="bg-transparent border border-ui-sky/20 rounded-lg text-ui-muted px-6 py-2.5 text-[14px] font-semibold cursor-pointer transition-all duration-200 hover:border-ui-sky/40 hover:text-ui-bright"
              onClick={() => navigate(RESOURCE_LIST_PATH)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? "Updating..." : "Update Resource"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </Layout>
  );
}