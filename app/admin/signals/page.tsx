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
  Loader2,
  Globe,
  Archive
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
  asset: string  // Changed from 'symbol' to 'asset'
  type: 'buy' | 'sell'
  entry_price: number
  target_price: number
  stop_loss: number
  timeframe: string
  status: 'published' | 'draft' | 'pending' | 'archived'
  category: string
  risk_level: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
  profit_loss?: string | null
  subscribers?: number
}

interface SignalStats {
  total_signals: number
  active_signals: number
  pending_signals: number
  completed_signals: number
  stopped_signals: number
}

const defaultStats: SignalStats = {
  total_signals: 0,
  active_signals: 0,
  pending_signals: 0,
  completed_signals: 0,
  stopped_signals: 0
}

const signalCategories = ['All', 'Crypto', 'Forex', 'Stocks', 'Commodities', 'Indices']
const timeFrames = ['1M', '5M', '15M', '1H', '4H', '1D', '1W']
const riskLevels = ['low', 'medium', 'high']
const signalStatuses = ['published', 'draft', 'pending', 'archived']

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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  // Updated form state to use 'asset' instead of 'symbol'
  const [newSignalForm, setNewSignalForm] = useState({
    asset: '',  // Changed from 'symbol' to 'asset'
    type: 'buy' as 'buy' | 'sell',
    entry_price: '',
    target_price: '',
    stop_loss: '',
    timeframe: '4H',
    status: 'draft' as 'published' | 'draft' | 'pending',
    category: 'Crypto',
    risk_level: 'medium' as 'low' | 'medium' | 'high',
  })

  // Reset form helper
  const resetForm = () => {
    setNewSignalForm({
      asset: '',  // Changed from 'symbol' to 'asset'
      type: 'buy',
      entry_price: '',
      target_price: '',
      stop_loss: '',
      timeframe: '4H',
      status: 'draft',
      category: 'Crypto',
      risk_level: 'medium',
    })
    setValidationErrors({})
  }

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
      
      if (data.success && data.signals) {
        return data.signals.map((signal: any) => ({
          id: signal.id,
          asset: signal.asset,  // Changed from 'symbol' to 'asset'
          type: signal.type,
          entry_price: parseFloat(signal.entry_price),
          target_price: parseFloat(signal.target_price),
          stop_loss: parseFloat(signal.stop_loss),
          timeframe: signal.timeframe,
          status: signal.status,
          category: signal.category,
          risk_level: signal.risk_level,
          profit_loss: signal.profit_loss || '0',
          subscribers: signal.subscribers || 0,
          created_at: signal.created_at,
          updated_at: signal.updated_at
        }))
      } else {
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
        
        if (data.success && data.stats) {
          return {
            total_signals: data.stats.total_signals || 0,
            active_signals: data.stats.active_signals || 0,
            pending_signals: data.stats.pending_signals || 0,
            completed_signals: data.stats.completed_signals || 0,
            stopped_signals: data.stats.stopped_signals || 0
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

      console.log('Updating signal with data:', signalData) // Debug log

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

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 422) {
          // Handle validation errors
          if (data.errors) {
            setValidationErrors(data.errors)
            
            // Format validation errors for display
            const errorMessages = Object.entries(data.errors)
              .map(([field, messages]) => {
                return `${field}: ${messages}`
              })
              .join('\n')
            throw new Error('Validation failed:\n' + errorMessages)
          }
        }
        throw new Error(data.message || `Failed to update signal: ${response.statusText}`)
      }
      
      if (data.success) {
        return { success: true, message: data.message, data: data.data }
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

  // Create signal
  const createSignal = async (signalData: any) => {
    try {
      const token = getToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      console.log('Creating signal with data:', signalData) // Debug log

      const response = await fetch('http://localhost:8000/api/admin/signals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(signalData),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 422) {
          // Handle validation errors
          if (data.errors) {
            setValidationErrors(data.errors)
            
            // Format validation errors for display
            const errorMessages = Object.entries(data.errors)
              .map(([field, messages]) => {
                return `${field}: ${messages}`
              })
              .join('\n')
            throw new Error('Validation failed:\n' + errorMessages)
          }
        }
        throw new Error(data.message || `Failed to create signal: ${response.statusText}`)
      }
      
      if (data.success) {
        return { success: true, message: data.message, data: data.data }
      } else {
        throw new Error(data.message || 'Failed to create signal')
      }
    } catch (err) {
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to create signal' 
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

  // Publish signal
  const publishSignal = async (id: number) => {
    try {
      const token = getToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`http://localhost:8000/api/admin/signals/${id}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include'
      })

      const data = await response.json()
      
      if (data.success) {
        return { success: true, message: data.message }
      } else {
        throw new Error(data.message || 'Failed to publish signal')
      }
    } catch (err) {
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to publish signal' 
      }
    }
  }

  // Archive signal
  const archiveSignal = async (id: number) => {
    try {
      const token = getToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`http://localhost:8000/api/admin/signals/${id}/archive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include'
      })

      const data = await response.json()
      
      if (data.success) {
        return { success: true, message: data.message }
      } else {
        throw new Error(data.message || 'Failed to archive signal')
      }
    } catch (err) {
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to archive signal' 
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
        signal.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||  // Changed from 'symbol' to 'asset'
        signal.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(signal => signal.category === selectedCategory)
    }
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(signal => signal.status === selectedStatus)
    }
    
    if (activeTab !== 'all') {
      if (activeTab === 'published') {
        filtered = filtered.filter(signal => signal.status === 'published')
      } else if (activeTab === 'draft') {
        filtered = filtered.filter(signal => signal.status === 'draft')
      } else if (activeTab === 'pending') {
        filtered = filtered.filter(signal => signal.status === 'pending')
      } else if (activeTab === 'archived') {
        filtered = filtered.filter(signal => signal.status === 'archived')
      }
    }
    
    setFilteredSignals(filtered)
  }, [searchQuery, selectedCategory, selectedStatus, activeTab, signals])

  const handleSendSignal = () => {
    setSelectedSignal(null)
    resetForm()
    setShowSendModal(true)
  }

  const handleEditSignal = (signal: Signal) => {
    setSelectedSignal(signal)
    setNewSignalForm({
      asset: signal.asset,  // Changed from 'symbol' to 'asset'
      type: signal.type,
      entry_price: signal.entry_price.toString(),
      target_price: signal.target_price.toString(),
      stop_loss: signal.stop_loss.toString(),
      timeframe: signal.timeframe,
      status: signal.status as 'published' | 'draft' | 'pending',
      category: signal.category,
      risk_level: signal.risk_level,
    })
    setValidationErrors({})
    setShowSendModal(true)
  }

  const handleDeleteSignal = (signal: Signal) => {
    setSelectedSignal(signal)
    setShowDeleteModal(true)
  }

  const handlePublishSignal = async (signal: Signal) => {
    const result = await publishSignal(signal.id)
    if (result.success) {
      await handleRefresh()
    } else {
      setError(result.message)
    }
  }

  const handleArchiveSignal = async (signal: Signal) => {
    const result = await archiveSignal(signal.id)
    if (result.success) {
      await handleRefresh()
    } else {
      setError(result.message)
    }
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
    // Clear previous validation errors
    setValidationErrors({})
    setError(null)

    // Transform the data to match backend expectations
    const signalData = {
      asset: newSignalForm.asset,  // Changed from 'symbol' to 'asset'
      type: newSignalForm.type,
      entry_price: parseFloat(newSignalForm.entry_price),
      target_price: parseFloat(newSignalForm.target_price),
      stop_loss: parseFloat(newSignalForm.stop_loss),
      timeframe: newSignalForm.timeframe,
      status: newSignalForm.status,
      category: newSignalForm.category,
      risk_level: newSignalForm.risk_level,
    }

    console.log('Sending signal data:', signalData) // Debug log

    // Validate required fields
    if (!signalData.asset) {
      setError('Asset is required')
      return
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
      resetForm()
    } else {
      setError(result.message)
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
          <p className="text-gray-600 mb-6 whitespace-pre-line">{error}</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-white to-emerald-50/30 border border-emerald-100/50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-3xl font-bold mt-2 text-gray-900">
                  {stats.active_signals || 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 shadow-lg">
                <Globe className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-white to-amber-50/30 border border-amber-100/50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold mt-2 text-gray-900">
                  {stats.pending_signals || 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-white to-blue-50/30 border border-blue-100/50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="text-3xl font-bold mt-2 text-gray-900">
                  {stats.completed_signals || 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 shadow-lg">
                <Edit className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-white to-rose-50/30 border border-rose-100/50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Archived</p>
                <p className="text-3xl font-bold mt-2 text-gray-900">
                  {stats.stopped_signals || 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-rose-100 to-red-100 shadow-lg">
                <Archive className="w-6 h-6 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-white to-purple-50/30 border border-purple-100/50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-3xl font-bold mt-2 text-gray-900">
                  {stats.total_signals || 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 shadow-lg">
                <BarChart className="w-6 h-6 text-purple-600" />
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
                  <span className="font-semibold text-gray-900">{filteredSignals.length}</span> signals found
                </CardDescription>
              </div>
              <Tabs defaultValue="all" className="w-auto" onValueChange={setActiveTab}>
                <TabsList className="border-2 border-gray-300 bg-white p-1">
                  <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="published" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
                    <div className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      Published
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="draft" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
                    <div className="flex items-center gap-1">
                      <Edit className="w-3 h-3" />
                      Draft
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="archived" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-red-500 data-[state=active]:text-white">
                    <div className="flex items-center gap-1">
                      <Archive className="w-3 h-3" />
                      Archived
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
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Entry → Target</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Stop Loss</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Risk</th>
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
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <Badge className={`${getTypeColor(signal.type)} font-bold shadow-lg`}>
                          {signal.type === 'buy' ? 
                            <ArrowUpRight className="w-4 h-4 mr-1" /> : 
                            <ArrowDownRight className="w-4 h-4 mr-1" />
                          }
                          {signal.type.toUpperCase()}
                        </Badge>
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
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="font-bold text-rose-600">
                          ${signal.stop_loss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <Badge className={`${getStatusColor(signal.status)} font-bold`}>
                          {signal.status === 'published' && <Globe className="w-3 h-3 mr-1" />}
                          {signal.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {signal.status === 'draft' && <Edit className="w-3 h-3 mr-1" />}
                          {signal.status === 'archived' && <Archive className="w-3 h-3 mr-1" />}
                          {signal.status.charAt(0).toUpperCase() + signal.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-5 px-6">
                        <Badge variant="outline" className={`${getRiskColor(signal.risk_level)}`}>
                          <Shield className="w-3 h-3 mr-1" />
                          {signal.risk_level.charAt(0).toUpperCase() + signal.risk_level.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-1">
                          {signal.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePublishSignal(signal)}
                              className="hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 hover:text-emerald-600 rounded-lg transition-all"
                              title="Publish"
                            >
                              <Globe className="w-4 h-4" />
                            </Button>
                          )}
                          {signal.status === 'published' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleArchiveSignal(signal)}
                              className="hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 hover:text-amber-600 rounded-lg transition-all"
                              title="Archive"
                            >
                              <Archive className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditSignal(signal)}
                            className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSignal(signal)}
                            className="hover:bg-gradient-to-r hover:from-rose-50 hover:to-red-50 hover:text-rose-600 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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
                  Create Your First Signal
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
                {selectedSignal ? 'Edit Signal' : 'Create New Signal'}
              </DialogTitle>
              <DialogDescription className="text-center">
                {selectedSignal 
                  ? 'Update the trading signal details'
                  : 'Create a new trading signal'
                }
              </DialogDescription>
            </DialogHeader>
            
            {/* Validation Errors Display */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {Object.entries(validationErrors).map(([field, error]) => (
                    <li key={field} className="text-sm text-red-700">
                      <span className="font-medium">{field}:</span> {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="asset" className="text-sm font-medium text-gray-700">Asset *</Label>
                  <Input 
                    id="asset" 
                    placeholder="BTC/USD" 
                    value={newSignalForm.asset ?? ''}
                    onChange={(e) => setNewSignalForm({...newSignalForm, asset: e.target.value})}
                    className="border-2 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    required
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
                    onValueChange={(value: 'buy' | 'sell') => setNewSignalForm({...newSignalForm, type: value})}
                  >
                    <SelectTrigger className="border-2 border-gray-300 focus:border-emerald-500">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy" className="flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                        BUY
                      </SelectItem>
                      <SelectItem value="sell" className="flex items-center gap-2">
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
                    type="number"
                    step="0.01"
                    placeholder="0.00" 
                    value={newSignalForm.entry_price ?? ''}
                    onChange={(e) => setNewSignalForm({...newSignalForm, entry_price: e.target.value})}
                    className="border-2 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target" className="text-sm font-medium text-gray-700">Target Price *</Label>
                  <Input 
                    id="target" 
                    type="number"
                    step="0.01"
                    placeholder="0.00" 
                    value={newSignalForm.target_price ?? ''}
                    onChange={(e) => setNewSignalForm({...newSignalForm, target_price: e.target.value})}
                    className="border-2 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stopLoss" className="text-sm font-medium text-gray-700">Stop Loss *</Label>
                  <Input 
                    id="stopLoss" 
                    type="number"
                    step="0.01"
                    placeholder="0.00" 
                    value={newSignalForm.stop_loss ?? ''}
                    onChange={(e) => setNewSignalForm({...newSignalForm, stop_loss: e.target.value})}
                    className="border-2 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="risk" className="text-sm font-medium text-gray-700">Risk Level *</Label>
                  <Select 
                    value={newSignalForm.risk_level} 
                    onValueChange={(value: 'low' | 'medium' | 'high') => setNewSignalForm({...newSignalForm, risk_level: value})}
                  >
                    <SelectTrigger className="border-2 border-gray-300 focus:border-emerald-500">
                      <SelectValue placeholder="Select risk level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low" className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-500" />
                        Low
                      </SelectItem>
                      <SelectItem value="medium" className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-500" />
                        Medium
                      </SelectItem>
                      <SelectItem value="high" className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-rose-500" />
                        High
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status *</Label>
                  <Select 
                    value={newSignalForm.status} 
                    onValueChange={(value: 'published' | 'draft' | 'pending') => setNewSignalForm({...newSignalForm, status: value})}
                  >
                    <SelectTrigger className="border-2 border-gray-300 focus:border-emerald-500">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft" className="flex items-center gap-2">
                        <Edit className="w-4 h-4 text-gray-500" />
                        Draft
                      </SelectItem>
                      <SelectItem value="pending" className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        Pending
                      </SelectItem>
                      <SelectItem value="published" className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-emerald-500" />
                        Published
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSendModal(false)
                  setSelectedSignal(null)
                  resetForm()
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
                {selectedSignal ? 'Update Signal' : 'Create Signal'}
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
                    <p className="font-bold text-rose-800">{selectedSignal.asset} - {selectedSignal.type.toUpperCase()}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-rose-700 flex items-center gap-2">
                        <span className="font-medium">Entry:</span> ${selectedSignal.entry_price}
                      </p>
                      <p className="text-sm text-rose-700 flex items-center gap-2">
                        <span className="font-medium">Target:</span> ${selectedSignal.target_price}
                      </p>
                      <p className="text-xs text-rose-600 mt-2">
                        This will permanently remove the signal from the system.
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