import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Home() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <Layout>
      <div style={s.container}>
        <div style={s.card}>
          <div style={s.badge}>WORK IN PROGRESS</div>
          
          <h1 style={s.title}>
            Welcome back, <span style={s.accent}>{firstName}</span>.
          </h1>
          
          <p style={s.subtitle}>
            We're currently refining your SmartCampus experience. 
            The full dashboard will be available shortly.
          </p>

          <div style={s.divider} />

          <div style={s.status}>
            <span style={s.pulse} />
            System Status: <span style={s.statusText}>Building Greatness</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}

const s = {
  container: {
    height: '80vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  card: {
    maxWidth: '500px',
    textAlign: 'center',
    padding: '40px',
    background: 'rgba(10, 20, 40, 0.4)',
    border: '1px solid rgba(56, 189, 248, 0.15)',
    borderRadius: '24px',
    backdropFilter: 'blur(10px)',
  },
  badge: {
    display: 'inline-block',
    padding: '6px 12px',
    background: 'rgba(56, 189, 248, 0.1)',
    color: '#38bdf8',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.1em',
    borderRadius: '100px',
    marginBottom: '24px',
    border: '1px solid rgba(56, 189, 248, 0.2)',
  },
  title: {
    fontSize: '32px',
    color: '#f0f6ff',
    margin: '0 0 16px 0',
    fontWeight: '700',
  },
  accent: {
    color: '#38bdf8',
  },
  subtitle: {
    fontSize: '16px',
    color: '#7a9ab5',
    lineHeight: '1.6',
    margin: '0 auto 32px auto',
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.2), transparent)',
    marginBottom: '32px',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    fontSize: '13px',
    color: '#3d5a70',
    fontFamily: "'Geist Mono', monospace",
  },
  statusText: {
    color: '#38bdf8',
  },
  pulse: {
    width: '8px',
    height: '8px',
    backgroundColor: '#22c55e',
    borderRadius: '50%',
    boxShadow: '0 0 0 rgba(34, 197, 94, 0.4)',
    animation: 'pulse 2s infinite',
  },
};

// Add this to your global CSS if you want the dot to pulse:
// @keyframes pulse {
//   0% { box-shadow: 0 0 0 0px rgba(34, 197, 94, 0.7); }
//   70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
//   100% { box-shadow: 0 0 0 0px rgba(34, 197, 94, 0); }
// }