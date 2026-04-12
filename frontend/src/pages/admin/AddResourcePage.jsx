import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import Layout from "../../components/Layout";

const RESOURCE_TYPES = ["LECTURE_ROOM", "LAB", "MEETING_ROOM", "EQUIPMENT", "SPORTS", "EVENT_SPACE"];
const RESOURCE_STATUS = ["ACTIVE", "OUT_OF_SERVICE"];

export default function AddResourcePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
  name: "",
  type: "LECTURE_ROOM",
  description: "",
  location: "",
  capacity: "",
  status: "ACTIVE",
  availableFrom: "08:00",
  availableTo: "18:00",
  maxBookingHours: "2",
  availableDate: "" // ✅ FIXED
});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Prepare payload matching backend expectations
      const payload = {
  name: formData.name,
  type: formData.type,
  description: formData.description,
  location: formData.location,
  capacity: formData.capacity ? Number(formData.capacity) : null,
  status: formData.status,
  availableFrom: formData.availableFrom,
  availableTo: formData.availableTo,
  maxBookingHours: Number(formData.maxBookingHours),
  availableDate: formData.availableDate || null // ✅ FIXED
};

      console.log("Sending payload:", payload);
      const response = await api.post("/api/resources", payload);
      console.log("Response:", response.data);
      
      setSuccess(true);
      
      // Navigate to ResourceListPage after successful addition
      setTimeout(() => {
        navigate("/resourceslist");
      }, 1000);
      
    } catch (err) {
      console.error("Error adding resource:", err);
      console.error("Response data:", err.response?.data);
      setError(err.response?.data?.message || "Failed to add resource");
      setLoading(false);
    }
  };

  // Don't render if not authenticated
  if (!user) return null;

  return (
    <Layout adminOnly>
      <div style={s.container}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <div style={s.sectionLabel}>RESOURCE MANAGEMENT</div>
            <h1 style={s.title}>Create a new resource for the campus</h1>
            <p style={s.subtitle}>Add a new resource to the campus inventory</p>
          </div>
          <button 
            style={s.cancelBtn} 
            onClick={() => navigate("/resourceslist")}
          >
            ← Back to Resources
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div style={s.successMessage}>
            ✅ Resource added successfully! Redirecting to resources list...
          </div>
        )}

        {/* Error Message */}
        {error && <div style={s.errorMessage}>{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.formGrid}>
            <div style={s.formGroup}>
              <label style={s.label}>NAME *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                style={s.input}
                placeholder="e.g., A101"
              />
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>TYPE *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                style={s.select}
              >
                {RESOURCE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div style={s.formGroupFull}>
              <label style={s.label}>DESCRIPTION</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                style={s.textarea}
                placeholder="Describe the resource..."
                rows="4"
              />
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>LOCATION *</label>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                style={s.input}
                placeholder="e.g., Building C, Floor 1"
              />
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>CAPACITY</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                style={s.input}
                placeholder="e.g., 60"
              />
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>STATUS</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={s.select}
              >
                {RESOURCE_STATUS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>AVAILABLE DATE (YYYY-MM-DD)</label>
              <input
              type="date"
              name="availableDate"
              value={formData.availableDate}
              onChange={handleChange}
              style={s.input}
              />
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>AVAILABLE FROM</label>
              <input
                type="time"
                name="availableFrom"
                value={formData.availableFrom}
                onChange={handleChange}
                style={s.input}
              />
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>AVAILABLE TO</label>
              <input
                type="time"
                name="availableTo"
                value={formData.availableTo}
                onChange={handleChange}
                style={s.input}
              />
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>MAX BOOKING HOURS</label>
              <input
                type="number"
                name="maxBookingHours"
                value={formData.maxBookingHours}
                onChange={handleChange}
                style={s.input}
                placeholder="e.g., 2"
                required
              />
            </div>
          </div>

          <div style={s.formActions}>
            <button 
              type="button" 
              style={s.secondaryBtn} 
              onClick={() => navigate("/resourceslist")}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              style={s.primaryBtn} 
              disabled={loading || success}
            >
              {loading ? "Adding..." : success ? "Added!" : "Add Resource"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Layout>
  );
}

const s = {
  container: {
    padding: '32px 36px',
    maxWidth: 900,
    margin: '0 auto',
    width: '100%',
    animation: 'fadeUp 0.4s ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 32,
    flexWrap: 'wrap',
    gap: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.15em',
    color: '#fbbf24',
    fontFamily: "'Geist Mono', monospace",
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: 800,
    margin: '0 0 8px',
    letterSpacing: '-0.04em',
    color: '#f0f6ff',
  },
  subtitle: {
    color: '#7a9ab5',
    fontSize: 15,
    margin: 0,
  },
  cancelBtn: {
    background: 'rgba(56,189,248,0.08)',
    border: '1px solid rgba(56,189,248,0.2)',
    borderRadius: 10,
    color: '#38bdf8',
    padding: '10px 20px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  successMessage: {
    background: 'rgba(34,197,94,0.1)',
    border: '1px solid rgba(34,197,94,0.3)',
    borderRadius: 12,
    color: '#4ade80',
    padding: '12px 20px',
    marginBottom: 24,
    fontSize: 14,
  },
  errorMessage: {
    background: 'rgba(251,113,133,0.1)',
    border: '1px solid rgba(251,113,133,0.3)',
    borderRadius: 12,
    color: '#fb7185',
    padding: '12px 20px',
    marginBottom: 24,
    fontSize: 14,
  },
  form: {
    background: 'rgba(8,16,32,0.6)',
    border: '1px solid rgba(56,189,248,0.12)',
    borderRadius: 16,
    padding: '32px',
    backdropFilter: 'blur(12px)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  formGroupFull: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    gridColumn: 'span 2',
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#7a9ab5',
    letterSpacing: '0.05em',
    fontFamily: "'Geist Mono', monospace",
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(10,20,40,0.7)',
    border: '1px solid rgba(56,189,248,0.15)',
    borderRadius: 8,
    color: '#f0f6ff',
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(10,20,40,0.7)',
    border: '1px solid rgba(56,189,248,0.15)',
    borderRadius: 8,
    color: '#f0f6ff',
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(10,20,40,0.7)',
    border: '1px solid rgba(56,189,248,0.15)',
    borderRadius: 8,
    color: '#f0f6ff',
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  formActions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 32,
    paddingTop: 24,
    borderTop: '1px solid rgba(56,189,248,0.08)',
  },
  primaryBtn: {
    background: '#38bdf8',
    border: 'none',
    borderRadius: 8,
    color: '#050b18',
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  secondaryBtn: {
    background: 'transparent',
    border: '1px solid rgba(56,189,248,0.2)',
    borderRadius: 8,
    color: '#7a9ab5',
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
};