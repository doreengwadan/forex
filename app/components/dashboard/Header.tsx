"use client"

import { Bell, Search, User } from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  name: string
  email: string
  avatar?: string
  membership_type?: string
  role?: string
}

export default function DashboardHeader() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchUser()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.user-menu-container')) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchUser = async () => {
    try {
      const userDataStr = localStorage.getItem('user_data')
      const userData = userDataStr ? JSON.parse(userDataStr) : null
      
      const token = localStorage.getItem('auth_token') || 
                    localStorage.getItem('token') ||
                    (userData?.token ? userData.token : null)
      
      console.log('DashboardHeader: Token found:', !!token)

      if (!token) {
        console.log('DashboardHeader: No token, redirecting to login')
        router.push('/login')
        return
      }

      if (userData) {
        console.log('DashboardHeader: Using cached user data')
        setUser({
          id: userData.id,
          name: userData.first_name && userData.last_name 
            ? `${userData.first_name} ${userData.last_name}` 
            : userData.username || 'User',
          email: userData.email || '',
          membership_type: userData.account_type || 'free',
          role: userData.role || 'user'
        })
        setLoading(false)
        
        fetchFreshUserData(token)
        return
      }

      await fetchFreshUserData(token)
      
    } catch (error) {
      console.error('DashboardHeader: Error fetching user:', error)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('token')
      localStorage.removeItem('user_data')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchFreshUserData = async (token: string) => {
    try {
      console.log('DashboardHeader: Fetching fresh user data...')
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      console.log('DashboardHeader: API Response status:', response.status)

      if (response.ok) {
        const userData = await response.json()
        console.log('DashboardHeader: Fresh user data:', userData)
        
        setUser({
          id: userData.id,
          name: userData.first_name && userData.last_name 
            ? `${userData.first_name} ${userData.last_name}` 
            : userData.username || userData.name || 'User',
          email: userData.email || '',
          membership_type: userData.account_type || userData.membership_type || 'free',
          role: userData.role || 'user'
        })
      } else {
        console.error('DashboardHeader: API Error:', response.status, response.statusText)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('token')
        localStorage.removeItem('user_data')
        router.push('/login')
      }
    } catch (error) {
      console.error('DashboardHeader: Network error:', error)
      throw error
    }
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        })
      }
    } catch (error) {
      console.error('DashboardHeader: Logout error:', error)
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('token')
      localStorage.removeItem('user_data')
      router.push('/login')
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-1 max-w-lg">
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Search */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
              <Input
                type="search"
                placeholder="Search classes, signals, or mentors..."
                className="pl-10 w-full border-blue-300 focus:border-blue-500 focus:ring-blue-500 bg-white/80"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative hover:bg-blue-100 text-blue-600 hover:text-blue-700"
            >
              <Bell className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] text-xs bg-gradient-to-r from-purple-600 to-pink-600">
                3
              </Badge>
            </Button>

            {/* User menu - Fixed dropdown */}
            {user ? (
              <div className="relative user-menu-container">
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-2 hover:bg-blue-100"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
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
                  <span className="hidden md:inline font-medium text-blue-800">
                    {user.name}
                  </span>
                </Button>
                
                {/* Dropdown menu - Fixed positioning and z-index */}
                {dropdownOpen && (
                  <>
                    {/* Backdrop for mobile */}
                    <div 
                      className="fixed inset-0 z-40 lg:hidden"
                      onClick={() => setDropdownOpen(false)}
                    ></div>
                    
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-blue-100 z-50">
                      {/* User profile */}
                      <div className="p-6 border-b border-blue-200">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                            {user?.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
                                <span className="text-white font-bold text-lg">
                                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4 min-w-0 flex-1">
                            <p className="font-semibold text-blue-800 truncate">
                              {user?.name || 'Welcome!'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                user?.membership_type === 'premium' ? 'bg-green-500' : 
                                user?.membership_type === 'pro' ? 'bg-purple-500' : 
                                user?.membership_type === 'admin' ? 'bg-red-500' :
                                'bg-blue-500'
                              }`}></div>
                              <p className="text-sm text-blue-600 font-medium truncate">
                                {user?.role === 'admin' ? 'Administrator' : 
                                 user?.membership_type === 'demo' ? 'Demo Account' :
                                 user?.membership_type === 'premium' ? 'Premium Member' : 
                                 user?.membership_type === 'pro' ? 'Pro Member' :
                                 'Free Member'}
                              </p>
                            </div>
                            {user?.email && (
                              <p className="text-xs text-gray-500 truncate mt-1">
                                {user.email}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Quick stats row */}
                        <div className="grid grid-cols-3 gap-2 mt-4">
                          <div className="text-center p-2 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-600">Classes</p>
                            <p className="font-bold text-blue-800">12</p>
                          </div>
                          <div className="text-center p-2 bg-purple-50 rounded-lg">
                            <p className="text-xs text-purple-600">Signals</p>
                            <p className="font-bold text-purple-800">24</p>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded-lg">
                            <p className="text-xs text-green-600">Streak</p>
                            <p className="font-bold text-green-800">7d</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="py-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                        <a
                          href="/dashboard/profile"
                          className="flex items-center px-4 py-2.5 text-sm text-blue-800 hover:bg-blue-50 hover:text-blue-900 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <User className="w-4 h-4 mr-3 text-blue-500 flex-shrink-0" />
                          <span className="truncate">Profile Settings</span>
                        </a>
                        <a
                          href="/dashboard/payments"
                          className="flex items-center px-4 py-2.5 text-sm text-blue-800 hover:bg-blue-50 hover:text-blue-900 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <svg className="w-4 h-4 mr-3 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          <span className="truncate">Subscription</span>
                        </a>
                        <a
                          href="/dashboard/support"
                          className="flex items-center px-4 py-2.5 text-sm text-blue-800 hover:bg-blue-50 hover:text-blue-900 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <svg className="w-4 h-4 mr-3 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="truncate">Help & Support</span>
                        </a>
                        
                        {/* Admin links if user is admin */}
                        {user?.role === 'admin' && (
                          <>
                            <div className="border-t border-blue-100 my-2 pt-2">
                              <p className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Admin Panel
                              </p>
                              <a
                                href="/admin/dashboard"
                                className="flex items-center px-4 py-2.5 text-sm text-purple-800 hover:bg-purple-50 transition-colors"
                                onClick={() => setDropdownOpen(false)}
                              >
                                <svg className="w-4 h-4 mr-3 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                </svg>
                                <span className="truncate">Admin Dashboard</span>
                              </a>
                              <a
                                href="/admin/users"
                                className="flex items-center px-4 py-2.5 text-sm text-purple-800 hover:bg-purple-50 transition-colors"
                                onClick={() => setDropdownOpen(false)}
                              >
                                <svg className="w-4 h-4 mr-3 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                                </svg>
                                <span className="truncate">Manage Users</span>
                              </a>
                            </div>
                          </>
                        )}
                        
                        <div className="border-t border-blue-100 mt-2 pt-2">
                          <button
                            onClick={() => {
                              setDropdownOpen(false)
                              handleLogout()
                            }}
                            className="flex items-center w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-md"
                          >
                            <svg className="w-4 h-4 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="truncate">Sign out</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Button 
                onClick={() => router.push('/login')}
                variant="outline"
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}