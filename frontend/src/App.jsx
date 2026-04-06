import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import OAuthSuccess from './pages/OAuthSuccess';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import ResourceListPage from './pages/ResourceListPage';
import AddResourcePage from "./pages/AddResourcePage";
import EditResourcePage from "./pages/EditResourcePage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/resources" element={<ResourceListPage />} />
          <Route path="/resources/add" element={<AddResourcePage />} />
          <Route path="/resources/edit/:id" element={<EditResourcePage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
