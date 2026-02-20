'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Video, 
  TrendingUp, 
  MessageSquare, 
  Users,
  User,
  CreditCard,
  Bell,
  Settings,
  Menu,
  X,
  LogOut,
  Zap,
  Shield
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../../components/ui/Button'

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Classes', href: '/dashboard/classes', icon: Video },
  { name: 'Trading Signals', href: '/dashboard/signals', icon: TrendingUp },
  { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
  { name: 'Community Forum', href: '/dashboard/forum', icon: Users },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
]



interface UserData {
  id: number;
  name: string;
  email: string;
  username?: string;
  membership_type?: string;
  avatar?: string;
}

export default function DashboardSidebar() {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  // Get user data from localStorage (where login page stores it)
  useEffect(() => {
    const loadUserData = () => {
      try {
        setLoading(true)
        
        // Debug: Check what's in localStorage
        console.log('=== Checking localStorage ===')
        const userDataString = localStorage.getItem('user_data')
        const authToken = localStorage.getItem('auth_token')
        
        console.log('user_data key exists:', userDataString !== null)
        console.log('auth_token key exists:', authToken !== null)
        
        if (userDataString) {
          console.log('Raw user_data string:', userDataString)
          
          try {
            const userData = JSON.parse(userDataString)
            console.log('Parsed user data:', userData)
            console.log('User name found:', userData.name)
            console.log('User email found:', userData.email)
            
            setUser(userData)
          } catch (parseError) {
            console.error('Error parsing user_data JSON:', parseError)
            console.error('Invalid JSON string:', userDataString)
          }
        } else {
          console.warn('No user_data found in localStorage')
          console.log('All localStorage items:')
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            console.log(`Key: ${key}, Value: ${localStorage.getItem(key)}`)
          }
        }
        
        // Also check if we need to fetch from API as fallback
        fetchUserFromAPI()
        
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setLoading(false)
      }
    }

    const fetchUserFromAPI = async () => {
      try {
        // Fallback: Try to get user from API if not in localStorage
        const response = await fetch('http://localhost:8000/api/user', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (response.ok) {
          const userData = await response.json()
          console.log('User data from API:', userData)
          setUser(userData)
          localStorage.setItem('user_data', JSON.stringify(userData))
        } else if (response.status === 401) {
          console.log('API: Not authenticated')
          // Don't redirect here, let localStorage handle it
        }
      } catch (apiError) {
        console.error('API fetch error:', apiError)
        // Network error, continue with localStorage data
      }
    }

    // Load user on mount
    loadUserData()
    
    // Also listen for storage changes (if user logs in from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_data') {
        console.log('Storage changed - user_data updated')
        if (e.newValue) {
          try {
            setUser(JSON.parse(e.newValue))
          } catch (error) {
            console.error('Error parsing updated user_data:', error)
          }
        } else {
          setUser(null)
        }
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const handleLogout = async () => {
    try {
      // Call logout API
      await fetch('http://localhost:8000/api/logout', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      // Clear ALL auth-related storage
      localStorage.removeItem('user_data')
      localStorage.removeItem('auth_token')
      sessionStorage.clear()
      
      // Clear state
      setUser(null)
      
      // Redirect to login
      window.location.href = '/login'
    }
  }

  // Debug button to check localStorage
  const debugLocalStorage = () => {
    console.log('=== DEBUG: Current localStorage ===')
    console.log('user_data:', localStorage.getItem('user_data'))
    console.log('auth_token:', localStorage.getItem('auth_token'))
    
    const userData = localStorage.getItem('user_data')
    if (userData) {
      try {
        const parsed = JSON.parse(userData)
        console.log('Parsed user_data:', parsed)
        alert(`Current user: ${parsed.name || 'No name'}\nEmail: ${parsed.email || 'No email'}`)
      } catch (e) {
        console.error('Parse error:', e)
        alert('Error parsing user_data')
      }
    } else {
      alert('No user_data in localStorage')
    }
  }

  // Debug button to simulate login (for testing)
  const simulateLogin = () => {
    const testUser = {
      id: 1,
      name: 'John Trader',
      email: 'john@example.com',
      username: 'johntrader',
      membership_type: 'premium',
      avatar: null
    }
    localStorage.setItem('user_data', JSON.stringify(testUser))
    setUser(testUser)
    alert('Test user loaded: John Trader')
  }

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-blue-50 via-white to-indigo-50 border-r border-blue-200">
        <div className="p-6 border-b border-blue-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <div className="h-4 bg-gray-300 rounded w-32 mb-2 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
          </div>
        </div>
     
      
      </div>
    )
  }

  return (
    <>
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl"
        >
          {sidebarOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Sidebar for mobile */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity',
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-blue-50 via-white to-indigo-50 border-r border-blue-200 transform transition-transform lg:translate-x-0 lg:static lg:inset-auto lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-blue-200">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div className="ml-3">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Limitless
            </span>
            <p className="text-xs text-blue-500 font-medium">Trading Platform</p>
          </div>
        </div>

        

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-blue-800 hover:bg-blue-100 hover:translate-x-1'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={cn('w-5 h-5', isActive ? 'text-white' : 'text-blue-500')} />
                  <span className="ml-3">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>
              )
            })}
          </div>

          
        </nav>

        {/* Premium Banner - Conditionally show based on membership */}
        {(!user?.membership_type || user.membership_type === 'free') && (
          <div className="p-4 border-t border-blue-200">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-xl p-4 border border-blue-300/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Upgrade to Premium</p>
                  <p className="text-xs text-blue-600">Get access to all features</p>
                </div>
              </div>
              <Button 
                size="sm" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                Upgrade Now
              </Button>
            </div>
          </div>
        )}
        
        {/* Already Premium Banner */}
        {user?.membership_type === 'premium' && (
          <div className="p-4 border-t border-blue-200">
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-600/10 rounded-xl p-4 border border-green-300/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">Premium Member</p>
                  <p className="text-xs text-green-600">You have full access</p>
                </div>
              </div>
              <Button 
                size="sm" 
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                Manage Subscription
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}