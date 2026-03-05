'use client'

import { Bell, Search, Settings, Activity, Zap, Menu, User, LogOut, RefreshCw, X, Check, MessageSquare, Calendar, CreditCard, AlertCircle, Mail, Trophy, TrendingUp } from 'lucide-react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getEcho } from '../../lib/echo'
import Image from 'next/image'

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
  avatar_url?: string
  membership_type?: string
}

interface Notification {
  id: string
  type: string
  title: string
  content: string | null
  data: any
  icon: string
  color: string
  action_url: string | null
  created_at: string
  read_at: string | null
}

interface NotificationResponse {
  success: boolean
  data: Notification[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    unread_count: number
  }
}

interface AdminHeaderProps {
  onMenuClick?: () => void
  title?: string
  description?: string
}

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

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
    // Construct avatar URL if needed
    if (userData.avatar && !userData.avatar.startsWith('http')) {
      userData.avatar_url = `${API_BASE_URL.replace('/api', '')}/storage/${userData.avatar}`
    } else if (userData.avatar) {
      userData.avatar_url = userData.avatar
    }
    
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
  const [showNotifications, setShowNotifications] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsPage, setNotificationsPage] = useState(1)
  const [hasMoreNotifications, setHasMoreNotifications] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const notificationsEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const echoRef = useRef<any>(null)

  // ===================== USER HELPER FUNCTIONS =====================

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

  // Function to load user data from localStorage
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
        
        // Construct avatar URL if needed
        if (userData.avatar && !userData.avatar.startsWith('http')) {
          userData.avatar_url = `${API_BASE_URL.replace('/api', '')}/storage/${userData.avatar}`
        } else if (userData.avatar) {
          userData.avatar_url = userData.avatar
        }
        
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
          ? `${API_BASE_URL}/admin/user`
          : `${API_BASE_URL}/user`
        
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
          
          // Construct avatar URL if needed
          if (userData.avatar && !userData.avatar.startsWith('http')) {
            userData.avatar_url = `${API_BASE_URL.replace('/api', '')}/storage/${userData.avatar}`
          } else if (userData.avatar) {
            userData.avatar_url = userData.avatar
          }
          
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

  const handleLogout = async () => {
    try {
      const logoutEndpoint = user?.role === 'admin' 
        ? `${API_BASE_URL}/admin/logout`
        : `${API_BASE_URL}/logout`
      
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
        router.push('/login')
      } else {
        router.push('/login')
      }
    }
  }

  // ===================== NOTIFICATION FUNCTIONS =====================

  // Initialize Echo for real-time notifications
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token && user?.id) {
      try {
        echoRef.current = getEcho(token)
        
        // Subscribe to private notification channel (Laravel's default pattern)
        const channel = echoRef.current.private(`App.Models.User.${user.id}`)
        
        // Listen for new notifications
        channel.notification((notification: any) => {
          console.log('New notification received:', notification)
          handleNewNotification(notification)
        })
        
        return () => {
          echoRef.current?.leave(`App.Models.User.${user.id}`)
        }
      } catch (err) {
        console.error('Failed to initialize Echo for notifications', err)
      }
    }
  }, [user?.id])

  // Handle new notification from WebSocket
  const handleNewNotification = (notificationData: any) => {
    // Format notification for our UI
    const formattedNotification: Notification = {
      id: notificationData.id,
      type: notificationData.type || 'info',
      title: notificationData.title || 'New Notification',
      content: notificationData.content || null,
      data: notificationData.data || {},
      icon: notificationData.icon || 'Bell',
      color: notificationData.color || 'blue',
      action_url: notificationData.action_url || null,
      created_at: notificationData.created_at || new Date().toISOString(),
      read_at: notificationData.read_at || null,
    }
    
    // Add to notifications list
    setNotifications(prev => [formattedNotification, ...prev])
    setUnreadCount(prev => prev + 1)
    
    // Show browser notification if supported and permitted
    if (typeof window !== 'undefined' && Notification.permission === 'granted') {
      new Notification(formattedNotification.title, {
        body: formattedNotification.content || '',
        icon: '/favicon.ico',
      })
    }
  }

  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Load notifications
  const loadNotifications = async (page = 1, append = false) => {
    setLoadingNotifications(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(
        `${API_BASE_URL}/notifications?page=${page}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      )
      
      if (response.ok) {
        const data: NotificationResponse = await response.json()
        
        if (append) {
          setNotifications(prev => [...prev, ...data.data])
        } else {
          setNotifications(data.data)
        }
        
        setUnreadCount(data.pagination.unread_count)
        setHasMoreNotifications(page < data.pagination.last_page)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoadingNotifications(false)
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const token = localStorage.getItem('auth_token')
      await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      // Remove from list
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      await fetch(`${API_BASE_URL}/notifications/clear-all`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      setNotifications([])
      setUnreadCount(0)
    } catch (error) {
      console.error('Error clearing notifications:', error)
    }
  }

  // Load more notifications (infinite scroll)
  const loadMoreNotifications = () => {
    if (hasMoreNotifications && !loadingNotifications) {
      const nextPage = notificationsPage + 1
      setNotificationsPage(nextPage)
      loadNotifications(nextPage, true)
    }
  }

  // Handle scroll for infinite scroll
  const handleNotificationsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      loadMoreNotifications()
    }
  }

  // Get icon component based on string
  const getNotificationIcon = (iconName: string, color: string = 'blue') => {
    const iconProps = { className: `w-4 h-4` }
    
    switch (iconName) {
      case 'MessageSquare':
        return <MessageSquare {...iconProps} />
      case 'Calendar':
        return <Calendar {...iconProps} />
      case 'Zap':
        return <Zap {...iconProps} />
      case 'CreditCard':
        return <CreditCard {...iconProps} />
      case 'User':
        return <User {...iconProps} />
      case 'Bell':
        return <Bell {...iconProps} />
      case 'AlertCircle':
        return <AlertCircle {...iconProps} />
      case 'Mail':
        return <Mail {...iconProps} />
      case 'Trophy':
        return <Trophy {...iconProps} />
      case 'TrendingUp':
        return <TrendingUp {...iconProps} />
      default:
        return <Bell {...iconProps} />
    }
  }

  // Get color classes based on notification color
  const getNotificationColorClass = (color: string = 'blue') => {
    const colorMap: Record<string, { bg: string, text: string, border: string, hover: string }> = {
      blue: { 
        bg: 'bg-blue-500/10', 
        text: 'text-blue-400', 
        border: 'border-blue-500/20',
        hover: 'hover:bg-blue-500/20'
      },
      amber: { 
        bg: 'bg-amber-500/10', 
        text: 'text-amber-400', 
        border: 'border-amber-500/20',
        hover: 'hover:bg-amber-500/20'
      },
      green: { 
        bg: 'bg-green-500/10', 
        text: 'text-green-400', 
        border: 'border-green-500/20',
        hover: 'hover:bg-green-500/20'
      },
      emerald: { 
        bg: 'bg-emerald-500/10', 
        text: 'text-emerald-400', 
        border: 'border-emerald-500/20',
        hover: 'hover:bg-emerald-500/20'
      },
      purple: { 
        bg: 'bg-purple-500/10', 
        text: 'text-purple-400', 
        border: 'border-purple-500/20',
        hover: 'hover:bg-purple-500/20'
      },
      red: { 
        bg: 'bg-red-500/10', 
        text: 'text-red-400', 
        border: 'border-red-500/20',
        hover: 'hover:bg-red-500/20'
      },
    }
    return colorMap[color] || colorMap.blue
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
            
            // Construct avatar URL if needed
            if (userData.avatar && !userData.avatar.startsWith('http')) {
              userData.avatar_url = `${API_BASE_URL.replace('/api', '')}/storage/${userData.avatar}`
            } else if (userData.avatar) {
              userData.avatar_url = userData.avatar
            }
            
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

  // Load notifications when component mounts and when user changes
  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

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
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative hover:bg-slate-700/50 text-gray-300 hover:text-white transition-all duration-200"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <>
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <Badge className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] text-xs bg-gradient-to-r from-red-500 to-pink-600 border border-white/20">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    </span>
                  </>
                )}
              </Button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  
                  <div className="absolute right-0 mt-2 w-96 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/50">
                      <div className="flex items-center space-x-2">
                        <Bell className="w-5 h-5 text-cyan-400" />
                        <h3 className="font-semibold text-white">Notifications</h3>
                        {unreadCount > 0 && (
                          <Badge className="bg-gradient-to-r from-red-500 to-pink-600 border-0 animate-pulse">
                            {unreadCount} new
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {notifications.length > 0 && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={markAllAsRead}
                              className="text-xs text-gray-400 hover:text-cyan-300 transition-colors"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Mark all read
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearAllNotifications}
                              className="text-xs text-gray-400 hover:text-red-300 transition-colors"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Clear all
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Notification List */}
                    <div 
                      className="max-h-[400px] overflow-y-auto"
                      onScroll={handleNotificationsScroll}
                    >
                      {loadingNotifications && notifications.length === 0 ? (
                        <div className="flex justify-center items-center py-8">
                          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="text-center py-8 px-4">
                          <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-400 text-sm">No notifications yet</p>
                          <p className="text-xs text-gray-500 mt-1">
                            When you get notifications, they'll appear here
                          </p>
                        </div>
                      ) : (
                        <>
                          {notifications.map((notification) => {
                            const colors = getNotificationColorClass(notification.color)
                            const isUnread = !notification.read_at
                            
                            return (
                              <div
                                key={notification.id}
                                onClick={() => {
                                  if (isUnread) {
                                    markAsRead(notification.id)
                                  }
                                  if (notification.action_url) {
                                    router.push(notification.action_url)
                                    setShowNotifications(false)
                                  }
                                }}
                                className={`
                                  p-4 border-b border-slate-700/50 cursor-pointer
                                  transition-all duration-200 group
                                  ${isUnread ? 'bg-slate-700/30' : 'hover:bg-slate-800/50'}
                                `}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className={`
                                    flex-shrink-0 w-10 h-10 rounded-full ${colors.bg} 
                                    flex items-center justify-center
                                    group-hover:scale-110 transition-transform duration-200
                                  `}>
                                    {getNotificationIcon(notification.icon || 'Bell', notification.color)}
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <p className={`text-sm font-medium ${
                                          isUnread ? 'text-white' : 'text-gray-300'
                                        }`}>
                                          {notification.title}
                                        </p>
                                        {notification.content && (
                                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                            {notification.content}
                                          </p>
                                        )}
                                      </div>
                                      {isUnread && (
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 animate-pulse" />
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-2">
                                      <span className="text-xs text-gray-500">
                                        {new Date(notification.created_at).toLocaleString(undefined, {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                      
                                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {isUnread && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              markAsRead(notification.id)
                                            }}
                                            className="w-6 h-6 text-gray-500 hover:text-cyan-400"
                                            title="Mark as read"
                                          >
                                            <Check className="w-3 h-3" />
                                          </Button>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={(e) => deleteNotification(notification.id, e)}
                                          className="w-6 h-6 text-gray-500 hover:text-red-400"
                                          title="Delete"
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                          
                          {hasMoreNotifications && (
                            <div ref={notificationsEndRef} className="p-3 text-center">
                              {loadingNotifications ? (
                                <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={loadMoreNotifications}
                                  className="text-xs text-cyan-400 hover:text-cyan-300"
                                >
                                  Load more
                                </Button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="p-2 border-t border-slate-700 bg-slate-900/30">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            router.push('/notifications')
                            setShowNotifications(false)
                          }}
                          className="w-full text-xs text-gray-400 hover:text-cyan-300"
                        >
                          View all notifications
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                className="flex items-center space-x-2 hover:bg-slate-700/50 text-gray-300 hover:text-white transition-all duration-200 group"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                {user?.avatar_url ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-cyan-500/30 group-hover:border-cyan-400 transition-colors">
                    <Image
                      src={user.avatar_url}
                      alt={getUserDisplayName()}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // If image fails to load, fallback to initials
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.parentElement?.classList.add('bg-gradient-to-r', 'from-cyan-500', 'to-blue-600')
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold group-hover:scale-105 transition-transform">
                    {getUserInitials()}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <div className="text-sm font-medium text-white">
                    {getUserDisplayName()}
                  </div>
                  <div className="text-xs text-gray-400 capitalize flex items-center">
                    {user?.role === 'admin' ? 'Administrator' : user?.role || 'User'}
                    {user?.membership_type && (
                      <>
                        <span className="mx-1">•</span>
                        <Badge variant="outline" className="text-[10px] px-1 py-0 border-gray-600">
                          {user.membership_type}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </Button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  
                  <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    {/* User Info Section */}
                    <div className="p-4 border-b border-slate-700 bg-slate-900/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {user?.avatar_url ? (
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-500/50">
                              <Image
                                src={user.avatar_url}
                                alt={getUserDisplayName()}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  e.currentTarget.parentElement?.classList.add('bg-gradient-to-r', 'from-cyan-500', 'to-blue-600')
                                }}
                              />
                            </div>
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
                                  : user?.role === 'mentor'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                              }`}>
                                {user?.role === 'admin' ? 'Admin' : 
                                 user?.role === 'mentor' ? 'Mentor' : 
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
            {user?.role === 'admin' && typeof window !== 'undefined' && !window.location.pathname.includes('/admin') && (
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