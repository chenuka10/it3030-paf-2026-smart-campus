import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_COLORS = {
  ADMIN: { bg: 'rgba(251,113,133,0.12)', text: '#fb7185', border: 'rgba(251,113,133,0.25)' },
  TECHNICIAN: { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
  USER: { bg: 'rgba(56,189,248,0.12)', text: '#38bdf8', border: 'rgba(56,189,248,0.25)' },
};

export default function Profile() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <Loading />;
  if (!user) { navigate('/login'); return null; }

  const roleStyle = ROLE_COLORS[user.role] || ROLE_COLORS.USER;

  const fields = [
    { label: 'Full Name', value: user.name, icon: '◈' },
    { label: 'Email Address', value: user.email, icon: '◉' },
    { label: 'User ID', value: `#${user.id}`, icon: '◆', mono: true },
    { label: 'Provider', value: 'Google OAuth2', icon: '◇' },
  ];

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.navBrand}>
          <div style={styles.navDot} />
          <span style={styles.navText}>SmartCampus</span>
        </div>
        <div style={styles.navRight}>
          {user.role === 'ADMIN' && (
            <button
              style={styles.navBtn}
              onClick={() => navigate('/admin')}
              onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
              onMouseLeave={e => e.currentTarget.style.color = '#7a9ab5'}
            >
              Admin Dashboard →
            </button>
          )}
          <button
            style={{ ...styles.navBtn, ...styles.logoutBtn }}
            onClick={handleLogout}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(251,113,133,0.15)'; e.currentTarget.style.borderColor = 'rgba(251,113,133,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.2)'; }}
          >
            Sign out
          </button>
        </div>
      </nav>

      <main style={styles.main}>
        {/* Header card */}
        <div style={styles.headerCard}>
          <div style={styles.avatarRing}>
            {user.imageUrl
              ? <img src={user.imageUrl} alt={user.name} style={styles.avatar} />
              : <div style={styles.avatarFallback}>{user.name?.[0]?.toUpperCase()}</div>
            }
            <div style={styles.onlinePip} />
          </div>
          <div>
            <h1 style={styles.name}>{user.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <span style={{ ...styles.roleBadge, background: roleStyle.bg, color: roleStyle.text, borderColor: roleStyle.border }}>
                {user.role}
              </span>
              <span style={styles.memberTag}>Campus Member</span>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div style={styles.sectionLabel}>ACCOUNT DETAILS</div>
        <div style={styles.fieldsGrid}>
          {fields.map(f => (
            <div key={f.label} style={styles.field}>
              <span style={styles.fieldIcon}>{f.icon}</span>
              <div>
                <div style={styles.fieldLabel}>{f.label}</div>
                <div style={{ ...styles.fieldValue, ...(f.mono ? styles.mono : {}) }}>{f.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Permissions card */}
        <div style={styles.permCard}>
          <div style={styles.permTitle}>Access Level</div>
          <div style={styles.permDesc}>
            {user.role === 'ADMIN' && 'You have full administrative privileges including user management, role assignment, and system configuration.'}
            {user.role === 'TECHNICIAN' && 'You have technician-level access to manage campus resources and maintenance requests.'}
            {user.role === 'USER' && 'You have standard campus user access. Contact an administrator for elevated permissions.'}
          </div>
        </div>
      </main>
    </div>
  );
}

function Loading() {
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
  navBrand: { display: 'flex', alignItems: 'center', gap: 10 },
  navDot: { width: 10, height: 10, borderRadius: '50%', background: '#38bdf8' },
  navText: { fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: '#f0f6ff' },
  navRight: { display: 'flex', alignItems: 'center', gap: 16 },
  navBtn: { background: 'none', border: 'none', color: '#7a9ab5', fontSize: 14, cursor: 'pointer', transition: 'color 0.2s', fontFamily: 'inherit', fontWeight: 500 },
  logoutBtn: { border: '1px solid rgba(56,189,248,0.2)', borderRadius: 8, padding: '6px 14px', color: '#7a9ab5', transition: 'all 0.2s' },
  main: { maxWidth: 680, margin: '0 auto', padding: '48px 24px' },
  headerCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    background: 'rgba(10,20,40,0.7)',
    border: '1px solid rgba(56,189,248,0.15)',
    borderRadius: 18,
    padding: '28px 32px',
    marginBottom: 32,
    backdropFilter: 'blur(12px)',
  },
  avatarRing: { position: 'relative', flexShrink: 0 },
  avatar: { width: 72, height: 72, borderRadius: '50%', border: '2px solid rgba(56,189,248,0.3)', display: 'block' },
  avatarFallback: {
    width: 72, height: 72, borderRadius: '50%',
    background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 28, fontWeight: 800, color: '#050b18',
  },
  onlinePip: {
    position: 'absolute', bottom: 3, right: 3,
    width: 14, height: 14, borderRadius: '50%',
    background: '#22c55e', border: '2px solid #050b18',
  },
  name: { fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' },
  roleBadge: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
    padding: '3px 10px', borderRadius: 6, border: '1px solid',
    fontFamily: "'Geist Mono', monospace", textTransform: 'uppercase',
  },
  memberTag: { fontSize: 13, color: '#3d5a70' },
  sectionLabel: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.15em',
    color: '#3d5a70', fontFamily: "'Geist Mono', monospace",
    marginBottom: 12,
  },
  fieldsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 24,
  },
  field: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    background: 'rgba(10,20,40,0.5)',
    border: '1px solid rgba(56,189,248,0.1)',
    borderRadius: 12,
    padding: '18px 20px',
  },
  fieldIcon: { fontSize: 14, color: '#38bdf8', marginTop: 2 },
  fieldLabel: { fontSize: 11, color: '#3d5a70', letterSpacing: '0.05em', fontFamily: "'Geist Mono', monospace", marginBottom: 5 },
  fieldValue: { fontSize: 15, fontWeight: 600, color: '#d0e8ff' },
  mono: { fontFamily: "'Geist Mono', monospace", fontSize: 14 },
  permCard: {
    background: 'rgba(56,189,248,0.04)',
    border: '1px solid rgba(56,189,248,0.15)',
    borderRadius: 14,
    padding: '20px 24px',
  },
  permTitle: { fontSize: 13, fontWeight: 700, color: '#38bdf8', marginBottom: 8 },
  permDesc: { fontSize: 14, color: '#7a9ab5', lineHeight: 1.7 },
};
