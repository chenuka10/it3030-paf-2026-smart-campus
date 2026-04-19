import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Public
import Login from './pages/Login';
import Register from './pages/Register';
import OAuthSuccess from './pages/OAuthSuccess';

// Authenticated
import Home from './pages/Home';
import Profile from './pages/Profile';
import Resources from './pages/Resources';
import Bookings from './pages/Bookings';
import TicketListPage from './pages/tickets/TicketListPage';
import CreateTicket from './pages/tickets/CreateTicket';
import TicketDetailPage from './pages/tickets/TicketDetailPage';

// Admin
import AdminHub from './pages/admin/AdminHub';
import AdminUsers from './pages/admin/AdminUsers';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminReports from './pages/admin/AdminReports';
import ResourceUtilizationDashboard from './pages/admin/ResourceUtilizationDashboard';
import ResourceListPage from './pages/admin/ResourceListPage';
import AddResourcePage from './pages/admin/AddResourcePage';
import EditResourcePage from './pages/admin/EditResourcePage';
import AdminBookings from './pages/admin/AdminBookings';
import AdminCheckIn from './pages/admin/AdminCheckIn';

// Role routing
import RoleRedirect from './routes/RoleRedirect';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />

          {/* Root decides landing by role */}
          <Route path="/" element={<RoleRedirect />} />

          {/* User / shared authenticated routes */}
          <Route path="/home" element={<Home />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/tickets" element={<TicketListPage />} />
          <Route path="/tickets/new" element={<CreateTicket />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminHub />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/resources" element={<ResourceListPage />} />
          <Route path="/admin/resources/add" element={<AddResourcePage />} />
          <Route path="/admin/resources/edit/:id" element={<EditResourcePage />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/reports/resource-utilization" element={<ResourceUtilizationDashboard />} />
          <Route path="/admin/bookings" element={<AdminBookings />} />
          <Route path="/admin/check-in" element={<AdminCheckIn />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;