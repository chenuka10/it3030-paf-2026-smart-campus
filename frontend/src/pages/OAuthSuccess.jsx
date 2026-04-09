import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OAuthSuccess() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const called = useRef(false); // Prevent double-invocation in StrictMode

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const token = searchParams.get('token');

    if (!token) {
      navigate('/login');
      return;
    }

    // Save token and fetch user profile, then redirect
    login(token)
      .then(() => navigate('/', { replace: true }))
      .catch(() => navigate('/login', { replace: true }));
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.spinnerWrap}>
          <div style={styles.spinner} />
        </div>
        <p style={styles.label}>Authenticating</p>
        <div style={styles.dots}>
          <span style={{ ...styles.dot, animationDelay: '0s' }} />
          <span style={{ ...styles.dot, animationDelay: '0.2s' }} />
          <span style={{ ...styles.dot, animationDelay: '0.4s' }} />
        </div>
        <p style={styles.sub}>Verifying your credentials…</p>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#050b18',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  spinnerWrap: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: 'rgba(56,189,248,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(56,189,248,0.2)',
  },
  spinner: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: '2px solid rgba(56,189,248,0.15)',
    borderTopColor: '#38bdf8',
    animation: 'spin 0.8s linear infinite',
  },
  label: {
    color: '#f0f6ff',
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
    letterSpacing: '-0.02em',
  },
  dots: {
    display: 'flex',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#38bdf8',
    display: 'inline-block',
    animation: 'dotPulse 1.4s ease-in-out infinite',
  },
  sub: {
    color: '#3d5a70',
    fontSize: 13,
    margin: 0,
    fontFamily: "'Geist Mono', monospace",
    letterSpacing: '0.02em',
  },
};
