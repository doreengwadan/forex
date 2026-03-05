'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs'
import { Progress } from '../components/ui/Progress'
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Shield,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  UserCheck,
  Target,
  CreditCard,
  Star,
  MessageSquare,
  Bell,
  Settings,
  Filter,
  ChevronDown,
  X,
  FileText,
  BarChart3
} from 'lucide-react'
import { format, subDays, subMonths, subWeeks, subYears, eachDayOfInterval } from 'date-fns'

// Types
interface DashboardSummary {
  total_users: number
  total_mentors: number
  total_groups: number
  total_signals: number
  total_transactions: number
  total_revenue: number
  active_users: number
  active_mentors: number
  active_groups: number
  published_signals: number
  pending_approvals: number
  growth_rate: number
  win_rate: number
}

interface RecentActivity {
  id: number
  type: 'user' | 'mentor' | 'signal' | 'transaction' | 'group'
  title: string
  description: string
  timestamp: string
  status?: string
  amount?: number
  user?: {
    name: string
    email: string
    avatar?: string
  }
}

interface TopPerformer {
  id: number
  name: string
  email: string
  value: number
  metric: string
  trend: number
  avatar?: string
  status?: string
  rating?: number
  image?: string
}

interface ChartDataPoint {
  date: string
  value: number
}

interface DashboardData {
  summary: DashboardSummary
  recent_activities: RecentActivity[]
  top_users: TopPerformer[]
  top_mentors: TopPerformer[]
  top_signals: TopPerformer[]
  user_growth: ChartDataPoint[]
  revenue_trend: ChartDataPoint[]
  category_distribution: Record<string, number>
  alerts: Array<{
    id: number
    type: 'warning' | 'error' | 'info' | 'success'
    message: string
    timestamp: string
  }>
}

interface DateRange {
  from: Date
  to: Date
  label: string
}

// Default empty state
const defaultData: DashboardData = {
  summary: {
    total_users: 0,
    total_mentors: 0,
    total_groups: 0,
    total_signals: 0,
    total_transactions: 0,
    total_revenue: 0,
    active_users: 0,
    active_mentors: 0,
    active_groups: 0,
    published_signals: 0,
    pending_approvals: 0,
    growth_rate: 0,
    win_rate: 0
  },
  recent_activities: [],
  top_users: [],
  top_mentors: [],
  top_signals: [],
  user_growth: [],
  revenue_trend: [],
  category_distribution: {},
  alerts: []
}

// Helper functions
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-US').format(value)
}

const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`
}

const timeAgo = (timestamp: string) => {
  const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000)
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  }
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit)
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`
    }
  }
  
  return 'Just now'
}

const getTrendIndicator = (value: number) => {
  if (value > 0) {
    return <ArrowUpRight className="w-4 h-4 text-green-500" />
  } else if (value < 0) {
    return <ArrowDownRight className="w-4 h-4 text-red-500" />
  }
  return null
}

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    online: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    offline: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    published: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
  }
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || colors.inactive}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// Activity Icon Component
const ActivityIcon = ({ type }: { type: string }) => {
  const icons = {
    user: <UserCheck className="w-4 h-4" />,
    mentor: <Shield className="w-4 h-4" />,
    signal: <Target className="w-4 h-4" />,
    transaction: <CreditCard className="w-4 h-4" />,
    group: <Users className="w-4 h-4" />
  }
  
  const colors = {
    user: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
    mentor: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30',
    signal: 'bg-green-100 text-green-600 dark:bg-green-900/30',
    transaction: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30',
    group: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30'
  }
  
  return (
    <div className={`p-2 rounded-lg ${colors[type as keyof typeof colors] || 'bg-gray-100'}`}>
      {icons[type as keyof typeof icons] || <Activity className="w-4 h-4" />}
    </div>
  )
}

