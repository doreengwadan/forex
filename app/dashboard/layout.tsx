'use client';

import { useState, useEffect, ReactNode } from 'react';
import DashboardSidebar from '../components/dashboard/Sidebar';
import { Menu, User, ChevronDown } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  membership_type?: string;
  role?: string;
}

export default function DashboardLayout({ 
  children, 
  title = 'Trading Dashboard',
  description = 'Your personal trading command center'
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Check for mobile on mount and resize
  useEffect(() => {
    setMounted(true);
    
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      // On desktop, sidebar is open by default; on mobile, closed
      setSidebarOpen(!mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserStatusColor = (user: UserData | null) => {
    if (!user) return 'bg-gray-500';
    if (user.role === 'admin') return 'bg-red-500';
    if (user.membership_type === 'premium') return 'bg-green-500';
    if (user.membership_type === 'pro') return 'bg-purple-500';
    return 'bg-blue-500';
  };

  const getUserStatusText = (user: UserData | null) => {
    if (!user) return 'Guest';
    if (user.role === 'admin') return 'Administrator';
    if (user.membership_type === 'premium') return 'Premium Member';
    if (user.membership_type === 'pro') return 'Pro Member';
    return 'Free Member';
  };

  // Don't render until after mount to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-gradient-to-r from-blue-600/90 to-indigo-600/90"></div>
          <div className="flex-1 p-6">
            <div className="animate-pulse space-y-8">
              <div>
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Sidebar overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Dashboard Sidebar */}
      <div 
        id="dashboard-sidebar"
        className={`
          fixed lg:sticky top-0 left-0 z-40 
          transform transition-transform duration-300 ease-in-out
          h-screen lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <DashboardSidebar 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Scrollable main area with sticky header */}
        <main className="flex-1 overflow-y-auto">
          {/* Sticky Header */}
          <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                {/* Left side: Title and mobile menu */}
                <div className="flex items-center gap-4">
                  {isMobile && (
                    <button
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className="p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
                      aria-label="Toggle menu"
                    >
                      <Menu className="w-6 h-6" />
                    </button>
                  )}
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                    <p className="text-sm text-gray-600">{description}</p>
                  </div>
                </div>

                {/* Right side: User info (keep all your existing user menu code) */}
                <div className="flex items-center gap-4">
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="hidden md:block">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ) : user ? (
                    <div className="relative">
                      <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-medium text-sm">
                                {getInitials(user.name)}
                              </span>
                            )}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getUserStatusColor(user)}`}></div>
                        </div>
                        <div className="hidden md:block text-left">
                          <p className="font-medium text-gray-900 truncate max-w-[150px]">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${getUserStatusColor(user)}`}></span>
                            {getUserStatusText(user)}
                          </p>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* User Dropdown Menu (keep your existing dropdown code) */}
                      {userMenuOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                          {/* ... keep your existing dropdown content ... */}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => window.location.href = '/login'}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200/50 bg-white/50 backdrop-blur-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="text-sm text-gray-600">
              © {new Date().getFullYear()} Limitless Trading. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}