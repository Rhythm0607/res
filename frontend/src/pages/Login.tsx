import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BrainCircuit, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

// Validation Schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid work email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false)
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setError(null);
      await login(data.email, data.password, data.rememberMe);
      navigate('/app/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        setError('Incorrect email or password.');
      } else {
        setError('Login failed. Please check your network connection and try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-card rounded-[24px] p-8 shadow-soft border border-border">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 hover:scale-105 transition-transform">
            <BrainCircuit size={28} />
          </Link>
          <h2 className="text-2xl font-extrabold text-text tracking-tight">Welcome Back</h2>
          <p className="text-sm text-muted font-medium mt-1">Sign in to your enterprise ATS</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 bg-danger/5 border border-danger/20 rounded-xl text-danger text-xs font-semibold animate-pulse">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Work Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input 
                type="email" 
                placeholder="hr@company.com"
                {...register('email')}
                className={`w-full pl-10 pr-4 py-2.5 bg-background border rounded-xl outline-none text-sm font-semibold transition ${
                  errors.email ? 'border-danger' : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/10'
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
                className={`w-full pl-10 pr-10 py-2.5 bg-background border rounded-xl outline-none text-sm font-semibold transition ${
                  errors.password ? 'border-danger' : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/10'
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

          {/* Remember me & Forgot Password */}
          <div className="flex items-center justify-between text-sm font-semibold">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                {...register('rememberMe')}
                className="rounded border-border text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer" 
              />
              <span className="text-text">Remember me</span>
            </label>
            <button 
              type="button"
              onClick={() => alert("Password reset functionality is not configured in this demo.")}
              className="text-primary hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl shadow-soft disabled:opacity-55 active:scale-95 transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Social Authentication Dividers & Buttons */}
        <div className="my-6 flex items-center justify-between text-xs text-muted font-bold uppercase tracking-wider">
          <span className="w-1/4 h-px bg-border"></span>
          <span>Or sign in with</span>
          <span className="w-1/4 h-px bg-border"></span>
        </div>

        <div className="flex flex-col gap-3">
          {/* Google */}
          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                if (credentialResponse.credential) {
                  try {
                    setError(null);
                    await loginWithGoogle(credentialResponse.credential);
                    navigate('/app/dashboard');
                  } catch (err) {
                    setError('Google Login failed. Please try again.');
                  }
                }
              }}
              onError={() => {
                setError('Google sign-in was unsuccessful.');
              }}
              theme="outline"
              size="large"
              width="384"
            />
          </div>

          {/* GitHub */}
          <button 
            type="button" 
            onClick={() => alert("GitHub Single Sign-On is not configured for this enterprise demo.")}
            className="flex items-center justify-center gap-2.5 py-2.5 border border-border bg-card text-text hover:bg-background rounded-xl text-xs font-bold transition active:scale-95 w-full mt-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            Continue with GitHub
          </button>
        </div>

        {/* Switch Link */}
        <p className="mt-8 text-center text-sm font-semibold text-muted">
          New to HireSense?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}
