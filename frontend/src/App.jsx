import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
 
// Public
import Login        from './pages/Login';
import OAuthSuccess from './pages/OAuthSuccess';
 
// Authenticated
import Home    from './pages/Home';
import Profile from './pages/Profile';
import Resources from './pages/Resources';  // ← ADD THIS IMPORT
import Bookings from './pages/Bookings';
//import TicketForm from './components/tickets/TicketForm'; 
import TicketListPage from './pages/tickets/TicketListPage';
import CreateTicket from './pages/tickets/CreateTicket';
import TicketDetailPage from './pages/tickets/TicketDetailPage';
// Admin
import AdminHub           from './pages/admin/AdminHub';
import AdminUsers         from './pages/admin/AdminUsers';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminReports       from './pages/admin/AdminReports';
import ResourceListPage   from './pages/admin/ResourceListPage';
import AddResourcePage    from './pages/admin/AddResourcePage';
import EditResourcePage   from './pages/admin/EditResourcePage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"         element={<Login />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />
 
          {/* Default → home */}
          <Route path="/" element={<Navigate to="/home" replace />} />
 
          {/* Authenticated (no sidebar) */}
          <Route path="/home"    element={<Home />} />
          <Route path="/resources" element={<Resources />} />  {/* ← Now this will work */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/tickets" element={<TicketListPage />} />
          <Route path="/tickets/new" element={<CreateTicket />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
          {/* Admin routes (sidebar appears) */}
          <Route path="/admin" element={<AdminHub />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/resources" element={<ResourceListPage />} />
          <Route path="/admin/resources/add" element={<AddResourcePage />} />
          <Route path="/admin/resources/edit/:id" element={<EditResourcePage />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/reports" element={<AdminReports />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;