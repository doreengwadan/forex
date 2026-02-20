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
  MoreVertical
} from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select'
import { Label } from '../../components/ui/Label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/DropdownMenu'

interface Signal {
  id: number
  asset: string
  type: 'BUY' | 'SELL'
  entry_price: number
  target_price: number
  stop_loss: number
  timeframe: string
  status: 'active' | 'pending' | 'completed' | 'stopped'
  category: string
  risk_level: 'Low' | 'Medium' | 'High'
  profit_loss?: string | null
  pips: string
  confidence: string
  analysis?: string
  priority: 'low' | 'normal' | 'high'
  sent_at: string
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
  completed_signals: number
  success_rate: number
  avg_profit: number
  total_following: number
  total_mentors: number
  today_signals: number
}

const defaultStats: SignalStats = {
  total_signals: 0,
  active_signals: 0,
  completed_signals: 0,
  success_rate: 0,
  avg_profit: 0,
  total_following: 0,
  total_mentors: 0,
  today_signals: 0
}

const signalCategories = ['All', 'Crypto', 'Forex', 'Stocks', 'Commodities', 'Indices']
const riskLevels = ['Low', 'Medium', 'High']
const signalStatuses = ['all', 'active', 'pending', 'completed', 'stopped']

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
          signals: data.data.map((signal: Signal) => ({
            ...signal,
            profit_loss: signal.profit_loss || '0.0%'
          })),
          total: data.total || data.data.length,
          last_page: data.last_page || 1
        }
      } else if (data.success && data.signals) {
        // Handle non-paginated response
        return {
          signals: data.signals.map((signal: Signal) => ({
            ...signal,
            profit_loss: signal.profit_loss || '0.0%'
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
          return data.stats
        } else if (data.success && data.data) {
          return data.data
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

  // Filter signals based on search and filters
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
      filtered = filtered.filter(signal => signal.risk_level.toLowerCase() === selectedRisk)
    }
    
    if (activeTab !== 'all') {
      filtered = filtered.filter(signal => signal.status === activeTab)
    }
    
    setFilteredSignals(filtered)
  }, [searchQuery, selectedCategory, selectedRisk, activeTab, signals])

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
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'stopped': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeColor = (type: string) => {
    return type === 'BUY' 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200'
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'Medium': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'High': return 'bg-rose-100 text-rose-800 border-rose-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getProfitLossColor = (pl: string | null | undefined) => {
    if (!pl) return 'text-gray-600'
    if (pl.startsWith('+')) return 'text-green-600 font-bold'
    if (pl.startsWith('-')) return 'text-red-600 font-bold'
    return 'text-gray-600'
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Crypto': 'bg-purple-100 text-purple-800',
      'Forex': 'bg-blue-100 text-blue-800',
      'Stocks': 'bg-cyan-100 text-cyan-800',
      'Commodities': 'bg-amber-100 text-amber-800',
      'Indices': 'bg-pink-100 text-pink-800',
      'default': 'bg-gray-100 text-gray-800'
    }
    return colors[category] || colors.default
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
          <h1 className="text-3xl font-bold text-gray-900">Trading Signals</h1>
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
          <Button 
            variant="outline"
            className="gap-2"
            onClick={() => {/* Navigate to followed signals */}}
          >
            <Bell className="w-4 h-4" />
            My Signals
          </Button>
        </div>
      </div>

      {/* Stats Cards - User Version */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Signals</p>
                <p className="text-3xl font-bold mt-2 text-gray-900">
                  {stats.active_signals || 0}
                </p>
                <div className="flex items-center mt-1">
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600 ml-1">Live Now</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
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
              <div className="p-3 rounded-xl bg-blue-100">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
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
              <div className="p-3 rounded-xl bg-amber-100">
                <Target className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
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
              <div className="p-3 rounded-xl bg-purple-100">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
                className="border-green-200 hover:bg-green-50"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Follow
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkUnfollow}
                className="border-red-200 hover:bg-red-50 text-red-700"
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
        <Card className="lg:w-1/4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-5 h-5 text-blue-600" />
              Filter Signals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="search" className="mb-2">Search Signals</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Asset, Mentor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {signalCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2">Risk Level</Label>
              <Select value={selectedRisk} onValueChange={setSelectedRisk}>
                <SelectTrigger>
                  <SelectValue placeholder="All Risk Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {riskLevels.map(level => (
                    <SelectItem key={level} value={level.toLowerCase()}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2">Status</Label>
              <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="stopped">Stopped</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="lg:w-3/4 overflow-hidden">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle>Available Signals</CardTitle>
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
                  className="gap-2"
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
                  <tr className="bg-gray-50">
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 w-12">
                      <input
                        type="checkbox"
                        checked={selectedSignals.length === filteredSignals.length && filteredSignals.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Asset & Details</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Mentor</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Signal</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Prices</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Stats</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSignals.map((signal) => (
                    <tr key={signal.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-5 px-6">
                        <input
                          type="checkbox"
                          checked={selectedSignals.includes(signal.id)}
                          onChange={() => handleSignalSelect(signal.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-5 px-6">
                        <div>
                          <div className="font-bold text-gray-900">{signal.asset}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={getCategoryColor(signal.category)}>
                              {signal.category}
                            </Badge>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {signal.timeframe}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Sent {getTimeAgo(signal.sent_at)}
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        {signal.mentor_name ? (
                          <div>
                            <div className="font-medium text-gray-900">{signal.mentor_name}</div>
                            <div className="text-xs text-gray-500">Expert Mentor</div>
                            {signal.followers_count !== undefined && (
                              <div className="text-xs text-blue-600 mt-1">
                                {signal.followers_count} follower{signal.followers_count !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-400 italic">Unknown</div>
                        )}
                      </td>
                      <td className="py-5 px-6">
                        <div className="space-y-1">
                          <Badge className={getTypeColor(signal.type)}>
                            {signal.type}
                          </Badge>
                          <div className="text-xs text-gray-500">{signal.pips} pips</div>
                          <div className="text-xs text-amber-600">{signal.confidence} confidence</div>
                          <Badge variant="outline" className={getRiskColor(signal.risk_level)}>
                            <Shield className="w-3 h-3 mr-1" />
                            {signal.risk_level}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">Entry: </span>
                            <span className="font-bold">${signal.entry_price.toLocaleString()}</span>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-green-600">Target: </span>
                            <span className="font-bold text-green-600">${signal.target_price.toLocaleString()}</span>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-red-600">Stop: </span>
                            <span className="font-bold text-red-600">${signal.stop_loss.toLocaleString()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="space-y-1">
                          <Badge className={getStatusColor(signal.status)}>
                            {signal.status.charAt(0).toUpperCase() + signal.status.slice(1)}
                          </Badge>
                          <div className="text-xs text-gray-500">
                            Priority: {signal.priority}
                          </div>
                          {signal.is_following && (
                            <div className="text-xs text-green-600">
                              ✓ Following
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className={`text-lg font-bold ${getProfitLossColor(signal.profit_loss)}`}>
                          {signal.profit_loss || '0.0%'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Profit/Loss
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1"
                            onClick={() => setViewDetails(signal)}
                          >
                            <Info className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant={signal.is_following ? "outline" : "default"}
                            className="gap-1"
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
                  <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <Filter className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No signals found</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Try adjusting your filters or check back later for new signals
                  </p>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleRefresh}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Signals
                  </Button>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{viewDetails.asset}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getTypeColor(viewDetails.type)}>
                      {viewDetails.type}
                    </Badge>
                    <Badge variant="outline" className={getRiskColor(viewDetails.risk_level)}>
                      {viewDetails.risk_level} Risk
                    </Badge>
                    <Badge variant="outline">
                      {viewDetails.timeframe}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewDetails(null)}
                >
                  ✕
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Entry Price</Label>
                    <p className="text-2xl font-bold text-gray-900">
                      ${viewDetails.entry_price.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Target Price</Label>
                    <p className="text-2xl font-bold text-green-600">
                      ${viewDetails.target_price.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Stop Loss</Label>
                    <p className="text-2xl font-bold text-red-600">
                      ${viewDetails.stop_loss.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <Badge className={getStatusColor(viewDetails.status)}>
                      {viewDetails.status.charAt(0).toUpperCase() + viewDetails.status.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Confidence</Label>
                    <p className="text-lg font-bold text-amber-600">{viewDetails.confidence}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Expected Pips</Label>
                    <p className="text-lg font-bold text-gray-900">{viewDetails.pips}</p>
                  </div>
                </div>
              </div>

              {viewDetails.analysis && (
                <div className="mb-6">
                  <Label className="text-sm font-medium text-gray-700 mb-2">Technical Analysis</Label>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <p className="text-gray-700 whitespace-pre-line">{viewDetails.analysis}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(`/trading-chart?symbol=${viewDetails.asset}`, '_blank')}
                >
                  View Chart
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
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
                  {viewDetails.is_following ? 'Unfollow Signal' : 'Follow Signal'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}