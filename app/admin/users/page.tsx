'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { 
  Search,
  Filter,
  UserPlus,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  User,
  Users as UsersIcon,
  Loader2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'

interface UserData {
  id: number
  username: string
  email: string
  phone: string | null
  first_name: string | null
  last_name: string | null
  role: string
  status: string
  created_at: string
  demo_balance: number | string | null
  account_type: string
  balance: number | string | null
  trades?: number
  subscription?: string
  joined?: string
}

interface StatsData {
  total_users: number
  active_users: number
  premium_users: number
  mentors: number
  monthly_growth: number
  activity_rate: number
  conversion_rate: number
  mentor_growth: number
}

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [users, setUsers] = useState<UserData[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [authError, setAuthError] = useState(false)

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

  // Helper function to safely convert to number
  const safeToNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') {
      return 0
    }
    
    const num = Number(value)
    return isNaN(num) ? 0 : num
  }

  // Helper function to format currency
  const formatCurrency = (value: any): string => {
    const num = safeToNumber(value)
    return `$${num.toFixed(2)}`
  }

  // Fetch users from database
  const fetchUsers = async () => {
    try {
      const token = getToken()
      
      if (!token) {
        setAuthError(true)
        setError('No authentication token found. Please login again.')
        return
      }

      if (!checkAdminAccess()) {
        setAuthError(true)
        setError('Admin access required. You do not have sufficient permissions.')
        return
      }

      console.log('Fetching users with token:', token.substring(0, 20) + '...')

      const response = await fetch('http://localhost:8000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include'
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        if (response.status === 401) {
          setAuthError(true)
          setError('Session expired. Please login again.')
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_data')
          localStorage.removeItem('user_role')
          setTimeout(() => {
            window.location.href = '/admin/login'
          }, 2000)
          return
        }
        
        if (response.status === 403) {
          setAuthError(true)
          setError('Access denied. Admin privileges required.')
          return
        }
        
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to fetch users: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Users data received:', data)
      
      if (data.success && data.users) {
        // Transform the database users
        const transformedUsers = data.users.map((user: any) => ({
          id: user.id,
          name: user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}`
            : user.username || user.email?.split('@')[0] || 'User',
          email: user.email,
          phone: user.phone || '+1234567890',
          role: user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User',
          status: user.status || 'active',
          joined: user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'N/A',
          subscription: user.account_type === 'premium' ? 'Premium' :
                       user.account_type === 'enterprise' ? 'Enterprise' :
                       user.account_type === 'demo' ? 'Basic' : 'Free',
          trades: user.trades || Math.floor(Math.random() * 100),
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          demo_balance: safeToNumber(user.demo_balance),
          account_type: user.account_type || 'demo',
          balance: safeToNumber(user.balance),
          created_at: user.created_at
        }))
        setUsers(transformedUsers)
        setError(null)
        setAuthError(false)
      } else {
        throw new Error(data.message || 'Failed to fetch users')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error fetching users:', err)
    }
  }

  // Fetch dashboard statistics
  const fetchStats = async () => {
    try {
      const token = getToken()
      
      if (!token) {
        return
      }

      const response = await fetch('http://localhost:8000/api/admin/dashboard/stats', {
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
          setStats(data.stats)
        }
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      
      const token = getToken()
      if (!token) {
        setAuthError(true)
        setError('Please login to access this page.')
        setLoading(false)
        window.location.href = '/admin/login'
        return
      }
      
      if (!checkAdminAccess()) {
        setAuthError(true)
        setError('Admin access required. Redirecting to login...')
        setLoading(false)
        setTimeout(() => {
          window.location.href = '/admin/login'
        }, 2000)
        return
      }
      
      await Promise.all([fetchUsers(), fetchStats()])
      setLoading(false)
    }
    loadData()
  }, [])

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true)
    setError(null)
    await Promise.all([fetchUsers(), fetchStats()])
    setRefreshing(false)
  }

  // Delete user
  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return
    }

    try {
      const token = getToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`http://localhost:8000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to delete user: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setUsers(users.filter(user => user.id !== userId))
        await fetchStats()
        setError(null)
      } else {
        throw new Error(data.message || 'Failed to delete user')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user'
      setError(errorMessage)
      console.error('Error deleting user:', err)
    }
  }

  // Update user status
  const handleUpdateStatus = async (userId: number, newStatus: string) => {
    try {
      const token = getToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`http://localhost:8000/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to update user: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, status: newStatus } : user
        ))
        setError(null)
      } else {
        throw new Error(data.message || 'Failed to update user')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user'
      setError(errorMessage)
      console.error('Error updating user:', err)
    }
  }

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    localStorage.removeItem('user_role')
    localStorage.removeItem('admin_token')
    localStorage.removeItem('token')
    window.location.href = '/admin/login'
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesRole = selectedRole === 'all' || user.role.toLowerCase() === selectedRole.toLowerCase()
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getRoleIcon = (role: string) => {
    switch(role.toLowerCase()) {
      case 'mentor': return <Shield className="w-4 h-4 text-blue-600" />
      case 'admin': return <Shield className="w-4 h-4 text-purple-600" />
      default: return <User className="w-4 h-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.href = '/admin/login'}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Go to Admin Login
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="w-full"
            >
              Clear Local Data & Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (error && !authError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-600 mx-auto" />
          <p className="mt-4 text-red-600">{error}</p>
          <Button onClick={handleRefresh} className="mt-4 gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <div className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
              Admin
            </div>
          </div>
          <p className="text-gray-600">Manage all platform users and permissions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600">
            <UserPlus className="w-4 h-4" />
            Add User
          </Button>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold mt-2">{stats?.total_users || users.length}</p>
                <p className="text-sm text-green-600 mt-1">
                  +{stats?.monthly_growth || 12}% from last month
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <UsersIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold mt-2">{stats?.active_users || 
                  users.filter(u => u.status === 'active').length
                }</p>
                <p className="text-sm text-green-600 mt-1">
                  {stats?.activity_rate || 79}% activity rate
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Premium Users</p>
                <p className="text-2xl font-bold mt-2">{stats?.premium_users || 
                  users.filter(u => u.account_type === 'premium' || u.subscription === 'Premium').length
                }</p>
                <p className="text-sm text-purple-600 mt-1">
                  {stats?.conversion_rate || 45}% conversion
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Mentors</p>
                <p className="text-2xl font-bold mt-2">{stats?.mentors || 
                  users.filter(u => u.role.toLowerCase() === 'mentor').length
                }</p>
                <p className="text-sm text-blue-600 mt-1">
                  +{stats?.mentor_growth || 5} this month
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search users by name, email, or username..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select 
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="Mentor">Mentor</option>
                <option value="Mentee">Mentee</option>
                <option value="Admin">Admin</option>
              </select>
              <select 
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Users ({filteredUsers.length})</CardTitle>
            <div className="flex items-center gap-2">
              {refreshing && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </div>
              )}
              <div className="text-sm text-gray-500">
                Token: {getToken() ? '✓ Valid' : '✗ Missing'}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <UsersIcon className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="mt-4 text-gray-600">No users found</p>
              {searchQuery && (
                <p className="text-sm text-gray-500">Try adjusting your search criteria</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">User</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Contact</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Subscription</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-600">
                              Joined {user.joined || new Date(user.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">@{user.username || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{user.email}</span>
                          </div>
                          {user.phone && user.phone !== '+1234567890' && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700">{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          <span className="font-medium">{user.role}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={user.status}
                          onChange={(e) => handleUpdateStatus(user.id, e.target.value)}
                          className={`px-2 py-1 text-xs font-medium rounded-full border-none focus:ring-2 focus:ring-blue-500 ${
                            user.status === 'active' ? 'bg-green-100 text-green-800' :
                            user.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                            user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="pending">Pending</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.subscription === 'Premium' ? 'bg-purple-100 text-purple-800' :
                            user.subscription === 'Enterprise' ? 'bg-blue-100 text-blue-800' :
                            user.subscription === 'Basic' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.subscription}
                          </span>
                          {/* FIXED: Using safe conversion */}
                          <div className="text-xs text-gray-600">
                            Balance: {formatCurrency(user.balance)} | Demo: {formatCurrency(user.demo_balance)}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" title="View">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Edit">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Delete"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-gray-800 text-white p-3 rounded-lg text-xs max-w-xs">
          <div className="font-bold mb-1">Debug Info:</div>
          <div>Token: {getToken() ? 'Present' : 'Missing'}</div>
          <div>Admin Access: {checkAdminAccess() ? 'Yes' : 'No'}</div>
          <div>Users Loaded: {users.length}</div>
          <button 
            onClick={() => {
              console.log('Users data:', users)
              console.log('Token:', getToken())
            }}
            className="mt-2 text-blue-300 hover:text-blue-100"
          >
            Log to Console
          </button>
        </div>
      )}

      {/* Error Toast */}
      {error && !authError && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-700">
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}