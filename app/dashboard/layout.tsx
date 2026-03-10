'use client';

import { useState, useEffect, ReactNode } from 'react';
import DashboardSidebar from '../components/dashboard/Sidebar';
import { Menu, User, ChevronDown, Settings, LogOut, Shield, HelpCircle, Bell, CreditCard } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar?: string;
  avatar_url?: string;
  membership_type?: string;
  role?: string;
}

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create a custom event name for user updates
const USER_UPDATE_EVENT = 'userDataUpdated';

export default function DashboardLayout({ 
  children, 
  title = 'Trading Dashboard',
  description = 'Your personal trading command center'
}: DashboardLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

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

  // Function to load user data from localStorage
  const loadUserFromStorage = () => {
    try {
      // Try 'user_data' first (from login page)
      let userStr = localStorage.getItem('user_data');
      
      // If not found, try 'user' (fallback)
      if (!userStr) {
        userStr = localStorage.getItem('user');
      }
      
      if (userStr) {
        const userData = JSON.parse(userStr);
        
        // Construct avatar URL if needed
        if (userData.avatar && !userData.avatar.startsWith('http')) {
          userData.avatar_url = `${API_BASE_URL}/storage/${userData.avatar}`;
        } else if (userData.avatar) {
          userData.avatar_url = userData.avatar;
        }
        
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const userData = data.user || data;
          
          // Construct avatar URL if needed
          if (userData.avatar && !userData.avatar.startsWith('http')) {
            userData.avatar_url = `${API_BASE_URL}/storage/${userData.avatar}`;
          } else if (userData.avatar) {
            userData.avatar_url = userData.avatar;
          }
          
          setUser(userData);
          
          // Update localStorage
          localStorage.setItem('user_data', JSON.stringify(userData));
        } else if (response.status === 401) {
          // Token expired, try localStorage
          loadUserFromStorage();
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        // Fallback to localStorage
        loadUserFromStorage();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Listen for user update events
    const handleUserUpdate = (event: CustomEvent) => {
      setUser(event.detail);
      if (event.detail) {
        setAvatarError(false);
      }
    };

    window.addEventListener(USER_UPDATE_EVENT as any, handleUserUpdate);

    // Listen for storage changes (for cross-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_data' || e.key === 'user') {
        if (e.newValue) {
          try {
            const userData = JSON.parse(e.newValue);
            
            // Construct avatar URL if needed
            if (userData.avatar && !userData.avatar.startsWith('http')) {
              userData.avatar_url = `${API_BASE_URL}/storage/${userData.avatar}`;
            } else if (userData.avatar) {
              userData.avatar_url = userData.avatar;
            }
            
            setUser(userData);
            setAvatarError(false);
          } catch (error) {
            console.error('Error parsing updated user data:', error);
          }
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(USER_UPDATE_EVENT as any, handleUserUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (token) {
        await fetch(`${API_BASE_URL}/api/logout`, {
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
      localStorage.removeItem('user_data');
      localStorage.removeItem('user');
      
      // Emit user update event
      const event = new CustomEvent(USER_UPDATE_EVENT, { detail: null });
      window.dispatchEvent(event);
      
      window.location.href = '/login';
    }
  };

  const getInitials = () => {
    if (!user) return 'U';
    
    if (user.name) {
      const nameParts = user.name.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }
    
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    } else if (user.first_name) {
      return user.first_name.substring(0, 2).toUpperCase();
    }
    
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    
    return 'U';
  };

  const getDisplayName = () => {
    if (!user) return 'Guest';
    
    if (user.name && user.name.trim()) {
      return user.name;
    }
    
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user.first_name) {
      return user.first_name;
    } else if (user.username) {
      return user.username;
    } else if (user.email) {
      return user.email.split('@')[0];
    }
    
    return 'User';
  };

  const getUserStatusColor = () => {
    if (!user) return 'bg-gray-500';
    if (user.role === 'admin') return 'bg-red-500';
    if (user.membership_type === 'premium') return 'bg-green-500';
    if (user.membership_type === 'pro') return 'bg-purple-500';
    return 'bg-blue-500';
  };

  const getUserStatusText = () => {
    if (!user) return 'Guest';
    if (user.role === 'admin') return 'Administrator';
    if (user.membership_type === 'premium') return 'Premium Member';
    if (user.membership_type === 'pro') return 'Pro Member';
    return 'Free Member';
  };

  // Handle avatar error
  const handleAvatarError = () => {
    setAvatarError(true);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Fixed Header */}
        <header className="fixed top-0 left-0 right-0 lg:left-64 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
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

              {/* Right side: User info */}
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
                  <div className="relative user-menu-container">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          {user.avatar_url && !avatarError ? (
                            <Image
                              src={user.avatar_url}
                              alt={getDisplayName()}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                              onError={handleAvatarError}
                            />
                          ) : (
                            <span className="text-white font-medium text-sm">
                              {getInitials()}
                            </span>
                          )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getUserStatusColor()}`}></div>
                      </div>
                      <div className="hidden md:block text-left">
                        <p className="font-medium text-gray-900 truncate max-w-[150px]">
                          {getDisplayName()}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${getUserStatusColor()}`}></span>
                          {getUserStatusText()}
                        </p>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* User Dropdown Menu */}
                    {userMenuOpen && (
                      <>
                        {/* Backdrop for mobile */}
                        <div 
                          className="fixed inset-0 z-40 lg:hidden"
                          onClick={() => setUserMenuOpen(false)}
                        ></div>
                        
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                          {/* User Info */}
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                {user.avatar_url && !avatarError ? (
                                  <Image
                                    src={user.avatar_url}
                                    alt={getDisplayName()}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                    onError={handleAvatarError}
                                  />
                                ) : (
                                  <span className="text-white font-bold text-lg">
                                    {getInitials()}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">
                                  {getDisplayName()}
                                </p>
                                <p className="text-sm text-gray-600 truncate">
                                  {user.email}
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                                    user.role === 'admin' 
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {user.role === 'admin' ? 'Admin' : 'Member'}
                                  </span>
                                  {user.membership_type && (
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                                      user.membership_type === 'premium'
                                        ? 'bg-green-100 text-green-700'
                                        : user.membership_type === 'pro'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {user.membership_type}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Menu Items */}
                          <div className="py-1">
                            <button
                              onClick={() => {
                                router.push('/dashboard/profile');
                                setUserMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <User className="w-4 h-4 text-gray-500" />
                              <span>Profile Settings</span>
                            </button>
                            
                            <button
                              onClick={() => {
                                router.push('/dashboard/settings');
                                setUserMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Settings className="w-4 h-4 text-gray-500" />
                              <span>Account Settings</span>
                            </button>

                            <button
                              onClick={() => {
                                router.push('/dashboard/billing');
                                setUserMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <CreditCard className="w-4 h-4 text-gray-500" />
                              <span>Billing & Subscription</span>
                            </button>

                            <button
                              onClick={() => {
                                router.push('/dashboard/notifications');
                                setUserMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Bell className="w-4 h-4 text-gray-500" />
                              <span>Notifications</span>
                            </button>
                          </div>

                          <div className="border-t border-gray-200 py-1">
                            <button
                              onClick={() => {
                                router.push('/help');
                                setUserMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <HelpCircle className="w-4 h-4 text-gray-500" />
                              <span>Help & Support</span>
                            </button>
                          </div>

                          {/* Logout */}
                          <div className="border-t border-gray-200 p-2 bg-gray-50">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-red-500/10 to-pink-600/10 hover:from-red-500/20 hover:to-pink-600/20 text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-md transition-all"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Sign Out</span>
                            </button>
                          </div>
                        </div>
                      </>
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

        {/* Main content with padding to account for fixed header */}
        <main className="flex-1 mt-[88px] overflow-y-auto">
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