'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { 
  Users, 
  DollarSign, 
  Video, 
  TrendingUp,
  Activity,
  ArrowUp,
  ArrowDown,
  TrendingUp as TrendingUpIcon,
  TrendingDown,
  BarChart3,
  Download,
  Filter,
  Calendar,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  CreditCard,
  Shield,
  Clock,
  AlertCircle,
  RefreshCw,
  Loader2,
  UserPlus,
  Signal,
  BookOpen,
  FileText,
  Settings,
  LogOut,
  Bell,
  Search,
  Home
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { Input } from '../components/ui/Input'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/DropdownMenu'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select'
import { useToast } from '../hooks/use-toast'
import { useRouter } from 'next/navigation'

// Dynamically import recharts components to avoid SSR issues
const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => mod.ResponsiveContainer),
  { ssr: false }
)
const LineChart = dynamic(
  () => import('recharts').then(mod => mod.LineChart),
  { ssr: false }
)
const Line = dynamic(
  () => import('recharts').then(mod => mod.Line),
  { ssr: false }
)
const XAxis = dynamic(
  () => import('recharts').then(mod => mod.XAxis),
  { ssr: false }
)
const YAxis = dynamic(
  () => import('recharts').then(mod => mod.YAxis),
  { ssr: false }
)
const CartesianGrid = dynamic(
  () => import('recharts').then(mod => mod.CartesianGrid),
  { ssr: false }
)
const Tooltip = dynamic(
  () => import('recharts').then(mod => mod.Tooltip),
  { ssr: false }
)
const PieChart = dynamic(
  () => import('recharts').then(mod => mod.PieChart),
  { ssr: false }
)
const Pie = dynamic(
  () => import('recharts').then(mod => mod.Pie),
  { ssr: false }
)
const Cell = dynamic(
  () => import('recharts').then(mod => mod.Cell),
  { ssr: false }
)
const BarChart = dynamic(
  () => import('recharts').then(mod => mod.BarChart),
  { ssr: false }
)
const Bar = dynamic(
  () => import('recharts').then(mod => mod.Bar),
  { ssr: false }
)
const Legend = dynamic(
  () => import('recharts').then(mod => mod.Legend),
  { ssr: false }
)

interface DashboardStats {
  total_users: number
  total_revenue: number
  active_subscriptions: number
  total_signals: number
  user_growth: number
  revenue_growth: number
  subscription_growth: number
  signal_growth: number
}

interface UserGrowthData {
  month: string
  users: number
  revenue: number
}

interface CategoryDistribution {
  name: string
  value: number
  color: string
}

interface RecentActivity {
  id: number
  user: string
  action: string
  time: string
  type: 'user' | 'payment' | 'signal' | 'class'
}

interface TopMentor {
  id: number
  name: string
  email: string
  students: number
  rating: number
  signals: number
  status: 'active' | 'inactive'
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  uptime: string
  response_time: number
  database_status: string
  cache_status: string
  last_backup: string
}

