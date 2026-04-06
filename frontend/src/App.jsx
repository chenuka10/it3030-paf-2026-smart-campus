import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
 
// Public
import Login        from './pages/Login';
import OAuthSuccess from './pages/OAuthSuccess';
 
// Authenticated
import Home    from './pages/Home';
import Profile from './pages/Profile';
 
// Admin
import AdminHub           from './pages/admin/AdminHub';
import AdminUsers         from './pages/admin/AdminUsers';
import AdminResources     from './pages/admin/AdminResources';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminReports       from './pages/admin/AdminReports';

import ResourceListPage from './pages/ResourceListPage';
import AddResourcePage from "./pages/AddResourcePage";
import EditResourcePage from "./pages/EditResourcePage";
import Resources from './pages/Resources';

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
 
          {/* Authenticated */}
          <Route path="/home"    element={<Home />} />
          <Route path="/profile" element={<Profile />} />
 
          {/* Admin hub + sub-pages (sidebar auto-appears) */}
          <Route path="/admin"               element={<AdminHub />} />
          <Route path="/admin/users"         element={<AdminUsers />} />
          <Route path="/admin/resources"     element={<AdminResources />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/reports"       element={<AdminReports />} />
 
          {/* Resource pages — uncomment & import when ready */}
          {/* <Route path="/resources"          element={<ResourceListPage />} /> */}
          {/* <Route path="/resources/add"      element={<AddResourcePage />} /> */}
          {/* <Route path="/resources/edit/:id" element={<EditResourcePage />} /> */}

          <Route path="/resourceslist" element={<ResourceListPage />} />
          <Route path="/resources/add" element={<AddResourcePage />} />
          <Route path="/resources/edit/:id" element={<EditResourcePage />} />
          <Route path="/resources" element={<Resources />} />


          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
