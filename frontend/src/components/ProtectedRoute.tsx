import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrainCircuit } from 'lucide-react';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="relative flex items-center justify-center">
          {/* Animated rings */}
          <div className="absolute w-24 h-24 border-4 border-primary/25 rounded-full"></div>
          <div className="absolute w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
            <BrainCircuit size={28} className="animate-pulse" />
          </div>
        </div>
        <p className="text-muted font-bold text-sm tracking-wide animate-pulse">Authenticating Session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
