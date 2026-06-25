import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      navigate('/app/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card rounded-[24px] p-8 shadow-soft border border-border">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
            <BrainCircuit size={28} />
          </div>
          <h2 className="text-2xl font-extrabold text-text tracking-tight">Welcome back</h2>
          <p className="text-sm text-muted font-medium mt-1">Sign in to your enterprise ATS</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-text mb-1.5">Work Email</label>
            <input type="email" required defaultValue="hr@company.com" 
              className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition outline-none font-medium" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text mb-1.5">Password</label>
            <input type="password" required defaultValue="password"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition outline-none font-medium" />
          </div>
          
          <div className="flex items-center justify-between text-sm font-medium">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded text-primary focus:ring-primary w-4 h-4" />
              <span className="text-text">Remember me</span>
            </label>
            <a href="#" className="text-primary hover:underline">Forgot password?</a>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-primary text-white font-semibold py-3.5 rounded-xl shadow-soft hover:bg-primary/90 transition flex items-center justify-center">
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
