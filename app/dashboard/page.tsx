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
  BarChart3,
  BookOpen,
  Award,
  TrendingDown,
  GraduationCap,
  Video,
  Zap
} from 'lucide-react'
import { format, subDays, subMonths, subWeeks, subYears, eachDayOfInterval } from 'date-fns'

// Types
interface StudentDashboardSummary {
  enrolled_groups: number
  total_signals: number
  signals_taken: number
  signals_won: number
  win_rate: number
  total_profit_loss: number
  upcoming_sessions: number
  completed_sessions: number
  pending_approvals: number
  ranking: number
}

interface StudentRecentActivity {
  id: number
  type: 'signal' | 'session' | 'group' | 'mentor' | 'payment'
  title: string
  description: string
  timestamp: string
  status?: string
  profit_loss?: number
  group?: {
    name: string
    image?: string
  }
}

interface StudentGroup {
  id: number
  name: string
  mentor_name: string
  mentor_avatar?: string
  progress: number
  next_session_time?: string
  status: 'active' | 'completed' | 'pending'
  image?: string
}

interface StudentSignal {
  id: number
  asset: string
  type: 'buy' | 'sell'
  entry_price: number
  current_price?: number
  profit_loss?: number
  status: 'active' | 'closed' | 'pending'
  created_at: string
  closed_at?: string
}

interface StudentMentor {
  id: number
  name: string
  avatar?: string
  rating: number
  specialties: string[]
  groups_count: number
}

interface PerformanceDataPoint {
  date: string
  value: number
}

interface UpcomingSession {
  id: number
  group_name: string
  mentor_name: string
  start_time: string
  duration: number
  topic: string
}

interface StudentDashboardData {
  summary: StudentDashboardSummary
  recent_activities: StudentRecentActivity[]
  enrolled_groups: StudentGroup[]
  recent_signals: StudentSignal[]
  recommended_mentors: StudentMentor[]
  performance_data: PerformanceDataPoint[]
  upcoming_sessions: UpcomingSession[]
}

interface DateRange {
  from: Date
  to: Date
  label: string
}

// Default empty state
const defaultData: StudentDashboardData = {
  summary: {
    enrolled_groups: 0,
    total_signals: 0,
    signals_taken: 0,
    signals_won: 0,
    win_rate: 0,
    total_profit_loss: 0,
    upcoming_sessions: 0,
    completed_sessions: 0,
    pending_approvals: 0,
    ranking: 0
  },
  recent_activities: [],
  enrolled_groups: [],
  recent_signals: [],
  recommended_mentors: [],
  performance_data: [],
  upcoming_sessions: []
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
    published: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    buy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    sell: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
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
    signal: <Target className="w-4 h-4" />,
    session: <Video className="w-4 h-4" />,
    group: <Users className="w-4 h-4" />,
    mentor: <GraduationCap className="w-4 h-4" />,
    payment: <CreditCard className="w-4 h-4" />
  }
  
  const colors = {
    signal: 'bg-green-100 text-green-600 dark:bg-green-900/30',
    session: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
    group: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30',
    mentor: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30',
    payment: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30'
  }
  
  return (
    <div className={`p-2 rounded-lg ${colors[type as keyof typeof colors] || 'bg-gray-100'}`}>
      {icons[type as keyof typeof icons] || <Activity className="w-4 h-4" />}
    </div>
  )
}

