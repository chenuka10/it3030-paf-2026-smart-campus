import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import Layout from "../../components/Layout";

// ✅ FIXED: Match the types from AddResourcePage and backend
const RESOURCE_TYPES = ["LECTURE_HALL", "LAB", "MEETING_ROOM", "EQUIPMENT", "OUTDOOR", "AUDITORIUM", "CLASSROOM", "SPORTS"];
const RESOURCE_STATUS = ["ACTIVE", "OUT_OF_SERVICE"]; // ✅ Fixed: Match backend enum

export default function EditResourcePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    name: "",
    type: "LECTURE_HALL",
    description: "",
    location: "",
    capacity: "",
    status: "ACTIVE", // ✅ Changed from "AVAILABLE" to "ACTIVE"
    availableFrom: "",
    availableTo: "",
    maxBookingHours: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchResource();
  }, [user, navigate, id]);

  const fetchResource = async () => {
    try {
      const { data } = await api.get(`/api/resources/${id}`);
      // Ensure status is mapped correctly if backend returns different format
      setFormData({
        ...data,
        capacity: data.capacity || "",
        maxBookingHours: data.maxBookingHours || ""
      });
    } catch (err) {
      console.error("Failed to fetch resource", err);
      setError("Failed to load resource");
      setTimeout(() => navigate("/resources"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      // Prepare payload with proper number conversions
      const payload = {
        ...formData,
        capacity: formData.capacity ? Number(formData.capacity) : null,
        maxBookingHours: formData.maxBookingHours ? Number(formData.maxBookingHours) : null
      };
      
      await api.put(`/api/resources/${id}`, payload);
      navigate("/resources"); // ✅ Changed to navigate to main Resources page
    } catch (err) {
      console.error("Failed to update resource", err);
      setError(err.response?.data?.message || "Failed to update resource");
      setSaving(false);
    }
  };

  if (!user) return null;
  
  if (loading) {
    return (
      <Layout adminOnly>
        <div style={s.loadingContainer}>
          <div style={s.spinner} />
          <p style={s.loadingText}>Loading resource...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout adminOnly>
      <div style={s.container}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <div style={s.sectionLabel}>RESOURCE MANAGEMENT</div>
            <h1 style={s.title}>Edit Resource</h1>
            <p style={s.subtitle}>Update resource information</p>
          </div>
          <button style={s.cancelBtn} onClick={() => navigate("/resources")}>
            ← Back to Resources
          </button>
        </div>

        {/* Error Message */}
        {error && <div style={s.errorMessage}>{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.formGrid}>
            <div style={s.formGroup}>
              <label style={s.label}>Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={s.input}
                placeholder="e.g., Main Lecture Hall A"
              />
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={s.select}
              >
                {RESOURCE_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div style={s.formGroupFull}>
              <label style={s.label}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={s.textarea}
                placeholder="Describe the resource..."
                rows="4"
              />
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                style={s.input}
                placeholder="e.g., Building C, Floor 1"
              />
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Capacity</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                style={s.input}
                placeholder="e.g., 60"
              />
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={s.select}
              >
                {RESOURCE_STATUS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Available From</label>
              <input
                type="time"
                value={formData.availableFrom || ""}
                onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                style={s.input}
              />
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Available To</label>
              <input
                type="time"
                value={formData.availableTo || ""}
                onChange={(e) => setFormData({ ...formData, availableTo: e.target.value })}
                style={s.input}
              />
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Max Booking Hours</label>
              <input
                type="number"
                value={formData.maxBookingHours}
                onChange={(e) => setFormData({ ...formData, maxBookingHours: e.target.value })}
                style={s.input}
                placeholder="e.g., 4"
              />
            </div>
          </div>

          <div style={s.formActions}>
            <button type="button" style={s.secondaryBtn} onClick={() => navigate("/resources")}>
              Cancel
            </button>
            <button type="submit" style={s.primaryBtn} disabled={saving}>
              {saving ? "Updating..." : "Update Resource"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
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
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '16px',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid rgba(56,189,248,0.15)',
    borderTopColor: '#38bdf8',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    color: '#7a9ab5',
    fontSize: 14,
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