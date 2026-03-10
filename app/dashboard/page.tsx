'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
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
  ChevronDown,
  X,
  BookOpen,
  Award,
  GraduationCap,
  Video,
  Zap,
  BarChart3
} from 'lucide-react'
import { format, subDays, subMonths } from 'date-fns'

// Types
interface User {
  id: number
  name: string
  email: string
  avatar?: string
  demo_balance?: number
  balance?: number
  role: string
  status: string
}

interface DashboardStats {
  total_classes?: number
  completed_classes?: number
  total_signals?: number
  total_mentors?: number
  win_rate?: number
  total_profit_loss?: number
  ranking?: number
  pending_approvals?: number
}

interface EnrolledClass {
  id: number
  title: string
  name?: string
  description?: string
  mentor?: {
    id: number
    name: string
    avatar?: string
  }
  schedule?: Array<{
    id: number
    start_time: string
    duration: number
    topic: string
  }>
  status: string
  progress?: number
  image?: string
}

interface FollowedSignal {
  id: number
  asset: string
  pair?: string
  type: 'buy' | 'sell'
  entry_price: number
  current_price?: number
  profit_loss?: number
  status: 'active' | 'closed' | 'pending'
  created_at: string
  closed_at?: string
  mentor?: {
    id: number
    name: string
  }
}

interface SignalPerformance {
  date: string
  cumulative_pl: number
  value?: number
}

interface ChatMentor {
  id: number
  name: string
  avatar?: string
  rating?: number
  specialties?: string[]
  groups_count?: number
}

interface GroupMembership {
  group_id: number
  status: string
  role: string
  joined_at: string
  group: {
    id: number
    name: string
    slug: string
    description: string
    icon?: string
    cover_image?: string
  }
}

interface StudentDashboardData {
  user: User | null
  summary: {
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
    demo_balance: number
    balance: number
  }
  recent_activities: Array<{
    id: number
    type: 'signal' | 'session' | 'group' | 'mentor' | 'payment'
    title: string
    description: string
    timestamp: string
    status?: string
    profit_loss?: number
    group?: { name: string }
  }>
  enrolled_groups: Array<{
    id: number
    name: string
    mentor_name: string
    mentor_avatar?: string
    progress: number
    next_session_time?: string
    status: string
    image?: string
  }>
  recent_signals: Array<{
    id: number
    asset: string
    type: 'buy' | 'sell'
    entry_price: number
    current_price?: number
    profit_loss?: number
    status: string
    created_at: string
    closed_at?: string
  }>
  recommended_mentors: Array<{
    id: number
    name: string
    avatar?: string
    rating: number
    specialties: string[]
    groups_count: number
  }>
  performance_data: Array<{
    date: string
    value: number
  }>
  upcoming_sessions: Array<{
    id: number
    group_name: string
    mentor_name: string
    start_time: string
    duration: number
    topic: string
  }>
}

interface DateRange {
  from: Date
  to: Date
  label: string
}

