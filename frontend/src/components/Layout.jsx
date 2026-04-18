import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import AdminSidebar from './AdminSidebar';
import Footer from './Footer';

export default function Layout({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isAdminPage = pathname.startsWith('/admin');

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (adminOnly && user.role !== 'ADMIN') {
      navigate('/home', { replace: true });
    }
  }, [user, loading, adminOnly, navigate]);

  if (loading) return <Spinner />;
  if (!user) return null;
  if (adminOnly && user.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        {isAdminPage && <AdminSidebar />}

        <main className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1">
            {children}
          </div>

          {!isAdminPage && <Footer />}
        </main>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div
        className="w-8 h-8 rounded-full border-2 border-sky-200"
        style={{
          borderTopColor: '#0ea5e9',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}