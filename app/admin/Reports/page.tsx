'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs'
import { Progress } from '../../components/ui/Progress'
import { 
  TrendingUp, 
  Users, 
  Hash, 
  DollarSign, 
  BarChart3,
  Activity,
  Shield,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Printer,
  Mail,
  Bell,
  Settings,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  PieChart,
  LineChart,
  UserCheck,
  UserX,
  Award,
  Target,
  Zap,
  Globe,
  Archive,
  Edit,
  Trash2,
  Check,
  X,
  MessageSquare,
  CreditCard,
  Wallet,
  TrendingDown,
  Sparkles,
  Rocket,
  Crown,
  Star,
  BookOpen,
  GraduationCap,
  Briefcase,
  Building2,
  MapPin,
  Phone,
  Mail as MailIcon,
  Link,
  Twitter,
  Facebook,
  Linkedin,
  Instagram,
  Youtube,
  Github,
  Globe2,
  Cloud,
  CloudRain,
  Sun,
  Moon,
  Wind,
  Thermometer,
  Droplets,
  Umbrella,
  CloudSun,
  CloudMoon,
  CloudLightning,
  CloudSnow,
  Sunrise,
  Sunset,
  EyeIcon,
  UserPlus,
  UserMinus,
  UserCog,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Lock,
  Unlock,
  Key,
  Fingerprint,
  CreditCard as CreditCardIcon,
  Coins,
  Bitcoin,
  Ethereum,
  DollarSign as DollarSignIcon,
  Percent,
  Calculator,
  Sigma,
  Infinity,
  Circle,
  Square,
  Triangle,
  Hexagon,
  Octagon,
  Pentagon,
  Diamond,
  CircleDot,
  CircleDashed,
  CircleDotDashed,
  CircleOff,
  CircleSlash,
  CirclePower,
  CircleEqual,
  CircleDivide,
  CircleMinus,
  CirclePlus,
  CircleX,
  CircleCheck,
  CircleArrowUp,
  CircleArrowDown,
  CircleArrowLeft,
  CircleArrowRight,
  CircleHelp,
  CircleAlert,
  CircleStop,
  CirclePause,
  CirclePlay,
  CirclePauseOff,
  CirclePlayOff,
  CircleStopOff,
  CircleDollarSign,
  CircleEuro,
  CirclePound,
  CircleYen,
  CircleBitcoin,
  CircleEthereum,
  CirclePercent,
  CirclePlusOff,
  CircleMinusOff,
  CircleDivideOff,
  CircleEqualOff,
  CircleXOff,
  CircleCheckOff,
  CircleHelpOff,
  CircleAlertOff,
  CircleStopOff as CircleStopOffIcon,
  CirclePauseOff as CirclePauseOffIcon,
  CirclePlayOff as CirclePlayOffIcon,
  CircleDollarSign as CircleDollarSignIcon,
  CircleEuro as CircleEuroIcon,
  CirclePound as CirclePoundIcon,
  CircleYen as CircleYenIcon,
  CircleBitcoin as CircleBitcoinIcon,
  CircleEthereum as CircleEthereumIcon,
  CirclePercent as CirclePercentIcon,
  CirclePlus as CirclePlusIcon,
  CircleMinus as CircleMinusIcon,
  CircleDivide as CircleDivideIcon,
  CircleEqual as CircleEqualIcon,
  CircleX as CircleXIcon,
  CircleCheck as CircleCheckIcon,
  CircleHelp as CircleHelpIcon,
  CircleAlert as CircleAlertIcon,
  FileText
} from 'lucide-react'
import { format, subDays, subMonths, subWeeks, subYears, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

// Types
interface DashboardReport {
  period: {
    start: string
    end: string
    label: string
  }
  summary: {
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
  }
  users: {
    total: number
    active: number
    inactive: number
    suspended: number
    pending: number
    new_today: number
    new_week: number
    new_month: number
    by_role: Record<string, number>
    by_status: Record<string, number>
    by_account_type: Record<string, number>
    top_users: Array<{
      id: number
      name: string
      email: string
      role: string
      status: string
      joined: string
      activity: number
    }>
  }
  mentors: {
    total: number
    online: number
    away: number
    offline: number
    available: number
    featured: number
    avg_rating: number
    total_sessions: number
    total_conversations: number
    by_expertise: Record<string, number>
    by_rating: {
      high: number
      medium: number
      low: number
    }
    top_mentors: Array<{
      id: number
      name: string
      email: string
      rating: number
      sessions: number
      status: string
      is_available: boolean
      is_featured: boolean
      profile_image?: string
    }>
  }
  groups: {
    total: number
    active: number
    archived: number
    suspended: number
    private: number
    public: number
    requires_approval: number
    total_members: number
    total_messages: number
    messages_today: number
    new_members_week: number
    by_activity: {
      high: number
      medium: number
      low: number
    }
    top_groups: Array<{
      id: number
      name: string
      description: string
      members_count: number
      messages_count: number
      activity_level: string
      last_active: string
      is_private: boolean
      icon?: string
    }>
  }
  signals: {
    total: number
    published: number
    pending: number
    draft: number
    archived: number
    completed: number
    success_rate: number
    total_profit_loss: number
    avg_profit_loss: number
    win_rate: number
    by_category: Record<string, number>
    by_risk: Record<string, number>
    by_timeframe: Record<string, number>
    top_signals: Array<{
      id: number
      asset: string
      type: 'buy' | 'sell'
      entry_price: number
      target_price: number
      stop_loss: number
      profit_loss?: number
      status: string
      category: string
      created_at: string
    }>
  }
  transactions: {
    total: number
    completed: number
    pending: number
    failed: number
    refunded: number
    disputed: number
    total_amount: number
    avg_amount: number
    by_type: Record<string, number>
    by_status: Record<string, number>
    recent_transactions: Array<{
      id: number
      user_name: string
      amount: number
      status: string
      type: string
      date: string
    }>
    revenue_by_day: Array<{
      date: string
      amount: number
      count: number
    }>
  }
  charts: {
    user_growth: Array<{ date: string; count: number }>
    mentor_activity: Array<{ time: string; online: number; busy: number; offline: number }>
    group_activity: Array<{ date: string; messages: number; members: number }>
    signal_performance: Array<{ date: string; profit: number; signals: number }>
    revenue_trend: Array<{ date: string; revenue: number; transactions: number }>
  }
}

interface DateRange {
  from: Date
  to: Date
  label: string
}

// Helper function to safely format numbers with toFixed
const safeToFixed = (value: any, decimals: number = 1): string => {
  if (value === null || value === undefined) return '0.0'
  const num = typeof value === 'number' ? value : Number(value)
  return isNaN(num) ? '0.0' : num.toFixed(decimals)
}

// Helper function to safely get percentage
const safePercentage = (numerator: number, denominator: number): string => {
  if (!denominator || denominator === 0) return '0.0'
  return ((numerator / denominator) * 100).toFixed(1)
}

const defaultReport: DashboardReport = {
  period: {
    start: new Date().toISOString(),
    end: new Date().toISOString(),
    label: 'Today'
  },
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
    growth_rate: 0
  },
  users: {
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    pending: 0,
    new_today: 0,
    new_week: 0,
    new_month: 0,
    by_role: {},
    by_status: {},
    by_account_type: {},
    top_users: []
  },
  mentors: {
    total: 0,
    online: 0,
    away: 0,
    offline: 0,
    available: 0,
    featured: 0,
    avg_rating: 0,
    total_sessions: 0,
    total_conversations: 0,
    by_expertise: {},
    by_rating: {
      high: 0,
      medium: 0,
      low: 0
    },
    top_mentors: []
  },
  groups: {
    total: 0,
    active: 0,
    archived: 0,
    suspended: 0,
    private: 0,
    public: 0,
    requires_approval: 0,
    total_members: 0,
    total_messages: 0,
    messages_today: 0,
    new_members_week: 0,
    by_activity: {
      high: 0,
      medium: 0,
      low: 0
    },
    top_groups: []
  },
  signals: {
    total: 0,
    published: 0,
    pending: 0,
    draft: 0,
    archived: 0,
    completed: 0,
    success_rate: 0,
    total_profit_loss: 0,
    avg_profit_loss: 0,
    win_rate: 0,
    by_category: {},
    by_risk: {},
    by_timeframe: {},
    top_signals: []
  },
  transactions: {
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    refunded: 0,
    disputed: 0,
    total_amount: 0,
    avg_amount: 0,
    by_type: {},
    by_status: {},
    recent_transactions: [],
    revenue_by_day: []
  },
  charts: {
    user_growth: [],
    mentor_activity: [],
    group_activity: [],
    signal_performance: [],
    revenue_trend: []
  }
}

