'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { 
  Shield,
  Lock,
  Key,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Server,
  Globe,
  Fingerprint,
  Smartphone,
  Bell,
  RefreshCw,
  Download,
  Filter,
  Search,
  MoreVertical,
  Settings,
  LogOut,
  History,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Activity,
  Database,
  Network,
  FileLock,
  Upload,
  Copy,
  Trash2,
  Edit,
  Plus,
  AlertTriangle,
  Info
} from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import { Switch } from '../../components/ui/Switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs'
import { Textarea } from '../../components/ui/Textarea'

// Mock data
const securityEvents = [
  {
    id: 'SEC-001',
    type: 'Failed Login',
    user: 'john@example.com',
    ip: '192.168.1.100',
    location: 'New York, US',
    timestamp: '2024-01-15 14:30:25',
    severity: 'high',
    status: 'resolved',
    description: 'Multiple failed login attempts detected'
  },
  {
    id: 'SEC-002',
    type: 'Suspicious Activity',
    user: 'admin@system',
    ip: '203.0.113.42',
    location: 'London, UK',
    timestamp: '2024-01-15 12:15:10',
    severity: 'medium',
    status: 'investigating',
    description: 'Unusual access pattern detected'
  },
  {
    id: 'SEC-003',
    type: 'Password Change',
    user: 'jane@example.com',
    ip: '192.168.1.150',
    location: 'San Francisco, US',
    timestamp: '2024-01-15 10:45:33',
    severity: 'low',
    status: 'resolved',
    description: 'Password successfully changed'
  },
  {
    id: 'SEC-004',
    type: 'New Device Login',
    user: 'mike@example.com',
    ip: '198.51.100.23',
    location: 'Tokyo, JP',
    timestamp: '2024-01-14 22:10:45',
    severity: 'medium',
    status: 'pending',
    description: 'Login from new device detected'
  },
  {
    id: 'SEC-005',
    type: 'API Key Generated',
    user: 'system@admin',
    ip: '127.0.0.1',
    location: 'Localhost',
    timestamp: '2024-01-14 18:20:15',
    severity: 'low',
    status: 'resolved',
    description: 'New API key generated for service'
  },
  {
    id: 'SEC-006',
    type: 'Data Export',
    user: 'admin@system',
    ip: '192.168.1.200',
    location: 'Chicago, US',
    timestamp: '2024-01-14 15:40:22',
    severity: 'medium',
    status: 'resolved',
    description: 'Large data export initiated'
  },
  {
    id: 'SEC-007',
    type: 'Security Scan',
    user: 'system@automated',
    ip: '127.0.0.1',
    location: 'Localhost',
    timestamp: '2024-01-14 03:00:00',
    severity: 'info',
    status: 'completed',
    description: 'Automatic security scan completed'
  }
]

const activeSessions = [
  {
    id: 'SESS-001',
    user: 'Admin User',
    device: 'MacBook Pro',
    browser: 'Chrome 120',
    ip: '192.168.1.100',
    location: 'New York, US',
    lastActive: '2 minutes ago',
    status: 'active'
  },
  {
    id: 'SESS-002',
    user: 'John Doe',
    device: 'iPhone 14',
    browser: 'Safari 17',
    ip: '203.0.113.42',
    location: 'London, UK',
    lastActive: '15 minutes ago',
    status: 'active'
  },
  {
    id: 'SESS-003',
    user: 'Jane Smith',
    device: 'Windows PC',
    browser: 'Firefox 121',
    ip: '192.168.1.150',
    location: 'San Francisco, US',
    lastActive: '1 hour ago',
    status: 'idle'
  },
  {
    id: 'SESS-004',
    user: 'Mike Johnson',
    device: 'Android Phone',
    browser: 'Chrome Mobile',
    ip: '198.51.100.23',
    location: 'Tokyo, JP',
    lastActive: '3 hours ago',
    status: 'expired'
  }
]

const apiKeys = [
  {
    id: 'API-001',
    name: 'Production Backend',
    key: 'sk_live_***********',
    created: '2024-01-01',
    expires: '2024-12-31',
    permissions: ['read', 'write'],
    status: 'active'
  },
  {
    id: 'API-002',
    name: 'Development',
    key: 'sk_test_***********',
    created: '2024-01-10',
    expires: '2024-06-30',
    permissions: ['read'],
    status: 'active'
  },
  {
    id: 'API-003',
    name: 'Webhook Service',
    key: 'sk_webhook_*******',
    created: '2023-12-15',
    expires: '2024-03-15',
    permissions: ['read', 'write', 'webhook'],
    status: 'expired'
  }
]

