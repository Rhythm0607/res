import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import DashboardLayout from '@/layouts/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import JobManagement from '@/pages/JobManagement';
import ResumeChatbot from '@/pages/ResumeChatbot';
import CandidateRanking from '@/pages/CandidateRanking';
import Settings from '@/pages/Settings';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  const googleClientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || "1098679541315-k1djspe958m1kbh3v1oef96k48i1sk2f.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/app" element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="jobs" element={<JobManagement />} />
              <Route path="candidates" element={<CandidateRanking />} />
              <Route path="chat" element={<ResumeChatbot />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </GoogleOAuthProvider>
);
}

export default App;