export default function AdminDashboardReportPage() {
  const [report, setReport] = useState<DashboardReport>(defaultReport)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
    label: 'Last 30 Days'
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedTab, setSelectedTab] = useState('overview')
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf')
  const [showExportModal, setShowExportModal] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<number>(300000) // 5 minutes

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  // Get token
  const getToken = () => {
    if (typeof window === 'undefined') return null
    const tokenSources = [
      localStorage.getItem('auth_token'),
      localStorage.getItem('admin_token'),
      localStorage.getItem('token'),
    ]
    return tokenSources.find(token => token && token !== 'null' && token !== 'undefined') || null
  }

  // Check admin access
  const checkAdminAccess = () => {
    if (typeof window === 'undefined') return false
    const userData = localStorage.getItem('user_data')
    const userRole = localStorage.getItem('user_role')
    
    if (!userData || !userRole) return false
    
    try {
      const user = JSON.parse(userData)
      return user.role === 'admin' || userRole === 'admin'
    } catch {
      return false
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

      // Fetch users
      const usersRes = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const usersData = usersRes.ok ? await usersRes.json() : { users: [] }

      // Fetch mentors
      const mentorsRes = await fetch(`${API_BASE_URL}/admin/mentors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const mentorsData = mentorsRes.ok ? await mentorsRes.json() : { data: { data: [] } }

      // Fetch groups
      const groupsRes = await fetch(`${API_BASE_URL}/admin/groups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const groupsData = groupsRes.ok ? await groupsRes.json() : { groups: [] }

      // Fetch signals
      const signalsRes = await fetch(`${API_BASE_URL}/admin/signals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const signalsData = signalsRes.ok ? await signalsRes.json() : { signals: [] }

      // Fetch transactions
      const transactionsRes = await fetch(`${API_BASE_URL}/payments/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const transactionsData = transactionsRes.ok ? await transactionsRes.json() : { transactions: [] }

      // Fetch stats
      const statsRes = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const statsData = statsRes.ok ? await statsRes.json() : { stats: {} }

      // Transform and combine data
      const transformedReport = transformData(
        usersData,
        mentorsData,
        groupsData,
        signalsData,
        transactionsData,
        statsData,
        dateRange
      )

      setReport(transformedReport)
      setError(null)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
      
      // Fallback to demo data
      const demoReport = generateDemoReport(dateRange)
      setReport(demoReport)
    }
  }

  // Transform API data to report format
  const transformData = (
    usersData: any,
    mentorsData: any,
    groupsData: any,
    signalsData: any,
    transactionsData: any,
    statsData: any,
    range: DateRange
  ): DashboardReport => {
    const users = usersData.users || []
    const mentors = mentorsData.data?.data || []
    const groups = groupsData.groups || []
    const signals = signalsData.signals || []
    const transactions = transactionsData.transactions || []
    const stats = statsData.stats || {}

    // Calculate date ranges
    const startDate = range.from
    const endDate = range.to
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    // Filter data by date range
    const usersInRange = users.filter((u: any) => new Date(u.created_at) >= startDate && new Date(u.created_at) <= endDate)
    const transactionsInRange = transactions.filter((t: any) => new Date(t.date) >= startDate && new Date(t.date) <= endDate)
    const signalsInRange = signals.filter((s: any) => new Date(s.created_at) >= startDate && new Date(s.created_at) <= endDate)

    // Calculate user metrics
    const activeUsers = users.filter((u: any) => u.status === 'active').length
    const newToday = users.filter((u: any) => {
      const date = new Date(u.created_at)
      const today = new Date()
      return date.toDateString() === today.toDateString()
    }).length

    const newWeek = users.filter((u: any) => {
      const date = new Date(u.created_at)
      const weekAgo = subDays(new Date(), 7)
      return date >= weekAgo
    }).length

    const newMonth = users.filter((u: any) => {
      const date = new Date(u.created_at)
      const monthAgo = subDays(new Date(), 30)
      return date >= monthAgo
    }).length

    // Calculate mentor metrics
    const onlineMentors = mentors.filter((m: any) => m.status === 'online').length
    const awayMentors = mentors.filter((m: any) => m.status === 'away').length
    const offlineMentors = mentors.filter((m: any) => m.status === 'offline').length
    const availableMentors = mentors.filter((m: any) => m.is_available).length
    const featuredMentors = mentors.filter((m: any) => m.is_featured).length
    
    const avgRating = mentors.reduce((sum: number, m: any) => sum + (m.rating || 0), 0) / (mentors.length || 1)
    const totalSessions = mentors.reduce((sum: number, m: any) => sum + (m.total_sessions || 0), 0)

    // Calculate group metrics
    const activeGroups = groups.filter((g: any) => g.status === 'active').length
    const privateGroups = groups.filter((g: any) => g.is_private).length
    const approvalGroups = groups.filter((g: any) => g.requires_approval).length
    const totalMembers = groups.reduce((sum: number, g: any) => sum + (g.members_count || 0), 0)
    const totalMessages = groups.reduce((sum: number, g: any) => sum + (g.total_messages || 0), 0)
    
    const messagesToday = groups.reduce((sum: number, g: any) => sum + (g.messages_today || 0), 0)
    const newMembersWeek = groups.reduce((sum: number, g: any) => sum + (g.new_members_week || 0), 0)

    // Calculate signal metrics
    const publishedSignals = signals.filter((s: any) => s.status === 'published').length
    const pendingSignals = signals.filter((s: any) => s.status === 'pending').length
    const draftSignals = signals.filter((s: any) => s.status === 'draft').length
    const archivedSignals = signals.filter((s: any) => s.status === 'archived').length
    const completedSignals = signals.filter((s: any) => s.status === 'completed').length

    const completedWithProfit = signals.filter((s: any) => s.actual_profit_loss && s.actual_profit_loss > 0)
    const winRate = completedSignals > 0 ? (completedWithProfit.length / completedSignals) * 100 : 0

    const totalProfitLoss = signals.reduce((sum: number, s: any) => sum + (s.actual_profit_loss || 0), 0)
    const avgProfitLoss = completedSignals > 0 ? totalProfitLoss / completedSignals : 0

    // Calculate transaction metrics
    const completedTransactions = transactions.filter((t: any) => t.status === 'completed').length
    const pendingTransactions = transactions.filter((t: any) => t.status === 'pending').length
    const failedTransactions = transactions.filter((t: any) => t.status === 'failed').length
    const refundedTransactions = transactions.filter((t: any) => t.status === 'refunded').length
    
    const totalAmount = transactionsInRange.reduce((sum: number, t: any) => {
      const amount = parseFloat(t.amount?.replace(/[$,]/g, '') || '0')
      return sum + amount
    }, 0)
    
    const avgAmount = transactionsInRange.length > 0 ? totalAmount / transactionsInRange.length : 0

    // Generate chart data
    const userGrowth = generateUserGrowthData(users, range)
    const mentorActivity = generateMentorActivityData(mentors, range)
    const groupActivity = generateGroupActivityData(groups, range)
    const signalPerformance = generateSignalPerformanceData(signals, range)
    const revenueTrend = generateRevenueTrendData(transactions, range)

    return {
      period: {
        start: range.from.toISOString(),
        end: range.to.toISOString(),
        label: range.label
      },
      summary: {
        total_users: users.length,
        total_mentors: mentors.length,
        total_groups: groups.length,
        total_signals: signals.length,
        total_transactions: transactions.length,
        total_revenue: totalAmount,
        active_users: activeUsers,
        active_mentors: onlineMentors + awayMentors,
        active_groups: activeGroups,
        published_signals: publishedSignals,
        pending_approvals: approvalGroups,
        growth_rate: stats.growth_rate || 12.5
      },
      users: {
        total: users.length,
        active: activeUsers,
        inactive: users.filter((u: any) => u.status === 'inactive').length,
        suspended: users.filter((u: any) => u.status === 'suspended').length,
        pending: users.filter((u: any) => u.status === 'pending').length,
        new_today: newToday,
        new_week: newWeek,
        new_month: newMonth,
        by_role: users.reduce((acc: any, u: any) => {
          const role = u.role || 'user'
          acc[role] = (acc[role] || 0) + 1
          return acc
        }, {}),
        by_status: users.reduce((acc: any, u: any) => {
          const status = u.status || 'active'
          acc[status] = (acc[status] || 0) + 1
          return acc
        }, {}),
        by_account_type: users.reduce((acc: any, u: any) => {
          const type = u.account_type || 'demo'
          acc[type] = (acc[type] || 0) + 1
          return acc
        }, {}),
        top_users: users
          .sort((a: any, b: any) => (b.trades || 0) - (a.trades || 0))
          .slice(0, 5)
          .map((u: any) => ({
            id: u.id,
            name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || u.email,
            email: u.email,
            role: u.role || 'user',
            status: u.status || 'active',
            joined: u.created_at,
            activity: u.trades || Math.floor(Math.random() * 100)
          }))
      },
      mentors: {
        total: mentors.length,
        online: onlineMentors,
        away: awayMentors,
        offline: offlineMentors,
        available: availableMentors,
        featured: featuredMentors,
        avg_rating: avgRating,
        total_sessions: totalSessions,
        total_conversations: mentors.reduce((sum: number, m: any) => sum + (m.conversations_count || 0), 0),
        by_expertise: mentors.reduce((acc: any, m: any) => {
          (m.expertise || []).forEach((exp: string) => {
            acc[exp] = (acc[exp] || 0) + 1
          })
          return acc
        }, {}),
        by_rating: {
          high: mentors.filter((m: any) => (m.rating || 0) >= 4.5).length,
          medium: mentors.filter((m: any) => (m.rating || 0) >= 3.5 && (m.rating || 0) < 4.5).length,
          low: mentors.filter((m: any) => (m.rating || 0) < 3.5).length
        },
        top_mentors: mentors
          .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 5)
          .map((m: any) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            rating: m.rating || 0,
            sessions: m.total_sessions || 0,
            status: m.status || 'offline',
            is_available: m.is_available || false,
            is_featured: m.is_featured || false,
            profile_image: m.profile_image_url
          }))
      },
      groups: {
        total: groups.length,
        active: activeGroups,
        archived: groups.filter((g: any) => g.status === 'archived').length,
        suspended: groups.filter((g: any) => g.status === 'suspended').length,
        private: privateGroups,
        public: groups.length - privateGroups,
        requires_approval: approvalGroups,
        total_members: totalMembers,
        total_messages: totalMessages,
        messages_today: messagesToday,
        new_members_week: newMembersWeek,
        by_activity: {
          high: groups.filter((g: any) => g.activity_level === 'high').length,
          medium: groups.filter((g: any) => g.activity_level === 'medium').length,
          low: groups.filter((g: any) => g.activity_level === 'low').length
        },
        top_groups: groups
          .sort((a: any, b: any) => (b.members_count || 0) - (a.members_count || 0))
          .slice(0, 5)
          .map((g: any) => ({
            id: g.id,
            name: g.name,
            description: g.description,
            members_count: g.members_count || 0,
            messages_count: g.total_messages || 0,
            activity_level: g.activity_level || 'medium',
            last_active: g.last_active || g.updated_at,
            is_private: g.is_private || false,
            icon: g.icon
          }))
      },
      signals: {
        total: signals.length,
        published: publishedSignals,
        pending: pendingSignals,
        draft: draftSignals,
        archived: archivedSignals,
        completed: completedSignals,
        success_rate: winRate,
        total_profit_loss: totalProfitLoss,
        avg_profit_loss: avgProfitLoss,
        win_rate: winRate,
        by_category: signals.reduce((acc: any, s: any) => {
          const cat = s.category || 'Uncategorized'
          acc[cat] = (acc[cat] || 0) + 1
          return acc
        }, {}),
        by_risk: signals.reduce((acc: any, s: any) => {
          const risk = s.risk_level || 'medium'
          acc[risk] = (acc[risk] || 0) + 1
          return acc
        }, {}),
        by_timeframe: signals.reduce((acc: any, s: any) => {
          const tf = s.timeframe || '1H'
          acc[tf] = (acc[tf] || 0) + 1
          return acc
        }, {}),
        top_signals: signals
          .sort((a: any, b: any) => (b.actual_profit_loss || 0) - (a.actual_profit_loss || 0))
          .slice(0, 5)
          .map((s: any) => ({
            id: s.id,
            asset: s.asset || s.symbol,
            type: s.type || 'buy',
            entry_price: parseFloat(s.entry_price) || 0,
            target_price: parseFloat(s.target_price) || 0,
            stop_loss: parseFloat(s.stop_loss) || 0,
            profit_loss: s.actual_profit_loss,
            status: s.status || 'draft',
            category: s.category || 'Crypto',
            created_at: s.created_at
          }))
      },
      transactions: {
        total: transactions.length,
        completed: completedTransactions,
        pending: pendingTransactions,
        failed: failedTransactions,
        refunded: refundedTransactions,
        disputed: transactions.filter((t: any) => t.status === 'disputed').length,
        total_amount: totalAmount,
        avg_amount: avgAmount,
        by_type: transactions.reduce((acc: any, t: any) => {
          const type = t.type || 'one_time'
          acc[type] = (acc[type] || 0) + 1
          return acc
        }, {}),
        by_status: transactions.reduce((acc: any, t: any) => {
          const status = t.status || 'pending'
          acc[status] = (acc[status] || 0) + 1
          return acc
        }, {}),
        recent_transactions: transactions
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
          .map((t: any) => ({
            id: t.id,
            user_name: t.user_name || t.user?.name || 'Unknown',
            amount: parseFloat(t.amount?.replace(/[$,]/g, '') || '0'),
            status: t.status || 'pending',
            type: t.type || 'one_time',
            date: t.date || t.created_at
          })),
        revenue_by_day: generateRevenueByDay(transactions, range)
      },
      charts: {
        user_growth: userGrowth,
        mentor_activity: mentorActivity,
        group_activity: groupActivity,
        signal_performance: signalPerformance,
        revenue_trend: revenueTrend
      }
    }
  }

  // Helper functions for chart data generation
  const generateUserGrowthData = (users: any[], range: DateRange) => {
    const days = eachDayOfInterval({ start: range.from, end: range.to })
    return days.map(day => {
      const count = users.filter(u => new Date(u.created_at) <= day).length
      return {
        date: format(day, 'yyyy-MM-dd'),
        count
      }
    })
  }

  const generateMentorActivityData = (mentors: any[], range: DateRange) => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    return hours.map(hour => {
      const time = `${hour.toString().padStart(2, '0')}:00`
      return {
        time,
        online: mentors.filter(m => m.status === 'online').length,
        busy: mentors.filter(m => m.status === 'away' || !m.is_available).length,
        offline: mentors.filter(m => m.status === 'offline').length
      }
    })
  }

  const generateGroupActivityData = (groups: any[], range: DateRange) => {
    const days = eachDayOfInterval({ start: range.from, end: range.to })
    return days.map(day => ({
      date: format(day, 'yyyy-MM-dd'),
      messages: groups.reduce((sum, g) => sum + (g.messages_today || 0), 0),
      members: groups.reduce((sum, g) => sum + (g.new_members_week || 0), 0) / 7
    }))
  }

  const generateSignalPerformanceData = (signals: any[], range: DateRange) => {
    const days = eachDayOfInterval({ start: range.from, end: range.to })
    return days.map(day => {
      const daySignals = signals.filter(s => {
        const date = new Date(s.created_at)
        return date.toDateString() === day.toDateString()
      })
      const profit = daySignals.reduce((sum, s) => sum + (s.actual_profit_loss || 0), 0)
      return {
        date: format(day, 'yyyy-MM-dd'),
        profit,
        signals: daySignals.length
      }
    })
  }

  const generateRevenueTrendData = (transactions: any[], range: DateRange) => {
    const days = eachDayOfInterval({ start: range.from, end: range.to })
    return days.map(day => {
      const dayTransactions = transactions.filter(t => {
        const date = new Date(t.date || t.created_at)
        return date.toDateString() === day.toDateString()
      })
      const revenue = dayTransactions.reduce((sum, t) => {
        const amount = parseFloat(t.amount?.replace(/[$,]/g, '') || '0')
        return sum + amount
      }, 0)
      return {
        date: format(day, 'yyyy-MM-dd'),
        revenue,
        transactions: dayTransactions.length
      }
    })
  }

  const generateRevenueByDay = (transactions: any[], range: DateRange) => {
    const days = eachDayOfInterval({ start: range.from, end: range.to })
    return days.map(day => {
      const dayTransactions = transactions.filter(t => {
        const date = new Date(t.date || t.created_at)
        return date.toDateString() === day.toDateString()
      })
      const amount = dayTransactions.reduce((sum, t) => {
        const amt = parseFloat(t.amount?.replace(/[$,]/g, '') || '0')
        return sum + amt
      }, 0)
      return {
        date: format(day, 'yyyy-MM-dd'),
        amount,
        count: dayTransactions.length
      }
    })
  }

  // Generate demo data for fallback
  const generateDemoReport = (range: DateRange): DashboardReport => {
    const days = eachDayOfInterval({ start: range.from, end: range.to })
    const userGrowth = days.map((day, i) => ({
      date: format(day, 'yyyy-MM-dd'),
      count: 100 + i * 3 + Math.floor(Math.random() * 10)
    }))

    const mentorActivity = Array.from({ length: 24 }, (_, i) => ({
      time: `${i.toString().padStart(2, '0')}:00`,
      online: 5 + Math.floor(Math.random() * 10),
      busy: 3 + Math.floor(Math.random() * 5),
      offline: 10 + Math.floor(Math.random() * 8)
    }))

    const groupActivity = days.map(day => ({
      date: format(day, 'yyyy-MM-dd'),
      messages: 50 + Math.floor(Math.random() * 100),
      members: 5 + Math.floor(Math.random() * 15)
    }))

    const signalPerformance = days.map(day => ({
      date: format(day, 'yyyy-MM-dd'),
      profit: (Math.random() * 1000) - 200,
      signals: 3 + Math.floor(Math.random() * 8)
    }))

    const revenueTrend = days.map(day => ({
      date: format(day, 'yyyy-MM-dd'),
      revenue: 1000 + Math.floor(Math.random() * 2000),
      transactions: 5 + Math.floor(Math.random() * 15)
    }))

    const revenueByDay = days.map(day => ({
      date: format(day, 'yyyy-MM-dd'),
      amount: 500 + Math.floor(Math.random() * 1500),
      count: 2 + Math.floor(Math.random() * 8)
    }))

    return {
      period: {
        start: range.from.toISOString(),
        end: range.to.toISOString(),
        label: range.label
      },
      summary: {
        total_users: 1247,
        total_mentors: 42,
        total_groups: 18,
        total_signals: 356,
        total_transactions: 892,
        total_revenue: 45280,
        active_users: 876,
        active_mentors: 28,
        active_groups: 15,
        published_signals: 234,
        pending_approvals: 7,
        growth_rate: 15.3
      },
      users: {
        total: 1247,
        active: 876,
        inactive: 234,
        suspended: 12,
        pending: 125,
        new_today: 18,
        new_week: 124,
        new_month: 356,
        by_role: { admin: 3, mentor: 42, user: 1202 },
        by_status: { active: 876, inactive: 234, pending: 125, suspended: 12 },
        by_account_type: { premium: 234, basic: 567, demo: 446 },
        top_users: [
          { id: 1, name: 'John Smith', email: 'john@example.com', role: 'user', status: 'active', joined: '2024-01-15', activity: 89 },
          { id: 2, name: 'Sarah Chen', email: 'sarah@example.com', role: 'user', status: 'active', joined: '2024-02-20', activity: 76 },
          { id: 3, name: 'Mike Thompson', email: 'mike@example.com', role: 'mentor', status: 'active', joined: '2024-01-10', activity: 92 },
          { id: 4, name: 'Emma Wilson', email: 'emma@example.com', role: 'user', status: 'active', joined: '2024-03-05', activity: 45 },
          { id: 5, name: 'David Kim', email: 'david@example.com', role: 'user', status: 'pending', joined: '2024-03-18', activity: 12 }
        ]
      },
      mentors: {
        total: 42,
        online: 12,
        away: 8,
        offline: 22,
        available: 15,
        featured: 8,
        avg_rating: 4.7,
        total_sessions: 1245,
        total_conversations: 3421,
        by_expertise: { 'Stocks': 15, 'Forex': 12, 'Crypto': 10, 'Options': 5 },
        by_rating: { high: 18, medium: 20, low: 4 },
        top_mentors: [
          { id: 1, name: 'Mike Thompson', email: 'mike@example.com', rating: 4.9, sessions: 234, status: 'online', is_available: true, is_featured: true },
          { id: 2, name: 'Sarah Chen', email: 'sarah@example.com', rating: 4.8, sessions: 198, status: 'online', is_available: true, is_featured: true },
          { id: 3, name: 'John Smith', email: 'john@example.com', rating: 4.7, sessions: 167, status: 'away', is_available: false, is_featured: false },
          { id: 4, name: 'Emma Wilson', email: 'emma@example.com', rating: 4.6, sessions: 145, status: 'offline', is_available: false, is_featured: true },
          { id: 5, name: 'David Kim', email: 'david@example.com', rating: 4.5, sessions: 123, status: 'online', is_available: true, is_featured: false }
        ]
      },
      groups: {
        total: 18,
        active: 15,
        archived: 2,
        suspended: 1,
        private: 6,
        public: 12,
        requires_approval: 4,
        total_members: 1247,
        total_messages: 23456,
        messages_today: 234,
        new_members_week: 89,
        by_activity: { high: 5, medium: 8, low: 5 },
        top_groups: [
          { id: 1, name: 'Trading Strategies', description: 'Advanced trading strategies', members_count: 456, messages_count: 12345, activity_level: 'high', last_active: new Date().toISOString(), is_private: false },
          { id: 2, name: 'Crypto Enthusiasts', description: 'Crypto discussion', members_count: 345, messages_count: 8765, activity_level: 'high', last_active: new Date().toISOString(), is_private: true },
          { id: 3, name: 'Technical Analysis', description: 'Chart analysis', members_count: 234, messages_count: 5678, activity_level: 'medium', last_active: new Date().toISOString(), is_private: false },
          { id: 4, name: 'Forex Traders', description: 'Forex trading', members_count: 123, messages_count: 2345, activity_level: 'low', last_active: new Date().toISOString(), is_private: false },
          { id: 5, name: 'Options Trading', description: 'Options strategies', members_count: 89, messages_count: 1234, activity_level: 'medium', last_active: new Date().toISOString(), is_private: true }
        ]
      },
      signals: {
        total: 356,
        published: 234,
        pending: 45,
        draft: 56,
        archived: 21,
        completed: 189,
        success_rate: 68.5,
        total_profit_loss: 45280,
        avg_profit_loss: 239.58,
        win_rate: 68.5,
        by_category: { Crypto: 120, Forex: 98, Stocks: 76, Commodities: 42, Indices: 20 },
        by_risk: { low: 98, medium: 178, high: 80 },
        by_timeframe: { '1H': 89, '4H': 123, '1D': 98, '1W': 46 },
        top_signals: [
          { id: 1, asset: 'BTC/USD', type: 'buy', entry_price: 45000, target_price: 50000, stop_loss: 43000, profit_loss: 5000, status: 'completed', category: 'Crypto', created_at: new Date().toISOString() },
          { id: 2, asset: 'EUR/USD', type: 'sell', entry_price: 1.12, target_price: 1.10, stop_loss: 1.13, profit_loss: 200, status: 'completed', category: 'Forex', created_at: new Date().toISOString() },
          { id: 3, asset: 'AAPL', type: 'buy', entry_price: 175, target_price: 190, stop_loss: 168, profit_loss: 1500, status: 'completed', category: 'Stocks', created_at: new Date().toISOString() },
          { id: 4, asset: 'ETH/USD', type: 'buy', entry_price: 3200, target_price: 3500, stop_loss: 3100, profit_loss: 300, status: 'published', category: 'Crypto', created_at: new Date().toISOString() },
          { id: 5, asset: 'TSLA', type: 'sell', entry_price: 180, target_price: 165, stop_loss: 185, profit_loss: 0, status: 'pending', category: 'Stocks', created_at: new Date().toISOString() }
        ]
      },
      transactions: {
        total: 892,
        completed: 678,
        pending: 123,
        failed: 45,
        refunded: 34,
        disputed: 12,
        total_amount: 45280,
        avg_amount: 50.76,
        by_type: { subscription: 567, one_time: 289, refund: 36 },
        by_status: { completed: 678, pending: 123, failed: 45, refunded: 34, disputed: 12 },
        recent_transactions: [
          { id: 1, user_name: 'John Smith', amount: 99.99, status: 'completed', type: 'subscription', date: new Date().toISOString() },
          { id: 2, user_name: 'Sarah Chen', amount: 49.99, status: 'completed', type: 'one_time', date: new Date().toISOString() },
          { id: 3, user_name: 'Mike Thompson', amount: 199.99, status: 'pending', type: 'subscription', date: new Date().toISOString() },
          { id: 4, user_name: 'Emma Wilson', amount: 29.99, status: 'completed', type: 'one_time', date: new Date().toISOString() },
          { id: 5, user_name: 'David Kim', amount: 99.99, status: 'failed', type: 'subscription', date: new Date().toISOString() }
        ],
        revenue_by_day: revenueByDay
      },
      charts: {
        user_growth: userGrowth,
        mentor_activity: mentorActivity,
        group_activity: groupActivity,
        signal_performance: signalPerformance,
        revenue_trend: revenueTrend
      }
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

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      fetchAllData()
    }, refreshInterval)
    
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAllData()
    setRefreshing(false)
  }

  // Handle export
  const handleExport = () => {
    // Implement export logic
    console.log('Exporting as:', exportFormat)
    setShowExportModal(false)
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Format number
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  // Get trend indicator
  const getTrendIndicator = (value: number) => {
    if (value > 0) {
      return <ArrowUpRight className="w-4 h-4 text-green-500" />
    } else if (value < 0) {
      return <ArrowDownRight className="w-4 h-4 text-red-500" />
    }
    return null
  }

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      suspended: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      refunded: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      disputed: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      online: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      away: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      offline: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || colors.inactive}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Generating dashboard report...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6 ${isFullscreen ? 'fixed inset-0 overflow-y-auto' : ''}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Admin Dashboard Report
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Complete platform overview and analytics for {report.period.label}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Range Picker */}
            <div className="relative">
              <Button
                variant="outline"
                className="gap-2 border-2 border-gray-300 hover:border-blue-500"
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                <Calendar className="w-4 h-4" />
                {report.period.label}
                <ChevronDown className="w-4 h-4" />
              </Button>

              {showDatePicker && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 p-4">
                  <h4 className="font-semibold mb-3">Select Period</h4>
                  <div className="space-y-2">
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
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setDateRange({
                          from: subMonths(new Date(), 6),
                          to: new Date(),
                          label: 'Last 6 Months'
                        })
                        setShowDatePicker(false)
                      }}
                    >
                      Last 6 Months
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setDateRange({
                          from: subYears(new Date(), 1),
                          to: new Date(),
                          label: 'Last Year'
                        })
                        setShowDatePicker(false)
                      }}
                    >
                      Last Year
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Auto-refresh toggle */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
              <span className="text-sm text-gray-600 dark:text-gray-400">Auto-refresh</span>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`w-8 h-4 rounded-full transition-colors ${autoRefresh ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${autoRefresh ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="border-2 border-gray-300 hover:border-blue-500"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="border-2 border-gray-300 hover:border-blue-500"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="border-2 border-gray-300 hover:border-blue-500"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4" />
            </Button>

            <Button
              className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600"
              onClick={() => setShowExportModal(true)}
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Users</p>
                  <p className="text-2xl font-bold mt-1">{formatNumber(report.summary.total_users)}</p>
                  <div className="flex items-center gap-1 mt-2 text-blue-100">
                    {getTrendIndicator(report.summary.growth_rate)}
                    <span className="text-xs">{Math.abs(report.summary.growth_rate)}% growth</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Mentors</p>
                  <p className="text-2xl font-bold mt-1">{formatNumber(report.summary.total_mentors)}</p>
                  <div className="flex items-center gap-1 mt-2 text-purple-100">
                    <div className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      <span className="text-xs">{report.mentors.online} online</span>
                    </div>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Groups</p>
                  <p className="text-2xl font-bold mt-1">{formatNumber(report.summary.total_groups)}</p>
                  <div className="flex items-center gap-1 mt-2 text-green-100">
                    <Users className="w-3 h-3" />
                    <span className="text-xs">{report.groups.total_members} members</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Hash className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Total Signals</p>
                  <p className="text-2xl font-bold mt-1">{formatNumber(report.summary.total_signals)}</p>
                  <div className="flex items-center gap-1 mt-2 text-orange-100">
                    <Target className="w-3 h-3" />
                    <span className="text-xs">{safeToFixed(report.signals.win_rate)}% win rate</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(report.summary.total_revenue)}</p>
                  <div className="flex items-center gap-1 mt-2 text-red-100">
                    <CreditCard className="w-3 h-3" />
                    <span className="text-xs">{report.summary.total_transactions} transactions</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              Users
            </TabsTrigger>
            <TabsTrigger value="mentors" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              Mentors
            </TabsTrigger>
            <TabsTrigger value="groups" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              Groups
            </TabsTrigger>
            <TabsTrigger value="signals" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              Signals
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              Transactions
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(report.summary.active_users)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {safePercentage(report.summary.active_users, report.summary.total_users)}% of total
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Mentors</p>
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Shield className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(report.summary.active_mentors)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {report.mentors.available} available now
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Published Signals</p>
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Globe className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(report.summary.published_signals)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {safeToFixed(report.signals.win_rate)}% success rate
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approvals</p>
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                      <Clock className="w-4 h-4 text-yellow-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(report.summary.pending_approvals)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {report.groups.requires_approval} groups need review
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* User Growth Chart */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">User Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end justify-between gap-1">
                    {report.charts.user_growth.slice(-14).map((day, i) => {
                      const max = Math.max(...report.charts.user_growth.map(d => d.count))
                      const height = (day.count / max) * 100
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex justify-center">
                            <span className="text-xs font-medium text-gray-600">{day.count}</span>
                          </div>
                          <div
                            className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t"
                            style={{ height: `${height}%`, minHeight: '4px' }}
                          />
                          <div className="text-xs text-gray-500 rotate-45 origin-left">
                            {format(new Date(day.date), 'dd MMM')}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Trend Chart */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end justify-between gap-1">
                    {report.charts.revenue_trend.slice(-14).map((day, i) => {
                      const max = Math.max(...report.charts.revenue_trend.map(d => d.revenue))
                      const height = max > 0 ? (day.revenue / max) * 100 : 0
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex justify-center">
                            <span className="text-xs font-medium text-green-600">
                              ${(day.revenue / 1000).toFixed(1)}k
                            </span>
                          </div>
                          <div
                            className="w-full bg-gradient-to-t from-green-500 to-emerald-500 rounded-t"
                            style={{ height: `${height}%`, minHeight: '4px' }}
                          />
                          <div className="text-xs text-gray-500 rotate-45 origin-left">
                            {format(new Date(day.date), 'dd MMM')}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mentor Activity Chart */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Mentor Activity (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-1">
                  {report.charts.mentor_activity.map((hour, i) => {
                    const max = Math.max(
                      ...report.charts.mentor_activity.map(h => h.online + h.busy + h.offline)
                    )
                    const totalHeight = max > 0 ? ((hour.online + hour.busy + hour.offline) / max) * 100 : 0
                    const onlineHeight = max > 0 ? (hour.online / max) * 100 : 0
                    const busyHeight = max > 0 ? (hour.busy / max) * 100 : 0
                    
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full relative" style={{ height: `${totalHeight}%` }}>
                          <div
                            className="absolute bottom-0 w-full bg-green-500"
                            style={{ height: `${onlineHeight}%` }}
                          />
                          <div
                            className="absolute bottom-0 w-full bg-yellow-500"
                            style={{ height: `${busyHeight}%`, bottom: `${onlineHeight}%` }}
                          />
                          <div
                            className="absolute bottom-0 w-full bg-gray-500"
                            style={{ height: `${totalHeight - onlineHeight - busyHeight}%`, bottom: `${onlineHeight + busyHeight}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 rotate-45 origin-left">
                          {hour.time}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded" />
                    <span className="text-xs">Online</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded" />
                    <span className="text-xs">Busy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-500 rounded" />
                    <span className="text-xs">Offline</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Users */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Top Users by Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.users.top_users.map((user, i) => (
                      <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{user.activity}%</p>
                          <StatusBadge status={user.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Mentors */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Top Rated Mentors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.mentors.top_mentors.map((mentor, i) => (
                      <div key={mentor.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center overflow-hidden">
                            {mentor.profile_image ? (
                              <img src={mentor.profile_image} alt={mentor.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-bold text-sm">{mentor.name.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{mentor.name}</p>
                            <p className="text-xs text-gray-500">{mentor.sessions} sessions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-sm font-bold">
                              {safeToFixed(mentor.rating, 1)}
                            </span>
                          </div>
                          <StatusBadge status={mentor.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold mt-1">{formatNumber(report.users.total)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">{formatNumber(report.users.active)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">New This Month</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">{formatNumber(report.users.new_month)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-bold mt-1 text-yellow-600">{formatNumber(report.users.pending)}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* User Distribution */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">User Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">By Role</h4>
                      {Object.entries(report.users.by_role).map(([role, count]) => {
                        const percentage = (count / report.users.total) * 100
                        return (
                          <div key={role} className="mb-2">
                            <div className="flex justify-between text-sm">
                              <span className="capitalize">{role}</span>
                              <span>{count} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        )
                      })}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">By Status</h4>
                      {Object.entries(report.users.by_status).map(([status, count]) => {
                        const percentage = (count / report.users.total) * 100
                        return (
                          <div key={status} className="mb-2">
                            <div className="flex justify-between text-sm">
                              <span className="capitalize">{status}</span>
                              <span>{count} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Growth Chart */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">User Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {/* Chart would go here */}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Mentors Tab */}
          <TabsContent value="mentors" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Mentors</p>
                  <p className="text-2xl font-bold mt-1">{formatNumber(report.mentors.total)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Online Now</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">{formatNumber(report.mentors.online)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average Rating</p>
                  <p className="text-2xl font-bold mt-1 text-yellow-600">{safeToFixed(report.mentors.avg_rating, 1)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
                  <p className="text-2xl font-bold mt-1">{formatNumber(report.mentors.total_sessions)}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mentor Distribution */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Mentor Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">By Rating</h4>
                      {Object.entries(report.mentors.by_rating).map(([rating, count]) => {
                        const total = report.mentors.total
                        const percentage = total > 0 ? (count / total) * 100 : 0
                        return (
                          <div key={rating} className="mb-2">
                            <div className="flex justify-between text-sm">
                              <span className="capitalize">{rating}</span>
                              <span>{count} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <Progress 
                              value={percentage} 
                              className="h-2"
                              indicatorClassName={
                                rating === 'high' ? 'bg-green-500' :
                                rating === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                              }
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Expertise */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Top Expertise</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(report.mentors.by_expertise)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([exp, count]) => (
                        <div key={exp} className="flex justify-between items-center">
                          <span className="text-sm">{exp}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Groups</p>
                  <p className="text-2xl font-bold mt-1">{formatNumber(report.groups.total)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">{formatNumber(report.groups.active)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
                  <p className="text-2xl font-bold mt-1">{formatNumber(report.groups.total_members)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Messages Today</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">{formatNumber(report.groups.messages_today)}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Group Activity Distribution */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Group Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(report.groups.by_activity).map(([level, count]) => {
                      const percentage = (count / report.groups.total) * 100
                      return (
                        <div key={level} className="mb-2">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{level}</span>
                            <span>{count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <Progress 
                            value={percentage} 
                            className="h-2"
                            indicatorClassName={
                              level === 'high' ? 'bg-green-500' :
                              level === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
                            }
                          />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Top Groups */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Top Groups by Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.groups.top_groups.map((group) => (
                      <div key={group.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div>
                          <p className="font-medium">{group.name}</p>
                          <p className="text-xs text-gray-500">{group.members_count} members</p>
                        </div>
                        <div className="text-right">
                          <Badge className={
                            group.activity_level === 'high' ? 'bg-green-500' :
                            group.activity_level === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
                          }>
                            {group.activity_level}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Signals Tab */}
          <TabsContent value="signals" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Signals</p>
                  <p className="text-2xl font-bold mt-1">{formatNumber(report.signals.total)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Win Rate</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">{safeToFixed(report.signals.win_rate)}%</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total P&L</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">{formatCurrency(report.signals.total_profit_loss)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Published</p>
                  <p className="text-2xl font-bold mt-1 text-purple-600">{formatNumber(report.signals.published)}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Signal Distribution */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Signal Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">By Category</h4>
                      {Object.entries(report.signals.by_category).map(([category, count]) => {
                        const percentage = (count / report.signals.total) * 100
                        return (
                          <div key={category} className="mb-2">
                            <div className="flex justify-between text-sm">
                              <span>{category}</span>
                              <span>{count} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        )
                      })}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">By Risk Level</h4>
                      {Object.entries(report.signals.by_risk).map(([risk, count]) => {
                        const percentage = (count / report.signals.total) * 100
                        return (
                          <div key={risk} className="mb-2">
                            <div className="flex justify-between text-sm">
                              <span className="capitalize">{risk}</span>
                              <span>{count} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <Progress 
                              value={percentage} 
                              className="h-2"
                              indicatorClassName={
                                risk === 'low' ? 'bg-green-500' :
                                risk === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                              }
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Signals */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Top Performing Signals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.signals.top_signals.map((signal) => (
                      <div key={signal.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div>
                          <p className="font-medium">{signal.asset}</p>
                          <p className="text-xs text-gray-500">{signal.category} • {signal.type.toUpperCase()}</p>
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
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</p>
                  <p className="text-2xl font-bold mt-1">{formatNumber(report.transactions.total)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(report.transactions.total_amount)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">{formatNumber(report.transactions.completed)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average</p>
                  <p className="text-2xl font-bold mt-1 text-purple-600">{formatCurrency(report.transactions.avg_amount)}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Transaction Distribution */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Transaction Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">By Status</h4>
                      {Object.entries(report.transactions.by_status).map(([status, count]) => {
                        const percentage = (count / report.transactions.total) * 100
                        return (
                          <div key={status} className="mb-2">
                            <div className="flex justify-between text-sm">
                              <span className="capitalize">{status}</span>
                              <span>{count} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        )
                      })}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">By Type</h4>
                      {Object.entries(report.transactions.by_type).map(([type, count]) => {
                        const percentage = (count / report.transactions.total) * 100
                        return (
                          <div key={type} className="mb-2">
                            <div className="flex justify-between text-sm">
                              <span className="capitalize">{type.replace('_', ' ')}</span>
                              <span>{count} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.transactions.recent_transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{tx.user_name}</p>
                          <p className="text-xs text-gray-500">{format(new Date(tx.date), 'MMM dd, HH:mm')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{formatCurrency(tx.amount)}</p>
                          <StatusBadge status={tx.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Export Report</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => setExportFormat('pdf')}
                  >
                    <FileText className="w-6 h-6" />
                    <span className="text-xs">PDF</span>
                  </Button>
                  <Button
                    variant={exportFormat === 'excel' ? 'default' : 'outline'}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => setExportFormat('excel')}
                  >
                    <BarChart3 className="w-6 h-6" />
                    <span className="text-xs">Excel</span>
                  </Button>
                  <Button
                    variant={exportFormat === 'csv' ? 'default' : 'outline'}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => setExportFormat('csv')}
                  >
                    <Download className="w-6 h-6" />
                    <span className="text-xs">CSV</span>
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={() => setShowExportModal(false)}>
                  Cancel
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600" onClick={handleExport}>
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}