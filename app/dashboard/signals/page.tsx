'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { 
  TrendingUp, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Search,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Target,
  Shield,
  LineChart,
  Bell,
  Sparkles,
  Wallet,
  Loader2,
  Info,
  Filter,
  Download,
  MoreVertical,
  Globe,
  Archive,
  Zap,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Copy,
  Send,
  Mail,
  BarChart,
  DollarSign,
  Edit,
  Trash2
} from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select'
import { Label } from '../../components/ui/Label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs'
import { Switch } from '../../components/ui/Switch'
import { Textarea } from '../../components/ui/Textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/Dialog'

interface Signal {
  id: number
  asset: string
  type: 'buy' | 'sell'
  entry_price: number
  target_price: number
  stop_loss: number
  timeframe: string
  status: 'published' | 'draft' | 'pending' | 'archived'
  category: string
  risk_level: 'low' | 'medium' | 'high'
  profit_loss?: string | null
  created_at: string
  updated_at: string
  mentor_name?: string
  mentor_id?: number
  followers_count?: number
  is_following?: boolean
}

interface SignalStats {
  total_signals: number
  active_signals: number
  pending_signals: number
  completed_signals: number
  stopped_signals: number
  total_following: number
  success_rate: number
  avg_profit: number
  today_signals: number
}

const defaultStats: SignalStats = {
  total_signals: 0,
  active_signals: 0,
  pending_signals: 0,
  completed_signals: 0,
  stopped_signals: 0,
  total_following: 0,
  success_rate: 0,
  avg_profit: 0,
  today_signals: 0
}

