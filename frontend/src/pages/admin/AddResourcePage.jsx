import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import Layout from "../../components/Layout";

const RESOURCE_TYPES  = ["LECTURE_ROOM", "LAB", "MEETING_ROOM", "EQUIPMENT", "SPORTS", "EVENT_SPACE"];
const RESOURCE_STATUS = ["ACTIVE", "OUT_OF_SERVICE"];

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(false);
    try {
      const payload = {
        name:            formData.name,
        type:            formData.type,
        description:     formData.description,
        location:        formData.location,
        capacity:        formData.capacity ? Number(formData.capacity) : null,
        status:          formData.status,
        availableFrom:   formData.availableFrom,
        availableTo:     formData.availableTo,
        maxBookingHours: Number(formData.maxBookingHours),
      };
      await api.post("/api/resources", payload);
      setSuccess(true);
      setTimeout(() => navigate("/resourceslist"), 1000);
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
            onClick={() => navigate("/resourceslist")}
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
            {error}
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
                className={inputClass}
              />
            </div>

            {/* Type */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>TYPE *</label>
              <select
                name="type"
                value={formData.type} onChange={handleChange}
                className={inputClass}
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
                placeholder="Describe the resource..."
                className={`${inputClass} resize-y`}
              />
            </div>

            {/* Location */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>LOCATION *</label>
              <input
                type="text" name="location" required
                value={formData.location} onChange={handleChange}
                placeholder="e.g., Building C, Floor 1"
                className={inputClass}
              />
            </div>

            {/* Capacity */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>CAPACITY</label>
              <input
                type="number" name="capacity"
                value={formData.capacity} onChange={handleChange}
                placeholder="e.g., 60"
                className={inputClass}
              />
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
              />
            </div>

            {/* Available To */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>AVAILABLE TO</label>
              <input
                type="time" name="availableTo"
                value={formData.availableTo} onChange={handleChange}
                className={inputClass}
              />
            </div>

            {/* Max Booking Hours */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>MAX BOOKING HOURS</label>
              <input
                type="number" name="maxBookingHours" required
                value={formData.maxBookingHours} onChange={handleChange}
                placeholder="e.g., 2"
                className={inputClass}
              />
            </div>

          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end mt-8 pt-6 border-t border-ui-sky/8">
            <button
              type="button"
              className="bg-transparent border border-ui-sky/20 rounded-lg text-ui-muted px-6 py-2.5 text-[14px] font-semibold cursor-pointer transition-all duration-200 hover:border-ui-sky/40 hover:text-ui-bright"
              onClick={() => navigate("/resourceslist")}
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