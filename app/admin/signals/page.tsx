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
  Archive,
  FolderTree,
  FolderPlus,
  FolderOpen,
  Folder,
  Layers,
  Tag,
  Settings,
  Plus,
  GripVertical,
  Check,
  X
} from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select'
import { Label } from '../../components/ui/Label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs'
import { Switch } from '../../components/ui/Switch'
import { Textarea } from '../../components/ui/Textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/Dialog'
import { Checkbox } from '../../components/ui/Checkbox'

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
  created_at: string
  updated_at: string
  profit_loss?: string | null
  subscribers?: number
  group_id?: number | null
}

interface SignalGroup {
  id: number
  name: string
  description: string
  color: string
  icon: string
  signals_count: number
  is_active: boolean
  priority: number
  created_at: string
  updated_at: string
  signals?: Signal[]
}

interface SignalStats {
  total_signals: number
  active_signals: number
  pending_signals: number
  completed_signals: number
  stopped_signals: number
  total_groups: number
  active_groups: number
}

const defaultStats: SignalStats = {
  total_signals: 0,
  active_signals: 0,
  pending_signals: 0,
  completed_signals: 0,
  stopped_signals: 0,
  total_groups: 0,
  active_groups: 0
}

const signalCategories = ['All', 'Crypto', 'Forex', 'Stocks', 'Commodities', 'Indices']
const timeFrames = ['1M', '5M', '15M', '1H', '4H', '1D', '1W']
const riskLevels = ['low', 'medium', 'high']
const signalStatuses = ['published', 'draft', 'pending', 'archived']

const groupColors = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'green', label: 'Green', class: 'bg-green-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
  { value: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-500' },
  { value: 'teal', label: 'Teal', class: 'bg-teal-500' },
  { value: 'cyan', label: 'Cyan', class: 'bg-cyan-500' }
]

const groupIcons = [
  { value: 'trending-up', label: 'Trending Up', icon: TrendingUp },
  { value: 'target', label: 'Target', icon: Target },
  { value: 'zap', label: 'Zap', icon: Zap },
  { value: 'shield', label: 'Shield', icon: Shield },
  { value: 'wallet', label: 'Wallet', icon: Wallet },
  { value: 'bar-chart', label: 'Bar Chart', icon: BarChart },
  { value: 'line-chart', label: 'Line Chart', icon: LineChart },
  { value: 'users', label: 'Users', icon: Users },
  { value: 'bell', label: 'Bell', icon: Bell },
  { value: 'sparkles', label: 'Sparkles', icon: Sparkles }
]