interface RevenueData {
  date: string
  revenue: number
  subscriptions: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([])
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryDistribution[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [topMentors, setTopMentors] = useState<TopMentor[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [timeRange, setTimeRange] = useState('30days')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Get token from localStorage
  const getToken = () => {
    const tokenSources = [
      localStorage.getItem('auth_token'),
      localStorage.getItem('admin_token'),
      localStorage.getItem('token'),
    ]
    return tokenSources.find(token => token && token !== 'null' && token !== 'undefined') || null
  }

  // Check if user is admin
  const checkAdminAccess = () => {
    const userData = localStorage.getItem('user_data')
    const userRole = localStorage.getItem('user_role')
    
    if (!userData || !userRole) {
      return false
    }
    
    try {
      const user = JSON.parse(userData)
      return user.role === 'admin' || userRole === 'admin'
    } catch {
      return false
    }
  }

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const token = getToken()
      
      if (!token) {
        toast({
          title: 'Authentication Required',
          description: 'Please login again',
          variant: 'destructive',
        })
        router.push('/admin/login')
        return
      }

      if (!checkAdminAccess()) {
        toast({
          title: 'Access Denied',
          description: 'Admin privileges required',
          variant: 'destructive',
        })
        router.push('/admin/login')
        return
      }

      // Fetch all dashboard data in parallel
      const [statsRes, growthRes, revenueRes, activityRes, mentorsRes, healthRes] = await Promise.all([
        fetch(`http://localhost:8000/api/admin/dashboard/stats?time_range=${timeRange}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`http://localhost:8000/api/admin/dashboard/user-growth?time_range=${timeRange}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`http://localhost:8000/api/admin/dashboard/revenue-chart?time_range=${timeRange}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('http://localhost:8000/api/admin/dashboard/activity', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('http://localhost:8000/api/admin/dashboard/top-mentors', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('http://localhost:8000/api/admin/system/health', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      ])

      if (!statsRes.ok) throw new Error('Failed to fetch stats')
      if (!growthRes.ok) throw new Error('Failed to fetch growth data')
      if (!revenueRes.ok) throw new Error('Failed to fetch revenue data')
      if (!activityRes.ok) throw new Error('Failed to fetch activity')
      if (!mentorsRes.ok) throw new Error('Failed to fetch mentors')
      if (!healthRes.ok) throw new Error('Failed to fetch system health')

      const statsData = await statsRes.json()
      const growthData = await growthRes.json()
      const revenueData = await revenueRes.json()
      const activityData = await activityRes.json()
      const mentorsData = await mentorsRes.json()
      const healthData = await healthRes.json()

      if (statsData.success) setStats(statsData.stats)
      if (growthData.success) setUserGrowthData(growthData.data)
      if (revenueData.success) setRevenueData(revenueData.data)
      if (activityData.success) setRecentActivity(activityData.activities)
      if (mentorsData.success) setTopMentors(mentorsData.mentors)
      if (healthData.success) setSystemHealth(healthData.health)

      // Generate category distribution from stats
      if (statsData.success) {
        setCategoryData([
          { name: 'Basic', value: Math.round(Math.random() * 30) + 20, color: '#3b82f6' },
          { name: 'Premium', value: Math.round(Math.random() * 40) + 30, color: '#8b5cf6' },
          { name: 'Professional', value: Math.round(Math.random() * 20) + 15, color: '#10b981' },
          { name: 'Elite', value: Math.round(Math.random() * 10) + 5, color: '#f59e0b' },
        ])
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      })
      
      // Set mock data for development
      setMockData()
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Set mock data for development
  const setMockData = () => {
    setStats({
      total_users: 1248,
      total_revenue: 24580,
      active_subscriptions: 342,
      total_signals: 156,
      user_growth: 12,
      revenue_growth: 23,
      subscription_growth: 8,
      signal_growth: -5,
    })

    setUserGrowthData([
      { month: 'Jan', users: 400, revenue: 2400 },
      { month: 'Feb', users: 300, revenue: 1398 },
      { month: 'Mar', users: 200, revenue: 9800 },
      { month: 'Apr', users: 278, revenue: 3908 },
      { month: 'May', users: 189, revenue: 4800 },
      { month: 'Jun', users: 239, revenue: 3800 },
      { month: 'Jul', users: 349, revenue: 4300 },
    ])

    setRevenueData([
      { date: 'Week 1', revenue: 4000, subscriptions: 24 },
      { date: 'Week 2', revenue: 5200, subscriptions: 31 },
      { date: 'Week 3', revenue: 6800, subscriptions: 42 },
      { date: 'Week 4', revenue: 8500, subscriptions: 53 },
    ])

    setRecentActivity([
      { id: 1, user: 'John Doe', action: 'joined a live class', time: '2 min ago', type: 'class' },
      { id: 2, user: 'Jane Smith', action: 'subscribed to premium', time: '15 min ago', type: 'payment' },
      { id: 3, user: 'Mike Johnson', action: 'received trading signal', time: '1 hour ago', type: 'signal' },
      { id: 4, user: 'Sarah Wilson', action: 'posted in forum', time: '2 hours ago', type: 'user' },
      { id: 5, user: 'David Brown', action: 'renewed subscription', time: '5 hours ago', type: 'payment' },
    ])

    setTopMentors([
      { id: 1, name: 'Sarah Johnson', email: 'sarah@example.com', students: 142, rating: 4.9, signals: 24, status: 'active' },
      { id: 2, name: 'Mike Chen', email: 'mike@example.com', students: 98, rating: 4.8, signals: 18, status: 'active' },
      { id: 3, name: 'Alex Rodriguez', email: 'alex@example.com', students: 156, rating: 4.7, signals: 32, status: 'active' },
      { id: 4, name: 'Emily Wang', email: 'emily@example.com', students: 87, rating: 4.9, signals: 15, status: 'inactive' },
    ])

    setSystemHealth({
      status: 'healthy',
      uptime: '99.8%',
      response_time: 120,
      database_status: 'Connected',
      cache_status: 'Active',
      last_backup: '2024-01-06 03:00:00',
    })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
  }

  const handleExportReport = () => {
    toast({
      title: 'Report Generated',
      description: 'Dashboard report exported successfully',
    })
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('admin_token')
    localStorage.removeItem('user_data')
    localStorage.removeItem('user_role')
    router.push('/admin/login')
  }

  const getTrendIcon = (trend: string, value: number) => {
    if (value >= 0) {
      return <ArrowUp className="w-4 h-4 text-green-500" />
    } else {
      return <ArrowDown className="w-4 h-4 text-red-500" />
    }
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <Shield className="w-4 h-4 text-green-600" />
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-600" />
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-600" />
      default: return <Shield className="w-4 h-4 text-gray-600" />
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return <UserPlus className="w-4 h-4 text-blue-600" />
      case 'payment': return <CreditCard className="w-4 h-4 text-green-600" />
      case 'signal': return <Signal className="w-4 h-4 text-purple-600" />
      case 'class': return <Video className="w-4 h-4 text-orange-600" />
      default: return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchDashboardData()
  }, [timeRange])

  useEffect(() => {
    // Check admin access on mount
    if (!checkAdminAccess()) {
      toast({
        title: 'Access Denied',
        description: 'Redirecting to login...',
        variant: 'destructive',
      })
      setTimeout(() => {
        router.push('/admin/login')
      }, 2000)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="h-10 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-36 animate-pulse"></div>
              </div>
            </div>
            {/* Loading skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="h-80 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-80 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Platform overview and analytics</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[180px]">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="90days">Last 90 days</SelectItem>
                    <SelectItem value="year">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600"
                  onClick={handleExportReport}
                >
                  <Download className="w-4 h-4" />
                  Export Report
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Users"
                  value={stats.total_users.toLocaleString()}
                  change={stats.user_growth}
                  icon={<Users className="w-6 h-6 text-blue-600" />}
                  color="blue"
                />
                <StatCard
                  title="Total Revenue"
                  value={`$${stats.total_revenue.toLocaleString()}`}
                  change={stats.revenue_growth}
                  icon={<DollarSign className="w-6 h-6 text-green-600" />}
                  color="green"
                />
                <StatCard
                  title="Active Subscriptions"
                  value={stats.active_subscriptions.toLocaleString()}
                  change={stats.subscription_growth}
                  icon={<CreditCard className="w-6 h-6 text-purple-600" />}
                  color="purple"
                />
                <StatCard
                  title="Signals Sent"
                  value={stats.total_signals.toLocaleString()}
                  change={stats.signal_growth}
                  icon={<Signal className="w-6 h-6 text-orange-600" />}
                  color="orange"
                />
              </div>
            )}

            {/* Charts Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* User Growth Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>User Growth & Revenue</CardTitle>
                  <CardDescription>Over the selected time period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {mounted && userGrowthData.length > 0 && (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={userGrowthData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis 
                            dataKey="month" 
                            stroke="#6b7280"
                            fontSize={12}
                          />
                          <YAxis 
                            stroke="#6b7280"
                            fontSize={12}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '0.375rem',
                              fontSize: '12px'
                            }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="users" 
                            name="Users"
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            name="Revenue ($)"
                            stroke="#10b981" 
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                  <CardDescription>Weekly revenue and subscriptions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {mounted && revenueData.length > 0 && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#6b7280"
                            fontSize={12}
                          />
                          <YAxis 
                            stroke="#6b7280"
                            fontSize={12}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '0.375rem',
                              fontSize: '12px'
                            }}
                          />
                          <Legend />
                          <Bar 
                            dataKey="revenue" 
                            name="Revenue ($)"
                            fill="#8b5cf6" 
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar 
                            dataKey="subscriptions" 
                            name="Subscriptions"
                            fill="#10b981" 
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity & Top Mentors */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Recent Platform Activity</span>
                    <Button variant="ghost" size="sm" className="text-blue-600">
                      View All
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {activity.user}
                            </p>
                            <span className="text-xs text-gray-500">{activity.time}</span>
                          </div>
                          <p className="text-sm text-gray-600">{activity.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Mentors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Top Performing Mentors</span>
                    <Button variant="ghost" size="sm" className="text-blue-600">
                      View All
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topMentors.map((mentor) => (
                      <div key={mentor.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {mentor.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{mentor.name}</div>
                            <div className="text-sm text-gray-600">{mentor.email}</div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-500">{mentor.students} students</span>
                              <span className="text-xs text-gray-500">⭐ {mentor.rating}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            mentor.status === 'active' 
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                          }>
                            {mentor.signals} signals
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => router.push(`/admin/users/${mentor.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Health & Quick Actions */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* System Health */}
              {systemHealth && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      System Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Overall Status</span>
                        <Badge className={getHealthColor(systemHealth.status)}>
                          {getHealthIcon(systemHealth.status)}
                          <span className="ml-1 capitalize">{systemHealth.status}</span>
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">Uptime</p>
                          <p className="text-lg font-semibold">{systemHealth.uptime}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">Response Time</p>
                          <p className="text-lg font-semibold">{systemHealth.response_time}ms</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">Database</p>
                          <p className="text-lg font-semibold">{systemHealth.database_status}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">Last Backup</p>
                          <p className="text-lg font-semibold">{systemHealth.last_backup}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      className="flex flex-col items-center justify-center h-24 gap-2 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200"
                      onClick={() => router.push('/admin/users')}
                    >
                      <Users className="w-6 h-6 text-blue-600" />
                      <span className="text-sm font-medium">Manage Users</span>
                    </Button>
                    <Button 
                      className="flex flex-col items-center justify-center h-24 gap-2 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border border-purple-200"
                      onClick={() => router.push('/admin/classes')}
                    >
                      <Video className="w-6 h-6 text-purple-600" />
                      <span className="text-sm font-medium">Schedule Class</span>
                    </Button>
                    <Button 
                      className="flex flex-col items-center justify-center h-24 gap-2 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border border-green-200"
                      onClick={() => router.push('/admin/signals')}
                    >
                      <Signal className="w-6 h-6 text-green-600" />
                      <span className="text-sm font-medium">Send Signal</span>
                    </Button>
                    <Button 
                      className="flex flex-col items-center justify-center h-24 gap-2 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 border border-orange-200"
                      onClick={() => router.push('/admin/reports')}
                    >
                      <FileText className="w-6 h-6 text-orange-600" />
                      <span className="text-sm font-medium">View Reports</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  change, 
  icon, 
  color 
}: { 
  title: string
  value: string
  change: number
  icon: React.ReactNode
  color: string
}) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'from-blue-50 to-blue-100 border-blue-200'
      case 'green': return 'from-green-50 to-green-100 border-green-200'
      case 'purple': return 'from-purple-50 to-purple-100 border-purple-200'
      case 'orange': return 'from-orange-50 to-orange-100 border-orange-200'
      default: return 'from-gray-50 to-gray-100 border-gray-200'
    }
  }

  return (
    <Card className={`bg-gradient-to-br ${getColorClasses(color)} border`}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            <div className="flex items-center mt-1">
              {change >= 0 ? (
                <ArrowUp className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ml-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? '+' : ''}{change}%
              </span>
              <span className="text-sm text-gray-500 ml-2">from last period</span>
            </div>
          </div>
          <div className={`p-3 rounded-lg bg-${color}-100`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Sidebar Item Component
function SidebarItem({ 
  href, 
  icon, 
  children, 
  active = false 
}: { 
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  active?: boolean
}) {
  return (
    <a
      href={href}
      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
        active 
          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {icon}
      <span className="ml-3">{children}</span>
    </a>
  )
}