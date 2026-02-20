'use client'

import { Bell, Search, Settings, Activity, Zap, Menu, User, LogOut, RefreshCw } from 'lucide-react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AdminHeaderProps {
  onMenuClick?: () => void
  title?: string
  description?: string
}

interface UserData {
  id: number
  name: string
  username?: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string | null
  role: string
  status: string
  demo_balance?: string
  account_type?: string
  balance?: string
  avatar?: string
  membership_type?: string
  // Add other fields your User model might have
}

// Create a custom event name for user updates
const USER_UPDATE_EVENT = 'userDataUpdated'

// Function to emit user update event
export const emitUserUpdate = (userData: UserData | null) => {
  const event = new CustomEvent(USER_UPDATE_EVENT, { detail: userData })
  window.dispatchEvent(event)
}

// Function to manually update user data in localStorage and notify all components
export const updateUserData = (userData: UserData | null) => {
  if (userData) {
    localStorage.setItem('user_data', JSON.stringify(userData))
    // Also store as 'user' for backward compatibility
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('user_role', userData.role)
  } else {
    localStorage.removeItem('user_data')
    localStorage.removeItem('user')
    localStorage.removeItem('user_role')
  }
  emitUserUpdate(userData)
}

export default function AdminHeader({ 
  onMenuClick, 
  title = 'Admin Dashboard',
  description = 'Manage your trading platform'
}: AdminHeaderProps) {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  // Function to load user data
  const loadUserData = () => {
    try {
      // Try 'user_data' first (from login page)
      let userStr = localStorage.getItem('user_data')
      
      // If not found, try 'user' (fallback)
      if (!userStr) {
        userStr = localStorage.getItem('user')
      }
      
      if (userStr) {
        const userData = JSON.parse(userStr)
        setUser(userData)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Function to fetch fresh user data from API
  const fetchUserFromAPI = async (showLoading = false) => {
    if (showLoading) {
      setRefreshing(true)
    }
    
    try {
      const token = localStorage.getItem('auth_token')
      
      if (token) {
        // Determine which endpoint to use based on current path
        const isAdminPage = window.location.pathname.includes('/admin')
        const endpoint = isAdminPage 
          ? 'http://localhost:8000/api/admin/user'
          : 'http://localhost:8000/api/user'
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          const userData = data.user || data // Handle both response formats
          setUser(userData)
          updateUserData(userData) // Update localStorage and notify other components
          return true
        } else if (response.status === 401) {
          // Token expired, logout
          handleLogout()
        }
      }
    } catch (error) {
      console.error('Error fetching user from API:', error)
    } finally {
      if (showLoading) {
        setRefreshing(false)
      }
    }
    return false
  }

  // Manual refresh function
  const handleRefreshUser = async () => {
    await fetchUserFromAPI(true)
  }

  // Load user data on component mount
  useEffect(() => {
    loadUserData()
    
    // Fetch from API after loading from localStorage
    fetchUserFromAPI()
    
    // Listen for user update events from other components
    const handleUserUpdate = (event: CustomEvent) => {
      setUser(event.detail)
    }
    
    window.addEventListener(USER_UPDATE_EVENT as any, handleUserUpdate)
    
    // Listen for storage changes (for cross-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_data' || e.key === 'user') {
        if (e.newValue) {
          try {
            const userData = JSON.parse(e.newValue)
            setUser(userData)
          } catch (error) {
            console.error('Error parsing updated user data:', error)
          }
        } else {
          setUser(null)
        }
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Set up periodic refresh (every 5 minutes)
    const refreshInterval = setInterval(() => {
      fetchUserFromAPI()
    }, 5 * 60 * 1000) // 5 minutes
    
    // Cleanup
    return () => {
      window.removeEventListener(USER_UPDATE_EVENT as any, handleUserUpdate)
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(refreshInterval)
    }
  }, [])

  // Debug function
  const debugLocalStorage = () => {
    console.log('=== Debug: localStorage contents ===')
    console.log('user_data:', localStorage.getItem('user_data'))
    console.log('user:', localStorage.getItem('user'))
    console.log('auth_token:', localStorage.getItem('auth_token'))
    console.log('user_role:', localStorage.getItem('user_role'))
    
    const userData = localStorage.getItem('user_data')
    if (userData) {
      try {
        const parsed = JSON.parse(userData)
        console.log('Current user state:', user)
        console.log('Parsed user_data:', parsed)
        alert(`User found:\nName: ${parsed.name || 'N/A'}\nEmail: ${parsed.email}\nRole: ${parsed.role}`)
      } catch (e) {
        console.error('Parse error:', e)
      }
    }
  }

  const getUserInitials = () => {
    if (!user) return 'AD'
    
    if (user.name) {
      const nameParts = user.name.split(' ')
      if (nameParts.length >= 2) {
        return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase()
      }
      return user.name.substring(0, 2).toUpperCase()
    }
    
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
    } else if (user.first_name) {
      return user.first_name.substring(0, 2).toUpperCase()
    }
    
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase()
    }
    
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase()
    }
    
    return 'AD'
  }

  const getUserDisplayName = () => {
    if (!user) return 'Loading...'
    
    if (user.name && user.name.trim()) {
      return user.name
    }
    
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    } else if (user.first_name) {
      return user.first_name
    } else if (user.username) {
      return user.username
    } else if (user.email) {
      return user.email.split('@')[0]
    }
    
    return 'User'
  }

  const handleLogout = async () => {
    try {
      const logoutEndpoint = user?.role === 'admin' 
        ? 'http://localhost:8000/api/admin/logout'
        : 'http://localhost:8000/api/logout'
      
      const token = localStorage.getItem('auth_token')
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      await fetch(logoutEndpoint, {
        method: 'POST',
        headers,
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      // Clear ALL localStorage items
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      localStorage.removeItem('user')
      localStorage.removeItem('user_role')
      
      // Notify all components that user is logged out
      emitUserUpdate(null)
      
      // Clear state
      setUser(null)
      
      // Redirect
      if (window.location.pathname.includes('/admin')) {
        router.push('/admin/login')
      } else {
        router.push('/login')
      }
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-800/95 to-indigo-900/95 backdrop-blur-sm border-b border-white/10 shadow-lg">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-32 h-6 bg-gray-700/50 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 rounded-full bg-gray-700/50 animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-800/95 to-indigo-900/95 backdrop-blur-sm border-b border-white/10 shadow-lg">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            {onMenuClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className="lg:hidden text-gray-300 hover:text-white hover:bg-slate-700/50"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            
            <div>
              <h1 className="text-xl font-semibold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-sm text-gray-300 hidden md:block">
                {description}
              </p>
            </div>

            {/* Debug and refresh buttons */}
           
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
           

           
            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative hover:bg-slate-700/50 text-gray-300 hover:text-white"
            >
              <Bell className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] text-xs bg-gradient-to-r from-red-500 to-pink-600 border border-white/20">
                {user?.role === 'admin' ? '5' : '3'}
              </Badge>
            </Button>

            {/* User Profile Dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                className="flex items-center space-x-2 hover:bg-slate-700/50 text-gray-300 hover:text-white"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={getUserDisplayName()}
                    className="w-8 h-8 rounded-full object-cover border border-cyan-500/30"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    {getUserInitials()}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <div className="text-sm font-medium text-white">
                    {getUserDisplayName()}
                  </div>
                  <div className="text-xs text-gray-400 capitalize">
                    {user?.role === 'admin' ? 'Administrator' : user?.role || 'User'}
                    {user?.membership_type && ` • ${user.membership_type}`}
                  </div>
                </div>
              </Button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  
                  <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    {/* User Info Section */}
                    <div className="p-4 border-b border-slate-700 bg-slate-900/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {user?.avatar ? (
                            <img 
                              src={user.avatar} 
                              alt={getUserDisplayName()}
                              className="w-12 h-12 rounded-full object-cover border-2 border-cyan-500/50"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                              {getUserInitials()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white truncate">
                              {getUserDisplayName()}
                            </div>
                            <div className="text-sm text-gray-300 truncate">
                              {user?.email || 'No email'}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                user?.role === 'admin' 
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : user?.role === 'mentee'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                              }`}>
                                {user?.role === 'admin' ? 'Admin' : 
                                 user?.role === 'mentee' ? 'Mentee' : 
                                 user?.role === 'guest' ? 'Guest' : 
                                 user?.role || 'User'}
                              </span>
                              {user?.membership_type && (
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  user.membership_type === 'pro'
                                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30'
                                    : user.membership_type === 'premium'
                                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-300 border border-gray-500/30'
                                }`}>
                                  {user.membership_type}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleRefreshUser}
                          disabled={refreshing}
                          className="w-8 h-8 text-gray-400 hover:text-cyan-300"
                          title="Refresh"
                        >
                          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <button 
                        onClick={() => {
                          router.push(user?.role === 'admin' ? '/admin/profile' : '/dashboard/profile')
                          setShowUserMenu(false)
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-300 hover:bg-slate-700/50 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>Profile Settings</span>
                      </button>
                      
                      <button 
                        onClick={() => {
                          router.push(user?.role === 'admin' ? '/admin/settings' : '/dashboard/settings')
                          setShowUserMenu(false)
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-300 hover:bg-slate-700/50 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Account Settings</span>
                      </button>
                    </div>

                    {/* Logout Section */}
                    <div className="border-t border-slate-700 p-2 bg-slate-900/30">
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm bg-gradient-to-r from-red-500/10 to-pink-600/10 hover:from-red-500/20 hover:to-pink-600/20 text-red-300 hover:text-red-200 border border-red-500/30 hover:border-red-400/50 rounded-md transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Switch view button */}
            {user?.role === 'admin' && !window.location.pathname.includes('/admin') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/dashboard')}
                className="hidden md:inline-flex bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border-cyan-500/30 text-cyan-300 hover:from-cyan-500/20 hover:to-blue-600/20 hover:border-cyan-400 hover:text-white"
              >
                Admin Panel
              </Button>
            )}
            
            
          
          </div>
        </div>
      </div>
    </header>
  )
}