// Mini Chart Component
const MiniChart = ({ data, color }: { data: ChartDataPoint[]; color: string }) => {
  const values = data.map(d => d.value)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min
  
  return (
    <div className="flex items-end h-8 gap-0.5">
      {values.slice(-7).map((value, i) => {
        const height = range > 0 ? ((value - min) / range) * 100 : 50
        return (
          <div
            key={i}
            className="w-2 rounded-t transition-all hover:opacity-80"
            style={{
              height: `${Math.max(20, height)}%`,
              backgroundColor: color
            }}
          />
        )
      })}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(defaultData)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 7),
    to: new Date(),
    label: 'Last 7 Days'
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showAlerts, setShowAlerts] = useState(true)
  const [selectedTab, setSelectedTab] = useState('overview')

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  // Get token
  const getToken = () => {
    if (typeof window === 'undefined') return null
    const tokenSources = [
      localStorage.getItem('auth_token'),
      localStorage.getItem('admin_token'),
      localStorage.getItem('token'),
      localStorage.getItem('access_token')
    ]
    return tokenSources.find(token => token && token !== 'null' && token !== 'undefined') || null
  }

  // Check admin access
  const checkAdminAccess = () => {
    if (typeof window === 'undefined') return false
    
    try {
      const userData = localStorage.getItem('user_data')
      const userRole = localStorage.getItem('user_role')
      
      if (userData) {
        const user = JSON.parse(userData)
        return user.role === 'admin' || userRole === 'admin'
      }
      
      return userRole === 'admin'
    } catch {
      return false
    }
  }

  // Transform API data to dashboard format
  const transformData = (
    usersData: any,
    mentorsData: any,
    groupsData: any,
    signalsData: any,
    transactionsData: any,
    statsData: any,
    alertsData: any,
    range: DateRange
  ): DashboardData => {
    const users = usersData.users || []
    const mentors = mentorsData.data?.data || mentorsData.mentors || []
    const groups = groupsData.groups || []
    const signals = signalsData.signals || []
    const transactions = transactionsData.transactions || []
    const stats = statsData.stats || {}
    const alerts = alertsData.alerts || []

    // Calculate summary metrics
    const activeUsers = users.filter((u: any) => u.status === 'active').length
    const onlineMentors = mentors.filter((m: any) => m.status === 'online').length
    const activeGroups = groups.filter((g: any) => g.status === 'active').length
    const publishedSignals = signals.filter((s: any) => s.status === 'published').length
    
    // Calculate win rate
    const completedSignals = signals.filter((s: any) => s.status === 'completed').length
    const winningSignals = signals.filter((s: any) => s.actual_profit_loss && s.actual_profit_loss > 0).length
    const winRate = completedSignals > 0 ? (winningSignals / completedSignals) * 100 : 0

    // Calculate revenue
    const totalRevenue = transactions.reduce((sum: number, t: any) => {
      const amount = parseFloat(t.amount?.replace(/[$,]/g, '') || '0')
      return sum + amount
    }, 0)

    // Generate chart data
    const days = eachDayOfInterval({ start: range.from, end: range.to })
    
    const userGrowth = days.map(day => {
      const count = users.filter((u: any) => new Date(u.created_at) <= day).length
      return {
        date: format(day, 'yyyy-MM-dd'),
        value: count
      }
    })

    const revenueTrend = days.map(day => {
      const dayTransactions = transactions.filter((t: any) => {
        const date = new Date(t.date || t.created_at)
        return date.toDateString() === day.toDateString()
      })
      const revenue = dayTransactions.reduce((sum: number, t: any) => {
        const amount = parseFloat(t.amount?.replace(/[$,]/g, '') || '0')
        return sum + amount
      }, 0)
      return {
        date: format(day, 'yyyy-MM-dd'),
        value: revenue
      }
    })

    // Calculate category distribution
    const categoryDist: Record<string, number> = {}
    signals.forEach((s: any) => {
      const cat = s.category || 'Uncategorized'
      categoryDist[cat] = (categoryDist[cat] || 0) + 1
    })

    // Generate recent activities
    const recentActivities: RecentActivity[] = [
      ...users.slice(0, 2).map((u: any) => ({
        id: u.id,
        type: 'user' as const,
        title: 'New user registered',
        description: u.name || u.email,
        timestamp: u.created_at,
        status: u.status
      })),
      ...signals.slice(0, 2).map((s: any) => ({
        id: s.id,
        type: 'signal' as const,
        title: 'New signal published',
        description: `${s.asset || s.symbol} - ${s.type}`,
        timestamp: s.created_at,
        status: s.status
      })),
      ...transactions.slice(0, 3).map((t: any) => ({
        id: t.id,
        type: 'transaction' as const,
        title: 'New transaction',
        description: `${t.user_name || 'User'} - ${t.type}`,
        timestamp: t.date || t.created_at,
        status: t.status,
        amount: parseFloat(t.amount?.replace(/[$,]/g, '') || '0')
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5)

    // Get top users by activity
    const topUsers = users
      .sort((a: any, b: any) => (b.trades || 0) - (a.trades || 0))
      .slice(0, 3)
      .map((u: any) => ({
        id: u.id,
        name: u.name || u.email,
        email: u.email,
        value: u.trades || Math.floor(Math.random() * 100),
        metric: 'Trades',
        trend: Math.random() * 20 - 10,
        status: u.status
      }))

    // Get top mentors by rating
    const topMentors = mentors
      .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3)
      .map((m: any) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        value: m.rating || 0,
        metric: 'Rating',
        trend: Math.random() * 1 - 0.5,
        rating: m.rating || 0,
        status: m.status
      }))

    // Get top signals by profit
    const topSignals = signals
      .sort((a: any, b: any) => (b.actual_profit_loss || 0) - (a.actual_profit_loss || 0))
      .slice(0, 3)
      .map((s: any) => ({
        id: s.id,
        name: s.asset || s.symbol,
        email: s.category || 'Unknown',
        value: s.actual_profit_loss || 0,
        metric: 'Profit',
        trend: Math.random() * 20 - 10,
        status: s.status
      }))

    return {
      summary: {
        total_users: users.length,
        total_mentors: mentors.length,
        total_groups: groups.length,
        total_signals: signals.length,
        total_transactions: transactions.length,
        total_revenue: totalRevenue,
        active_users: activeUsers,
        active_mentors: onlineMentors,
        active_groups: activeGroups,
        published_signals: publishedSignals,
        pending_approvals: groups.filter((g: any) => g.requires_approval).length,
        growth_rate: stats.growth_rate || 0,
        win_rate: winRate
      },
      recent_activities: recentActivities,
      top_users: topUsers,
      top_mentors: topMentors,
      top_signals: topSignals,
      user_growth: userGrowth,
      revenue_trend: revenueTrend,
      category_distribution: categoryDist,
      alerts: alerts.slice(0, 3)
    }
  }

  // Fetch all data
  const fetchAllData = async () => {
    try {
      const token = getToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      if (!checkAdminAccess()) {
        throw new Error('Admin access required')
      }

      // Fetch all required data in parallel
      const [
        usersRes,
        mentorsRes,
        groupsRes,
        signalsRes,
        transactionsRes,
        statsRes,
        alertsRes
      ] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/admin/mentors`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/admin/groups`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/admin/signals`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/payments/transactions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/notifications/alerts`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      // Process responses
      const usersData = usersRes.status === 'fulfilled' && usersRes.value.ok 
        ? await usersRes.value.json() 
        : { users: [] }

      const mentorsData = mentorsRes.status === 'fulfilled' && mentorsRes.value.ok 
        ? await mentorsRes.value.json() 
        : { mentors: [] }

      const groupsData = groupsRes.status === 'fulfilled' && groupsRes.value.ok 
        ? await groupsRes.value.json() 
        : { groups: [] }

      const signalsData = signalsRes.status === 'fulfilled' && signalsRes.value.ok 
        ? await signalsRes.value.json() 
        : { signals: [] }

      const transactionsData = transactionsRes.status === 'fulfilled' && transactionsRes.value.ok 
        ? await transactionsRes.value.json() 
        : { transactions: [] }

      const statsData = statsRes.status === 'fulfilled' && statsRes.value.ok 
        ? await statsRes.value.json() 
        : { stats: {} }

      const alertsData = alertsRes.status === 'fulfilled' && alertsRes.value.ok 
        ? await alertsRes.value.json() 
        : { alerts: [] }

      // Transform and set data
      const transformedData = transformData(
        usersData,
        mentorsData,
        groupsData,
        signalsData,
        transactionsData,
        statsData,
        alertsData,
        dateRange
      )

      setData(transformedData)
      setError(null)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
    }
  }

  // Load data on mount and when date range changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchAllData()
      setLoading(false)
    }
    loadData()
  }, [dateRange])

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAllData()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Welcome back! Here's what's happening with your platform.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Date Range Picker */}
              <div className="relative">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                >
                  <Calendar className="w-4 h-4" />
                  {dateRange.label}
                  <ChevronDown className="w-4 h-4" />
                </Button>

                {showDatePicker && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 p-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setDateRange({
                          from: new Date(),
                          to: new Date(),
                          label: 'Today'
                        })
                        setShowDatePicker(false)
                      }}
                    >
                      Today
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setDateRange({
                          from: subDays(new Date(), 7),
                          to: new Date(),
                          label: 'Last 7 Days'
                        })
                        setShowDatePicker(false)
                      }}
                    >
                      Last 7 Days
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setDateRange({
                          from: subDays(new Date(), 30),
                          to: new Date(),
                          label: 'Last 30 Days'
                        })
                        setShowDatePicker(false)
                      }}
                    >
                      Last 30 Days
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setDateRange({
                          from: subMonths(new Date(), 3),
                          to: new Date(),
                          label: 'Last 3 Months'
                        })
                        setShowDatePicker(false)
                      }}
                    >
                      Last 3 Months
                    </Button>
                  </div>
                )}
              </div>

             

            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-600 dark:text-red-400 text-sm flex-1">{error}</p>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Alerts Panel */}
        {showAlerts && data.alerts.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Notifications & Alerts</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAlerts(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {data.alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg flex items-start gap-3 ${
                      alert.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                      alert.type === 'error' ? 'bg-red-50 dark:bg-red-900/20' :
                      alert.type === 'success' ? 'bg-green-50 dark:bg-green-900/20' :
                      'bg-blue-50 dark:bg-blue-900/20'
                    }`}
                  >
                    <div className={`w-2 h-2 mt-2 rounded-full ${
                      alert.type === 'warning' ? 'bg-yellow-500' :
                      alert.type === 'error' ? 'bg-red-500' :
                      alert.type === 'success' ? 'bg-green-500' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{timeAgo(alert.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold mt-1">{formatNumber(data.summary.total_users)}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {getTrendIndicator(data.summary.growth_rate)}
                    <span className="text-xs text-gray-500">{Math.abs(data.summary.growth_rate)}% vs last month</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Mentors</p>
                  <p className="text-2xl font-bold mt-1">{formatNumber(data.summary.total_mentors)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-green-600">{data.summary.active_mentors} online</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Signals</p>
                  <p className="text-2xl font-bold mt-1">{formatNumber(data.summary.total_signals)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-green-600">Win rate: {data.summary.win_rate.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(data.summary.total_revenue)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">{data.summary.total_transactions} transactions</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end justify-between gap-2">
                {data.user_growth.slice(-7).map((point, i) => {
                  const max = Math.max(...data.user_growth.map(p => p.value))
                  const height = max > 0 ? (point.value / max) * 100 : 0
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full text-center">
                        <span className="text-xs font-medium text-gray-600">{point.value}</span>
                      </div>
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-xs text-gray-500">
                        {format(new Date(point.date), 'dd MMM')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end justify-between gap-2">
                {data.revenue_trend.slice(-7).map((point, i) => {
                  const max = Math.max(...data.revenue_trend.map(p => p.value))
                  const height = max > 0 ? (point.value / max) * 100 : 0
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full text-center">
                        <span className="text-xs font-medium text-green-600">
                          ${(point.value / 1000).toFixed(1)}k
                        </span>
                      </div>
                      <div
                        className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-xs text-gray-500">
                        {format(new Date(point.date), 'dd MMM')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Activity */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recent_activities.length > 0 ? (
                  data.recent_activities.map(activity => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <ActivityIcon type={activity.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">{timeAgo(activity.timestamp)}</span>
                          {activity.status && <StatusBadge status={activity.status} />}
                          {activity.amount && (
                            <span className="text-xs font-medium text-green-600">
                              {formatCurrency(activity.amount)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <div className="lg:col-span-2 space-y-4">
            <Tabs defaultValue="users" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="users">Top Users</TabsTrigger>
                <TabsTrigger value="mentors">Top Mentors</TabsTrigger>
                <TabsTrigger value="signals">Top Signals</TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    {data.top_users.length > 0 ? (
                      data.top_users.map((user, index) => (
                        <div
                          key={user.id}
                          className={`flex items-center justify-between p-4 ${
                            index !== data.top_users.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">{user.value}</p>
                            <div className="flex items-center gap-1 text-xs">
                              {getTrendIndicator(user.trend)}
                              <span className={user.trend > 0 ? 'text-green-500' : 'text-red-500'}>
                                {Math.abs(user.trend)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No user data available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

<TabsContent value="mentors" className="mt-4">
  <Card>
    <CardContent className="p-0">
      {data.top_mentors.length > 0 ? (
        data.top_mentors.map((mentor, index) => (
          <div
            key={mentor.id}
            className={`flex items-center justify-between p-4 ${
              index !== data.top_mentors.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {mentor.name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-medium">{mentor.name || 'Unknown'}</p>
                <p className="text-xs text-gray-500">{mentor.email || 'No email'}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span className="text-sm font-bold">
                  {typeof mentor.rating === 'number' 
                    ? mentor.rating.toFixed(1) 
                    : mentor.rating 
                      ? Number(mentor.rating).toFixed(1) 
                      : '0.0'}
                </span>
              </div>
              <StatusBadge status={mentor.status || 'offline'} />
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">No mentor data available</p>
      )}
    </CardContent>
  </Card>
</TabsContent>
             
             
               <TabsContent value="signals" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    {data.top_signals.length > 0 ? (
                      data.top_signals.map((signal, index) => (
                        <div
                          key={signal.id}
                          className={`flex items-center justify-between p-4 ${
                            index !== data.top_signals.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {signal.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{signal.name}</p>
                              <p className="text-xs text-gray-500">{signal.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${signal.value > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {signal.value > 0 ? '+' : ''}{formatCurrency(signal.value)}
                            </p>
                            <StatusBadge status={signal.status || 'completed'} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No signal data available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signal Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(data.category_distribution).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(data.category_distribution).map(([category, count]) => {
                  const percentage = (count / data.summary.total_signals) * 100
                  return (
                    <div key={category} className="text-center">
                      <div className="relative w-20 h-20 mx-auto">
                        <svg className="w-20 h-20 transform -rotate-90">
                          <circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-gray-200 dark:text-gray-700"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 36}`}
                            strokeDashoffset={`${2 * Math.PI * 36 * (1 - percentage / 100)}`}
                            className={
                              category === 'Crypto' ? 'text-orange-500' :
                              category === 'Stocks' ? 'text-blue-500' :
                              category === 'Forex' ? 'text-green-500' :
                              'text-purple-500'
                            }
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold">{percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                      <p className="text-sm font-medium mt-2">{category}</p>
                      <p className="text-xs text-gray-500">{count} signals</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No category data available</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button className="h-auto py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <FileText className="w-5 h-5 mr-2" />
            Generate Report
          </Button>
          <Button variant="outline" className="h-auto py-4">
            <MessageSquare className="w-5 h-5 mr-2" />
            Review Messages
          </Button>
          <Button variant="outline" className="h-auto py-4">
            <Shield className="w-5 h-5 mr-2" />
            Moderate Content
          </Button>
          <Button variant="outline" className="h-auto py-4">
            <BarChart3 className="w-5 h-5 mr-2" />
            View Analytics
          </Button>
        </div>
      </div>
    </div>
  )
}