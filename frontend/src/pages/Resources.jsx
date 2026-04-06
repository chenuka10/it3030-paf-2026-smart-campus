import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function Resources() {
  const { user } = useAuth();

  return (
    <Layout>
      <div style={s.page}>
        <h1 style={s.title}>Resources</h1>
        <p style={s.sub}>This is the Resources page for {user?.name || 'user'}.</p>

        {/* Placeholder content */}
        <div style={s.placeholder}>
          <p>No resources loaded yet. This area will display campus resources.</p>
        </div>
      </div>
    </Layout>
  );
}

// --- Simple inline styles ---
const s = {
  page: {
    padding: '2rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
  },
  sub: {
    fontSize: '1rem',
    marginBottom: '1.5rem',
    color: '#a0b0c0',
  },
  placeholder: {
    padding: '2rem',
    background: '#0b1524',
    borderRadius: '0.5rem',
    textAlign: 'center',
    color: '#7a9ab5',
  },
};