const signalCategories = ['All', 'Crypto', 'Forex', 'Stocks', 'Commodities', 'Indices']
const riskLevels = ['low', 'medium', 'high']
const signalStatuses = ['all', 'published', 'pending', 'draft', 'archived']

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'Crypto': 'from-purple-500 to-violet-600',
    'Forex': 'from-blue-500 to-indigo-600',
    'Stocks': 'from-cyan-500 to-teal-600',
    'Commodities': 'from-amber-500 to-orange-600',
    'Indices': 'from-fuchsia-500 to-pink-600',
    'default': 'from-gray-500 to-gray-600'
  }
  return colors[category] || colors.default
}

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [filteredSignals, setFilteredSignals] = useState<Signal[]>([])
  const [stats, setStats] = useState<SignalStats>(defaultStats)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedRisk, setSelectedRisk] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewDetails, setViewDetails] = useState<Signal | null>(null)
  const [selectedSignals, setSelectedSignals] = useState<number[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'profit' | 'followers'>('newest')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Get token from localStorage
  const getToken = () => {
    const tokenSources = [
      localStorage.getItem('auth_token'),
      localStorage.getItem('token'),
    ]
    return tokenSources.find(token => token && token !== 'null' && token !== 'undefined') || null
  }

  // Fetch signals from API - USER/FOLLOWER ENDPOINT
  const fetchSignals = async (page = 1): Promise<{ signals: Signal[], total: number, last_page: number }> => {
    try {
      const token = getToken()
      
      if (!token) {
        setError('No authentication token found. Please login.')
        return { signals: [], total: 0, last_page: 1 }
      }

      // Use regular user signals endpoint
      const response = await fetch(`http://localhost:8000/api/signals?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please login again.')
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_data')
          setTimeout(() => {
            window.location.href = '/login'
          }, 2000)
          return { signals: [], total: 0, last_page: 1 }
        }
        
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to fetch signals: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        // Handle paginated response
        return {
          signals: data.data.map((signal: any) => ({
            id: signal.id,
            asset: signal.asset,
            type: signal.type,
            entry_price: parseFloat(signal.entry_price),
            target_price: parseFloat(signal.target_price),
            stop_loss: parseFloat(signal.stop_loss),
            timeframe: signal.timeframe,
            status: signal.status,
            category: signal.category,
            risk_level: signal.risk_level,
            profit_loss: signal.profit_loss || '0.0%',
            created_at: signal.created_at,
            updated_at: signal.updated_at,
            mentor_name: signal.mentor_name,
            mentor_id: signal.mentor_id,
            followers_count: signal.followers_count || 0,
            is_following: signal.is_following || false
          })),
          total: data.total || data.data.length,
          last_page: data.last_page || 1
        }
      } else if (data.success && data.signals) {
        // Handle non-paginated response
        return {
          signals: data.signals.map((signal: any) => ({
            id: signal.id,
            asset: signal.asset,
            type: signal.type,
            entry_price: parseFloat(signal.entry_price),
            target_price: parseFloat(signal.target_price),
            stop_loss: parseFloat(signal.stop_loss),
            timeframe: signal.timeframe,
            status: signal.status,
            category: signal.category,
            risk_level: signal.risk_level,
            profit_loss: signal.profit_loss || '0.0%',
            created_at: signal.created_at,
            updated_at: signal.updated_at,
            mentor_name: signal.mentor_name,
            mentor_id: signal.mentor_id,
            followers_count: signal.followers_count || 0,
            is_following: signal.is_following || false
          })),
          total: data.signals.length,
          last_page: 1
        }
      } else {
        throw new Error(data.message || 'Failed to fetch signals')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error fetching signals:', err)
      return { signals: [], total: 0, last_page: 1 }
    }
  }

  // Fetch signal statistics for user
  const fetchSignalStats = async (): Promise<SignalStats> => {
    try {
      const token = getToken()
      
      if (!token) {
        return defaultStats
      }

      const response = await fetch('http://localhost:8000/api/signals/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.stats) {
          return {
            total_signals: data.stats.total_signals || 0,
            active_signals: data.stats.active_signals || 0,
            pending_signals: data.stats.pending_signals || 0,
            completed_signals: data.stats.completed_signals || 0,
            stopped_signals: data.stats.stopped_signals || 0,
            total_following: data.stats.total_following || 0,
            success_rate: data.stats.success_rate || 0,
            avg_profit: data.stats.avg_profit || 0,
            today_signals: data.stats.today_signals || 0
          }
        }
      }
      return defaultStats
    } catch (err) {
      console.error('Error fetching signal stats:', err)
      return defaultStats
    }
  }

  // User actions
  const followSignal = async (signalId: number) => {
    try {
      const token = getToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`http://localhost:8000/api/signals/${signalId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to follow signal: ${response.statusText}`)
      }

      return { success: true }
    } catch (err) {
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to follow signal' 
      }
    }
  }

  const unfollowSignal = async (signalId: number) => {
    try {
      const token = getToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`http://localhost:8000/api/signals/${signalId}/unfollow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to unfollow signal: ${response.statusText}`)
      }

      return { success: true }
    } catch (err) {
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to unfollow signal' 
      }
    }
  }

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      
      const token = getToken()
      if (!token) {
        setError('Please login to access signals.')
        setIsLoading(false)
        window.location.href = '/login'
        return
      }
      
      try {
        const [signalsData, statsData] = await Promise.all([
          fetchSignals(currentPage),
          fetchSignalStats()
        ])
        
        setSignals(signalsData.signals)
        setTotalPages(signalsData.last_page)
        setStats(statsData)
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [currentPage])

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    setError(null)
    try {
      const [signalsData, statsData] = await Promise.all([
        fetchSignals(currentPage),
        fetchSignalStats()
      ])
      
      setSignals(signalsData.signals)
      setTotalPages(signalsData.last_page)
      setStats(statsData)
      setSelectedSignals([])
      setShowBulkActions(false)
    } catch (err) {
      console.error('Error refreshing data:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Filter and sort signals based on search and filters
  useEffect(() => {
    let filtered = [...signals]
    
    if (searchQuery) {
      filtered = filtered.filter(signal => 
        signal.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
        signal.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (signal.mentor_name && signal.mentor_name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(signal => signal.category === selectedCategory)
    }
    
    if (selectedRisk !== 'all') {
      filtered = filtered.filter(signal => signal.risk_level === selectedRisk)
    }
    
    if (activeTab !== 'all') {
      filtered = filtered.filter(signal => signal.status === activeTab)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return sortOrder === 'desc' 
            ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'profit':
          const aProfit = parseFloat(a.profit_loss?.replace('%', '') || '0')
          const bProfit = parseFloat(b.profit_loss?.replace('%', '') || '0')
          return sortOrder === 'desc' ? bProfit - aProfit : aProfit - bProfit
        case 'followers':
          return sortOrder === 'desc' 
            ? (b.followers_count || 0) - (a.followers_count || 0)
            : (a.followers_count || 0) - (b.followers_count || 0)
        default:
          return 0
      }
    })
    
    setFilteredSignals(filtered)
  }, [searchQuery, selectedCategory, selectedRisk, activeTab, signals, sortBy, sortOrder])

  // Handle signal selection for bulk actions
  const handleSignalSelect = (signalId: number) => {
    setSelectedSignals(prev => {
      if (prev.includes(signalId)) {
        return prev.filter(id => id !== signalId)
      } else {
        return [...prev, signalId]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedSignals.length === filteredSignals.length) {
      setSelectedSignals([])
    } else {
      setSelectedSignals(filteredSignals.map(signal => signal.id))
    }
  }

  useEffect(() => {
    setShowBulkActions(selectedSignals.length > 0)
  }, [selectedSignals])

  // Bulk actions for user
  const handleBulkFollow = async () => {
    const results = await Promise.all(
      selectedSignals.map(id => followSignal(id))
    )
    
    const successCount = results.filter(r => r.success).length
    if (successCount > 0) {
      handleRefresh()
      alert(`Successfully followed ${successCount} signals`)
    }
  }

  const handleBulkUnfollow = async () => {
    const results = await Promise.all(
      selectedSignals.map(id => unfollowSignal(id))
    )
    
    const successCount = results.filter(r => r.success).length
    if (successCount > 0) {
      handleRefresh()
      alert(`Successfully unfollowed ${successCount} signals`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-emerald-200/50'
      case 'pending': return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-200/50'
      case 'draft': return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-gray-200/50'
      case 'archived': return 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-rose-200/50'
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
    }
  }

  const getTypeColor = (type: string) => {
    return type === 'buy' 
      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-200/50'
      : 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-rose-200/50'
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-800 border-emerald-200'
      case 'medium': return 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 border-amber-200'
      case 'high': return 'bg-gradient-to-r from-rose-100 to-rose-50 text-rose-800 border-rose-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getProfitLossColor = (pl: string | null | undefined) => {
    if (!pl) return 'text-gray-600'
    if (pl.startsWith('+')) return 'text-green-600 font-bold'
    if (pl.startsWith('-')) return 'text-red-600 font-bold'
    return 'text-gray-600'
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  // Pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading signals...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Button 
              onClick={handleRefresh}
              className="w-full"
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Retry
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Trading Signals
          </h1>
          <p className="text-gray-600 mt-2">Follow expert trading signals from top mentors</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards - User Version */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-white to-emerald-50/30 border border-emerald-100/50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Published Signals</p>
                <p className="text-3xl font-bold mt-2 text-gray-900">
                  {stats.active_signals || 0}
                </p>
                <div className="flex items-center mt-1">
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600 ml-1">Live Now</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 shadow-lg">
                <Eye className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-white to-blue-50/30 border border-blue-100/50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Following</p>
                <p className="text-3xl font-bold mt-2 text-gray-900">
                  {stats.total_following || 0}
                </p>
                <div className="flex items-center mt-1">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-blue-600 ml-1">Signals</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 shadow-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-white to-amber-50/30 border border-amber-100/50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-3xl font-bold mt-2 text-gray-900">
                  {stats.success_rate || 0}%
                </p>
                <div className="flex items-center mt-1">
                  <Target className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-amber-600 ml-1">Platform average</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-lg">
                <Target className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-white to-purple-50/30 border border-purple-100/50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Profit</p>
                <p className="text-3xl font-bold mt-2 text-gray-900">
                  {stats.avg_profit || 0}%
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-purple-600 ml-1">Per signal</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 shadow-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">
                {selectedSignals.length} signal{selectedSignals.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkFollow}
                className="border-green-200 hover:bg-green-50 hover:border-green-300 transition-all"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Follow
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkUnfollow}
                className="border-red-200 hover:bg-red-50 hover:border-red-300 text-red-700 transition-all"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Unfollow
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSignals([])}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <Card className="lg:w-1/4 border-0 shadow-xl bg-gradient-to-b from-white to-gray-50/50">
          <CardHeader className="pb-4 border-b border-gray-200/50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-5 h-5 text-indigo-600" />
              Filter Signals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div>
              <Label htmlFor="search" className="mb-2 block text-sm font-medium text-gray-700">Search Signals</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="BTC, Crypto, Mentor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 border-2 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="border-2 border-gray-300 focus:border-indigo-500">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {signalCategories.map(category => (
                    <SelectItem key={category} value={category} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getCategoryColor(category)}`}></div>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700">Risk Level</Label>
              <Select value={selectedRisk} onValueChange={setSelectedRisk}>
                <SelectTrigger className="border-2 border-gray-300 focus:border-indigo-500">
                  <SelectValue placeholder="All Risk Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {riskLevels.map(level => (
                    <SelectItem key={level} value={level}>
                      <div className="flex items-center gap-2">
                        <Shield className={`w-3 h-3 ${
                          level === 'low' ? 'text-emerald-500' :
                          level === 'medium' ? 'text-amber-500' : 'text-rose-500'
                        }`} />
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700">Sort By</Label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="border-2 border-gray-300 focus:border-indigo-500">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="profit">Highest Profit</SelectItem>
                  <SelectItem value="followers">Most Followed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full gap-2"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </Button>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-200/50">
              <Label className="block text-sm font-medium text-gray-700">Quick Actions</Label>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2 border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all">
                  <Download className="w-4 h-4" />
                  Export List
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="lg:w-3/4 border-0 shadow-xl bg-gradient-to-b from-white to-gray-50/50 overflow-hidden">
          <CardHeader className="border-b border-gray-200/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle className="text-xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Available Signals
                </CardTitle>
                <CardDescription className="mt-2">
                  <span className="font-semibold text-gray-900">{filteredSignals.length}</span> signals • 
                  <span className="ml-2 text-green-600 font-medium">{(stats.success_rate || 0)}% success rate</span>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="gap-2 border-2 border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                >
                  {selectedSignals.length === filteredSignals.length ? (
                    <>
                      <XCircle className="w-4 h-4" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Select All
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 w-12">
                      <input
                        type="checkbox"
                        checked={selectedSignals.length === filteredSignals.length && filteredSignals.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Asset & Details</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Mentor</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Signal</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Prices</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">P/L</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50">
                  {filteredSignals.map((signal) => (
                    <tr key={signal.id} className="hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-gray-100/30 transition-colors group">
                      <td className="py-5 px-6">
                        <input
                          type="checkbox"
                          checked={selectedSignals.includes(signal.id)}
                          onChange={() => handleSignalSelect(signal.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="py-5 px-6">
                        <div>
                          <div className="font-bold text-gray-900 text-lg">{signal.asset}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full bg-gradient-to-r ${getCategoryColor(signal.category)} text-white`}>
                              {signal.category}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {signal.timeframe}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {getTimeAgo(signal.created_at)}
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        {signal.mentor_name ? (
                          <div>
                            <div className="font-medium text-gray-900">{signal.mentor_name}</div>
                            <div className="text-xs text-gray-500">Expert Mentor</div>
                            {signal.followers_count !== undefined && (
                              <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {signal.followers_count} follower{signal.followers_count !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-400 italic">Unknown</div>
                        )}
                      </td>
                      <td className="py-5 px-6">
                        <div className="space-y-2">
                          <Badge className={`${getTypeColor(signal.type)} font-bold shadow-lg`}>
                            {signal.type === 'buy' ? 
                              <ArrowUpRight className="w-4 h-4 mr-1" /> : 
                              <ArrowDownRight className="w-4 h-4 mr-1" />
                            }
                            {signal.type.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className={`${getRiskColor(signal.risk_level)}`}>
                            <Shield className="w-3 h-3 mr-1" />
                            {signal.risk_level.charAt(0).toUpperCase() + signal.risk_level.slice(1)}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-600">Entry:</span>
                            <span className="font-bold text-gray-900">
                              ${signal.entry_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                            <span className="font-bold text-emerald-600">
                              ${signal.target_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-red-600">Stop:</span>
                            <span className="font-bold text-red-600">
                              ${signal.stop_loss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="space-y-2">
                          <Badge className={`${getStatusColor(signal.status)} font-bold`}>
                            {signal.status === 'published' && <Globe className="w-3 h-3 mr-1" />}
                            {signal.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                            {signal.status === 'draft' && <Edit className="w-3 h-3 mr-1" />}
                            {signal.status === 'archived' && <Archive className="w-3 h-3 mr-1" />}
                            {signal.status.charAt(0).toUpperCase() + signal.status.slice(1)}
                          </Badge>
                          {signal.is_following && (
                            <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Following
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className={`text-lg font-bold ${getProfitLossColor(signal.profit_loss)}`}>
                          {signal.profit_loss || '0.0%'}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600 rounded-lg transition-all"
                            onClick={() => setViewDetails(signal)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={signal.is_following ? "outline" : "default"}
                            className={`gap-1 ${
                              signal.is_following 
                                ? 'border-2 border-gray-300 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700' 
                                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg'
                            }`}
                            onClick={() => {
                              if (signal.is_following) {
                                unfollowSignal(signal.id).then(handleRefresh)
                              } else {
                                followSignal(signal.id).then(handleRefresh)
                              }
                            }}
                          >
                            {signal.is_following ? 'Unfollow' : 'Follow'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredSignals.length === 0 && (
                <div className="text-center py-16">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                    <Filter className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No signals found</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Try adjusting your filters or check back later for new signals
                  </p>
                  <Button
                    variant="outline"
                    className="gap-2 border-2 border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                    onClick={handleRefresh}
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh Signals
                  </Button>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200/50">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="border-2 border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="border-2 border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Signal Details Modal */}
      {viewDetails && (
        <Dialog open={!!viewDetails} onOpenChange={() => setViewDetails(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto border-0 shadow-2xl bg-gradient-to-b from-white to-gray-50/50 z-[100]">
            <div className="p-6">
              <DialogHeader>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {viewDetails.asset}
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`${getTypeColor(viewDetails.type)} font-bold shadow-lg`}>
                        {viewDetails.type === 'buy' ? 
                          <ArrowUpRight className="w-4 h-4 mr-1" /> : 
                          <ArrowDownRight className="w-4 h-4 mr-1" />
                        }
                        {viewDetails.type.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className={`${getRiskColor(viewDetails.risk_level)}`}>
                        <Shield className="w-3 h-3 mr-1" />
                        {viewDetails.risk_level.charAt(0).toUpperCase() + viewDetails.risk_level.slice(1)} Risk
                      </Badge>
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        {viewDetails.timeframe}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200">
                    <Label className="text-sm font-medium text-gray-500">Entry Price</Label>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      ${viewDetails.entry_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200">
                    <Label className="text-sm font-medium text-emerald-700">Target Price</Label>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">
                      ${viewDetails.target_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-rose-50 to-red-50/50 border border-rose-200">
                    <Label className="text-sm font-medium text-rose-700">Stop Loss</Label>
                    <p className="text-2xl font-bold text-rose-600 mt-1">
                      ${viewDetails.stop_loss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200">
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <div className="mt-2">
                      <Badge className={`${getStatusColor(viewDetails.status)} font-bold`}>
                        {viewDetails.status === 'published' && <Globe className="w-3 h-3 mr-1" />}
                        {viewDetails.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {viewDetails.status === 'draft' && <Edit className="w-3 h-3 mr-1" />}
                        {viewDetails.status === 'archived' && <Archive className="w-3 h-3 mr-1" />}
                        {viewDetails.status.charAt(0).toUpperCase() + viewDetails.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  {viewDetails.mentor_name && (
                    <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50/50 border border-purple-200">
                      <Label className="text-sm font-medium text-purple-700">Mentor</Label>
                      <p className="text-lg font-bold text-gray-900 mt-1">{viewDetails.mentor_name}</p>
                      {viewDetails.followers_count !== undefined && (
                        <div className="text-sm text-purple-600 mt-2 flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {viewDetails.followers_count} follower{viewDetails.followers_count !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200">
                    <Label className="text-sm font-medium text-gray-500">Category</Label>
                    <div className="mt-2">
                      <span className={`text-sm font-medium px-3 py-1.5 rounded-full bg-gradient-to-r ${getCategoryColor(viewDetails.category)} text-white`}>
                        {viewDetails.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  className="flex-1 border-2 border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                  onClick={() => window.open(`/trading-chart?symbol=${viewDetails.asset}`, '_blank')}
                >
                  <LineChart className="w-4 h-4 mr-2" />
                  View Chart
                </Button>
                <Button
                  variant="default"
                  className={`flex-1 gap-2 ${
                    viewDetails.is_following 
                      ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700' 
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
                  } shadow-lg`}
                  onClick={() => {
                    if (viewDetails.is_following) {
                      unfollowSignal(viewDetails.id).then(() => {
                        handleRefresh()
                        setViewDetails(null)
                      })
                    } else {
                      followSignal(viewDetails.id).then(() => {
                        handleRefresh()
                        setViewDetails(null)
                      })
                    }
                  }}
                >
                  {viewDetails.is_following ? (
                    <>
                      <XCircle className="w-4 h-4" />
                      Unfollow Signal
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Follow Signal
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}