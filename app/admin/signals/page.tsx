'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { 
  TrendingUp, 
  Filter, 
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Edit,
  Trash2,
  Send,
  Copy,
  Users,
  DollarSign,
  BarChart,
  Search,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Zap,
  Target,
  Shield,
  LineChart,
  Bell,
  Mail,
  Sparkles,
  Wallet,
  TrendingDown,
  Loader2
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
  type: 'BUY' | 'SELL'
  entry_price: number
  target_price: number
  stop_loss: number
  timeframe: string
  status: 'active' | 'pending' | 'completed' | 'stopped'
  category: string
  subscribers: number
  risk_level: 'Low' | 'Medium' | 'High'
  profit_loss?: string | null
  pips: string
  confidence: string
  analysis?: string
  priority: 'low' | 'normal' | 'high'
  push_notifications: boolean
  email_alerts: boolean
  sent_at: string
  created_at: string
  updated_at: string
}

interface SignalStats {
  total_signals: number
  active_signals: number
  completed_signals: number
  pending_signals: number
  total_subscribers: number
  success_rate: number
  avg_profit: number
}

const defaultStats: SignalStats = {
  total_signals: 0,
  active_signals: 0,
  completed_signals: 0,
  pending_signals: 0,
  total_subscribers: 0,
  success_rate: 0,
  avg_profit: 0
}

const signalCategories = ['All', 'Crypto', 'Forex', 'Stocks', 'Commodities', 'Indices']
const timeFrames = ['1M', '5M', '15M', '1H', '4H', '1D', '1W']
const riskLevels = ['Low', 'Medium', 'High']

export default function AdminSignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [filteredSignals, setFilteredSignals] = useState<Signal[]>([])
  const [stats, setStats] = useState<SignalStats>(defaultStats)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showSendModal, setShowSendModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newSignalForm, setNewSignalForm] = useState({
    asset: '',
    type: 'BUY',
    entry_price: '',
    target_price: '',
    stop_loss: '',
    timeframe: '4H',
    status: 'active',
    category: 'Crypto',
    risk_level: 'Medium',
    confidence: '85%',
    pips: '',
    analysis: 'Strong bullish momentum with RSI oversold. Price approaching key support level.',
    priority: 'normal',
    push_notifications: true,
    email_alerts: true,
    subscribers: Math.floor(Math.random() * 1500) + 500
  })

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

  // Fetch signals from API
  // Fetch signals from API