export default function AdminSecurityPage() {
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    ipWhitelist: false,
    passwordPolicy: true,
    sessionTimeout: 30,
    loginNotifications: true,
    auditLogging: true,
    apiRateLimit: 1000
  })

  const [events, setEvents] = useState(securityEvents)
  const [sessions, setSessions] = useState(activeSessions)
  const [keys, setKeys] = useState(apiKeys)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showApiKey, setShowApiKey] = useState<string | null>(null)
  const [newApiKeyName, setNewApiKeyName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState('')

  // Security stats
  const totalEvents = events.length
  const highSeverityEvents = events.filter(e => e.severity === 'high').length
  const activeSessionsCount = sessions.filter(s => s.status === 'active').length
  const activeApiKeys = keys.filter(k => k.status === 'active').length

  const handleToggleSetting = (setting: keyof typeof securitySettings) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }))
  }

  const handleTerminateSession = (sessionId: string) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId))
  }

  const handleRevokeApiKey = (keyId: string) => {
    setKeys(prev => prev.map(key => 
      key.id === keyId ? { ...key, status: 'revoked' } : key
    ))
  }

  const handleGenerateApiKey = () => {
    if (!newApiKeyName.trim()) return

    const newKey = {
      id: `API-00${keys.length + 1}`,
      name: newApiKeyName,
      key: `sk_gen_${Math.random().toString(36).substr(2, 24)}`,
      created: new Date().toISOString().split('T')[0],
      expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      permissions: ['read', 'write'],
      status: 'active'
    }

    setKeys(prev => [...prev, newKey])
    setNewApiKeyName('')
    setShowApiKey(newKey.id)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'info': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'resolved': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'investigating': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'idle': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'revoked': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'w-3 h-3 rounded-full bg-emerald-500'
      case 'idle': return 'w-3 h-3 rounded-full bg-amber-500'
      case 'expired': return 'w-3 h-3 rounded-full bg-gray-400'
      default: return 'w-3 h-3 rounded-full bg-gray-400'
    }
  }

  const handleSecurityScan = () => {
    setIsLoading(true)
    // Simulate security scan
    setTimeout(() => {
      setIsLoading(false)
      // Add a new security event
      const newEvent = {
        id: `SEC-00${events.length + 1}`,
        type: 'Security Scan',
        user: 'admin@system',
        ip: '127.0.0.1',
        location: 'Localhost',
        timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
        severity: 'info',
        status: 'completed',
        description: 'Manual security scan completed successfully'
      }
      setEvents(prev => [newEvent, ...prev])
    }, 2000)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-800 to-amber-800 bg-clip-text text-transparent">
            Security Center
          </h1>
          <p className="text-gray-600">Manage platform security, monitor events, and configure access</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            className="gap-2 border-gray-300 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            onClick={() => setIsLoading(true)}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            className="gap-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 shadow-md hover:shadow-lg transition-all duration-300"
            onClick={handleSecurityScan}
            disabled={isLoading}
          >
            <ShieldCheck className="w-4 h-4" />
            Run Security Scan
          </Button>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-xl transition-all duration-300 border border-gray-200/50 backdrop-blur-sm bg-white/80">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Security Score</p>
                <p className="text-2xl font-bold mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  92/100
                </p>
                <div className="flex items-center mt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-emerald-600 ml-1">Excellent</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 border border-gray-200/50 backdrop-blur-sm bg-white/80">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">High Severity Events</p>
                <p className="text-2xl font-bold mt-2 bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                  {highSeverityEvents}
                </p>
                <div className="flex items-center mt-1">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600 ml-1">Requires attention</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-red-50 to-rose-50">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 border border-gray-200/50 backdrop-blur-sm bg-white/80">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {activeSessionsCount}
                </p>
                <div className="flex items-center mt-1">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-blue-600 ml-1">Currently logged in</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 border border-gray-200/50 backdrop-blur-sm bg-white/80">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">API Keys Active</p>
                <p className="text-2xl font-bold mt-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {activeApiKeys}
                </p>
                <div className="flex items-center mt-1">
                  <Key className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-purple-600 ml-1">In use</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50">
                <Key className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="settings" className="space-y-8">
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Security Events
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Active Sessions
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            API Keys
          </TabsTrigger>
        </TabsList>

        {/* Security Settings */}
        <TabsContent value="settings">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Authentication Settings */}
            <Card className="border border-gray-200/50 backdrop-blur-sm bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Authentication
                </CardTitle>
                <CardDescription>Configure login and access settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="2fa" className="font-medium">Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500 mt-1">Require 2FA for all admin accounts</p>
                  </div>
                  <Switch
                    id="2fa"
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={() => handleToggleSetting('twoFactorAuth')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="password-policy" className="font-medium">Password Policy</Label>
                    <p className="text-sm text-gray-500 mt-1">Enforce strong password requirements</p>
                  </div>
                  <Switch
                    id="password-policy"
                    checked={securitySettings.passwordPolicy}
                    onCheckedChange={() => handleToggleSetting('passwordPolicy')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="session-timeout" className="font-medium">Session Timeout</Label>
                    <p className="text-sm text-gray-500 mt-1">Auto-logout after inactivity</p>
                  </div>
                  <Select 
                    value={securitySettings.sessionTimeout.toString()} 
                    onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(value) }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="login-notifications" className="font-medium">Login Notifications</Label>
                    <p className="text-sm text-gray-500 mt-1">Email alerts for new logins</p>
                  </div>
                  <Switch
                    id="login-notifications"
                    checked={securitySettings.loginNotifications}
                    onCheckedChange={() => handleToggleSetting('loginNotifications')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Network & API Settings */}
            <Card className="border border-gray-200/50 backdrop-blur-sm bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  Network & API
                </CardTitle>
                <CardDescription>Configure network security and API access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ip-whitelist" className="font-medium">IP Whitelist</Label>
                    <p className="text-sm text-gray-500 mt-1">Restrict access to specific IPs</p>
                  </div>
                  <Switch
                    id="ip-whitelist"
                    checked={securitySettings.ipWhitelist}
                    onCheckedChange={() => handleToggleSetting('ipWhitelist')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="audit-logging" className="font-medium">Audit Logging</Label>
                    <p className="text-sm text-gray-500 mt-1">Log all security events</p>
                  </div>
                  <Switch
                    id="audit-logging"
                    checked={securitySettings.auditLogging}
                    onCheckedChange={() => handleToggleSetting('auditLogging')}
                  />
                </div>

                <div>
                  <Label htmlFor="rate-limit" className="font-medium">API Rate Limit</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Input
                      id="rate-limit"
                      type="number"
                      value={securitySettings.apiRateLimit}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, apiRateLimit: parseInt(e.target.value) }))}
                      className="w-32"
                    />
                    <span className="text-sm text-gray-500">requests per minute</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Maximum API requests allowed per minute per IP</p>
                </div>

                <div>
                  <Label htmlFor="ip-whitelist-ips" className="font-medium">IP Whitelist</Label>
                  <Textarea
                    id="ip-whitelist-ips"
                    placeholder="Enter one IP address per line"
                    rows={4}
                    className="mt-2"
                    defaultValue="192.168.1.0/24\n10.0.0.0/8"
                    disabled={!securitySettings.ipWhitelist}
                  />
                  <p className="text-sm text-gray-500 mt-2">Only these IPs will be allowed to access the admin panel</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Security Actions */}
            <Card className="lg:col-span-2 border border-gray-200/50 backdrop-blur-sm bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" />
                  Quick Security Actions
                </CardTitle>
                <CardDescription>Immediate security measures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col items-center justify-center gap-3 border-red-200 hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-all duration-300"
                  >
                    <LogOut className="w-8 h-8 text-red-600" />
                    <span className="font-medium text-red-700">Force Logout All Users</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col items-center justify-center gap-3 border-amber-200 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 transition-all duration-300"
                  >
                    <History className="w-8 h-8 text-amber-600" />
                    <span className="font-medium text-amber-700">Clear Audit Logs</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col items-center justify-center gap-3 border-blue-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all duration-300"
                  >
                    <Download className="w-8 h-8 text-blue-600" />
                    <span className="font-medium text-blue-700">Export Security Report</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Events */}
        <TabsContent value="events">
          <Card className="border border-gray-200/50 backdrop-blur-sm bg-white/80">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Security Events Log</CardTitle>
                  <CardDescription>{totalEvents} security events recorded</CardDescription>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search events..."
                      className="pl-9 w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Event Type</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">User</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">IP Address</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Location</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Timestamp</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Severity</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {events.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{event.type}</div>
                          <div className="text-xs text-gray-500 mt-1">{event.description}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{event.user}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-mono text-sm text-gray-900">{event.ip}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-900">{event.location}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-900">{event.timestamp}</div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={getSeverityColor(event.severity)}>
                            {event.severity.charAt(0).toUpperCase() + event.severity.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={getStatusColor(event.status)}>
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Sessions */}
        <TabsContent value="sessions">
          <Card className="border border-gray-200/50 backdrop-blur-sm bg-white/80">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>{sessions.length} total sessions • {activeSessionsCount} active</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => {
                    if (confirm('Are you sure you want to terminate all sessions?')) {
                      setSessions([])
                    }
                  }}
                >
                  Terminate All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className={getSessionStatusColor(session.status)}></div>
                      <div>
                        <div className="font-medium text-gray-900">{session.user}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                          <Smartphone className="w-3 h-3" />
                          {session.device} • {session.browser}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm text-gray-900">{session.ip}</div>
                      <div className="text-sm text-gray-600 mt-1">{session.location}</div>
                      <div className="text-xs text-gray-500 mt-1">{session.lastActive}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleTerminateSession(session.id)}
                        >
                          Terminate
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Management */}
        <TabsContent value="api">
          <Card className="border border-gray-200/50 backdrop-blur-sm bg-white/80">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>API Keys Management</CardTitle>
                  <CardDescription>{keys.length} API keys configured • {activeApiKeys} active</CardDescription>
                </div>
                <div className="flex gap-3">
                  <Input
                    placeholder="New key name"
                    value={newApiKeyName}
                    onChange={(e) => setNewApiKeyName(e.target.value)}
                    className="w-48"
                  />
                  <Button 
                    className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    onClick={handleGenerateApiKey}
                    disabled={!newApiKeyName.trim()}
                  >
                    <Plus className="w-4 h-4" />
                    Generate Key
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {keys.map((apiKey) => (
                  <div key={apiKey.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">{apiKey.name}</h3>
                          <Badge className={getStatusColor(apiKey.status)}>
                            {apiKey.status.charAt(0).toUpperCase() + apiKey.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                          <span>Created: {apiKey.created}</span>
                          <span>Expires: {apiKey.expires}</span>
                          <span>Permissions: {apiKey.permissions.join(', ')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => setShowApiKey(showApiKey === apiKey.id ? null : apiKey.id)}
                        >
                          {showApiKey === apiKey.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          {showApiKey === apiKey.id ? 'Hide' : 'Show'} Key
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRevokeApiKey(apiKey.id)}
                        >
                          Revoke
                        </Button>
                      </div>
                    </div>
                    
                    {showApiKey === apiKey.id && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <code className="font-mono text-sm bg-white px-3 py-2 rounded border border-gray-300 flex-1">
                            {apiKey.key}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-2 gap-1"
                            onClick={() => navigator.clipboard.writeText(apiKey.key)}
                          >
                            <Copy className="w-4 h-4" />
                            Copy
                          </Button>
                        </div>
                        <div className="mt-2 flex items-center text-amber-600 text-sm">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Keep this key secret. Anyone with this key can access your API.
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Security Warning */}
              <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800">Security Recommendations</h4>
                    <ul className="mt-2 text-sm text-amber-700 space-y-1">
                      <li>• Rotate API keys every 90 days</li>
                      <li>• Restrict API keys to minimum required permissions</li>
                      <li>• Monitor API usage for suspicious activity</li>
                      <li>• Never commit API keys to version control</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Security Tips */}
      <Card className="border border-gray-200/50 backdrop-blur-sm bg-white/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Security Best Practices
          </CardTitle>
          <CardDescription>Essential security guidelines for your platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Fingerprint className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-blue-800">Authentication</h3>
              </div>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  Enable 2FA for all admin accounts
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  Use strong, unique passwords
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  Regularly review active sessions
                </li>
              </ul>
            </div>

            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <Database className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-emerald-800">Data Protection</h3>
              </div>
              <ul className="text-sm text-emerald-700 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  Encrypt sensitive data at rest
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  Regular data backups
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  Implement data access controls
                </li>
              </ul>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Network className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-purple-800">Network Security</h3>
              </div>
              <ul className="text-sm text-purple-700 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  Use HTTPS for all connections
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  Implement rate limiting
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  Regular security audits
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}