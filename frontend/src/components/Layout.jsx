import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import AdminSidebar from './AdminSidebar';

export default function Layout({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isAdminPage = pathname.startsWith('/admin');

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/login'); return; }
    if (adminOnly && user.role !== 'ADMIN') { navigate('/home'); }
  }, [user, loading, adminOnly]);

  if (loading) return <Spinner />;
  if (!user)   return null;
  if (adminOnly && user.role !== 'ADMIN') return null;

  return (
  <div style={s.root}>
    {!isAdminPage && <Navbar />}   {/* ✅ hide navbar on admin pages */}

    <div style={s.body}>
      {isAdminPage && <AdminSidebar />}   {/* ✅ only admin pages get sidebar */}

      <main style={{ ...s.main, ...(isAdminPage ? s.mainWithSidebar : {}) }}>
        {children}
      </main>
    </div>
  </div>
);
}

function Spinner() {
  return (
    <div style={{ minHeight: '100vh', background: '#050b18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(56,189,248,0.15)', borderTopColor: '#38bdf8', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const s = {
  root: {
    minHeight: '100vh',
    background: '#050b18',
    fontFamily: "'DM Sans', sans-serif",
    color: '#f0f6ff',
    display: 'flex', flexDirection: 'column',
  },
  body: { display: 'flex', flex: 1 },
  main: { flex: 1, minWidth: 0 },
  mainWithSidebar: { padding: 0 },
};