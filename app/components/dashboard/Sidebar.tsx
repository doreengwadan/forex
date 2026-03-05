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

interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Classes', href: '/dashboard/classes', icon: Video },
  { name: 'Trading Signals', href: '/dashboard/signals', icon: TrendingUp },
  { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
  { name: 'Community Forum', href: '/dashboard/forum', icon: Users },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Groups', href: '/dashboard/group', icon: Users },
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

export default function DashboardSidebar({ 
  isOpen: externalIsOpen, 
  onClose, 
  isMobile = false 
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  // Sync with external isOpen prop if provided
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setSidebarOpen(externalIsOpen)
    }
  }, [externalIsOpen])

  // Handle close
  const handleClose = () => {
    setSidebarOpen(false)
    if (onClose) {
      onClose()
    }
  }

  // Handle toggle
  const handleToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  useEffect(() => {
    const loadUserData = () => {
      try {
        setLoading(true)
        const userDataString = localStorage.getItem('user_data')
        if (userDataString) {
          setUser(JSON.parse(userDataString))
        }
        fetchUserFromAPI()
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setLoading(false)
      }
    }

    const fetchUserFromAPI = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const response = await fetch('http://localhost:8000/api/user', {
          credentials: 'include',
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : {}
        })
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          localStorage.setItem('user_data', JSON.stringify(userData))
        }
      } catch (apiError) {
        // fallback to localStorage
      }
    }

    loadUserData()
    window.addEventListener('storage', (e) => {
      if (e.key === 'user_data') {
        setUser(e.newValue ? JSON.parse(e.newValue) : null)
      }
    })
    return () => window.removeEventListener('storage', () => {})
  }, [])

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      await fetch('http://localhost:8000/api/logout', { 
        method: 'POST', 
        credentials: 'include',
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      })
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      localStorage.removeItem('user_data')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('token')
      sessionStorage.clear()
      window.location.href = '/login'
    }
  }

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
      {/* Mobile toggle button - only show if not controlled externally */}
      {!isMobile && (
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={handleToggle}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      )}

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        />
      )}

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
                  onClick={handleClose}
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

        {/* Premium Banner – Free user */}
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
                onClick={() => window.location.href = '/dashboard/subscription'}
              >
                Upgrade Now
              </Button>
            </div>
          </div>
        )}
        
        {/* Premium Banner – Premium user */}
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
                onClick={() => window.location.href = '/dashboard/subscription'}
              >
                Manage Subscription
              </Button>
            </div>
          </div>
        )}

        {/* Logout button */}
        <div className="p-4 border-t border-blue-200">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </div>
    </>
  )
}