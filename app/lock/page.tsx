'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { 
  Lock,
  Shield,
  AlertTriangle,
  Key,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Server,
  RefreshCw,
  Loader2,
  Clock,
  Calendar
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// The specific password that must be entered within one week
const REQUIRED_PASSWORD = "Lew1n2023@@"

interface SystemLockState {
  isLocked: boolean
  installationDate: string | null
  daysRemaining: number
  passwordEntered: boolean
  message?: string
}

export default function SystemLockPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Password state
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // System state
  const [systemState, setSystemState] = useState<SystemLockState>({
    isLocked: true,
    installationDate: null,
    daysRemaining: 7,
    passwordEntered: false
  })

  // Countdown timer
  const [countdown, setCountdown] = useState({
    days: 7,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  // Get token
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || ''
    }
    return ''
  }

  // Check system lock status on mount
  useEffect(() => {
    checkSystemLockStatus()
  }, [])

  // Update countdown timer
  useEffect(() => {
    if (!systemState.installationDate) return

    const interval = setInterval(() => {
      const installation = new Date(systemState.installationDate!)
      const deadline = new Date(installation)
      deadline.setDate(deadline.getDate() + 7) // Add 7 days
      
      const now = new Date()
      const timeLeft = deadline.getTime() - now.getTime()
      
      if (timeLeft <= 0) {
        // System should be locked
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        if (!systemState.isLocked) {
          setSystemState(prev => ({ ...prev, isLocked: true }))
        }
        clearInterval(interval)
      } else {
        // Calculate remaining time
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
        
        setCountdown({ days, hours, minutes, seconds })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [systemState.installationDate])

  const checkSystemLockStatus = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const token = getToken()
      
      const response = await fetch(`${API_URL}/admin/system/lock-status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin/login')
          return
        }
        throw new Error('Failed to check system status')
      }

      const data = await response.json()
      
      // Check if installation date exists in localStorage as fallback
      let installationDate = data.installationDate
      if (!installationDate) {
        // Try to get from localStorage
        installationDate = localStorage.getItem('system_installation_date')
        
        // If still no date, set it now
        if (!installationDate) {
          installationDate = new Date().toISOString()
          localStorage.setItem('system_installation_date', installationDate)
        }
      }
      
      // Calculate days remaining
      const installation = new Date(installationDate)
      const deadline = new Date(installation)
      deadline.setDate(deadline.getDate() + 7)
      const now = new Date()
      const daysRemaining = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      
      // Check if password has been entered
      const passwordEntered = localStorage.getItem('system_password_entered') === 'true'
      
      // Determine if system should be locked
      const isLocked = !passwordEntered && (daysRemaining <= 0 || data.isLocked)
      
      setSystemState({
        isLocked,
        installationDate,
        daysRemaining,
        passwordEntered
      })
      
      // If system is not locked and password was entered, redirect to dashboard
      if (!isLocked && passwordEntered) {
        router.push('/')
      }
    } catch (err) {
      console.error('Error checking system status:', err)
      setError(err instanceof Error ? err.message : 'Failed to check system status')
    } finally {
      setLoading(false)
    }
  }

  // Handle password submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setChecking(true)
    setError(null)
    setSuccess(null)

    try {
      // Check if password matches "Lew1n2023@@"
      if (password !== REQUIRED_PASSWORD) {
        setError('Incorrect password. Access denied.')
        setChecking(false)
        return
      }

      const token = getToken()
      
      const response = await fetch(`${API_URL}/admin/system/validate-setup-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          password: password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to validate password')
      }

      // Store that password was entered
      localStorage.setItem('system_password_entered', 'true')
      
      setSuccess('Password accepted! System unlocked. Redirecting to dashboard...')
      
      // Update token if provided
      if (data.token) {
        localStorage.setItem('auth_token', data.token)
      }
      
      // Update system state
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate password')
    } finally {
      setChecking(false)
    }
  }

  // Format installation date
  const formatInstallationDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping">
              <Lock className="w-16 h-16 text-red-400 mx-auto" />
            </div>
            <Lock className="w-16 h-16 text-red-600 mx-auto relative" />
          </div>
          <p className="mt-4 text-gray-600">Checking system security...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* System Lock Alert */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-3 rounded-t-lg flex items-center gap-3">
            <Lock className="w-6 h-6" />
            <div>
              <h2 className="font-bold">SYSTEM LOCK</h2>
              <p className="text-sm text-red-100">One-Time Setup Required</p>
            </div>
          </div>
          <div className="bg-red-500 text-white px-4 py-2 rounded-b-lg text-sm flex items-center justify-between">
            <span>Installation Lock Active</span>
            <Server className="w-4 h-4" />
          </div>
        </div>

        <Card className="border-red-200 shadow-xl">
          <CardHeader className="text-center border-b border-red-100 bg-red-50">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-900">System Installation Lock</CardTitle>
            <CardDescription className="text-red-700">
              Enter the one-time setup password within 7 days of installation
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            {/* Countdown Timer */}
            <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Time Remaining</h3>
              </div>
              
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-white rounded-lg p-2 shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">{countdown.days}</div>
                  <div className="text-xs text-gray-500">Days</div>
                </div>
                <div className="bg-white rounded-lg p-2 shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">{countdown.hours}</div>
                  <div className="text-xs text-gray-500">Hours</div>
                </div>
                <div className="bg-white rounded-lg p-2 shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">{countdown.minutes}</div>
                  <div className="text-xs text-gray-500">Mins</div>
                </div>
                <div className="bg-white rounded-lg p-2 shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">{countdown.seconds}</div>
                  <div className="text-xs text-gray-500">Secs</div>
                </div>
              </div>
              
              {systemState.installationDate && (
                <p className="text-xs text-center text-gray-500 mt-3">
                  Installed: {formatInstallationDate(systemState.installationDate)}
                </p>
              )}
            </div>

            {/* Security Warning */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">⚠️ One-Time Password Required</p>
                  <p>The system requires a one-time setup password. This password must be entered within 7 days of installation. After the timer expires, the system will be permanently locked.</p>
                </div>
              </div>
            </div>

            {/* Password Form */}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  One-Time Setup Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter setup password"
                    className="pr-10 border-red-300 focus:border-red-500 focus:ring-red-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Contact your system administrator for the one-time password
                </p>
              </div>

              <Button
                type="submit"
                disabled={checking || !password || systemState.daysRemaining <= 0}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validating...
                  </>
                ) : systemState.daysRemaining <= 0 ? (
                  <>
                    <Lock className="w-4 h-4" />
                    System Locked - Time Expired
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Unlock System
                  </>
                )}
              </Button>
            </form>

            {/* System Info */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>7-Day Installation Lock</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Security Level: Maximum</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning Footer */}
        <p className="text-center text-xs text-red-600 mt-4">
          ⚠️ After 7 days without the correct password, the system will be permanently locked
        </p>
      </div>
    </div>
  )
}