export default function AdminSignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [groups, setGroups] = useState<SignalGroup[]>([])
  const [filteredSignals, setFilteredSignals] = useState<Signal[]>([])
  const [stats, setStats] = useState<SignalStats>(defaultStats)
  const [activeTab, setActiveTab] = useState('all')
  const [activeGroupTab, setActiveGroupTab] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [showSendModal, setShowSendModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showGroupDeleteModal, setShowGroupDeleteModal] = useState(false)
  const [showAssignGroupModal, setShowAssignGroupModal] = useState(false)
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null)
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState<SignalGroup | null>(null)
  const [selectedSignalsForGroup, setSelectedSignalsForGroup] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  // Signal form state
  const [newSignalForm, setNewSignalForm] = useState({
    asset: '',
    type: 'buy' as 'buy' | 'sell',
    entry_price: '',
    target_price: '',
    stop_loss: '',
    timeframe: '4H',
    status: 'draft' as 'published' | 'draft' | 'pending',
    category: 'Crypto',
    risk_level: 'medium' as 'low' | 'medium' | 'high',
    group_id: '',
  })

  // Group form state
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    color: 'blue',
    icon: 'trending-up',
    is_active: true,
    priority: 0,
  })

  // Reset signal form
  const resetSignalForm = () => {
    setNewSignalForm({
      asset: '',
      type: 'buy',
      entry_price: '',
      target_price: '',
      stop_loss: '',
      timeframe: '4H',
      status: 'draft',
      category: 'Crypto',
      risk_level: 'medium',
      group_id: '',
    })
    setValidationErrors({})
  }

  // Reset group form
  const resetGroupForm = () => {
    setGroupForm({
      name: '',
      description: '',
      color: 'blue',
      icon: 'trending-up',
      is_active: true,
      priority: 0,
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
          asset: signal.asset,
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
          group_id: signal.group_id || null,
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

  // Fetch signal groups from API
  const fetchGroups = async () => {
    try {
      const token = getToken()
      
      if (!token) {
        return []
      }

      const response = await fetch('http://localhost:8000/api/admin/signal-groups', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch groups: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success && data.groups) {
        return data.groups
      } else {
        return []
      }
    } catch (err) {
      console.error('Error fetching groups:', err)
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
            stopped_signals: data.stats.stopped_signals || 0,
            total_groups: data.stats.total_groups || 0,
            active_groups: data.stats.active_groups || 0
          }
        }
      }
      return defaultStats
    } catch (err) {
      console.error('Error fetching signal stats:', err)
      return defaultStats
    }
  }

  // Create signal group
  const createGroup = async (groupData: any) => {
    try {
      const token = getToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('http://localhost:8000/api/admin/signal-groups', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(groupData),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 422 && data.errors) {
          setValidationErrors(data.errors)
          throw new Error('Validation failed')
        }
        throw new Error(data.message || `Failed to create group: ${response.statusText}`)
      }
      
      if (data.success) {
        return { success: true, message: data.message, data: data.data }
      } else {
        throw new Error(data.message || 'Failed to create group')
      }
    } catch (err) {
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to create group' 
      }
    }
  }

  // Update signal group
  const updateGroup = async (id: number, groupData: any) => {
    try {
      const token = getToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`http://localhost:8000/api/admin/signal-groups/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(groupData),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 422 && data.errors) {
          setValidationErrors(data.errors)
          throw new Error('Validation failed')
        }
        throw new Error(data.message || `Failed to update group: ${response.statusText}`)
      }
      
      if (data.success) {
        return { success: true, message: data.message, data: data.data }
      } else {
        throw new Error(data.message || 'Failed to update group')
      }
    } catch (err) {
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to update group' 
      }
    }
  }

  // Delete signal group
  const deleteGroup = async (id: number) => {
    try {
      const token = getToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`http://localhost:8000/api/admin/signal-groups/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to delete group: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        return { success: true, message: data.message }
      } else {
        throw new Error(data.message || 'Failed to delete group')
      }
    } catch (err) {
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to delete group' 
      }
    }
  }

  // Assign signals to group
  const assignSignalsToGroup = async (groupId: number, signalIds: number[]) => {
    try {
      const token = getToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`http://localhost:8000/api/admin/signal-groups/${groupId}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ signal_ids: signalIds }),
        credentials: 'include'
      })

      const data = await response.json()
      
      if (data.success) {
        return { success: true, message: data.message }
      } else {
        throw new Error(data.message || 'Failed to assign signals')
      }
    } catch (err) {
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to assign signals' 
      }
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

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 422 && data.errors) {
          setValidationErrors(data.errors)
          throw new Error('Validation failed')
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
        if (response.status === 422 && data.errors) {
          setValidationErrors(data.errors)
          throw new Error('Validation failed')
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
        const [signalsData, groupsData, statsData] = await Promise.all([
          fetchSignals(),
          fetchGroups(),
          fetchSignalStats()
        ])
        
        setSignals(signalsData)
        setGroups(groupsData)
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
      const [signalsData, groupsData, statsData] = await Promise.all([
        fetchSignals(),
        fetchGroups(),
        fetchSignalStats()
      ])
      
      setSignals(signalsData)
      setGroups(groupsData)
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
      filtered = filtered.filter(signal => signal.status === selectedStatus)
    }
    
    if (selectedGroup !== 'all') {
      if (selectedGroup === 'ungrouped') {
        filtered = filtered.filter(signal => !signal.group_id)
      } else {
        filtered = filtered.filter(signal => signal.group_id === parseInt(selectedGroup))
      }
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
  }, [searchQuery, selectedCategory, selectedStatus, selectedGroup, activeTab, signals])

  const handleSendSignal = () => {
    setSelectedSignal(null)
    resetSignalForm()
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
      status: signal.status as 'published' | 'draft' | 'pending',
      category: signal.category,
      risk_level: signal.risk_level,
      group_id: signal.group_id?.toString() || '',
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
    setValidationErrors({})
    setError(null)

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
      group_id: newSignalForm.group_id ? parseInt(newSignalForm.group_id) : null,
    }

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
      resetSignalForm()
    } else {
      setError(result.message)
    }
  }

  // Group handlers
  const handleCreateGroup = () => {
    setSelectedGroupForEdit(null)
    resetGroupForm()
    setShowGroupModal(true)
  }

  const handleEditGroup = (group: SignalGroup) => {
    setSelectedGroupForEdit(group)
    setGroupForm({
      name: group.name,
      description: group.description || '',
      color: group.color,
      icon: group.icon,
      is_active: group.is_active,
      priority: group.priority,
    })
    setValidationErrors({})
    setShowGroupModal(true)
  }

  const handleDeleteGroup = (group: SignalGroup) => {
    setSelectedGroupForEdit(group)
    setShowGroupDeleteModal(true)
  }

  const handleAssignToGroup = (signal?: Signal) => {
    if (signal) {
      setSelectedSignal(signal)
      setSelectedSignalsForGroup([signal.id])
    } else {
      setSelectedSignal(null)
      setSelectedSignalsForGroup(filteredSignals.map(s => s.id))
    }
    setShowAssignGroupModal(true)
  }

  const confirmDeleteGroup = async () => {
    if (selectedGroupForEdit) {
      const result = await deleteGroup(selectedGroupForEdit.id)
      if (result.success) {
        setGroups(prev => prev.filter(g => g.id !== selectedGroupForEdit.id))
        setShowGroupDeleteModal(false)
        setSelectedGroupForEdit(null)
        await handleRefresh()
      } else {
        setError(result.message)
      }
    }
  }

  const handleSaveGroup = async () => {
    setValidationErrors({})
    setError(null)

    const groupData = {
      name: groupForm.name,
      description: groupForm.description,
      color: groupForm.color,
      icon: groupForm.icon,
      is_active: groupForm.is_active,
      priority: groupForm.priority,
    }

    if (!groupData.name) {
      setError('Group name is required')
      return
    }

    let result
    if (selectedGroupForEdit) {
      result = await updateGroup(selectedGroupForEdit.id, groupData)
    } else {
      result = await createGroup(groupData)
    }
    
    if (result.success) {
      await handleRefresh()
      setShowGroupModal(false)
      setSelectedGroupForEdit(null)
      resetGroupForm()
    } else {
      setError(result.message)
    }
  }

  const handleAssignSignals = async () => {
    if (!selectedGroupForEdit || selectedSignalsForGroup.length === 0) {
      return
    }

    const result = await assignSignalsToGroup(selectedGroupForEdit.id, selectedSignalsForGroup)
    
    if (result.success) {
      await handleRefresh()
      setShowAssignGroupModal(false)
      setSelectedGroupForEdit(null)
      setSelectedSignalsForGroup([])
    } else {
      setError(result.message)
    }
  }

  const toggleSignalSelection = (signalId: number) => {
    setSelectedSignalsForGroup(prev => 
      prev.includes(signalId)
        ? prev.filter(id => id !== signalId)
        : [...prev, signalId]
    )
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

  const getGroupColor = (color: string) => {
    const colors: Record<string, string> = {
      'blue': 'bg-blue-500',
      'green': 'bg-green-500',
      'purple': 'bg-purple-500',
      'orange': 'bg-orange-500',
      'pink': 'bg-pink-500',
      'indigo': 'bg-indigo-500',
      'red': 'bg-red-500',
      'yellow': 'bg-yellow-500',
      'teal': 'bg-teal-500',
      'cyan': 'bg-cyan-500'
    }
    return colors[color] || 'bg-gray-500'
  }

  const getGroupIcon = (iconName: string) => {
    const icon = groupIcons.find(i => i.value === iconName)
    return icon ? icon.icon : TrendingUp
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
            variant="outline"
            className="gap-2 border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
            onClick={handleCreateGroup}
          >
            <FolderPlus className="w-4 h-4" />
            Create Group
          </Button>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-white to-emerald-50/30 border border-emerald-100/50 lg:col-span-1">
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

        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-white to-amber-50/30 border border-amber-100/50 lg:col-span-1">
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

        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-white to-blue-50/30 border border-blue-100/50 lg:col-span-1">
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

        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-white to-rose-50/30 border border-rose-100/50 lg:col-span-1">
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

        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-white to-purple-50/30 border border-purple-100/50 lg:col-span-1">
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

        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-white to-indigo-50/30 border border-indigo-100/50 lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Groups</p>
                <p className="text-3xl font-bold mt-2 text-gray-900">
                  {stats.total_groups || 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 shadow-lg">
                <FolderTree className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-white to-teal-50/30 border border-teal-100/50 lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Groups</p>
                <p className="text-3xl font-bold mt-2 text-gray-900">
                  {stats.active_groups || 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 shadow-lg">
                <Layers className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Groups Section */}
      <Card className="border-0 shadow-xl bg-gradient-to-b from-white to-gray-50/50">
        <CardHeader className="border-b border-gray-200/50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FolderTree className="w-5 h-5 text-indigo-600" />
                Signal Groups
              </CardTitle>
              <CardDescription className="mt-1">
                Organize your signals into logical groups for better management
              </CardDescription>
            </div>
            <Button
              size="sm"
              className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              onClick={handleCreateGroup}
            >
              <Plus className="w-4 h-4" />
              New Group
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groups.map((group) => {
              const GroupIcon = getGroupIcon(group.icon)
              return (
                <div
                  key={group.id}
                  className="group relative p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-200 hover:shadow-lg transition-all cursor-pointer bg-white"
                  onClick={() => setSelectedGroup(group.id.toString())}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getGroupColor(group.color)} bg-opacity-20`}>
                        <GroupIcon className={`w-5 h-5 ${getGroupColor(group.color).replace('bg-', 'text-')}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{group.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{group.signals_count} signals</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditGroup(group)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-rose-50 hover:text-rose-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteGroup(group)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {group.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{group.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="outline" className={`${group.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                      {group.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-xs text-gray-400">Priority: {group.priority}</span>
                  </div>
                </div>
              )
            })}
            {groups.length === 0 && (
              <div className="col-span-full text-center py-8">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                  <FolderTree className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No groups yet</h3>
                <p className="text-gray-600 mb-4">Create your first signal group to organize signals</p>
                <Button
                  variant="outline"
                  className="gap-2 border-2 border-indigo-200 hover:border-indigo-400"
                  onClick={handleCreateGroup}
                >
                  <FolderPlus className="w-4 h-4" />
                  Create Group
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
              <Label className="mb-2 block text-sm font-medium text-gray-700">Signal Group</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="border-2 border-gray-300 focus:border-indigo-500">
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  <SelectItem value="ungrouped">Ungrouped</SelectItem>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getGroupColor(group.color)}`}></div>
                        {group.name} ({group.signals_count})
                      </div>
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
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2 border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50 hover:text-purple-700 transition-all"
                  onClick={() => handleAssignToGroup()}
                  disabled={filteredSignals.length === 0}
                >
                  <FolderTree className="w-4 h-4" />
                  Assign to Group
                </Button>
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
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                      <Checkbox 
                        checked={filteredSignals.length > 0 && selectedSignalsForGroup.length === filteredSignals.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSignalsForGroup(filteredSignals.map(s => s.id))
                          } else {
                            setSelectedSignalsForGroup([])
                          }
                        }}
                      />
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Asset</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Entry → Target</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Stop Loss</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Group</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Risk</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50">
                  {filteredSignals.map((signal) => {
                    const signalGroup = groups.find(g => g.id === signal.group_id)
                    const GroupIcon = signalGroup ? getGroupIcon(signalGroup.icon) : null
                    
                    return (
                      <tr key={signal.id} className="hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-gray-100/30 transition-colors group">
                        <td className="py-5 px-6">
                          <Checkbox 
                            checked={selectedSignalsForGroup.includes(signal.id)}
                            onCheckedChange={() => toggleSignalSelection(signal.id)}
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
                          {signalGroup ? (
                            <div className="flex items-center gap-2">
                              <div className={`p-1 rounded ${getGroupColor(signalGroup.color)} bg-opacity-20`}>
                                {GroupIcon && <GroupIcon className={`w-3 h-3 ${getGroupColor(signalGroup.color).replace('bg-', 'text-')}`} />}
                              </div>
                              <span className="text-sm font-medium text-gray-700">{signalGroup.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
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
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleAssignToGroup(signal)}
                              className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 hover:text-purple-600 rounded-lg transition-all"
                              title="Assign to Group"
                            >
                              <FolderTree className="w-4 h-4" />
                            </Button>
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
                    )
                  })}
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

      {/* Send/Edit Signal Modal */}
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

              <div className="space-y-2">
                <Label htmlFor="group" className="text-sm font-medium text-gray-700">Signal Group</Label>
                <Select 
                  value={newSignalForm.group_id} 
                  onValueChange={(value) => setNewSignalForm({...newSignalForm, group_id: value})}
                >
                  <SelectTrigger className="border-2 border-gray-300 focus:border-emerald-500">
                    <SelectValue placeholder="Select group (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Group</SelectItem>
                    {groups.map(group => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getGroupColor(group.color)}`}></div>
                          {group.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSendModal(false)
                  setSelectedSignal(null)
                  resetSignalForm()
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

      {/* Create/Edit Group Modal */}
      <Dialog open={showGroupModal} onOpenChange={setShowGroupModal}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto border-0 shadow-2xl bg-gradient-to-b from-white to-gray-50/50 z-[100]">
          <div className="p-6">
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-indigo-100 to-purple-100">
                <FolderTree className="h-7 w-7 text-indigo-600" />
              </div>
              <DialogTitle className="text-center text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {selectedGroupForEdit ? 'Edit Group' : 'Create New Group'}
              </DialogTitle>
              <DialogDescription className="text-center">
                {selectedGroupForEdit 
                  ? 'Update the signal group details'
                  : 'Create a new group to organize your signals'
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
              <div className="space-y-2">
                <Label htmlFor="groupName" className="text-sm font-medium text-gray-700">Group Name *</Label>
                <Input 
                  id="groupName" 
                  placeholder="e.g., Day Trading Signals" 
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
                  className="border-2 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupDescription" className="text-sm font-medium text-gray-700">Description</Label>
                <Textarea 
                  id="groupDescription" 
                  placeholder="Brief description of this signal group"
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
                  className="border-2 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="groupColor" className="text-sm font-medium text-gray-700">Color</Label>
                  <Select 
                    value={groupForm.color} 
                    onValueChange={(value) => setGroupForm({...groupForm, color: value})}
                  >
                    <SelectTrigger className="border-2 border-gray-300 focus:border-indigo-500">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupColors.map(color => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full ${color.class}`}></div>
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="groupIcon" className="text-sm font-medium text-gray-700">Icon</Label>
                  <Select 
                    value={groupForm.icon} 
                    onValueChange={(value) => setGroupForm({...groupForm, icon: value})}
                  >
                    <SelectTrigger className="border-2 border-gray-300 focus:border-indigo-500">
                      <SelectValue placeholder="Select icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupIcons.map(icon => {
                        const IconComponent = icon.icon
                        return (
                          <SelectItem key={icon.value} value={icon.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4" />
                              {icon.label}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="groupPriority" className="text-sm font-medium text-gray-700">Priority</Label>
                  <Input 
                    id="groupPriority" 
                    type="number"
                    min="0"
                    max="999"
                    placeholder="0"
                    value={groupForm.priority}
                    onChange={(e) => setGroupForm({...groupForm, priority: parseInt(e.target.value) || 0})}
                    className="border-2 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500">Higher priority groups appear first</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="groupStatus" className="text-sm font-medium text-gray-700">Status</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch 
                      id="groupStatus"
                      checked={groupForm.is_active}
                      onCheckedChange={(checked) => setGroupForm({...groupForm, is_active: checked})}
                    />
                    <Label htmlFor="groupStatus" className="text-sm text-gray-600">
                      {groupForm.is_active ? 'Active' : 'Inactive'}
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setShowGroupModal(false)
                  setSelectedGroupForEdit(null)
                  resetGroupForm()
                }}
                className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg hover:shadow-xl"
                onClick={handleSaveGroup}
                disabled={!groupForm.name}
              >
                <FolderTree className="w-4 h-4" />
                {selectedGroupForEdit ? 'Update Group' : 'Create Group'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign to Group Modal */}
      <Dialog open={showAssignGroupModal} onOpenChange={setShowAssignGroupModal}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto border-0 shadow-2xl bg-gradient-to-b from-white to-gray-50/50 z-[100]">
          <div className="p-6">
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-purple-100 to-pink-100">
                <FolderTree className="h-7 w-7 text-purple-600" />
              </div>
              <DialogTitle className="text-center text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Assign to Group
              </DialogTitle>
              <DialogDescription className="text-center">
                Select a group to assign {selectedSignalsForGroup.length} signal(s) to
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {groups.map(group => {
                  const GroupIcon = getGroupIcon(group.icon)
                  return (
                    <div
                      key={group.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedGroupForEdit?.id === group.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-200 hover:bg-purple-50/50'
                      }`}
                      onClick={() => setSelectedGroupForEdit(group)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getGroupColor(group.color)} bg-opacity-20`}>
                            <GroupIcon className={`w-5 h-5 ${getGroupColor(group.color).replace('bg-', 'text-')}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{group.name}</h3>
                            <p className="text-xs text-gray-500">{group.signals_count} signals</p>
                          </div>
                        </div>
                        {selectedGroupForEdit?.id === group.id && (
                          <Check className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                      {group.description && (
                        <p className="text-sm text-gray-600 mt-2 ml-11">{group.description}</p>
                      )}
                    </div>
                  )
                })}
                {groups.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No groups available</p>
                    <Button
                      variant="link"
                      className="text-purple-600"
                      onClick={() => {
                        setShowAssignGroupModal(false)
                        handleCreateGroup()
                      }}
                    >
                      Create a group first
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAssignGroupModal(false)
                  setSelectedGroupForEdit(null)
                  setSelectedSignalsForGroup([])
                }}
                className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl"
                onClick={handleAssignSignals}
                disabled={!selectedGroupForEdit || selectedSignalsForGroup.length === 0}
              >
                <FolderTree className="w-4 h-4" />
                Assign to Group
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Signal Confirmation Modal */}
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

      {/* Delete Group Confirmation Modal */}
      <Dialog open={showGroupDeleteModal} onOpenChange={setShowGroupDeleteModal}>
        <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto border-0 shadow-2xl z-[100]">
          <div className="p-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-rose-100 to-red-100">
              <AlertCircle className="h-7 w-7 text-rose-600" />
            </div>
            <DialogHeader className="text-center">
              <DialogTitle className="text-xl text-rose-700">Delete Group</DialogTitle>
              <DialogDescription className="text-gray-600">
                Are you sure you want to delete this group? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {selectedGroupForEdit && (
              <div className="p-4 rounded-lg border-2 border-rose-200 bg-gradient-to-r from-rose-50/50 to-red-50/50 mt-4">
                <div className="flex items-start space-x-3">
                  <FolderTree className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-rose-800">{selectedGroupForEdit.name}</p>
                    <p className="text-sm text-rose-700 mt-1">{selectedGroupForEdit.signals_count} signals in this group</p>
                    <p className="text-xs text-rose-600 mt-2">
                      Signals in this group will become ungrouped, but will not be deleted.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 pt-4 border-t border-gray-200 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowGroupDeleteModal(false)
                  setSelectedGroupForEdit(null)
                }}
                className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-lg"
                onClick={confirmDeleteGroup}
              >
                Delete Group
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}