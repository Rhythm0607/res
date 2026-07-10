import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BrainCircuit, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Validation Schema
const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid work email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const { registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setError(null);
      await registerUser(data.fullName, data.email, data.password);
      navigate('/app/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Registration failed. The email might already be registered.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(226,251,108,0.28),_transparent_35%),linear-gradient(135deg,_#f7f8f4_0%,_#ebece8_100%)] flex items-center justify-center p-6 font-sans">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-border bg-card shadow-[0_24px_80px_-35px_rgba(0,72,56,0.25)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden bg-secondary p-10 text-background lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
              <BrainCircuit size={14} /> HireSense AI
            </div>
            <h2 className="mt-6 text-3xl font-black tracking-tight">Set up your recruiting workspace.</h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-background/80">Start with a polished recruiting hub that helps your team review talent faster and collaborate with less friction.</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/10 p-5 text-sm text-background/80">
            <p className="font-semibold text-background">Fast, structured onboarding</p>
            <p className="mt-2">Bring your jobs, candidates, and interview workflow into one premium operating surface.</p>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="flex flex-col items-center mb-8">
            <Link to="/" className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 hover:scale-105 transition-transform">
              <BrainCircuit size={28} />
            </Link>
            <h2 className="text-2xl font-extrabold text-text tracking-tight">Create Account</h2>
            <p className="text-sm text-muted font-medium mt-1">Get started with HireSense AI screening</p>
          </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 bg-danger/5 border border-danger/20 rounded-xl text-danger text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input
                type="text"
                placeholder="e.g. John Doe"
                {...register('fullName')}
                className={`w-full pl-10 pr-4 py-2.5 bg-background border rounded-xl outline-none text-sm font-semibold transition ${errors.fullName ? 'border-danger focus:ring-2 focus:ring-danger/10' : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/10'
                  }`}
              />
            </div>
            {errors.fullName && <p className="text-danger text-[11px] mt-1 font-medium">{errors.fullName.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Work Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input
                type="email"
                placeholder="you@company.com"
                {...register('email')}
                className={`w-full pl-10 pr-4 py-2.5 bg-background border rounded-xl outline-none text-sm font-semibold transition ${errors.email ? 'border-danger' : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/10'
                  }`}
              />
            </div>
            {errors.email && <p className="text-danger text-[11px] mt-1 font-medium">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                className={`w-full pl-10 pr-10 py-2.5 bg-background border rounded-xl outline-none text-sm font-semibold transition ${errors.password ? 'border-danger' : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/10'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-danger text-[11px] mt-1 font-medium">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('confirmPassword')}
                className={`w-full pl-10 pr-4 py-2.5 bg-background border rounded-xl outline-none text-sm font-semibold transition ${errors.confirmPassword ? 'border-danger' : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/10'
                  }`}
              />
            </div>
            {errors.confirmPassword && <p className="text-danger text-[11px] mt-1 font-medium">{errors.confirmPassword.message}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl shadow-soft disabled:opacity-55 active:scale-95 transition flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Social Authentication Dividers & Buttons */}
        <div className="my-6 flex items-center justify-between text-xs text-muted font-bold uppercase tracking-wider">
          <span className="w-1/4 h-px bg-border"></span>
          <span>Or register with</span>
          <span className="w-1/4 h-px bg-border"></span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Google */}
          <button
            type="button"
            onClick={() => alert("Google Single Sign-On is not configured for this enterprise demo.")}
            className="flex items-center justify-center gap-2.5 py-2.5 border border-border bg-card text-text hover:bg-background rounded-xl text-xs font-bold transition active:scale-95"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.98 1 12 1 7.35 1 3.37 3.68 1.42 7.57l3.85 2.99C6.18 7.37 8.87 5.04 12 5.04z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.44c-.28 1.46-1.1 2.69-2.33 3.51l3.62 2.81c2.12-1.95 3.76-4.83 3.76-8.5z" />
              <path fill="#FBBC05" d="M5.27 14.44c-.25-.75-.39-1.56-.39-2.44s.14-1.69.39-2.44L1.42 6.57C.51 8.39 0 10.42 0 12.5s.51 4.11 1.42 5.93l3.85-2.99z" />
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.62-2.81c-1.1.74-2.51 1.18-4.34 1.18-3.13 0-5.82-2.33-6.77-5.52L1.38 15.93C3.33 19.82 7.31 22.5 12 23z" />
            </svg>
            Google
          </button>

          {/* GitHub */}
          <button
            type="button"
            onClick={() => alert("GitHub Single Sign-On is not configured for this enterprise demo.")}
            className="flex items-center justify-center gap-2.5 py-2.5 border border-border bg-card text-text hover:bg-background rounded-xl text-xs font-bold transition active:scale-95"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            GitHub
          </button>
        </div>

          {/* Switch Link */}
          <p className="mt-8 text-center text-sm font-semibold text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
