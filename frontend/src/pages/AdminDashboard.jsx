import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const ROLES = ['USER', 'ADMIN', 'TECHNICIAN'];

const ROLE_STYLES = {
  ADMIN: { bg: 'rgba(251,113,133,0.12)', text: '#fb7185', border: 'rgba(251,113,133,0.25)' },
  TECHNICIAN: { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
  USER: { bg: 'rgba(56,189,248,0.12)', text: '#38bdf8', border: 'rgba(56,189,248,0.25)' },
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({}); // { [userId]: true }
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/api/users');
      setUsers(data);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('forbidden');
      } else {
        setError('Failed to load users. Check backend connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchUsers();
  }, [user]);

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(prev => ({ ...prev, [userId]: true }));
    try {
      const { data } = await api.put(`/api/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: data.role } : u));
      showToast(`Role updated to ${newRole}`, 'success');
    } catch (err) {
      if (err.response?.status === 403) {
        showToast('Permission denied — Admin only', 'error');
      } else {
        showToast('Failed to update role', 'error');
      }
    } finally {
      setUpdating(prev => ({ ...prev, [userId]: false }));
    }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <FullPageSpinner />;

  if (error === 'forbidden') return (
    <div style={styles.page}>
      <div style={styles.forbidden}>
        <div style={styles.forbiddenIcon}>⊗</div>
        <h2 style={styles.forbiddenTitle}>Access Denied</h2>
        <p style={styles.forbiddenSub}>You need Admin privileges to view this page.</p>
        <button style={styles.backBtn} onClick={() => navigate('/profile')}>← Back to Profile</button>
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      {/* Toast */}
      {toast && (
        <div style={{ ...styles.toast, ...(toast.type === 'error' ? styles.toastError : styles.toastSuccess) }}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      {/* Nav */}
      <nav style={styles.nav}>
        <div style={styles.navBrand}>
          <div style={styles.navDot} />
          <span style={styles.navName}>SmartCampus</span>
          <span style={styles.navSep}>/</span>
          <span style={styles.navPage}>Admin</span>
        </div>
        <div style={styles.navRight}>
          <button style={styles.navBtn} onClick={() => navigate('/profile')}
            onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
            onMouseLeave={e => e.currentTarget.style.color = '#7a9ab5'}
          >
            Profile
          </button>
          <button style={{ ...styles.navBtn, ...styles.logoutBtn }}
            onClick={() => { logout(); navigate('/login'); }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(251,113,133,0.15)'; e.currentTarget.style.borderColor = 'rgba(251,113,133,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.2)'; }}
          >
            Sign out
          </button>
        </div>
      </nav>

      <main style={styles.main}>
        {/* Header */}
        <div style={styles.pageHeader}>
          <div>
            <div style={styles.sectionLabel}>ADMIN PANEL</div>
            <h1 style={styles.pageTitle}>User Management</h1>
            <p style={styles.pageSub}>Manage user roles and permissions across SmartCampus</p>
          </div>
          <div style={styles.statsPill}>
            <span style={styles.statsNum}>{users.length}</span>
            <span style={styles.statsLabel}>Total Users</span>
          </div>
        </div>

        {/* Error banner */}
        {error && error !== 'forbidden' && (
          <div style={styles.errorBanner}>⚠ {error}</div>
        )}

        {/* Controls */}
        <div style={styles.controls}>
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon}>⌕</span>
            <input
              style={styles.search}
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button style={styles.refreshBtn} onClick={fetchUsers}>↺ Refresh</button>
        </div>

        {/* Table */}
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['ID', 'User', 'Email', 'Role', 'Change Role'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={styles.emptyCell}>No users found</td>
                </tr>
              ) : filtered.map((u, i) => (
                <tr
                  key={u.id}
                  style={{ ...styles.tr, animationDelay: `${i * 0.05}s` }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ ...styles.td, ...styles.mono, color: '#3d5a70' }}>#{u.id}</td>
                  <td style={styles.td}>
                    <div style={styles.userCell}>
                      <div style={styles.userAvatar}>
                        {u.imageUrl
                          ? <img src={u.imageUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          : <span style={styles.avatarInitial}>{u.name?.[0]?.toUpperCase() || '?'}</span>
                        }
                      </div>
                      <span style={styles.userName}>{u.name || '—'}</span>
                    </div>
                  </td>
                  <td style={{ ...styles.td, color: '#7a9ab5', fontSize: 13 }}>{u.email}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.roleBadge,
                      background: ROLE_STYLES[u.role]?.bg,
                      color: ROLE_STYLES[u.role]?.text,
                      borderColor: ROLE_STYLES[u.role]?.border,
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.selectWrap}>
                      <select
                        style={styles.select}
                        value={u.role}
                        disabled={updating[u.id]}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      {updating[u.id] && <div style={styles.miniSpinner} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={styles.tableFooter}>
          Showing {filtered.length} of {users.length} users
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes rowFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}

function FullPageSpinner() {
  return (
    <div style={{ minHeight: '100vh', background: '#050b18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(56,189,248,0.15)', borderTopColor: '#38bdf8', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#050b18',
    fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    color: '#f0f6ff',
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
    animation: 'rowFadeIn 0.3s ease',
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
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 32px',
    borderBottom: '1px solid rgba(56,189,248,0.1)',
    background: 'rgba(5,11,24,0.9)',
    backdropFilter: 'blur(12px)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navBrand: { display: 'flex', alignItems: 'center', gap: 8 },
  navDot: { width: 10, height: 10, borderRadius: '50%', background: '#38bdf8' },
  navName: { fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' },
  navSep: { color: '#3d5a70', fontSize: 16 },
  navPage: { fontSize: 15, color: '#7a9ab5', fontWeight: 500 },
  navRight: { display: 'flex', alignItems: 'center', gap: 16 },
  navBtn: { background: 'none', border: 'none', color: '#7a9ab5', fontSize: 14, cursor: 'pointer', transition: 'color 0.2s', fontFamily: 'inherit', fontWeight: 500 },
  logoutBtn: { border: '1px solid rgba(56,189,248,0.2)', borderRadius: 8, padding: '6px 14px', transition: 'all 0.2s' },
  main: { maxWidth: 1100, margin: '0 auto', padding: '48px 24px' },
  pageHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36 },
  sectionLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#3d5a70', fontFamily: "'Geist Mono', monospace", marginBottom: 10 },
  pageTitle: { fontSize: 36, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.03em' },
  pageSub: { color: '#7a9ab5', fontSize: 14, margin: 0 },
  statsPill: {
    background: 'rgba(10,20,40,0.7)',
    border: '1px solid rgba(56,189,248,0.2)',
    borderRadius: 14,
    padding: '16px 24px',
    textAlign: 'center',
    flexShrink: 0,
  },
  statsNum: { display: 'block', fontSize: 32, fontWeight: 800, color: '#38bdf8', lineHeight: 1 },
  statsLabel: { fontSize: 11, color: '#3d5a70', letterSpacing: '0.08em', fontFamily: "'Geist Mono', monospace", textTransform: 'uppercase' },
  errorBanner: {
    background: 'rgba(251,113,133,0.08)',
    border: '1px solid rgba(251,113,133,0.2)',
    borderRadius: 10,
    padding: '12px 20px',
    color: '#fb7185',
    fontSize: 14,
    marginBottom: 20,
  },
  controls: { display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' },
  searchWrap: {
    position: 'relative',
    flex: 1,
  },
  searchIcon: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#3d5a70', fontSize: 18 },
  search: {
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
  },
  tableWrap: {
    background: 'rgba(8,16,32,0.6)',
    border: '1px solid rgba(56,189,248,0.12)',
    borderRadius: 16,
    overflow: 'hidden',
    backdropFilter: 'blur(12px)',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
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
    animation: 'rowFadeIn 0.4s ease both',
    borderBottom: '1px solid rgba(56,189,248,0.06)',
  },
  td: { padding: '14px 20px', fontSize: 14, verticalAlign: 'middle' },
  mono: { fontFamily: "'Geist Mono', monospace", fontSize: 12 },
  userCell: { display: 'flex', alignItems: 'center', gap: 10 },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  avatarInitial: { fontSize: 12, fontWeight: 800, color: '#050b18' },
  userName: { fontWeight: 600, color: '#d0e8ff' },
  roleBadge: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
    padding: '3px 9px', borderRadius: 6, border: '1px solid',
    fontFamily: "'Geist Mono', monospace", textTransform: 'uppercase',
  },
  selectWrap: { display: 'flex', alignItems: 'center', gap: 8 },
  select: {
    background: 'rgba(10,20,40,0.9)',
    border: '1px solid rgba(56,189,248,0.2)',
    borderRadius: 8,
    color: '#d0e8ff',
    padding: '7px 12px',
    fontSize: 13,
    fontFamily: "'Geist Mono', monospace",
    cursor: 'pointer',
    outline: 'none',
    fontWeight: 600,
  },
  miniSpinner: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    border: '2px solid rgba(56,189,248,0.15)',
    borderTopColor: '#38bdf8',
    animation: 'spin 0.6s linear infinite',
    flexShrink: 0,
  },
  emptyCell: { textAlign: 'center', padding: '40px', color: '#3d5a70', fontStyle: 'italic', fontSize: 14 },
  tableFooter: {
    padding: '14px 20px',
    fontSize: 12,
    color: '#3d5a70',
    fontFamily: "'Geist Mono', monospace",
    borderTop: '1px solid rgba(56,189,248,0.08)',
    background: 'rgba(56,189,248,0.02)',
  },
  forbidden: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  forbiddenIcon: { fontSize: 64, color: '#fb7185', lineHeight: 1 },
  forbiddenTitle: { fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.03em', color: '#fb7185' },
  forbiddenSub: { color: '#7a9ab5', fontSize: 16, margin: 0 },
  backBtn: {
    background: 'rgba(56,189,248,0.1)',
    border: '1px solid rgba(56,189,248,0.25)',
    borderRadius: 10,
    color: '#38bdf8',
    padding: '10px 20px',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 600,
    marginTop: 8,
  },
};
