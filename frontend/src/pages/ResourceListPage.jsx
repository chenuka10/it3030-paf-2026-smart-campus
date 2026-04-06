import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";


export default function ResourceListPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchResources = async () => {
    try {
      const { data } = await api.get("/api/resources");
      setResources(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this resource?")) return;

    try {
      await api.delete(`/api/resources/${id}`);
      setResources(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert("Delete failed");
    }
  };

  if (loading) return <div style={styles.center}>Loading...</div>;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1>Resources</h1>
        <button style={styles.addBtn} onClick={() => navigate("/resources/add")}>
          + Add Resource
        </button>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Type</th>
            <th style={styles.th}>Description</th>
            <th style={styles.th}>Location</th>
            <th style={styles.th}>Capacity</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Available</th>
            <th style={styles.th}>Max Hours</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {resources.map(r => (
            <tr key={r.id}>
              <td style={styles.td}>{r.name}</td>
              <td style={styles.td}>{r.type}</td>
              <td style={styles.td}>{r.description}</td>
              <td style={styles.td}>{r.location}</td>
              <td style={styles.td}>{r.capacity}</td>
              <td style={styles.td}>{r.status}</td>
              <td style={styles.td}>{r.availableFrom} - {r.availableTo}</td>
              <td style={styles.td}>{r.maxBookingHours}</td>

              <td style={styles.td}>
                <button
                  style={styles.editBtn}
                  onClick={() => navigate(`/resources/edit/${r.id}`)}
                >
                  Edit
                </button>

                <button
                  style={styles.deleteBtn}
                  onClick={() => handleDelete(r.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  page: { padding: 40, background: "#050b18", minHeight: "100vh", color: "#fff" },
  header: { display: "flex", justifyContent: "space-between", marginBottom: 20 },
  addBtn: { background: "#38bdf8", padding: 10, borderRadius: 8, border: "none", cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: 10, color: "#7a9ab5" },
  td: { padding: 10, borderTop: "1px solid rgba(255,255,255,0.1)" },
  editBtn: { marginRight: 8, padding: "6px 10px", cursor: "pointer" },
  deleteBtn: { padding: "6px 10px", background: "#fb7185", color: "#fff", cursor: "pointer" },
  center: { textAlign: "center", marginTop: 100 }
};