import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import Layout from "../../components/Layout";

const RESOURCE_TYPES  = ["LECTURE_ROOM", "LAB", "MEETING_ROOM", "EQUIPMENT", "SPORTS", "EVENT_SPACE"];
const RESOURCE_STATUS = ["ACTIVE", "OUT_OF_SERVICE"];
const RESOURCE_LIST_PATH = "/admin/resources";

export default function AddResourcePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name:            "",
    type:            "LECTURE_ROOM",
    description:     "",
    location:        "",
    capacity:        "",
    status:          "ACTIVE",
    availableFrom:   "08:00",
    availableTo:     "18:00",
    maxBookingHours: "2",
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    // Name validation
    if (!formData.name.trim()) {
      setError("Resource name is required");
      return false;
    }

    // Location validation
    if (!formData.location.trim()) {
      setError("Location is required");
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

    // Time validation
    if (formData.availableFrom >= formData.availableTo) {
      setError("Available To time must be after Available From time");
      return false;
    }

    // Max booking hours validation
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

    // Location length validation
    if (formData.location.length > 200) {
      setError("Location cannot exceed 200 characters");
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
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      const payload = {
        name:            formData.name.trim(),
        type:            formData.type,
        description:     formData.description ? formData.description.trim() : "",
        location:        formData.location.trim(),
        capacity:        formData.capacity ? Number(formData.capacity) : null,
        status:          formData.status,
        availableFrom:   formData.availableFrom,
        availableTo:     formData.availableTo,
        maxBookingHours: Number(formData.maxBookingHours),
      };
      await api.post("/api/resources", payload);
      setSuccess(true);
      setTimeout(() => navigate(RESOURCE_LIST_PATH, { replace: true }), 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add resource");
      setLoading(false);
    }
  };

  if (!user) return null;

  const inputClass = "w-full bg-ui-base border border-ui-sky/15 rounded-lg px-3.5 py-2.5 text-ui-bright text-[14px] outline-none transition-all duration-200 box-border focus:border-ui-sky";
  const labelClass = "text-[12px] font-semibold text-ui-muted tracking-[0.05em] font-mono uppercase";

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
              Create a new resource for the campus
            </h1>
            <p className="text-ui-muted text-[15px] m-0">
              Add a new resource to the campus inventory
            </p>
          </div>
          <button
            className="bg-ui-sky/8 border border-ui-sky/20 rounded-[10px] text-ui-sky px-5 py-2.5 text-[13px] font-semibold cursor-pointer transition-all duration-200 hover:bg-ui-sky/15 hover:border-ui-sky/40"
            onClick={() => navigate(RESOURCE_LIST_PATH)}
          >
            ← Back to Resources
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-ui-green/10 border border-ui-green/30 rounded-xl text-ui-green px-5 py-3 mb-6 text-[14px]">
            ✅ Resource added successfully! Redirecting to resources list...
          </div>
        )}

        {/* Error Message */}
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
              <label className={labelClass}>NAME *</label>
              <input
                type="text" name="name" required
                value={formData.name} onChange={handleChange}
                placeholder="e.g., A101"
                maxLength="100"
                className={inputClass}
              />
              <span className="text-[11px] text-ui-muted">
                {formData.name.length}/100 characters
              </span>
            </div>

            {/* Type */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>TYPE *</label>
              <select
                name="type"
                value={formData.type} onChange={handleChange}
                className={inputClass}
                required
              >
                {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Description — full width */}
            <div className="flex flex-col gap-2 col-span-2">
              <label className={labelClass}>DESCRIPTION</label>
              <textarea
                name="description" rows={4}
                value={formData.description} onChange={handleChange}
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
              <label className={labelClass}>LOCATION *</label>
              <input
                type="text" name="location" required
                value={formData.location} onChange={handleChange}
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
              <label className={labelClass}>CAPACITY</label>
              <input
                type="number" name="capacity"
                value={formData.capacity} onChange={handleChange}
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
              <label className={labelClass}>STATUS</label>
              <select
                name="status"
                value={formData.status} onChange={handleChange}
                className={inputClass}
              >
                {RESOURCE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Available From */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>AVAILABLE FROM</label>
              <input
                type="time" name="availableFrom"
                value={formData.availableFrom} onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            {/* Available To */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>AVAILABLE TO</label>
              <input
                type="time" name="availableTo"
                value={formData.availableTo} onChange={handleChange}
                className={inputClass}
                required
              />
              <span className="text-[11px] text-ui-muted">
                Must be after "Available From" time
              </span>
            </div>

            {/* Max Booking Hours */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>MAX BOOKING HOURS *</label>
              <input
                type="number" name="maxBookingHours" required
                value={formData.maxBookingHours} onChange={handleChange}
                placeholder="e.g., 2"
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
              disabled={loading || success}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? "Adding..." : success ? "Added!" : "Add Resource"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Layout>
  );
}