// lib/auth-context.tsx (UPDATED)
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  backendAvailable: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState(false);
  const router = useRouter();

  // Check backend availability on mount
  useEffect(() => {
    checkBackendAvailability();
    checkAuth();
  }, []);

  const checkBackendAvailability = async () => {
    try {
      const response = await fetch('http://localhost:8000/sanctum/csrf-cookie', {
        method: 'GET',
        credentials: 'include',
      });
      setBackendAvailable(response.ok);
    } catch (error) {
      console.warn('Backend not available:', error);
      setBackendAvailable(false);
    }
  };

  const checkAuth = async (): Promise<boolean> => {
    try {
      setLoading(true);
      
      // First try localStorage
      const storedUser = localStorage.getItem('user_data');
      const storedToken = localStorage.getItem('auth_token');
      
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setLoading(false);
        return true;
      }
      
      // Only verify with backend if available
      if (backendAvailable) {
        const response = await fetch('http://localhost:8000/api/user', {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${storedToken}`,
          },
          credentials: 'include',
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          localStorage.setItem('user_data', JSON.stringify(userData));
          return true;
        }
      }
    } catch (error) {
      console.warn('Auth check failed (backend might be down):', error);
    } finally {
      setLoading(false);
    }
    
    return false;
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Check backend first
      if (!backendAvailable) {
        console.error('Backend not available');
        return false;
      }

      // Get CSRF token
      await fetch('http://localhost:8000/sanctum/csrf-cookie', {
        credentials: 'include',
      });

      // Login request
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('user_data', JSON.stringify(data.user));
          
          if (data.token) {
            localStorage.setItem('auth_token', data.token);
          }
          
          return true;
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    }
    
    return false;
  };

  const logout = async () => {
    try {
      if (backendAvailable) {
        await fetch('http://localhost:8000/api/logout', {
          method: 'POST',
          credentials: 'include',
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('user_data');
      localStorage.removeItem('auth_token');
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth, backendAvailable }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}