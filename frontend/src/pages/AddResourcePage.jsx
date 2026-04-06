import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const RESOURCE_TYPES = ["LECTURE_ROOM", "LAB", "MEETING_ROOM", "EQUIPMENT", "SPORTS", "EVENT_SPACE"];
const RESOURCE_STATUS = ["ACTIVE", "OUT_OF_SERVICE"];

export default function AddResourcePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    type: "LECTURE_ROOM",
    description: "",
    location: "",
    capacity: "",
    status: "ACTIVE",
    availableFrom: "08:00",
    availableTo: "18:00",
    maxBookingHours: 2
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post("/api/resources", {
        ...form,

        // ✅ FIX: Convert numbers properly
        capacity: form.capacity ? Number(form.capacity) : null,
        maxBookingHours: Number(form.maxBookingHours)
      });

      navigate("/resources");

    } catch (err) {
      console.error(err); // ✅ see real error in console
      setError(err.response?.data?.message || "Failed to add resource");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Add New Resource</h1>

      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          style={styles.input}
          name="name"
          placeholder="Resource Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <select style={styles.input} name="type" value={form.type} onChange={handleChange}>
          {RESOURCE_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <input
          style={styles.input}
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
        />

        <input
          style={styles.input}
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
          required
        />

        <input
          style={styles.input}
          name="capacity"
          type="number"
          placeholder="Capacity"
          value={form.capacity}
          onChange={handleChange}
        />

        <select style={styles.input} name="status" value={form.status} onChange={handleChange}>
          {RESOURCE_STATUS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div style={styles.timeRow}>
          <label>
            From:
            <input
              style={styles.timeInput}
              type="time"
              name="availableFrom"
              value={form.availableFrom}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            To:
            <input
              style={styles.timeInput}
              type="time"
              name="availableTo"
              value={form.availableTo}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <input
          style={styles.input}
          name="maxBookingHours"
          type="number"
          placeholder="Max Booking Hours"
          value={form.maxBookingHours}
          onChange={handleChange}
          required
        />

        <button style={styles.submitBtn} type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Resource"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: 40,
    background: "#050b18",
    color: "#f0f6ff"
  },
  title: { fontSize: 28, marginBottom: 20 },
  form: { display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 },
  input: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid rgba(56,189,248,0.2)",
    background: "#0a1428",
    color: "#fff"
  },
  timeRow: { display: "flex", gap: 12 },
  timeInput: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 6,
    background: "#0a1428",
    color: "#fff",
    border: "1px solid rgba(56,189,248,0.2)"
  },
  submitBtn: {
    padding: 12,
    borderRadius: 8,
    background: "#38bdf8",
    color: "#050b18",
    fontWeight: 700,
    border: "none",
    cursor: "pointer"
  },
  error: { color: "#fb7185", marginBottom: 12 }
};