export default function StudentDashboardPage() {
  const [data, setData] = useState<StudentDashboardData>(defaultData)
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

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  // Get token
  const getToken = () => {
    if (typeof window === 'undefined') return null
    const tokenSources = [
      localStorage.getItem('auth_token'),
      localStorage.getItem('token'),
      localStorage.getItem('access_token')
    ]
    return tokenSources.find(token => token && token !== 'null' && token !== 'undefined') || null
  }

  // Transform API data to dashboard format
  const transformData = (
    dashboardRes: any,
    groupsRes: any,
    signalsRes: any,
    mentorsRes: any,
    performanceRes: any,
    sessionsRes: any
  ): StudentDashboardData => {
    // Assuming API responses structure; adjust based on actual backend
    const dashboard = dashboardRes?.data || dashboardRes || {}
    const groups = groupsRes?.groups || groupsRes?.data || []
    const signals = signalsRes?.signals || signalsRes?.data || []
    const mentors = mentorsRes?.mentors || mentorsRes?.data || []
    const performance = performanceRes?.data || performanceRes || []
    const sessions = sessionsRes?.sessions || sessionsRes?.data || []

    // Summary
    const summary: StudentDashboardSummary = {
      enrolled_groups: groups.length,
      total_signals: signals.length,
      signals_taken: dashboard.signals_taken || signals.filter((s: any) => s.status !== 'pending').length,
      signals_won: dashboard.signals_won || signals.filter((s: any) => s.profit_loss && s.profit_loss > 0).length,
      win_rate: dashboard.win_rate || 0,
      total_profit_loss: dashboard.total_profit_loss || signals.reduce((acc: number, s: any) => acc + (s.profit_loss || 0), 0),
      upcoming_sessions: sessions.filter((s: any) => new Date(s.start_time) > new Date()).length,
      completed_sessions: sessions.filter((s: any) => new Date(s.start_time) < new Date()).length,
      pending_approvals: dashboard.pending_approvals || 0,
      ranking: dashboard.ranking || 0
    }

    // Recent activities (combine and sort)
    const activities: StudentRecentActivity[] = [
      ...signals.slice(0, 2).map((s: any) => ({
        id: s.id,
        type: 'signal' as const,
        title: s.type === 'buy' ? 'Buy Signal' : 'Sell Signal',
        description: `${s.asset} at ${formatCurrency(s.entry_price)}`,
        timestamp: s.created_at,
        status: s.status,
        profit_loss: s.profit_loss
      })),
      ...sessions.slice(0, 2).map((s: any) => ({
        id: s.id,
        type: 'session' as const,
        title: 'Live Session',
        description: s.topic,
        timestamp: s.start_time,
        status: new Date(s.start_time) > new Date() ? 'upcoming' : 'completed',
        group: { name: s.group_name }
      })),
      ...groups.slice(0, 1).map((g: any) => ({
        id: g.id,
        type: 'group' as const,
        title: 'Enrolled in Group',
        description: g.name,
        timestamp: g.enrolled_at || g.created_at,
        status: g.status
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5)

    // Enrolled groups
    const enrolledGroups: StudentGroup[] = groups.map((g: any) => ({
      id: g.id,
      name: g.name,
      mentor_name: g.mentor?.name || 'Unknown',
      mentor_avatar: g.mentor?.avatar,
      progress: g.progress || 0,
      next_session_time: g.next_session?.start_time,
      status: g.status,
      image: g.image
    }))

    // Recent signals
    const recentSignals: StudentSignal[] = signals.slice(0, 3).map((s: any) => ({
      id: s.id,
      asset: s.asset,
      type: s.type,
      entry_price: s.entry_price,
      current_price: s.current_price,
      profit_loss: s.profit_loss,
      status: s.status,
      created_at: s.created_at,
      closed_at: s.closed_at
    }))

    // Recommended mentors
    const recommendedMentors: StudentMentor[] = mentors.slice(0, 3).map((m: any) => ({
      id: m.id,
      name: m.name,
      avatar: m.avatar,
      rating: m.rating || 4.5,
      specialties: m.specialties || [],
      groups_count: m.groups_count || 0
    }))

    // Performance data (for chart)
    const performanceData: PerformanceDataPoint[] = performance.map((p: any) => ({
      date: p.date,
      value: p.cumulative_pl || p.value
    }))

    // Upcoming sessions
    const upcomingSessions: UpcomingSession[] = sessions
      .filter((s: any) => new Date(s.start_time) > new Date())
      .slice(0, 3)
      .map((s: any) => ({
        id: s.id,
        group_name: s.group_name,
        mentor_name: s.mentor_name,
        start_time: s.start_time,
        duration: s.duration || 60,
        topic: s.topic
      }))

    return {
      summary,
      recent_activities: activities,
      enrolled_groups: enrolledGroups,
      recent_signals: recentSignals,
      recommended_mentors: recommendedMentors,
      performance_data: performanceData,
      upcoming_sessions: upcomingSessions
    }
  }

  // Fetch all data
  const fetchAllData = async () => {
    try {
      const token = getToken()
      
      if (!token) {
        throw new Error('No authentication token found. Please log in.')
      }

      // Fetch all required data in parallel
      const [
        dashboardRes,
        groupsRes,
        signalsRes,
        mentorsRes,
        performanceRes,
        sessionsRes
      ] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/student/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/student/groups`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/student/signals`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/student/mentors/recommended`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/student/performance?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/student/sessions/upcoming`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      // Process responses
      const dashboardData = dashboardRes.status === 'fulfilled' && dashboardRes.value.ok 
        ? await dashboardRes.value.json() 
        : {}

      const groupsData = groupsRes.status === 'fulfilled' && groupsRes.value.ok 
        ? await groupsRes.value.json() 
        : { groups: [] }

      const signalsData = signalsRes.status === 'fulfilled' && signalsRes.value.ok 
        ? await signalsRes.value.json() 
        : { signals: [] }

      const mentorsData = mentorsRes.status === 'fulfilled' && mentorsRes.value.ok 
        ? await mentorsRes.value.json() 
        : { mentors: [] }

      const performanceData = performanceRes.status === 'fulfilled' && performanceRes.value.ok 
        ? await performanceRes.value.json() 
        : []

      const sessionsData = sessionsRes.status === 'fulfilled' && sessionsRes.value.ok 
        ? await sessionsRes.value.json() 
        : { sessions: [] }

      // Transform and set data
      const transformedData = transformData(
        dashboardData,
        groupsData,
        signalsData,
        mentorsData,
        performanceData,
        sessionsData
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
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
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
                Student Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Track your progress, upcoming sessions, and performance.
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

              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
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

        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Welcome back, Student!</h2>
                <p className="text-blue-100 mt-1">You're ranked #{data.summary.ranking} among students this month.</p>
              </div>
              <Award className="w-12 h-12 text-white/80" />
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Enrolled Groups</p>
                  <p className="text-2xl font-bold mt-1">{data.summary.enrolled_groups}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-gray-500">{data.summary.completed_sessions} sessions completed</span>
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Signals Taken</p>
                  <p className="text-2xl font-bold mt-1">{data.summary.signals_taken}</p>
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total P&L</p>
                  <p className={`text-2xl font-bold mt-1 ${data.summary.total_profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.summary.total_profit_loss >= 0 ? '+' : ''}{formatCurrency(data.summary.total_profit_loss)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {getTrendIndicator(data.summary.total_profit_loss)}
                    <span className="text-xs text-gray-500">{data.summary.signals_won} winning signals</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming Sessions</p>
                  <p className="text-2xl font-bold mt-1">{data.summary.upcoming_sessions}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-gray-500">Next: {data.upcoming_sessions[0] ? format(new Date(data.upcoming_sessions[0].start_time), 'hh:mm a') : 'None'}</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cumulative P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end justify-between gap-2">
              {data.performance_data.length > 0 ? (
                data.performance_data.slice(-7).map((point, i) => {
                  const values = data.performance_data.map(p => p.value)
                  const max = Math.max(...values)
                  const min = Math.min(...values)
                  const range = max - min
                  const height = range > 0 ? ((point.value - min) / range) * 100 : 50
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full text-center">
                        <span className={`text-xs font-medium ${point.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(point.value)}
                        </span>
                      </div>
                      <div
                        className={`w-full bg-gradient-to-t ${point.value >= 0 ? 'from-green-500 to-green-400' : 'from-red-500 to-red-400'} rounded-t`}
                        style={{ height: `${Math.max(10, height)}%` }}
                      />
                      <span className="text-xs text-gray-500">
                        {format(new Date(point.date), 'dd MMM')}
                      </span>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-gray-500 text-center w-full py-8">No performance data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Upcoming Sessions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Upcoming Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.upcoming_sessions.length > 0 ? (
                  data.upcoming_sessions.map(session => (
                    <div key={session.id} className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Video className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{session.topic}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{session.group_name} · {session.mentor_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">
                            {format(new Date(session.start_time), 'MMM dd, hh:mm a')} · {session.duration} min
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No upcoming sessions</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Signals */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Recent Signals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recent_signals.length > 0 ? (
                  data.recent_signals.map(signal => (
                    <div key={signal.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={signal.type} />
                        <div>
                          <p className="font-medium">{signal.asset}</p>
                          <p className="text-xs text-gray-500">Entry: {formatCurrency(signal.entry_price)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {signal.profit_loss !== undefined && (
                          <p className={`text-sm font-bold ${signal.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {signal.profit_loss >= 0 ? '+' : ''}{formatCurrency(signal.profit_loss)}
                          </p>
                        )}
                        <StatusBadge status={signal.status} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No recent signals</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enrolled Groups & Recommended Mentors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Enrolled Groups */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.enrolled_groups.length > 0 ? (
                  data.enrolled_groups.slice(0, 3).map(group => (
                    <div key={group.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {group.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{group.name}</p>
                            <p className="text-xs text-gray-500">Mentor: {group.mentor_name}</p>
                          </div>
                        </div>
                        <StatusBadge status={group.status} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{group.progress}%</span>
                        </div>
                        <Progress value={group.progress} className="h-2" />
                      </div>
                      {group.next_session_time && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>Next session: {format(new Date(group.next_session_time), 'MMM dd, hh:mm a')}</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">You are not enrolled in any groups yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recommended Mentors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recommended Mentors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recommended_mentors.length > 0 ? (
                  data.recommended_mentors.map(mentor => (
                    <div key={mentor.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {mentor.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{mentor.name}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-xs">{mentor.rating.toFixed(1)}</span>
                            </div>
                            <span className="text-xs text-gray-500">{mentor.specialties.slice(0, 2).join(', ')}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No mentor recommendations available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button className="h-auto py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <BookOpen className="w-5 h-5 mr-2" />
            Browse Groups
          </Button>
          <Button variant="outline" className="h-auto py-4">
            <Target className="w-5 h-5 mr-2" />
            View Signals
          </Button>
          <Button variant="outline" className="h-auto py-4">
            <Calendar className="w-5 h-5 mr-2" />
            Schedule Session
          </Button>
          <Button variant="outline" className="h-auto py-4">
            <BarChart3 className="w-5 h-5 mr-2" />
            Performance
          </Button>
        </div>
      </div>
    </div>
  )
}