const fetchSignals = async () => {
  try {
    const token = getToken()
    
    if (!token) {
      setError('No authentication token found. Please login again.')
      return []
    }

    if (!checkAdminAccess()) {
      setError('Admin access required. You do not have sufficient permissions.')
      return []
    }

    const response = await fetch('http://localhost:8000/api/admin/signals', {
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
        localStorage.removeItem('user_role')
        setTimeout(() => {
          window.location.href = '/admin/login'
        }, 2000)
        return []
      }
      
      if (response.status === 403) {
        setError('Access denied. Admin privileges required.')
        return []
      }
      
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to fetch signals: ${response.statusText}`)
    }

    const data = await response.json()
    
    // FIX: Check for the correct data structure
    if (data.success && data.signals) {
      // Map the data to match your frontend interface
      return data.signals.map((signal: any) => ({
        id: signal.id,
        asset: signal.asset,
        type: signal.type.toUpperCase(), // Ensure uppercase
        entry_price: parseFloat(signal.entry_price),
        target_price: parseFloat(signal.target_price),
        stop_loss: parseFloat(signal.stop_loss),
        timeframe: signal.timeframe,
        status: signal.status,
        category: signal.category,
        subscribers: signal.subscribers || 0,
        risk_level: signal.risk_level,
        profit_loss: signal.profit_loss || '0.0%',
        pips: signal.pips || '0',
        confidence: signal.confidence || '85%',
        analysis: signal.analysis || '',
        priority: signal.priority || 'normal',
        push_notifications: signal.push_notifications || false,
        email_alerts: signal.email_alerts || false,
        sent_at: signal.sent_at || signal.created_at,
        created_at: signal.created_at,
        updated_at: signal.updated_at
      }))
    } else {
      // If the response structure is different, log it for debugging
      console.error('Unexpected API response structure:', data)
      throw new Error(data.message || 'Failed to fetch signals')
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An error occurred'
    setError(errorMessage)
    console.error('Error fetching signals:', err)
    return []
  }
}
  // Fetch signal statistics
  // Fetch signal statistics
const fetchSignalStats = async (): Promise<SignalStats> => {
  try {
    const token = getToken()
    
    if (!token) {
      return defaultStats
    }

    const response = await fetch('http://localhost:8000/api/admin/signals/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include'
    })

    if (response.ok) {
      const data = await response.json()
      
      // FIX: Check for the correct data structure
      if (data.success && data.stats) {
        return {
          total_signals: data.stats.total_signals || 0,
          active_signals: data.stats.active_signals || 0,
          completed_signals: data.stats.completed_signals || 0,
          pending_signals: data.stats.pending_signals || 0,
          total_subscribers: data.stats.total_subscribers || 0,
          success_rate: data.stats.success_rate || 0,
          avg_profit: data.stats.avg_profit || 0
        }
      }
    }
    return defaultStats
  } catch (err) {
    console.error('Error fetching signal stats:', err)
    return defaultStats
  }
}
  // Update signal
  const updateSignal = async (id: number, signalData: any) => {
    try {
      const token = getToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`http://localhost:8000/api/admin/signals/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(signalData),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to update signal: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        return { success: true, message: data.message }
      } else {
        throw new Error(data.message || 'Failed to update signal')
      }
    } catch (err) {
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to update signal' 
      }
    }
  }

  // Delete signal
  const deleteSignal = async (id: number) => {
    try {
      const token = getToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`http://localhost:8000/api/admin/signals/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to delete signal: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        return { success: true, message: data.message }
      } else {
        throw new Error(data.message || 'Failed to delete signal')
      }
    } catch (err) {
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to delete signal' 
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
        setError('Please login to access this page.')
        setIsLoading(false)
        window.location.href = '/admin/login'
        return
      }
      
      if (!checkAdminAccess()) {
        setError('Admin access required. Redirecting to login...')
        setIsLoading(false)
        setTimeout(() => {
          window.location.href = '/admin/login'
        }, 2000)
        return
      }
      
      try {
        const [signalsData, statsData] = await Promise.all([
          fetchSignals(),
          fetchSignalStats()
        ])
        
        setSignals(signalsData)
        setStats(statsData)
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    setError(null)
    try {
      const [signalsData, statsData] = await Promise.all([
        fetchSignals(),
        fetchSignalStats()
      ])
      
      setSignals(signalsData)
      setStats(statsData)
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
        signal.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(signal => signal.category === selectedCategory)
    }
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(signal => signal.risk_level.toLowerCase() === selectedStatus)
    }
    
    if (activeTab !== 'all') {
      filtered = filtered.filter(signal => signal.status === activeTab)
    }
    
    setFilteredSignals(filtered)
  }, [searchQuery, selectedCategory, selectedStatus, activeTab, signals])

  const handleSendSignal = () => {
    setSelectedSignal(null)
    setShowSendModal(true)
  }

  const handleEditSignal = (signal: Signal) => {
    setSelectedSignal(signal)
    setNewSignalForm({
      asset: signal.asset,
      type: signal.type,
      entry_price: signal.entry_price.toString(),
      target_price: signal.target_price.toString(),
      stop_loss: signal.stop_loss.toString(),
      timeframe: signal.timeframe,
      status: signal.status,
      category: signal.category,
      risk_level: signal.risk_level,
      confidence: signal.confidence,
      pips: signal.pips,
      analysis: signal.analysis || '',
      priority: signal.priority,
      push_notifications: signal.push_notifications,
      email_alerts: signal.email_alerts,
      subscribers: signal.subscribers
    })
    setShowSendModal(true)
  }

  const handleDeleteSignal = (signal: Signal) => {
    setSelectedSignal(signal)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (selectedSignal) {
      const result = await deleteSignal(selectedSignal.id)
      if (result.success) {
        setSignals(prev => prev.filter(s => s.id !== selectedSignal.id))
        const newStats = await fetchSignalStats()
        setStats(newStats)
        setShowDeleteModal(false)
        setSelectedSignal(null)
      } else {
        setError(result.message)
      }
    }
  }

  const handleSaveSignal = async () => {
    const signalData = {
      asset: newSignalForm.asset,
      type: newSignalForm.type,
      entry_price: parseFloat(newSignalForm.entry_price),
      target_price: parseFloat(newSignalForm.target_price),
      stop_loss: parseFloat(newSignalForm.stop_loss),
      timeframe: newSignalForm.timeframe,
      status: newSignalForm.status,
      category: newSignalForm.category,
      risk_level: newSignalForm.risk_level,
      confidence: newSignalForm.confidence,
      pips: newSignalForm.pips,
      analysis: newSignalForm.analysis,
      priority: newSignalForm.priority,
      push_notifications: newSignalForm.push_notifications,
      email_alerts: newSignalForm.email_alerts,
      subscribers: newSignalForm.subscribers
    }

    let result
    if (selectedSignal) {
      result = await updateSignal(selectedSignal.id, signalData)
    } else {
      result = await createSignal(signalData)
    }
    
    if (result.success) {
      await handleRefresh()
      setShowSendModal(false)
      setSelectedSignal(null)
      setNewSignalForm({
        asset: '',
        type: 'BUY',
        entry_price: '',
        target_price: '',
        stop_loss: '',
        timeframe: '4H',
        status: 'active',
        category: 'Crypto',
        risk_level: 'Medium',
        confidence: '85%',
        pips: '',
        analysis: 'Strong bullish momentum with RSI oversold. Price approaching key support level.',
        priority: 'normal',
        push_notifications: true,
        email_alerts: true,
        subscribers: Math.floor(Math.random() * 1500) + 500
      })
    } else {
      setError(result.message)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-emerald-200/50'
      case 'completed': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-blue-200/50'
      case 'pending': return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-200/50'
      case 'stopped': return 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-rose-200/50'
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
    }
  }

  const getTypeColor = (type: string) => {
    return type === 'BUY' 
      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-200/50'
      : 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-rose-200/50'
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-800 border-emerald-200'
      case 'Medium': return 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 border-amber-200'
      case 'High': return 'bg-gradient-to-r from-rose-100 to-rose-50 text-rose-800 border-rose-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getProfitLossColor = (pl: string | null | undefined) => {
    if (!pl) return 'text-gray-600'
    if (pl.startsWith('+')) return 'text-emerald-600 font-bold'
    if (pl.startsWith('-')) return 'text-rose-600 font-bold'
    return 'text-gray-600'
  }

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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Button 
              onClick={handleRefresh}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
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
              onClick={() => window.location.href = '/admin/login'}
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
            Trading Signals
          </h1>
          <p className="text-gray-600 mt-2">Real-time trading insights and signal management</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 group"
            onClick={handleSendSignal}
          >
            <Zap className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
            Send New Signal
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-white to-emerald-50/30 border border-emerald-100/50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Signals
                </p>
                <p className="text-3xl font-bold mt-2 text-gray-900">
                  {stats.active_signals || 0}
                </p>
                <div className="flex items-center mt-1">
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-emerald-600 ml-1">Real-time</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 shadow-lg">
                <LineChart className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-white to-blue-50/30 border border-blue-100/50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Total Subscribers
                </p>
                <p className="text-3xl font-bold mt-2 text-gray-900">
                  {(stats.total_subscribers || 0).toLocaleString()}
                </p>
                <div className="flex items-center mt-1">
                  <ArrowUpRight className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-blue-600 ml-1">All time</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 shadow-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-white to-purple-50/30 border border-purple-100/50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Success Rate
                </p>
                <p className="text-3xl font-bold mt-2 text-gray-900">
                  {stats.success_rate || 0}%
                </p>
                <div className="flex items-center mt-1">
                  <ArrowUpRight className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-purple-600 ml-1">Overall</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 shadow-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-white to-amber-50/30 border border-amber-100/50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Avg Profit/Loss
                </p>
                <p className="text-3xl font-bold mt-2 text-emerald-600">
                  +{(stats.avg_profit || 0).toFixed(1)}%
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-emerald-600 ml-1">per signal</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-lg">
                <Wallet className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Tabs */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <Card className="lg:w-1/4 border-0 shadow-xl bg-gradient-to-b from-white to-gray-50/50">
          <CardHeader className="pb-4 border-b border-gray-200/50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-5 h-5 text-indigo-600" />
              Filters & Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div>
              <Label htmlFor="search" className="mb-2 block text-sm font-medium text-gray-700">Search Signals</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="BTC, EUR, AAPL..."
                  value={searchQuery ?? ''}
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
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="border-2 border-gray-300 focus:border-indigo-500">
                  <SelectValue placeholder="All Risk Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {riskLevels.map(level => (
                    <SelectItem key={level} value={level.toLowerCase()}>
                      <div className="flex items-center gap-2">
                        <Shield className={`w-3 h-3 ${
                          level === 'Low' ? 'text-emerald-500' :
                          level === 'Medium' ? 'text-amber-500' : 'text-rose-500'
                        }`} />
                        {level}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-200/50">
              <Label className="block text-sm font-medium text-gray-700">Quick Actions</Label>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2 border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all">
                  <Download className="w-4 h-4" />
                  Export Signals
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
                  All Trading Signals
                </CardTitle>
                <CardDescription className="mt-2">
                  <span className="font-semibold text-gray-900">{filteredSignals.length}</span> signals found • 
                  <span className="ml-2 text-emerald-600 font-medium">{(stats.success_rate || 0)}% success rate</span>
                </CardDescription>
              </div>
              <Tabs defaultValue="all" className="w-auto" onValueChange={setActiveTab}>
                <TabsList className="border-2 border-gray-300 bg-white p-1">
                  <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="active" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      Active
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      Pending
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      Completed
                    </div>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Asset</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Signal</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Entry → Target</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Stop Loss</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">P/L</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50">
                  {filteredSignals.map((signal) => (
                    <tr key={signal.id} className="hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-gray-100/30 transition-colors group">
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
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                              {signal.confidence} Conf.
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <Badge className={`${getTypeColor(signal.type)} font-bold shadow-lg`}>
                          {signal.type === 'BUY' ? 
                            <ArrowUpRight className="w-4 h-4 mr-1" /> : 
                            <ArrowDownRight className="w-4 h-4 mr-1" />
                          }
                          {signal.type}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">{signal.pips} pips</div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">
                              ${signal.entry_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                            <span className="font-bold text-emerald-600">
                              ${signal.target_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="w-24 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: '60%' }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="font-bold text-rose-600">
                          ${signal.stop_loss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <Badge variant="outline" className={`${getRiskColor(signal.risk_level)} mt-1`}>
                          <Shield className="w-3 h-3 mr-1" />
                          {signal.risk_level}
                        </Badge>
                      </td>
                      <td className="py-5 px-6">
                        <div className="space-y-1">
                          <Badge className={`${getStatusColor(signal.status)} font-bold`}>
                            {signal.status === 'active' && <Sparkles className="w-3 h-3 mr-1" />}
                            {signal.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {signal.status === 'pending' && <AlertCircle className="w-3 h-3 mr-1" />}
                            {signal.status === 'stopped' && <XCircle className="w-3 h-3 mr-1" />}
                            {signal.status.charAt(0).toUpperCase() + signal.status.slice(1)}
                          </Badge>
                          <div className="text-xs text-gray-500">
                            {signal.subscribers.toLocaleString()} subscribers
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className={`text-xl font-bold ${getProfitLossColor(signal.profit_loss)}`}>
                          {signal.profit_loss || '0.0%'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Realized profit
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditSignal(signal)}
                            className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600 rounded-lg transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSignal(signal)}
                            className="hover:bg-gradient-to-r hover:from-rose-50 hover:to-red-50 hover:text-rose-600 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 hover:text-gray-700 rounded-lg transition-all"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredSignals.length === 0 && (
              <div className="text-center py-16">
                <div className="mx-auto w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                  <TrendingUp className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No signals found</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Try adjusting your filters or create a new signal to get started
                </p>
                <Button
                  className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                  onClick={handleSendSignal}
                >
                  <Send className="w-4 h-4" />
                  Send Your First Signal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Send Signal Modal */}
      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto border-0 shadow-2xl bg-gradient-to-b from-white to-gray-50/50 z-[100]">
          <div className="p-6">
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-emerald-100 to-teal-100">
                <Zap className="h-7 w-7 text-emerald-600" />
              </div>
              <DialogTitle className="text-center text-xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {selectedSignal ? 'Edit Signal' : 'Send New Signal'}
              </DialogTitle>
              <DialogDescription className="text-center">
                {selectedSignal 
                  ? 'Update the trading signal details'
                  : 'Create and send a new trading signal to all subscribers'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="asset" className="text-sm font-medium text-gray-700">Asset Pair *</Label>
                  <Input 
                    id="asset" 
                    placeholder="BTC/USD" 
                    value={newSignalForm.asset ?? ''}
                    onChange={(e) => setNewSignalForm({...newSignalForm, asset: e.target.value})}
                    className="border-2 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category *</Label>
                  <Select 
                    value={newSignalForm.category} 
                    onValueChange={(value) => setNewSignalForm({...newSignalForm, category: value})}
                  >
                    <SelectTrigger className="border-2 border-gray-300 focus:border-emerald-500">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {signalCategories.filter(c => c !== 'All').map(category => (
                        <SelectItem key={category} value={category} className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getCategoryColor(category)}`}></div>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium text-gray-700">Signal Type *</Label>
                  <Select 
                    value={newSignalForm.type} 
                    onValueChange={(value: 'BUY' | 'SELL') => setNewSignalForm({...newSignalForm, type: value})}
                  >
                    <SelectTrigger className="border-2 border-gray-300 focus:border-emerald-500">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BUY" className="flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                        BUY
                      </SelectItem>
                      <SelectItem value="SELL" className="flex items-center gap-2">
                        <ArrowDownRight className="w-4 h-4 text-rose-500" />
                        SELL
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeframe" className="text-sm font-medium text-gray-700">Timeframe *</Label>
                  <Select 
                    value={newSignalForm.timeframe} 
                    onValueChange={(value) => setNewSignalForm({...newSignalForm, timeframe: value})}
                  >
                    <SelectTrigger className="border-2 border-gray-300 focus:border-emerald-500">
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeFrames.map(timeframe => (
                        <SelectItem key={timeframe} value={timeframe}>{timeframe}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entry" className="text-sm font-medium text-gray-700">Entry Price *</Label>
                  <Input 
                    id="entry" 
                    placeholder="0.00" 
                    value={newSignalForm.entry_price ?? ''}
                    onChange={(e) => setNewSignalForm({...newSignalForm, entry_price: e.target.value})}
                    className="border-2 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target" className="text-sm font-medium text-gray-700">Target Price *</Label>
                  <Input 
                    id="target" 
                    placeholder="0.00" 
                    value={newSignalForm.target_price ?? ''}
                    onChange={(e) => setNewSignalForm({...newSignalForm, target_price: e.target.value})}
                    className="border-2 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stopLoss" className="text-sm font-medium text-gray-700">Stop Loss *</Label>
                  <Input 
                    id="stopLoss" 
                    placeholder="0.00" 
                    value={newSignalForm.stop_loss ?? ''}
                    onChange={(e) => setNewSignalForm({...newSignalForm, stop_loss: e.target.value})}
                    className="border-2 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="risk" className="text-sm font-medium text-gray-700">Risk Level *</Label>
                  <Select 
                    value={newSignalForm.risk_level} 
                    onValueChange={(value: 'Low' | 'Medium' | 'High') => setNewSignalForm({...newSignalForm, risk_level: value})}
                  >
                    <SelectTrigger className="border-2 border-gray-300 focus:border-emerald-500">
                      <SelectValue placeholder="Select risk level" />
                    </SelectTrigger>
                    <SelectContent>
                      {riskLevels.map(level => (
                        <SelectItem key={level} value={level} className="flex items-center gap-2">
                          <Shield className={`w-4 h-4 ${
                            level === 'Low' ? 'text-emerald-500' :
                            level === 'Medium' ? 'text-amber-500' : 'text-rose-500'
                          }`} />
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confidence" className="text-sm font-medium text-gray-700">Confidence</Label>
                  <Select 
                    value={newSignalForm.confidence} 
                    onValueChange={(value) => setNewSignalForm({...newSignalForm, confidence: value})}
                  >
                    <SelectTrigger className="border-2 border-gray-300 focus:border-emerald-500">
                      <SelectValue placeholder="Select confidence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="65%">65% - Low</SelectItem>
                      <SelectItem value="75%">75% - Medium</SelectItem>
                      <SelectItem value="85%">85% - High</SelectItem>
                      <SelectItem value="95%">95% - Very High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pips" className="text-sm font-medium text-gray-700">Expected Pips</Label>
                  <Input 
                    id="pips" 
                    placeholder="+100" 
                    value={newSignalForm.pips ?? ''}
                    onChange={(e) => setNewSignalForm({...newSignalForm, pips: e.target.value})}
                    className="border-2 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                  <Select 
                    value={newSignalForm.status} 
                    onValueChange={(value: 'active' | 'pending' | 'completed' | 'stopped') => setNewSignalForm({...newSignalForm, status: value})}
                  >
                    <SelectTrigger className="border-2 border-gray-300 focus:border-emerald-500">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="stopped">Stopped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="analysis" className="text-sm font-medium text-gray-700">Technical Analysis</Label>
                <Textarea 
                  id="analysis" 
                  placeholder="Add your analysis, reasoning, and any additional notes..."
                  rows={4}
                  value={newSignalForm.analysis ?? ''}
                  onChange={(e) => setNewSignalForm({...newSignalForm, analysis: e.target.value})}
                  className="border-2 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-4 rounded-lg border-2 border-gray-200 bg-gray-50/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-emerald-600" />
                    <Label htmlFor="notification" className="font-medium text-gray-700">Push Notifications</Label>
                  </div>
                  <Switch 
                    id="notification" 
                    checked={newSignalForm.push_notifications}
                    onCheckedChange={(checked) => setNewSignalForm({...newSignalForm, push_notifications: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    <Label htmlFor="email" className="font-medium text-gray-700">Email Alerts</Label>
                  </div>
                  <Switch 
                    id="email" 
                    checked={newSignalForm.email_alerts}
                    onCheckedChange={(checked) => setNewSignalForm({...newSignalForm, email_alerts: checked})}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSendModal(false)
                  setSelectedSignal(null)
                  setNewSignalForm({
                    asset: '',
                    type: 'BUY',
                    entry_price: '',
                    target_price: '',
                    stop_loss: '',
                    timeframe: '4H',
                    status: 'active',
                    category: 'Crypto',
                    risk_level: 'Medium',
                    confidence: '85%',
                    pips: '',
                    analysis: 'Strong bullish momentum with RSI oversold. Price approaching key support level.',
                    priority: 'normal',
                    push_notifications: true,
                    email_alerts: true,
                    subscribers: Math.floor(Math.random() * 1500) + 500
                  })
                }}
                className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl"
                onClick={handleSaveSignal}
                disabled={!newSignalForm.asset || !newSignalForm.entry_price || !newSignalForm.target_price || !newSignalForm.stop_loss}
              >
                <Send className="w-4 h-4" />
                {selectedSignal ? 'Update Signal' : 'Send Signal to All Subscribers'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto border-0 shadow-2xl z-[100]">
          <div className="p-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-rose-100 to-red-100">
              <AlertCircle className="h-7 w-7 text-rose-600" />
            </div>
            <DialogHeader className="text-center">
              <DialogTitle className="text-xl text-rose-700">Delete Signal</DialogTitle>
              <DialogDescription className="text-gray-600">
                Are you sure you want to delete this signal? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {selectedSignal && (
              <div className="p-4 rounded-lg border-2 border-rose-200 bg-gradient-to-r from-rose-50/50 to-red-50/50 mt-4">
                <div className="flex items-start space-x-3">
                  <TrendingDown className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-rose-800">{selectedSignal.asset} - {selectedSignal.type}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-rose-700 flex items-center gap-2">
                        <span className="font-medium">Entry:</span> ${selectedSignal.entry_price}
                      </p>
                      <p className="text-sm text-rose-700 flex items-center gap-2">
                        <span className="font-medium">Target:</span> ${selectedSignal.target_price}
                      </p>
                      <p className="text-xs text-rose-600 mt-2">
                        This will permanently remove the signal from all subscriber dashboards.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 pt-4 border-t border-gray-200 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedSignal(null)
                }}
                className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-lg"
                onClick={confirmDelete}
              >
                Delete Signal
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}