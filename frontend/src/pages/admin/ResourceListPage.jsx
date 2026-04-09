import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import Layout from "../../components/Layout";

const STATUS_STYLES = {
  ACTIVE: { bg: 'rgba(34,197,94,0.12)', text: '#4ade80', border: 'rgba(34,197,94,0.25)' },
  OUT_OF_SERVICE: { bg: 'rgba(251,113,133,0.12)', text: '#fb7185', border: 'rgba(251,113,133,0.25)' },
};

export default function ResourceListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/api/resources");
      setResources(data);
    } catch (err) {
      setError('Failed to load resources. Check backend connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchResources();
  }, [user, navigate]);

  const handleDelete = async (id) => {
    setDeleting(null);
    try {
      await api.delete(`/api/resources/${id}`);
      setResources(prev => prev.filter(r => r.id !== id));
      showToast('Resource deleted successfully');
    } catch (err) {
      showToast('Delete failed', 'error');
    }
  };

  const filtered = resources.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.type?.toLowerCase().includes(search.toLowerCase()) ||
    r.location?.toLowerCase().includes(search.toLowerCase())
  );

  // Updated stats for ACTIVE and OUT_OF_SERVICE
  const stats = {
    total: resources.length,
    active: resources.filter(r => r.status === 'ACTIVE').length,
    outOfService: resources.filter(r => r.status === 'OUT_OF_SERVICE').length,
  };

  if (loading) {
    return (
      <Layout adminOnly>
        <div style={s.loadingContainer}>
          <div style={s.spinner} />
          <p style={s.loadingText}>Loading resources...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout adminOnly>
      {toast && (
        <div style={{ ...s.toast, ...(toast.type === 'error' ? s.toastError : s.toastSuccess) }}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleting && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setDeleting(null)}>
          <div style={s.modal}>
            <div style={s.modalIcon}>⚠️</div>
            <h3 style={s.modalTitle}>Delete Resource</h3>
            <p style={s.modalText}>
              Are you sure you want to delete <strong>{deleting.name}</strong>?
              This action cannot be undone.
            </p>
            <div style={s.modalActions}>
              <button style={s.cancelBtn} onClick={() => setDeleting(null)}>
                Cancel
              </button>
              <button style={s.deleteBtn} onClick={() => handleDelete(deleting.id)}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={s.container}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <div style={s.sectionLabel}>RESOURCE MANAGEMENT</div>
            <h1 style={s.title}>Campus Resources</h1>
            <p style={s.subtitle}>Manage labs, equipment, rooms, and other campus assets</p>
          </div>
          <button style={s.addBtn} onClick={() => navigate("/admin/resources/add")}>
            + Add Resource
          </button>
        </div>

        {/* Stats Cards - Updated to 3 cards */}
        {error ? (
          <div style={s.errorBanner}>⚠ {error}</div>
        ) : (
          <div style={s.statsGrid}>
            <div style={s.statCard}>
              <div style={{ ...s.statValue, color: '#38bdf8' }}>{stats.total}</div>
              <div style={s.statLabel}>TOTAL RESOURCES</div>
            </div>
            <div style={s.statCard}>
              <div style={{ ...s.statValue, color: '#4ade80' }}>{stats.active}</div>
              <div style={s.statLabel}>ACTIVE</div>
            </div>
            <div style={s.statCard}>
              <div style={{ ...s.statValue, color: '#fb7185' }}>{stats.outOfService}</div>
              <div style={s.statLabel}>OUT OF SERVICE</div>
            </div>
          </div>
        )}

        {/* Search and Refresh */}
        <div style={s.controls}>
          <div style={s.searchWrapper}>
            <span style={s.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search by name, type, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={s.searchInput}
            />
          </div>
          <button style={s.refreshBtn} onClick={fetchResources}>
            ↺ Refresh
          </button>
        </div>

        {/* Resources Table */}
        <div style={s.tableWrapper}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>NAME</th>
                <th style={s.th}>TYPE</th>
                <th style={s.th}>DESCRIPTION</th>
                <th style={s.th}>LOCATION</th>
                <th style={s.th}>CAPACITY</th>
                <th style={s.th}>STATUS</th>
                <th style={s.th}>AVAILABLE HOURS</th>
                <th style={s.th}>MAX HOURS</th>
                <th style={s.th}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" style={s.emptyCell}>
                    {search ? "No matching resources found" : "No resources found. Click 'Add Resource' to create one."}
                  </td>
                </tr>
              ) : (
                filtered.map((resource, index) => (
                  <tr key={resource.id} style={{ ...s.tr, animationDelay: `${index * 0.03}s` }}>
                    <td style={{ ...s.td, fontWeight: 600, color: '#d0e8ff' }}>{resource.name}</td>
                    <td style={s.td}>
                      <span style={s.typeBadge}>{resource.type}</span>
                    </td>
                    <td style={{ ...s.td, color: '#7a9ab5', fontSize: 13, maxWidth: 250 }}>
                      {resource.description?.slice(0, 80)}
                      {resource.description?.length > 80 ? '...' : ''}
                    </td>
                    <td style={{ ...s.td, color: '#7a9ab5' }}>{resource.location || '—'}</td>
                    <td style={{ ...s.td, color: '#7a9ab5' }}>{resource.capacity || '—'}</td>
                    <td style={s.td}>
                      <span style={{
                        ...s.statusBadge,
                        background: STATUS_STYLES[resource.status]?.bg || STATUS_STYLES.ACTIVE.bg,
                        color: STATUS_STYLES[resource.status]?.text || STATUS_STYLES.ACTIVE.text,
                        borderColor: STATUS_STYLES[resource.status]?.border || STATUS_STYLES.ACTIVE.border,
                      }}>
                        {resource.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td style={{ ...s.td, color: '#7a9ab5', fontSize: 13 }}>
                      {resource.availableFrom || '—'} - {resource.availableTo || '—'}
                    </td>
                    <td style={{ ...s.td, color: '#7a9ab5' }}>{resource.maxBookingHours || '—'}h</td>
                    <td style={s.td}>
                      <div style={s.actionButtons}>
                        <button
                          style={s.editBtn}
                          onClick={() => navigate(`/admin/resources/edit/${resource.id}`)}
                        >
                          Edit
                        </button>
                        <button
                          style={s.deleteBtnSmall}
                          onClick={() => setDeleting(resource)}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={s.tableFooter}>
          Showing {filtered.length} of {resources.length} resources
        </div>
      </div>

      <style>{`
        @keyframes rowIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
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
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </Layout>
  );
}

const s = {
  container: {
    padding: '32px 36px',
    maxWidth: 1400,
    margin: '0 auto',
    width: '100%',
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
  toast: {
    position: 'fixed',
    top: 24,
    right: 24,
    zIndex: 9999,
    padding: '12px 20px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    backdropFilter: 'blur(12px)',
    animation: 'fadeUp 0.3s ease',
  },
  toastSuccess: {
    background: 'rgba(34,197,94,0.15)',
    border: '1px solid rgba(34,197,94,0.3)',
    color: '#4ade80',
  },
  toastError: {
    background: 'rgba(251,113,133,0.15)',
    border: '1px solid rgba(251,113,133,0.3)',
    color: '#fb7185',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 28,
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
  addBtn: {
    background: 'rgba(56,189,248,0.1)',
    border: '1px solid rgba(56,189,248,0.25)',
    borderRadius: 10,
    color: '#38bdf8',
    padding: '12px 24px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    background: 'rgba(10,20,40,0.7)',
    border: '1px solid rgba(56,189,248,0.12)',
    borderRadius: 14,
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 800,
    lineHeight: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#3d5a70',
    letterSpacing: '0.08em',
    fontFamily: "'Geist Mono', monospace",
    textTransform: 'uppercase',
  },
  errorBanner: {
    background: 'rgba(251,113,133,0.08)',
    border: '1px solid rgba(251,113,133,0.2)',
    borderRadius: 10,
    padding: '12px 20px',
    color: '#fb7185',
    fontSize: 14,
    marginBottom: 20,
  },
  controls: {
    display: 'flex',
    gap: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  searchWrapper: {
    position: 'relative',
    flex: 1,
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#3d5a70',
    fontSize: 16,
  },
  searchInput: {
    width: '100%',
    background: 'rgba(10,20,40,0.7)',
    border: '1px solid rgba(56,189,248,0.15)',
    borderRadius: 10,
    padding: '11px 16px 11px 40px',
    color: '#f0f6ff',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  },
  refreshBtn: {
    background: 'rgba(10,20,40,0.7)',
    border: '1px solid rgba(56,189,248,0.2)',
    borderRadius: 10,
    padding: '11px 20px',
    color: '#7a9ab5',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
  tableWrapper: {
    background: 'rgba(8,16,32,0.6)',
    border: '1px solid rgba(56,189,248,0.12)',
    borderRadius: 16,
    overflow: 'auto',
    backdropFilter: 'blur(12px)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 1100,
  },
  th: {
    textAlign: 'left',
    padding: '14px 20px',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: '#3d5a70',
    fontFamily: "'Geist Mono', monospace",
    textTransform: 'uppercase',
    borderBottom: '1px solid rgba(56,189,248,0.1)',
    background: 'rgba(56,189,248,0.03)',
  },
  tr: {
    transition: 'background 0.15s',
    animation: 'rowIn 0.4s ease both',
    borderBottom: '1px solid rgba(56,189,248,0.06)',
  },
  td: {
    padding: '14px 20px',
    fontSize: 14,
    verticalAlign: 'middle',
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    padding: '3px 9px',
    borderRadius: 6,
    border: '1px solid',
    fontFamily: "'Geist Mono', monospace",
    textTransform: 'uppercase',
    display: 'inline-block',
  },
  typeBadge: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    padding: '3px 9px',
    borderRadius: 6,
    background: 'rgba(56,189,248,0.08)',
    color: '#38bdf8',
    border: '1px solid rgba(56,189,248,0.2)',
    fontFamily: "'Geist Mono', monospace",
    textTransform: 'uppercase',
    display: 'inline-block',
  },
  actionButtons: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  editBtn: {
    background: 'rgba(56,189,248,0.08)',
    border: '1px solid rgba(56,189,248,0.2)',
    borderRadius: 7,
    color: '#38bdf8',
    padding: '5px 14px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  deleteBtnSmall: {
    background: 'transparent',
    border: '1px solid rgba(56,189,248,0.15)',
    borderRadius: 7,
    color: '#3d5a70',
    padding: '5px 10px',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  emptyCell: {
    textAlign: 'center',
    padding: 60,
    color: '#3d5a70',
    fontStyle: 'italic',
    fontSize: 14,
  },
  tableFooter: {
    padding: '14px 20px',
    fontSize: 12,
    color: '#3d5a70',
    fontFamily: "'Geist Mono', monospace",
    borderTop: '1px solid rgba(56,189,248,0.08)',
    background: 'rgba(56,189,248,0.02)',
    borderRadius: '0 0 16px 16px',
  },
  // Modal styles
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 24,
  },
  modal: {
    background: '#0a1428',
    border: '1px solid rgba(56,189,248,0.2)',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 480,
    textAlign: 'center',
    animation: 'scaleIn 0.25s ease',
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 800,
    margin: '0 0 12px',
    letterSpacing: '-0.03em',
    color: '#f0f6ff',
  },
  modalText: {
    fontSize: 14,
    color: '#7a9ab5',
    lineHeight: 1.7,
    margin: '0 0 24px',
  },
  modalActions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
  },
  cancelBtn: {
    background: 'transparent',
    border: '1px solid rgba(56,189,248,0.2)',
    borderRadius: 10,
    color: '#7a9ab5',
    padding: '9px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  deleteBtn: {
    background: '#fb7185',
    border: 'none',
    borderRadius: 10,
    color: '#fff',
    padding: '9px 24px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
};