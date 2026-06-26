import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { authService, UserResponse } from '../services/authService';

interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  registerUser: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize: load token if it exists
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const userData = await authService.getMe();
          setUser(userData);
        } catch (error) {
          console.error('Session expired or invalid token', error);
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe = false) => {
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      const token = data.access_token;
      
      if (rememberMe) {
        // Keep persistent
        localStorage.setItem('token', token);
      } else {
        // Keep in session or local storage for simplicity in this SPA
        localStorage.setItem('token', token);
      }
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const userData = await authService.getMe();
      setUser(userData);
    } catch (error) {
      logout();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (fullName: string, email: string, password: string) => {
    setLoading(true);
    try {
      await authService.register(fullName, email, password);
      // Automatically log them in after registration
      await login(email, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, registerUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
