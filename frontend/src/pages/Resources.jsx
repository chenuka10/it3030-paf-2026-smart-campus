import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import Navbar from "../components/Navbar";

const STATUS_STYLES = {
  AVAILABLE: { bg: 'rgba(34,197,94,0.12)', text: '#4ade80', border: 'rgba(34,197,94,0.25)', label: 'Available' },
  MAINTAINING: { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24', border: 'rgba(251,191,36,0.25)', label: 'Maintenance' },
  UNAVAILABLE: { bg: 'rgba(251,113,133,0.12)', text: '#fb7185', border: 'rgba(251,113,133,0.25)', label: 'Unavailable' },
};

export default function Resources() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedResource, setSelectedResource] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchResources();
  }, [user, navigate]);

  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/api/resources");
      setResources(data);
    } catch (err) {
      setError('Failed to load resources. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getUniqueTypes = () => {
    const types = resources.map(r => r.type);
    return ['ALL', ...new Set(types)];
  };

  const filtered = resources.filter(r => {
    const matchesSearch = r.name?.toLowerCase().includes(search.toLowerCase()) ||
                          r.description?.toLowerCase().includes(search.toLowerCase()) ||
                          r.location?.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === "ALL" || r.type === selectedType;
    const matchesStatus = selectedStatus === "ALL" || r.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const availableResources = resources.filter(r => r.status === 'AVAILABLE').length;

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={s.loadingContainer}>
          <div style={s.spinner} />
          <p style={s.loadingText}>Loading available resources...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={s.container}>
        {/* Hero Section */}
        <div style={s.hero}>
          <div style={s.heroContent}>
            <div style={s.badge}>CAMPUS RESOURCES</div>
            <h1 style={s.title}>Available Resources</h1>
            <p style={s.subtitle}>
              Browse and book labs, equipment, rooms, and other campus facilities
            </p>
            <div style={s.stats}>
              <div style={s.stat}>
                <span style={s.statNumber}>{resources.length}</span>
                <span style={s.statLabel}>Total Resources</span>
              </div>
              <div style={s.statDivider} />
              <div style={s.stat}>
                <span style={{ ...s.statNumber, color: '#4ade80' }}>{availableResources}</span>
                <span style={s.statLabel}>Currently Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div style={s.filtersSection}>
          <div style={s.filtersContainer}>
            {/* Search Bar */}
            <div style={s.searchWrapper}>
              <span style={s.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search by name, description, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={s.searchInput}
              />
            </div>

            <div style={s.filterGroup}>
              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={s.filterSelect}
              >
                {getUniqueTypes().map(type => (
                  <option key={type} value={type}>
                    {type === 'ALL' ? 'All Types' : type}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={s.filterSelect}
              >
                <option value="ALL">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="MAINTAINING">Maintenance</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </select>

              {/* Clear Filters Button */}
              {(search || selectedType !== "ALL" || selectedStatus !== "ALL") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedType("ALL");
                    setSelectedStatus("ALL");
                  }}
                  style={s.clearBtn}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div style={s.resultsCount}>
          Found {filtered.length} resource{filtered.length !== 1 ? 's' : ''}
        </div>

        {/* Resources Grid */}
        {error ? (
          <div style={s.errorContainer}>
            <div style={s.errorIcon}>⚠️</div>
            <p style={s.errorText}>{error}</p>
            <button onClick={fetchResources} style={s.retryBtn}>Try Again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={s.emptyContainer}>
            <div style={s.emptyIcon}>📦</div>
            <h3 style={s.emptyTitle}>No resources found</h3>
            <p style={s.emptyText}>
              {search || selectedType !== "ALL" || selectedStatus !== "ALL"
                ? "Try adjusting your filters to see more results"
                : "No resources are currently available"}
            </p>
          </div>
        ) : (
          <div style={s.grid}>
            {filtered.map((resource, index) => (
              <div
                key={resource.id}
                style={{ ...s.card, animationDelay: `${index * 0.05}s` }}
                onClick={() => setSelectedResource(resource)}
              >
                <div style={s.cardHeader}>
                  <div style={s.cardIcon}>
                    {resource.type === 'LAB' && '🔬'}
                    {resource.type === 'EQUIPMENT' && '🛠️'}
                    {resource.type === 'ROOM' && '🚪'}
                    {resource.type === 'VEHICLE' && '🚗'}
                    {resource.type === 'OTHER' && '📦'}
                  </div>
                  <span style={{
                    ...s.statusChip,
                    background: STATUS_STYLES[resource.status]?.bg || STATUS_STYLES.AVAILABLE.bg,
                    color: STATUS_STYLES[resource.status]?.text || STATUS_STYLES.AVAILABLE.text,
                    borderColor: STATUS_STYLES[resource.status]?.border || STATUS_STYLES.AVAILABLE.border,
                  }}>
                    {STATUS_STYLES[resource.status]?.label || 'Available'}
                  </span>
                </div>

                <h3 style={s.cardTitle}>{resource.name}</h3>
                <p style={s.cardDescription}>{resource.description || 'No description available'}</p>

                <div style={s.cardDetails}>
                  <div style={s.detailItem}>
                    <span style={s.detailIcon}>📍</span>
                    <span style={s.detailText}>{resource.location || 'Location not specified'}</span>
                  </div>
                  {resource.capacity && (
                    <div style={s.detailItem}>
                      <span style={s.detailIcon}>👥</span>
                      <span style={s.detailText}>Capacity: {resource.capacity}</span>
                    </div>
                  )}
                  {resource.availableFrom && resource.availableTo && (
                    <div style={s.detailItem}>
                      <span style={s.detailIcon}>⏰</span>
                      <span style={s.detailText}>{resource.availableFrom} - {resource.availableTo}</span>
                    </div>
                  )}
                  {resource.maxBookingHours && (
                    <div style={s.detailItem}>
                      <span style={s.detailIcon}>⌛</span>
                      <span style={s.detailText}>Max {resource.maxBookingHours} hours</span>
                    </div>
                  )}
                </div>

                <button
                  style={{
                    ...s.viewBtn,
                    opacity: resource.status === 'AVAILABLE' ? 1 : 0.5,
                    cursor: resource.status === 'AVAILABLE' ? 'pointer' : 'not-allowed',
                  }}
                  disabled={resource.status !== 'AVAILABLE'}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (resource.status === 'AVAILABLE') {
                      // Navigate to booking page or show booking modal
                      alert(`Booking for ${resource.name} - Coming soon!`);
                    }
                  }}
                >
                  {resource.status === 'AVAILABLE' ? 'Book Now →' : 'Currently Unavailable'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Resource Detail Modal */}
        {selectedResource && (
          <div style={s.modalOverlay} onClick={() => setSelectedResource(null)}>
            <div style={s.modal} onClick={e => e.stopPropagation()}>
              <button style={s.modalClose} onClick={() => setSelectedResource(null)}>✕</button>
              
              <div style={s.modalHeader}>
                <div style={s.modalIcon}>
                  {selectedResource.type === 'LAB' && '🔬'}
                  {selectedResource.type === 'EQUIPMENT' && '🛠️'}
                  {selectedResource.type === 'ROOM' && '🚪'}
                  {selectedResource.type === 'VEHICLE' && '🚗'}
                  {selectedResource.type === 'OTHER' && '📦'}
                </div>
                <div>
                  <span style={{
                    ...s.modalStatus,
                    background: STATUS_STYLES[selectedResource.status]?.bg || STATUS_STYLES.AVAILABLE.bg,
                    color: STATUS_STYLES[selectedResource.status]?.text || STATUS_STYLES.AVAILABLE.text,
                  }}>
                    {STATUS_STYLES[selectedResource.status]?.label || 'Available'}
                  </span>
                  <h2 style={s.modalTitle}>{selectedResource.name}</h2>
                  <p style={s.modalType}>{selectedResource.type}</p>
                </div>
              </div>

              <div style={s.modalBody}>
                <div style={s.modalSection}>
                  <h4 style={s.modalSectionTitle}>Description</h4>
                  <p style={s.modalText}>{selectedResource.description || 'No description provided.'}</p>
                </div>

                <div style={s.modalSection}>
                  <h4 style={s.modalSectionTitle}>Details</h4>
                  <div style={s.modalDetailsGrid}>
                    <div style={s.modalDetail}>
                      <span style={s.modalDetailIcon}>📍</span>
                      <div>
                        <div style={s.modalDetailLabel}>Location</div>
                        <div style={s.modalDetailValue}>{selectedResource.location || 'Not specified'}</div>
                      </div>
                    </div>
                    {selectedResource.capacity && (
                      <div style={s.modalDetail}>
                        <span style={s.modalDetailIcon}>👥</span>
                        <div>
                          <div style={s.modalDetailLabel}>Capacity</div>
                          <div style={s.modalDetailValue}>{selectedResource.capacity} people</div>
                        </div>
                      </div>
                    )}
                    {selectedResource.availableFrom && selectedResource.availableTo && (
                      <div style={s.modalDetail}>
                        <span style={s.modalDetailIcon}>⏰</span>
                        <div>
                          <div style={s.modalDetailLabel}>Available Hours</div>
                          <div style={s.modalDetailValue}>{selectedResource.availableFrom} - {selectedResource.availableTo}</div>
                        </div>
                      </div>
                    )}
                    {selectedResource.maxBookingHours && (
                      <div style={s.modalDetail}>
                        <span style={s.modalDetailIcon}>⌛</span>
                        <div>
                          <div style={s.modalDetailLabel}>Max Booking Duration</div>
                          <div style={s.modalDetailValue}>{selectedResource.maxBookingHours} hours</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={s.modalFooter}>
                <button style={s.modalCancelBtn} onClick={() => setSelectedResource(null)}>Close</button>
                {selectedResource.status === 'AVAILABLE' && (
                  <button
                    style={s.modalBookBtn}
                    onClick={() => {
                      alert(`Booking for ${selectedResource.name} - Coming soon!`);
                      setSelectedResource(null);
                    }}
                  >
                    Book This Resource
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
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
    </>
  );
}

const s = {
  container: {
    minHeight: '100vh',
    background: '#050b18',
    fontFamily: "'DM Sans', sans-serif",
  },
  loadingContainer: {
    minHeight: '100vh',
    background: '#050b18',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
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
  hero: {
    background: 'linear-gradient(135deg, #0a1428 0%, #050b18 100%)',
    padding: '60px 32px 80px',
    borderBottom: '1px solid rgba(56,189,248,0.1)',
  },
  heroContent: {
    maxWidth: 900,
    margin: '0 auto',
    textAlign: 'center',
  },
  badge: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.15em',
    color: '#fbbf24',
    fontFamily: "'Geist Mono', monospace",
    marginBottom: 16,
  },
  title: {
    fontSize: 48,
    fontWeight: 800,
    margin: '0 0 16px',
    letterSpacing: '-0.04em',
    color: '#f0f6ff',
  },
  subtitle: {
    fontSize: 18,
    color: '#7a9ab5',
    marginBottom: 32,
    lineHeight: 1.5,
  },
  stats: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    padding: '20px 32px',
    background: 'rgba(10,20,40,0.7)',
    borderRadius: 16,
    border: '1px solid rgba(56,189,248,0.12)',
    maxWidth: 400,
    margin: '0 auto',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 800,
    color: '#38bdf8',
  },
  statLabel: {
    fontSize: 11,
    color: '#3d5a70',
    fontFamily: "'Geist Mono', monospace",
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 30,
    background: 'rgba(56,189,248,0.2)',
  },
  filtersSection: {
    position: 'sticky',
    top: 60,
    background: 'rgba(5,11,24,0.95)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(56,189,248,0.1)',
    zIndex: 10,
  },
  filtersContainer: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '20px 32px',
  },
  searchWrapper: {
    position: 'relative',
    marginBottom: 16,
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
    padding: '12px 16px 12px 40px',
    background: 'rgba(10,20,40,0.7)',
    border: '1px solid rgba(56,189,248,0.15)',
    borderRadius: 10,
    color: '#f0f6ff',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  },
  filterGroup: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  filterSelect: {
    padding: '8px 16px',
    background: 'rgba(10,20,40,0.7)',
    border: '1px solid rgba(56,189,248,0.15)',
    borderRadius: 8,
    color: '#f0f6ff',
    fontSize: 13,
    fontFamily: 'inherit',
    cursor: 'pointer',
    outline: 'none',
  },
  clearBtn: {
    padding: '8px 16px',
    background: 'rgba(251,113,133,0.1)',
    border: '1px solid rgba(251,113,133,0.3)',
    borderRadius: 8,
    color: '#fb7185',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  resultsCount: {
    maxWidth: 1200,
    margin: '24px auto 0',
    padding: '0 32px',
    fontSize: 13,
    color: '#3d5a70',
    fontFamily: "'Geist Mono', monospace",
  },
  grid: {
    maxWidth: 1200,
    margin: '24px auto 0',
    padding: '0 32px 60px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: 24,
  },
  card: {
    background: 'rgba(10,20,40,0.7)',
    border: '1px solid rgba(56,189,248,0.12)',
    borderRadius: 16,
    padding: '20px',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    animation: 'fadeUp 0.5s ease both',
    backdropFilter: 'blur(12px)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 32,
  },
  statusChip: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    padding: '3px 9px',
    borderRadius: 6,
    border: '1px solid',
    fontFamily: "'Geist Mono', monospace",
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#f0f6ff',
    margin: '0 0 8px',
  },
  cardDescription: {
    fontSize: 13,
    color: '#7a9ab5',
    lineHeight: 1.5,
    marginBottom: 16,
  },
  cardDetails: {
    borderTop: '1px solid rgba(56,189,248,0.08)',
    paddingTop: 16,
    marginBottom: 16,
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    fontSize: 12,
    color: '#7a9ab5',
  },
  detailIcon: {
    fontSize: 12,
  },
  detailText: {
    fontSize: 12,
  },
  viewBtn: {
    width: '100%',
    padding: '10px',
    background: 'rgba(56,189,248,0.1)',
    border: '1px solid rgba(56,189,248,0.25)',
    borderRadius: 8,
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  errorContainer: {
    maxWidth: 500,
    margin: '80px auto',
    textAlign: 'center',
    padding: '0 32px',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    color: '#fb7185',
    fontSize: 14,
    marginBottom: 20,
  },
  retryBtn: {
    padding: '10px 24px',
    background: 'rgba(56,189,248,0.1)',
    border: '1px solid rgba(56,189,248,0.25)',
    borderRadius: 8,
    color: '#38bdf8',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  emptyContainer: {
    maxWidth: 500,
    margin: '80px auto',
    textAlign: 'center',
    padding: '0 32px',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#f0f6ff',
    marginBottom: 8,
  },
  emptyText: {
    color: '#7a9ab5',
    fontSize: 14,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 24,
  },
  modal: {
    position: 'relative',
    maxWidth: 600,
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    background: '#0a1428',
    border: '1px solid rgba(56,189,248,0.2)',
    borderRadius: 20,
    padding: 32,
    animation: 'scaleIn 0.25s ease',
  },
  modalClose: {
    position: 'absolute',
    top: 20,
    right: 20,
    background: 'rgba(56,189,248,0.1)',
    border: 'none',
    borderRadius: 8,
    color: '#7a9ab5',
    fontSize: 16,
    cursor: 'pointer',
    padding: '4px 8px',
    transition: 'all 0.2s',
  },
  modalHeader: {
    display: 'flex',
    gap: 16,
    marginBottom: 24,
  },
  modalIcon: {
    fontSize: 48,
  },
  modalStatus: {
    display: 'inline-block',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    padding: '3px 9px',
    borderRadius: 6,
    marginBottom: 12,
    fontFamily: "'Geist Mono', monospace",
    textTransform: 'uppercase',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 800,
    margin: '0 0 4px',
    color: '#f0f6ff',
  },
  modalType: {
    fontSize: 13,
    color: '#38bdf8',
    fontFamily: "'Geist Mono', monospace",
  },
  modalBody: {
    marginBottom: 24,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#3d5a70',
    fontFamily: "'Geist Mono', monospace",
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: '#7a9ab5',
    lineHeight: 1.6,
  },
  modalDetailsGrid: {
    display: 'grid',
    gap: 16,
  },
  modalDetail: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  modalDetailIcon: {
    fontSize: 20,
  },
  modalDetailLabel: {
    fontSize: 11,
    color: '#3d5a70',
    fontFamily: "'Geist Mono', monospace",
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  modalDetailValue: {
    fontSize: 14,
    color: '#f0f6ff',
  },
  modalFooter: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    paddingTop: 24,
    borderTop: '1px solid rgba(56,189,248,0.08)',
  },
  modalCancelBtn: {
    padding: '10px 20px',
    background: 'transparent',
    border: '1px solid rgba(56,189,248,0.2)',
    borderRadius: 8,
    color: '#7a9ab5',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  modalBookBtn: {
    padding: '10px 24px',
    background: '#38bdf8',
    border: 'none',
    borderRadius: 8,
    color: '#050b18',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};