'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Shield, 
  Lock, 
  Mail, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Database,
  BarChart3,
  Users,
  Key,
  Server
} from 'lucide-react';

export default function AdminLoginPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(true); // Toggle between admin/regular login

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (message) setMessage(null);
  };

  // ADMIN API CALL FUNCTION
  const adminLogin = async (data: { email: string; password: string }) => {
    try {
      // Get CSRF token
      const csrfResponse = await fetch('http://localhost:8000/sanctum/csrf-cookie', {
        method: 'GET',
        credentials: 'include',
      });

      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }

      // Make admin login request - note the different endpoint
      const response = await fetch('http://localhost:8000/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      console.log('Admin Login API Response:', responseData);

      if (!response.ok) {
        if (response.status === 422) {
          return {
            success: false,
            message: 'Validation failed',
            errors: responseData.errors || responseData,
          };
        }
        if (response.status === 403) {
          return {
            success: false,
            message: 'Access denied. Admin privileges required.',
          };
        }
        return {
          success: false,
          message: responseData.message || `Login failed: ${response.status}`,
        };
      }

      return {
        success: true,
        message: responseData.message || 'Admin login successful!',
        data: responseData,
      };
    } catch (error: any) {
      console.error('Admin login error:', error);
      return {
        success: false,
        message: error.message || 'Admin login failed. Please try again.',
      };
    }
  };

  // Regular user login (for toggle)
  const regularLogin = async (data: { email: string; password: string }) => {
    try {
      const csrfResponse = await fetch('http://localhost:8000/sanctum/csrf-cookie', {
        method: 'GET',
        credentials: 'include',
      });

      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }

      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 422) {
          return {
            success: false,
            message: 'Validation failed',
            errors: responseData.errors || responseData,
          };
        }
        return {
          success: false,
          message: responseData.message || `Login failed: ${response.status}`,
        };
      }

      return {
        success: true,
        message: responseData.message || 'Login successful!',
        data: responseData,
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Login failed. Please try again.',
      };
    }
  };
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
  
    // Basic validation
    if (!form.email.trim() || !form.password.trim()) {
      setMessage({ type: 'error', text: 'Please enter both email and password' });
      return;
    }
  
    setLoading(true);
    setMessage(null);
  
    try {
      console.log('Logging in as:', isAdminLogin ? 'Admin' : 'User', { email: form.email });
  
      const response = isAdminLogin 
        ? await adminLogin({ email: form.email, password: form.password })
        : await regularLogin({ email: form.email, password: form.password });
  
      console.log('Login Response:', response);
  
      if (response.success) {
        setMessage({ 
          type: 'success', 
          text: response.message || 'Login successful! Redirecting...' 
        });
        
        // Store auth data with multiple token names for compatibility
        if (response.data?.token) {
          localStorage.setItem('auth_token', response.data.token);
          localStorage.setItem('admin_token', response.data.token);  // ADD THIS
          localStorage.setItem('token', response.data.token);        // ADD THIS
        }
        if (response.data?.user) {
          localStorage.setItem('user_data', JSON.stringify(response.data.user));
          
          // Store role separately for quick access
          if (response.data.user.role) {
            localStorage.setItem('user_role', response.data.user.role);
          }
        }
  
        setTimeout(() => {
          // Redirect based on role
          if (isAdminLogin && response.data?.user?.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
        }, 100);
        return;
      }
  
      // Handle validation errors
      if (response.errors) {
        const firstError = Object.values(response.errors)[0];
        setMessage({ 
          type: 'error', 
          text: Array.isArray(firstError) ? firstError[0] : firstError || 'Please fix the form errors.' 
        });
        return;
      }
  
      // Handle other errors
      if (!response.success && response.message) {
        setMessage({ 
          type: 'error', 
          text: response.message 
        });
        return;
      }
  
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Please ensure Laravel backend is running.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  }
  
  
  // Quick admin access (for development)
  const quickAdminAccess = () => {
    setForm({
      email: 'admin@tradingplatform.com',
      password: 'admin123'
    });
    setMessage({ 
      type: 'success', 
      text: 'Admin credentials pre-filled. Click "Sign In as Admin" to login.' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-gray-800/10 -z-10" />
      
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Admin Features */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-gray-800/50 via-gray-900/30 to-gray-800/50 rounded-2xl p-8 border border-gray-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Admin Portal</h1>
                <p className="text-gray-400">Trading Platform Management System</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-gray-300">User Management & Analytics</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Database className="h-4 w-4 text-green-400" />
                </div>
                <span className="text-gray-300">Database Administration</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-purple-400" />
                </div>
                <span className="text-gray-300">Platform Analytics & Reports</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <Settings className="h-4 w-4 text-red-400" />
                </div>
                <span className="text-gray-300">System Configuration</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 text-center backdrop-blur-sm">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Server className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">Secure</div>
              <div className="text-sm text-gray-400">Enterprise Security</div>
            </div>
            
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 text-center backdrop-blur-sm">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Key className="h-6 w-6 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white">Admin</div>
              <div className="text-sm text-gray-400">Privileged Access</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-2xl p-8 border border-blue-700/30">
            <h3 className="text-xl font-bold mb-4 text-white">Security Notice</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="h-3 w-3 text-red-400" />
                </div>
                <p className="text-sm text-gray-300">
                  This portal contains sensitive administrative functions. Access is restricted to authorized personnel only.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="h-3 w-3 text-yellow-400" />
                </div>
                <p className="text-sm text-gray-300">
                  All activities are logged and monitored. Unauthorized access attempts will be reported.
                </p>
              </div>
            </div>
          </div>

          {/* Quick access for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-yellow-900/20 rounded-lg border border-yellow-700/30">
              <button
                type="button"
                onClick={quickAdminAccess}
                className="text-sm text-yellow-300 hover:text-yellow-200 w-full text-left"
              >
                🔐 Development: Load Admin Credentials
              </button>
            </div>
          )}
        </div>

        {/* Right Side - Admin Login Form */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-8 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Administrator Access</h2>
                <p className="text-gray-400 text-sm mt-1">Restricted management portal</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Regular user?</div>
                <button
                  onClick={() => setIsAdminLogin(!isAdminLogin)}
                  className="inline-flex items-center gap-2 text-sm font-semibold bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-all mt-1 text-gray-300"
                >
                  {isAdminLogin ? 'User Login' : 'Admin Login'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Login Type Indicator */}
            <div className={`rounded-lg p-3 mb-6 ${isAdminLogin ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-gray-700/30 border border-gray-600/30'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isAdminLogin ? 'bg-blue-500' : 'bg-gray-500'}`}></div>
                <span className="text-sm font-medium text-gray-300">
                  {isAdminLogin ? 'Administrator Login' : 'Regular User Login'}
                </span>
              </div>
            </div>

            {message && (
              <div
                className={`rounded-xl p-4 text-sm font-medium backdrop-blur-sm border mb-6 ${
                  message.type === 'success'
                    ? 'bg-green-500/10 text-green-300 border-green-500/20'
                    : 'bg-red-500/10 text-red-300 border-red-500/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  {message.type === 'success' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                  <span>{message.text}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="admin@tradingplatform.com"
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-gray-500"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Password *
                  </label>
                  <Link 
                    href="/admin/forgot-password" 
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl pl-12 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-gray-500"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                    <Shield className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-300">Two-Factor Authentication</div>
                    <div className="text-xs text-gray-500">Required for admin access</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Secure Connection</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 ${
                  loading
                    ? 'bg-gray-700 cursor-not-allowed'
                    : isAdminLogin 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                      : 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-3"></div>
                    {isAdminLogin ? 'Authenticating...' : 'Signing In...'}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-lg">
                      {isAdminLogin ? 'Sign In as Admin' : 'Sign In as User'}
                    </span>
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-800/50 text-gray-500">
                    Advanced access
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setMessage({ type: 'error', text: 'SSO authentication coming soon!' })}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 border border-gray-700 rounded-xl hover:bg-gray-700/50 transition-colors text-gray-300"
                  disabled={loading}
                >
                  <Key className="h-4 w-4" />
                  <span>Single Sign-On (SSO)</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setMessage({ type: 'error', text: 'Emergency access requires additional verification!' })}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 border border-red-700/50 rounded-xl hover:bg-red-900/20 transition-colors text-red-300"
                  disabled={loading}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>Emergency Access</span>
                </button>
              </div>

              <div className="text-center pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-500">
                  {isAdminLogin ? (
                    <>
                      Need help?{' '}
                      <Link 
                        href="/admin/support" 
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        Contact Super Admin
                      </Link>
                    </>
                  ) : (
                    <>
                      Don't have an account?{' '}
                      <Link 
                        href="/register" 
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        Create Trading Account
                      </Link>
                    </>
                  )}
                </p>
              </div>
            </form>

            {/* Security Footer */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  <span>v1.0.0 • Production</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>All systems operational</span>
                </div>
              </div>
              <div className="text-center mt-4">
                <Link 
                  href="/admin/audit-log" 
                  className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
                >
                  🔍 View access audit logs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  }

