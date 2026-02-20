'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { 
  BarChart3, 
  Download, 
  Search,
  Filter, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  PieChart,
  LineChart,
  AlertCircle,
  ExternalLink,
  Printer,
  Share2,
  FileText,
  Activity,
  Target,
  Award,
  Sparkles,
  Loader2
} from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs'

interface Report {
  id: string
  title: string
  type: string
  period: string
  status: 'completed' | 'pending' | 'failed'
  generated_at: string
  size: string
  format: string
  downloads: number
  metrics: {
    revenue: number
    growth: number
    active_users: number
    churn_rate: number
  }
}

const reportTypes = ['All', 'Revenue', 'Users', 'Signals', 'Platform', 'Financial', 'Marketing']
const reportPeriods = ['All', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']
const reportFormats = ['All', 'PDF', 'Excel', 'CSV', 'JSON']

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [filteredReports, setFilteredReports] = useState<Report[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('All')
  const [selectedPeriod, setSelectedPeriod] = useState('All')
  const [selectedFormat, setSelectedFormat] = useState('All')
  const [dateRange, setDateRange] = useState('30days')
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [expandedReport, setExpandedReport] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  // Fetch reports from API
  const fetchReports = async () => {
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

      const response = await fetch('http://localhost:8000/api/admin/reports', {
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
        throw new Error(errorData.message || `Failed to fetch reports: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success && data.reports) {
        return data.reports
      } else {
        throw new Error(data.message || 'Failed to fetch reports')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error fetching reports:', err)
      return []
    }
  }

  // Fetch report statistics from API
  const fetchReportStats = async () => {
    try {
      const token = getToken()
      
      if (!token) {
        return {
          total_reports: 0,
          completed_reports: 0,
          total_downloads: 0,
          total_revenue: 0,
          avg_report_size: 0
        }
      }

      const response = await fetch('http://localhost:8000/api/admin/reports/stats', {
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
        }
      }
      return {
        total_reports: 0,
        completed_reports: 0,
        total_downloads: 0,
        total_revenue: 0,
        avg_report_size: 0
      }
    } catch (err) {
      console.error('Error fetching report stats:', err)
      return {
        total_reports: 0,
        completed_reports: 0,
        total_downloads: 0,
        total_revenue: 0,
        avg_report_size: 0
      }
    }
  }

  // Generate new report
  const generateReport = async (reportType: string = 'performance') => {
    try {
      const token = getToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('http://localhost:8000/api/admin/reports/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          type: reportType,
          period: 'weekly',
          format: 'PDF'
        }),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        return { success: true, report: data.report }
      } else {
        throw new Error(data.message || 'Failed to generate report')
      }
    } catch (err) {
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to generate report' 
      }
    }
  }

  // Download report
  const downloadReport = async (reportId: string) => {
    try {
      const token = getToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`http://localhost:8000/api/admin/reports/${reportId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to download report: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Increment download count locally
        setReports(prev => prev.map(report => 
          report.id === reportId 
            ? { ...report, downloads: report.downloads + 1 }
            : report
        ))
        return { success: true, url: data.download_url }
      } else {
        throw new Error(data.message || 'Failed to download report')
      }
    } catch (err) {
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to download report' 
      }
    }
  }

  // Delete report
  const deleteReport = async (reportId: string) => {
    try {
      const token = getToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`http://localhost:8000/api/admin/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to delete report: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        return { success: true, message: data.message }
      } else {
        throw new Error(data.message || 'Failed to delete report')
      }
    } catch (err) {
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to delete report' 
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
        const [reportsData, statsData] = await Promise.all([
          fetchReports(),
          fetchReportStats()
        ])
        
        setReports(reportsData)
        // You can use statsData for your stats cards
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
    setIsLoading(true)
    setError(null)
    try {
      const [reportsData, statsData] = await Promise.all([
        fetchReports(),
        fetchReportStats()
      ])
      
      setReports(reportsData)
    } catch (err) {
      console.error('Error refreshing data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter reports
  useEffect(() => {
    let filtered = [...reports]
    
    if (searchQuery) {
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    if (selectedType !== 'All') {
      filtered = filtered.filter(report => report.type === selectedType)
    }
    
    if (selectedPeriod !== 'All') {
      filtered = filtered.filter(report => report.period.toLowerCase().includes(selectedPeriod.toLowerCase()))
    }
    
    if (selectedFormat !== 'All') {
      filtered = filtered.filter(report => report.format === selectedFormat)
    }
    
    if (activeTab !== 'all') {
      filtered = filtered.filter(report => report.status === activeTab)
    }
    
    setFilteredReports(filtered)
  }, [searchQuery, selectedType, selectedPeriod, selectedFormat, activeTab, reports])

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const result = await generateReport('performance')
      if (result.success && result.report) {
        setReports(prev => [result.report, ...prev])
      } else {
        setError(result.message || 'Failed to generate report')
      }
    } catch (err) {
      setError('Failed to generate report')
      console.error('Error generating report:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadReport = async (reportId: string) => {
    try {
      const result = await downloadReport(reportId)
      if (result.success && result.url) {
        // Open download URL in new tab
        window.open(result.url, '_blank')
      } else {
        setError(result.message || 'Failed to download report')
      }
    } catch (err) {
      setError('Failed to download report')
      console.error('Error downloading report:', err)
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      try {
        const result = await deleteReport(reportId)
        if (result.success) {
          setReports(prev => prev.filter(report => report.id !== reportId))
        } else {
          setError(result.message || 'Failed to delete report')
        }
      } catch (err) {
        setError('Failed to delete report')
        console.error('Error deleting report:', err)
      }
    }
  }

  // Calculate statistics from fetched data
  const totalReports = reports.length
  const completedReports = reports.filter(r => r.status === 'completed').length
  const totalDownloads = reports.reduce((acc, r) => acc + r.downloads, 0)
  const totalRevenue = reports.reduce((acc, r) => acc + r.metrics.revenue, 0)
  const avgReportSize = reports.length > 0 
    ? reports.reduce((acc, r) => {
        const size = parseFloat(r.size.replace(' MB', ''))
        return acc + size
      }, 0) / reports.length 
    : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-3 h-3 mr-1" />
      case 'pending': return <Clock className="w-3 h-3 mr-1" />
      case 'failed': return <XCircle className="w-3 h-3 mr-1" />
      default: return null
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Revenue': return 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-700'
      case 'Users': return 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-700'
      case 'Signals': return 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-700'
      case 'Platform': return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-700'
      case 'Financial': return 'bg-gradient-to-r from-cyan-500/20 to-sky-500/20 text-cyan-700'
      case 'Marketing': return 'bg-gradient-to-r from-rose-500/20 to-red-500/20 text-rose-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString.replace(' ', 'T'))
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const toggleReportExpansion = (reportId: string) => {
    setExpandedReport(expandedReport === reportId ? null : reportId)
  }

  if (isLoading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    )
  }

  if (error && reports.length === 0) {
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
              disabled={isLoading}
            >
              {isLoading ? (
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-800 to-blue-800 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-gray-600">Generate and manage platform performance reports</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            className="gap-2 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-300"
            onClick={handleGenerateReport}
            disabled={isGenerating || isLoading}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <BarChart3 className="w-4 h-4" />
            )}
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-xl transition-all duration-300 border border-gray-200/50 backdrop-blur-sm bg-white/80">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  {totalReports}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-cyan-500" />
                  <span className="text-sm text-cyan-600 ml-1">Tracked</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50">
                <FileText className="w-6 h-6 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 border border-gray-200/50 backdrop-blur-sm bg-white/80">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Total Downloads</p>
                <p className="text-2xl font-bold mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {totalDownloads.toLocaleString()}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-emerald-600 ml-1">All time</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50">
                <Download className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 border border-gray-200/50 backdrop-blur-sm bg-white/80">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Avg Report Size</p>
                <p className="text-2xl font-bold mt-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {avgReportSize.toFixed(1)} MB
                </p>
                <div className="flex items-center mt-1">
                  <TrendingDown className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-purple-600 ml-1">Average</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50">
                <PieChart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 border border-gray-200/50 backdrop-blur-sm bg-white/80">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Revenue Tracked</p>
                <p className="text-2xl font-bold mt-2 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  {formatCurrency(totalRevenue)}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-amber-600 ml-1">Total revenue</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters */}
        <Card className="lg:w-1/4 border border-gray-200/50 backdrop-blur-sm bg-white/80">
          <CardHeader>
            <CardTitle className="text-lg">Report Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="search" className="mb-2 block">Search Reports</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by title, ID, type..."
                  value={searchQuery || ''}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Report Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Period</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {reportPeriods.map(period => (
                    <SelectItem key={period} value={period}>{period}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Format</Label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {reportFormats.map(format => (
                    <SelectItem key={format} value={format}>{format}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                  <SelectItem value="year">This year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4">
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedType('All')
                  setSelectedPeriod('All')
                  setSelectedFormat('All')
                  setDateRange('30days')
                }}
              >
                <Filter className="w-4 h-4" />
                Clear All Filters
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completed</span>
                  <Badge className="bg-emerald-100 text-emerald-800">
                    {completedReports}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending</span>
                  <Badge className="bg-amber-100 text-amber-800">
                    {reports.filter(r => r.status === 'pending').length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Failed</span>
                  <Badge className="bg-red-100 text-red-800">
                    {reports.filter(r => r.status === 'failed').length}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card className="lg:w-3/4 border border-gray-200/50 backdrop-blur-sm bg-white/80">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle>Generated Reports</CardTitle>
                <CardDescription>
                  {filteredReports.length} reports found • {formatCurrency(
                    filteredReports.reduce((acc, r) => acc + r.metrics.revenue, 0)
                  )} total revenue tracked
                </CardDescription>
              </div>
              <Tabs defaultValue="all" className="w-auto" onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="completed" className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    Completed
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    Pending
                  </TabsTrigger>
                  <TabsTrigger value="failed" className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    Failed
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div key={report.id} className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  {/* Report Header */}
                  <div className="p-4 cursor-pointer" onClick={() => toggleReportExpansion(report.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">{report.title}</h3>
                          <Badge className={getTypeColor(report.type)}>
                            {report.type}
                          </Badge>
                          <Badge className={getStatusColor(report.status)}>
                            {getStatusIcon(report.status)}
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {report.period}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {report.format} • {report.size}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            {report.downloads} downloads
                          </span>
                          <span className="text-gray-500">
                            ID: {report.id}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {expandedReport === report.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedReport === report.id && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Revenue</span>
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div className="text-xl font-bold text-gray-900">
                            {formatCurrency(report.metrics.revenue)}
                          </div>
                          <div className={`text-sm flex items-center ${report.metrics.growth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {report.metrics.growth >= 0 ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {report.metrics.growth >= 0 ? '+' : ''}{report.metrics.growth.toFixed(1)}%
                          </div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Active Users</span>
                            <Users className="w-4 h-4 text-blue-500" />
                          </div>
                          <div className="text-xl font-bold text-gray-900">
                            {report.metrics.active_users.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">Tracked users</div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Churn Rate</span>
                            <Activity className="w-4 h-4 text-purple-500" />
                          </div>
                          <div className="text-xl font-bold text-gray-900">
                            {report.metrics.churn_rate.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">User retention</div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Generated</span>
                            <Clock className="w-4 h-4 text-amber-500" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(report.generated_at)}
                          </div>
                          <div className="text-sm text-gray-600">Last updated</div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          Report includes detailed analytics, charts, and recommendations
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleDownloadReport(report.id)}
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => window.print()}
                          >
                            <Printer className="w-4 h-4" />
                            Print
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <Share2 className="w-4 h-4" />
                            Share
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleDeleteReport(report.id)}
                          >
                            <XCircle className="w-4 h-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="px-4 pb-4">
                    <div className="flex flex-wrap gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-gray-900"
                        onClick={() => handleDownloadReport(report.id)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-gray-900"
                        onClick={() => {
                          // Preview functionality - could open modal or new tab
                          window.open(`/admin/reports/${report.id}/preview`, '_blank')
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-gray-900"
                        onClick={() => {
                          // Clone report functionality
                          handleGenerateReport(report.type.toLowerCase())
                        }}
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        Regenerate
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {filteredReports.length === 0 && (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                    {searchQuery || selectedType !== 'All' || selectedPeriod !== 'All' 
                      ? 'Try adjusting your filters or search query'
                      : 'Generate your first report to get started'}
                  </p>
                  {!searchQuery && selectedType === 'All' && selectedPeriod === 'All' && (
                    <Button
                      onClick={handleGenerateReport}
                      className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <BarChart3 className="w-4 h-4" />
                      )}
                      Generate First Report
                    </Button>
                  )}
                </div>
              )}

              {/* Loading State */}
              {isLoading && filteredReports.length > 0 && (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-600">Loading more reports...</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredReports.length > 0 && (
              <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
                <div className="text-sm text-gray-600">
                  Showing {Math.min(filteredReports.length, 10)} of {filteredReports.length} reports
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="gap-1"
                  >
                    <ChevronUp className="w-4 h-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="w-8 h-8 p-0">1</Button>
                    <Button variant="outline" size="sm" className="w-8 h-8 p-0 bg-blue-50 border-blue-200 text-blue-700">2</Button>
                    <Button variant="outline" size="sm" className="w-8 h-8 p-0">3</Button>
                    <span className="px-2">...</span>
                    <Button variant="outline" size="sm" className="w-8 h-8 p-0">5</Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                  >
                    Next
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section */}
      <Card className="border border-gray-200/50 backdrop-blur-sm bg-white/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="w-5 h-5 text-blue-600" />
            Report Analytics & Trends
          </CardTitle>
          <CardDescription>
            Performance metrics and usage patterns over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="h-64 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Report generation trends chart</p>
                  <p className="text-sm text-gray-500 mt-1">Monthly report volume and download statistics</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                <h4 className="font-medium text-cyan-800 mb-2">Most Downloaded</h4>
                <p className="text-2xl font-bold text-cyan-900">Q4 Revenue Report</p>
                <p className="text-sm text-cyan-700">1,248 downloads • 98% completion rate</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                <h4 className="font-medium text-emerald-800 mb-2">Fastest Generation</h4>
                <p className="text-2xl font-bold text-emerald-900">2.3 seconds</p>
                <p className="text-sm text-emerald-700">Daily user activity report • CSV format</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                <h4 className="font-medium text-amber-800 mb-2">Revenue Leader</h4>
                <p className="text-2xl font-bold text-amber-900">{formatCurrency(450000)}</p>
                <p className="text-sm text-amber-700">Quarterly financial report • Highest revenue tracked</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Report Generation Tips</h4>
                <p className="text-sm text-gray-600">Best practices for optimal report performance</p>
              </div>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  // Open documentation
                  window.open('/admin/docs/reports', '_blank')
                }}
              >
                <ExternalLink className="w-4 h-4" />
                View Documentation
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">Schedule Reports</h5>
                    <p className="text-sm text-gray-600">Automate generation for peak efficiency</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50">
                    <Award className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">Optimize Formats</h5>
                    <p className="text-sm text-gray-600">Use CSV for large datasets, PDF for sharing</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">Export Templates</h5>
                    <p className="text-sm text-gray-600">Save custom report configurations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom">
          <Card className="border-red-200 bg-red-50 shadow-lg max-w-md">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-900">Error</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-700 hover:text-red-900 hover:bg-red-100"
                  onClick={() => setError(null)}
                >
                  X
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Global Actions */}
      <div className="flex flex-wrap gap-3 justify-end pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => window.open('/admin/reports/export-all', '_blank')}
        >
          <Download className="w-4 h-4" />
          Export All Reports
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            // Clear old reports
            if (confirm('Are you sure you want to clear reports older than 1 year?')) {
              // Implement clear old reports logic
              console.log('Clearing old reports...')
            }
          }}
        >
          <Clock className="w-4 h-4" />
          Clear Old Reports
        </Button>
        <Button
          className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          onClick={() => {
            // Advanced analytics
            window.open('/admin/analytics/advanced', '_blank')
          }}
        >
          <Activity className="w-4 h-4" />
          Advanced Analytics
        </Button>
      </div>
    </div>
  )
}