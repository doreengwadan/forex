'use client';

import { useState, useEffect, ReactNode } from 'react';
import DashboardSidebar from '../components/dashboard/Sidebar';
import { Menu, X, User, ChevronDown } from 'lucide-react';


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
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop: Fixed Sidebar */}
      <div className="hidden lg:block">
        <div className="fixed inset-y-0 left-0 w-64 z-30 bg-gradient-to-b from-blue-50 via-white to-indigo-50 border-r border-blue-200 overflow-y-auto">
          <DashboardSidebar />
        </div>
        {/* Spacer to account for fixed sidebar */}
        <div className="w-64"></div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
        lg:hidden
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <DashboardSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="lg:pl-64 min-h-screen flex flex-col">
      
        
        {/* Page Header with User Info */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Left side: Title and mobile menu */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
                >
                  {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                  <p className="text-sm text-gray-600">{description}</p>
                </div>
              </div>

              {/* Right side: Logged-in user info */}
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
                  <div className="relative group">
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

                    {/* User Dropdown Menu */}
                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                        {/* User Profile Section */}
                        <div className="p-4 border-b border-gray-100">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden mr-3">
                              {user.avatar ? (
                                <img 
                                  src={user.avatar} 
                                  alt={user.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-white font-bold text-lg">
                                  {user.name?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{user.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className={`w-2 h-2 rounded-full ${getUserStatusColor(user)}`}></div>
                                <p className="text-sm text-gray-600">
                                  {getUserStatusText(user)}
                                </p>
                              </div>
                              {user.email && (
                                <p className="text-xs text-gray-500 truncate mt-1">
                                  {user.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          <a
                            href="/dashboard/profile"
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <User className="w-4 h-4 mr-3 text-gray-500" />
                            Profile Settings
                          </a>
                          <a
                            href="/dashboard/payments"
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Subscription & Billing
                          </a>
                          
                          {/* Admin links */}
                          {user.role === 'admin' && (
                            <>
                              <div className="border-t border-gray-100 my-2 pt-2">
                                <p className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                  Admin Panel
                                </p>
                                <a
                                  href="/admin/dashboard"
                                  className="flex items-center px-4 py-3 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                                  onClick={() => setUserMenuOpen(false)}
                                >
                                  <svg className="w-4 h-4 mr-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                  </svg>
                                  Admin Dashboard
                                </a>
                              </div>
                            </>
                          )}
                          
                          <div className="border-t border-gray-100 mt-2 pt-2">
                            <button
                              onClick={() => {
                                setUserMenuOpen(false);
                                handleLogout();
                              }}
                              className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-md"
                            >
                              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              Sign Out
                            </button>
                          </div>
                        </div>
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

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50/30">
          <div className="p-4 sm:p-6 lg:p-8">
     

            {/* Dashboard Stats - Only show on main dashboard */}
            {title === 'Trading Dashboard' && (
              <div className="mb-6 sm:mb-8 lg:mb-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Welcome back{user ? `, ${user.name.split(' ')[0]}!` : '!'} 👋
                    </h1>
                    <p className="text-gray-600 mt-2">Here's what's happening with your trading journey today.</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Mobile sidebar toggle */}
                    <button
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
                    >
                      {sidebarOpen ? (
                        <>
                          <X className="w-5 h-5" />
                          <span>Close Menu</span>
                        </>
                      ) : (
                        <>
                          <Menu className="w-5 h-5" />
                          <span>Open Menu</span>
                        </>
                      )}
                    </button>
                    
                    
                    
                  </div>
                </div>
                
                </div>
                  
              
            )}
            
            {/* Main Content */}
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}