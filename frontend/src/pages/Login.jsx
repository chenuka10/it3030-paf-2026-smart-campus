import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/profile');
  }, [user, loading, navigate]);

  return (
    <div style={styles.page}>
      <div style={styles.grid} aria-hidden="true">
        {Array.from({ length: 120 }).map((_, i) => (
          <div key={i} style={styles.cell} />
        ))}
      </div>

      <div style={styles.card}>
        {/* Logo mark */}
        <div style={styles.logoWrap}>
          <div style={styles.logoOuter}>
            <div style={styles.logoInner} />
          </div>
        </div>

        <div style={styles.badge}>SLIIT SmartCampus</div>
        <h1 style={styles.title}>
          Welcome<br />
          <span style={styles.titleAccent}>back.</span>
        </h1>
        <p style={styles.sub}>
          Sign in to access your campus portal, manage resources, and stay connected.
        </p>

        {/* The critical <a> tag — not a button */}
        <a
          href="http://localhost:8081/oauth2/authorization/google"
          style={styles.googleLink}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.color = '#0a0f1e';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(56,189,248,0.25)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#f0f6ff';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <GoogleIcon />
          Continue with Google
        </a>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>Secure · Encrypted · Institutional</span>
          <span style={styles.dividerLine} />
        </div>

        <p style={styles.footer}>
          By continuing, you agree to SLIIT's terms of use and data policy.
        </p>
      </div>

      {/* Decorative orb */}
      <div style={styles.orb} />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,19.001,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#050b18',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  grid: {
    position: 'absolute',
    inset: 0,
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gridTemplateRows: 'repeat(10, 1fr)',
    opacity: 0.06,
    pointerEvents: 'none',
  },
  cell: {
    border: '1px solid #38bdf8',
  },
  orb: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    zIndex: 10,
    background: 'rgba(10, 20, 40, 0.85)',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    borderRadius: 20,
    padding: '52px 48px',
    width: '100%',
    maxWidth: 420,
    backdropFilter: 'blur(20px)',
    boxShadow: '0 0 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
    animation: 'fadeSlideUp 0.6s ease both',
  },
  logoWrap: {
    marginBottom: 28,
  },
  logoOuter: {
    width: 52,
    height: 52,
    borderRadius: 14,
    background: 'rgba(56,189,248,0.1)',
    border: '1px solid rgba(56,189,248,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: {
    width: 24,
    height: 24,
    borderRadius: 6,
    background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
    transform: 'rotate(45deg)',
  },
  badge: {
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#38bdf8',
    marginBottom: 16,
    fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
  },
  title: {
    fontSize: 42,
    fontWeight: 800,
    lineHeight: 1.1,
    color: '#f0f6ff',
    margin: '0 0 16px',
    letterSpacing: '-0.03em',
  },
  titleAccent: {
    color: '#38bdf8',
  },
  sub: {
    fontSize: 14,
    color: '#7a9ab5',
    lineHeight: 1.7,
    margin: '0 0 36px',
  },
  googleLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    padding: '14px 24px',
    background: 'transparent',
    color: '#f0f6ff',
    border: '1px solid rgba(240,246,255,0.25)',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: '-0.01em',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '28px 0 20px',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: 'rgba(56,189,248,0.1)',
  },
  dividerText: {
    fontSize: 10,
    color: '#3d5a70',
    letterSpacing: '0.08em',
    fontFamily: "'Geist Mono', monospace",
    whiteSpace: 'nowrap',
  },
  footer: {
    fontSize: 12,
    color: '#3d5a70',
    textAlign: 'center',
    lineHeight: 1.6,
    margin: 0,
  },
};