// Default empty state
const defaultData: StudentDashboardData = {
  user: null,
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
    ranking: 0,
    demo_balance: 0,
    balance: 0
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

// Safe array helper - ensures we always have an array to work with
const safeArray = <T,>(data: any, defaultValue: T[] = []): T[] => {
  if (Array.isArray(data)) return data
  if (data?.data && Array.isArray(data.data)) return data.data
  if (data?.memberships && Array.isArray(data.memberships)) return data.memberships
  if (data?.signals && Array.isArray(data.signals)) return data.signals
  if (data?.results && Array.isArray(data.results)) return data.results
  if (data?.items && Array.isArray(data.items)) return data.items
  return defaultValue
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
    userData: any,
    dashboardStats: any,
    enrolledClasses: any,
    mySignals: any,
    signalPerformance: any,
    chatMentors: any,
    groupMemberships: any
  ): StudentDashboardData => {
    // Process user data
    const user = userData ? {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar,
      demo_balance: userData.demo_balance || 0,
      balance: userData.balance || 0,
      role: userData.role,
      status: userData.status
    } : null

    // Process enrolled classes - use safeArray
    const enrolledClassesData = safeArray<EnrolledClass>(enrolledClasses)
    const enrolledGroups = enrolledClassesData.map((c: EnrolledClass) => ({
      id: c.id,
      name: c.title || c.name || 'Unknown',
      mentor_name: c.mentor?.name || 'Unknown',
      mentor_avatar: c.mentor?.avatar,
      progress: c.progress || Math.floor(Math.random() * 100),
      next_session_time: c.schedule?.[0]?.start_time,
      status: c.status || 'active',
      image: c.image
    }))

    // Process my signals - use safeArray
    const signalsData = safeArray<FollowedSignal>(mySignals)
    const recentSignals = signalsData.slice(0, 5).map((s: FollowedSignal) => ({
      id: s.id,
      asset: s.asset || s.pair || 'Unknown',
      type: s.type || 'buy',
      entry_price: s.entry_price || 0,
      current_price: s.current_price,
      profit_loss: s.profit_loss,
      status: s.status || 'active',
      created_at: s.created_at,
      closed_at: s.closed_at
    }))

    // Calculate signal stats
    const signalsTaken = recentSignals.length
    const signalsWon = recentSignals.filter(s => s.profit_loss && s.profit_loss > 0).length
    const winRate = signalsTaken > 0 ? (signalsWon / signalsTaken) * 100 : 0
    const totalProfitLoss = recentSignals.reduce((acc, s) => acc + (s.profit_loss || 0), 0)

    // Process chat mentors for recommended mentors - use safeArray
    const mentorsData = safeArray<ChatMentor>(chatMentors)
    const recommendedMentors = mentorsData.slice(0, 3).map((m: ChatMentor) => ({
      id: m.id,
      name: m.name,
      avatar: m.avatar,
      rating: m.rating || 4.5,
      specialties: m.specialties || ['Forex', 'Technical Analysis'],
      groups_count: m.groups_count || 0
    }))

    // Process group memberships - use safeArray
    const membershipsData = safeArray<GroupMembership>(groupMemberships?.memberships || groupMemberships)
    const groupsFromMemberships = membershipsData.map((m: GroupMembership) => ({
      id: m.group_id,
      name: m.group?.name || 'Unknown',
      mentor_name: 'Mentor',
      progress: 0,
      status: m.status || 'active',
      image: m.group?.icon,
      group: m.group
    }))

    // Combine groups from enrolled classes and memberships
    const allGroups = [...enrolledGroups, ...groupsFromMemberships]
    const uniqueGroups = Array.from(new Map(allGroups.map(g => [g.id, g])).values())

    // Process performance data for chart - use safeArray
    const performanceData = safeArray<SignalPerformance>(signalPerformance?.data || signalPerformance).map((p: SignalPerformance) => ({
      date: p.date || format(new Date(), 'yyyy-MM-dd'),
      value: p.cumulative_pl || p.value || 0
    }))

    // Generate upcoming sessions from classes
    const upcomingSessions = enrolledClassesData
      .flatMap((c: EnrolledClass) => 
        c.schedule?.filter(s => new Date(s.start_time) > new Date()).map(s => ({
          id: s.id,
          group_name: c.title || c.name || 'Unknown',
          mentor_name: c.mentor?.name || 'Unknown',
          start_time: s.start_time,
          duration: s.duration || 60,
          topic: s.topic || 'Live Session'
        })) || []
      )
      .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 3)

    // Get dashboard stats
    const stats = dashboardStats?.data || dashboardStats || {}

    // Create recent activities
    const activities = [
      ...recentSignals.slice(0, 2).map(s => ({
        id: s.id,
        type: 'signal' as const,
        title: `${s.type === 'buy' ? 'Buy' : 'Sell'} Signal`,
        description: `${s.asset} at ${formatCurrency(s.entry_price)}`,
        timestamp: s.created_at,
        status: s.status,
        profit_loss: s.profit_loss
      })),
      ...upcomingSessions.slice(0, 2).map(s => ({
        id: s.id,
        type: 'session' as const,
        title: 'Upcoming Session',
        description: s.topic,
        timestamp: s.start_time,
        status: 'upcoming',
        group: { name: s.group_name }
      })),
      ...uniqueGroups.slice(0, 1).map(g => ({
        id: g.id,
        type: 'group' as const,
        title: 'Enrolled in Group',
        description: g.name,
        timestamp: new Date().toISOString(),
        status: g.status
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5)

    // Summary
    const summary = {
      enrolled_groups: uniqueGroups.length,
      total_signals: signalsData.length,
      signals_taken: signalsTaken,
      signals_won: signalsWon,
      win_rate: winRate,
      total_profit_loss: totalProfitLoss,
      upcoming_sessions: upcomingSessions.length,
      completed_sessions: stats.completed_classes || 0,
      pending_approvals: stats.pending_approvals || 0,
      ranking: stats.ranking || 0,
      demo_balance: user?.demo_balance || 0,
      balance: user?.balance || 0
    }

    return {
      user,
      summary,
      recent_activities: activities,
      enrolled_groups: uniqueGroups,
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

      // Fetch all required data in parallel using actual API endpoints
      const [
        userRes,
        dashboardStatsRes,
        enrolledClassesRes,
        mySignalsRes,
        signalPerformanceRes,
        chatMentorsRes,
        groupMembershipsRes
      ] = await Promise.allSettled([
        // Get current user
        fetch(`${API_BASE_URL}/user`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        // Get dashboard stats
        fetch(`${API_BASE_URL}/dashboard/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        // Get enrolled classes
        fetch(`${API_BASE_URL}/classes/enrolled`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        // Get followed signals
        fetch(`${API_BASE_URL}/signals/my-followed`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        // Get signal performance
        fetch(`${API_BASE_URL}/signals/performance?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        // Get chat mentors (for recommendations)
        fetch(`${API_BASE_URL}/chat/mentors`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        // Get group memberships
        fetch(`${API_BASE_URL}/user/group-memberships`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      // Process responses with error logging
      const processResponse = async (res: PromiseSettledResult<Response>, defaultValue: any = null) => {
        if (res.status === 'fulfilled' && res.value.ok) {
          try {
            return await res.value.json()
          } catch (e) {
            console.error('Failed to parse JSON response:', e)
            return defaultValue
          }
        }
        if (res.status === 'rejected') {
          console.error('Request failed:', res.reason)
        }
        return defaultValue
      }

      const userData = await processResponse(userRes, null)
      const dashboardStats = await processResponse(dashboardStatsRes, {})
      const enrolledClasses = await processResponse(enrolledClassesRes, { data: [] })
      const mySignals = await processResponse(mySignalsRes, { data: [] })
      const signalPerformance = await processResponse(signalPerformanceRes, { data: [] })
      const chatMentors = await processResponse(chatMentorsRes, { data: [] })
      const groupMemberships = await processResponse(groupMembershipsRes, { memberships: [] })

      // Transform and set data
      const transformedData = transformData(
        userData,
        dashboardStats,
        enrolledClasses,
        mySignals,
        signalPerformance,
        chatMentors,
        groupMemberships
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
                Welcome back, {data.user?.name?.split(' ')[0] || 'Student'}! Track your progress and performance.
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
                <h2 className="text-xl font-semibold">Welcome back, {data.user?.name?.split(' ')[0] || 'Student'}!</h2>
                <p className="text-blue-100 mt-1">
                  {data.summary.ranking > 0 
                    ? `You're ranked #${data.summary.ranking} among students this month.` 
                    : 'Keep learning to improve your ranking!'}
                </p>
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Demo Balance</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">{formatCurrency(data.summary.demo_balance)}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs text-gray-500">Practice account</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Enrolled Groups</p>
                  <p className="text-2xl font-bold mt-1">{formatNumber(data.summary.enrolled_groups)}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-gray-500">{data.summary.completed_sessions} sessions completed</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
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
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600" />
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
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
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
                <p className="text-sm text-gray-500 text-center w-full py-8">No performance data available. Start following signals to see your performance.</p>
              )}
            </div>
          </CardContent>
        </Card>

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
                          {activity.profit_loss !== undefined && (
                            <span className={`text-xs font-medium ${activity.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {activity.profit_loss >= 0 ? '+' : ''}{formatCurrency(activity.profit_loss)}
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

          {/* Upcoming Sessions & Recent Signals */}
          <div className="lg:col-span-2 space-y-4">
            {/* Upcoming Sessions */}
            <Card>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Signals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.recent_signals.length > 0 ? (
                    data.recent_signals.slice(0, 3).map(signal => (
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
                    <p className="text-sm text-gray-500 text-center py-4">No recent signals. Follow signals to see them here.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
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