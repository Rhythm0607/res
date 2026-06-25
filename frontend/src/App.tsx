import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/Login';
import DashboardLayout from '@/layouts/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import JobManagement from '@/pages/JobManagement';
import ResumeChatbot from '@/pages/ResumeChatbot';
import CandidateRanking from '@/pages/CandidateRanking';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="jobs" element={<JobManagement />} />
          <Route path="candidates" element={<CandidateRanking />} />
          <Route path="chat" element={<ResumeChatbot />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
