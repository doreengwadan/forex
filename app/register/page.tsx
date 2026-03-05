'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
  first_name: string;
  last_name: string;
}

const registerUser = async (data: RegisterData) => {
  try {
    const csrfResponse = await fetch('http://localhost:8000/sanctum/csrf-cookie', {
      method: 'GET',
      credentials: 'include',
    });

    if (!csrfResponse.ok) {
      throw new Error('Failed to get CSRF token');
    }

    const response = await fetch('http://localhost:8000/api/register', {
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
    console.log('API Response:', responseData);

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
        message: responseData.message || `Registration failed: ${response.status}`,
      };
    }

    return {
      success: true,
      message: responseData.message || 'Registration successful!',
      data: responseData,
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: error.message || 'Registration failed. Please try again.',
    };
  }
};

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
    first_name: '',
    last_name: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!form.username.trim()) errors.username = 'Username is required';
    if (!form.email.trim()) errors.email = 'Email is required';
    if (!form.password.trim()) errors.password = 'Password is required';
    if (!form.password_confirmation.trim()) errors.password_confirmation = 'Please confirm your password';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.email && !emailRegex.test(form.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (form.password !== form.password_confirmation) {
      errors.password_confirmation = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, text: 'Enter password', color: 'bg-gray-300' };
    
    let score = 0;
    
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 20;
    if (/[A-Z]/.test(password)) score += 20;
    if (/[a-z]/.test(password)) score += 20;
    if (/\d/.test(password)) score += 20;
    if (/[^A-Za-z0-9]/.test(password)) score += 20;
    
    score = Math.min(score, 100);
    
    if (score >= 80) return { score, text: 'Very Strong', color: 'bg-green-500' };
    if (score >= 60) return { score, text: 'Strong', color: 'bg-blue-500' };
    if (score >= 40) return { score, text: 'Good', color: 'bg-yellow-500' };
    if (score >= 20) return { score, text: 'Weak', color: 'bg-orange-500' };
    return { score, text: 'Very Weak', color: 'bg-red-500' };
  };

  const hasError = (fieldName: string) => fieldErrors[fieldName];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setMessage(null);
    setFieldErrors({});

    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Please fix validation errors before submitting.' });
      return;
    }

    setLoading(true);

    try {
      console.log('Submitting form data:', form);
      
      const response = await registerUser(form);

      console.log('API Response:', response);

      if (response.success) {
        setMessage({ 
          type: 'success', 
          text: response.message || 'Registration successful! Redirecting...' 
        });

        setForm({
          username: '',
          email: '',
          password: '',
          password_confirmation: '',
          first_name: '',
          last_name: '',
        });

        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
        return;
      }

      if (response.errors) {
        const errors: { [key: string]: string } = {};
        Object.entries(response.errors).forEach(([key, value]) => {
          errors[key] = Array.isArray(value) ? value[0] : value;
        });
        setFieldErrors(errors);
        
        const firstError = Object.values(errors)[0];
        setMessage({ type: 'error', text: firstError || 'Please fix the form errors.' });
        return;
      }

      if (!response.success && response.message) {
        setMessage({ type: 'error', text: response.message });
        return;
      }

    } catch (error: any) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
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

  const passwordStrength = getPasswordStrength(form.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full lg:max-w-2xl">
        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Limitless Trading</h1>
                <p className="text-blue-100 text-sm mt-1">Mentorship Platform</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-blue-200">Already have an account?</div>
                <Link 
                  href="/login" 
                  className="inline-flex items-center gap-2 text-sm font-semibold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all mt-1"
                >
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="mt-6">
              <h2 className="text-2xl font-bold">Create Your Trading Account</h2>
              <p className="text-blue-100 mt-2">Join thousands of successful traders</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {message && (
              <div className={`rounded-xl p-4 text-sm font-medium ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="John"
                  className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    hasError('first_name')
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {hasError('first_name') && (
                  <p className="text-red-600 text-xs mt-2">{fieldErrors.first_name}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Doe"
                  className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    hasError('last_name')
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {hasError('last_name') && (
                  <p className="text-red-600 text-xs mt-2">{fieldErrors.last_name}</p>
                )}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username *
              </label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="tradingpro123"
                className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                  hasError('username')
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                required
              />
              {hasError('username') && (
                <p className="text-red-600 text-xs mt-2">{fieldErrors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                  hasError('email')
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                required
              />
              {hasError('email') && (
                <p className="text-red-600 text-xs mt-2">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a password (min 8 characters)"
                  className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 pr-12 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    hasError('password')
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {form.password && (
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Password Strength: {passwordStrength.text}
                    </span>
                    <span className="text-sm font-bold">
                      {passwordStrength.score}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                </div>
              )}

              {hasError('password') && (
                <p className="text-red-600 text-xs mt-2">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="password_confirmation"
                  value={form.password_confirmation}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 pr-12 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    hasError('password_confirmation') || form.password !== form.password_confirmation
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {hasError('password_confirmation') && (
                <p className="text-red-600 text-xs mt-2">{fieldErrors.password_confirmation}</p>
              )}
              {form.password_confirmation && form.password !== form.password_confirmation && (
                <p className="text-red-600 text-xs mt-2">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-3"></div>
                  Creating Account...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <span className="text-lg">Start Trading Journey</span>
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                By registering, you agree to our{' '}
                <Link href="/terms" className="text-blue-600 hover:text-blue-800 font-medium">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-800 font-medium">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}