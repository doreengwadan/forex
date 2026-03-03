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
  Loader2
} from 'lucide-react'

interface SystemLockState {
  isLocked: boolean
  defaultPasswordChanged: boolean
  requiresSetup: boolean
  message?: string
}

export default function SystemLockPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // System state
  const [systemState, setSystemState] = useState<SystemLockState>({
    isLocked: true,
    defaultPasswordChanged: false,
    requiresSetup: true
  })

  // Password validation
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [passwordStrength, setPasswordStrength] = useState(0)

  // Check system lock status on mount
  useEffect(() => {
    checkSystemLockStatus()
  }, [])

  const checkSystemLockStatus = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/system/lock-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Failed to check system status')
      }

      const data = await response.json()
      setSystemState(data)
      
      // If system is not locked, redirect to dashboard
      if (!data.isLocked && data.defaultPasswordChanged) {
        router.push('/admin/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check system status')
    } finally {
      setLoading(false)
    }
  }

  // Validate password strength
  const validatePassword = (password: string) => {
    const errors: string[] = []
    let strength = 0

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    } else {
      strength += 25
    }

    if (/[A-Z]/.test(password)) {
      strength += 25
    } else {
      errors.push('Include at least one uppercase letter')
    }

    if (/[a-z]/.test(password)) {
      strength += 25
    } else {
      errors.push('Include at least one lowercase letter')
    }

    if (/[0-9]/.test(password)) {
      strength += 15
    } else {
      errors.push('Include at least one number')
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      strength += 10
    } else {
      errors.push('Include at least one special character')
    }

    setPasswordErrors(errors)
    setPasswordStrength(strength)
  }

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setChecking(true)
    setError(null)
    setSuccess(null)

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      setChecking(false)
      return
    }

    if (passwordErrors.length > 0) {
      setError('Please fix password validation errors')
      setChecking(false)
      return
    }

    try {
      const response = await fetch('/api/system/change-default-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password')
      }

      setSuccess('Default password changed successfully! Redirecting to dashboard...')
      
      // Update system state
      setTimeout(() => {
        router.push('/admin/dashboard')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setChecking(false)
    }
  }

  // Handle system unlock with master key
  const handleMasterUnlock = async () => {
    setChecking(true)
    setError(null)

    try {
      const response = await fetch('/api/system/master-unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to unlock system')
      }

      setSuccess('System unlocked with master key! Redirecting...')
      
      setTimeout(() => {
        router.push('/admin/setup')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock system')
    } finally {
      setChecking(false)
    }
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
        <div className="mb-6 animate-pulse">
          <div className="bg-red-600 text-white px-4 py-3 rounded-t-lg flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <h2 className="font-bold">SYSTEM LOCKED</h2>
              <p className="text-sm text-red-100">Security Protocol Active</p>
            </div>
          </div>
          <div className="bg-red-500 text-white px-4 py-2 rounded-b-lg text-sm flex items-center justify-between">
            <span>Default credentials detected</span>
            <Server className="w-4 h-4" />
          </div>
        </div>

        <Card className="border-red-200 shadow-xl">
          <CardHeader className="text-center border-b border-red-100 bg-red-50">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-900">System Security Lock</CardTitle>
            <CardDescription className="text-red-700">
              The system is locked because default password is still active
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

            {/* Security Warning */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Security Notice:</p>
                  <p>The system is using default credentials. All administrative functions are locked until you change the default password.</p>
                </div>
              </div>
            </div>

            {/* Password Change Form */}
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Default Password
                </label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter default password"
                    className="pr-10 border-red-300 focus:border-red-500 focus:ring-red-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Default password is usually 'admin' or 'password'
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      validatePassword(e.target.value)
                    }}
                    placeholder="Enter new password"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1 h-1 mb-2">
                      <div className={`flex-1 rounded-full ${passwordStrength >= 25 ? 'bg-red-500' : 'bg-gray-200'}`} />
                      <div className={`flex-1 rounded-full ${passwordStrength >= 50 ? 'bg-orange-500' : 'bg-gray-200'}`} />
                      <div className={`flex-1 rounded-full ${passwordStrength >= 75 ? 'bg-yellow-500' : 'bg-gray-200'}`} />
                      <div className={`flex-1 rounded-full ${passwordStrength >= 100 ? 'bg-green-500' : 'bg-gray-200'}`} />
                    </div>
                    {passwordErrors.length > 0 && (
                      <ul className="text-xs text-red-600 space-y-1">
                        {passwordErrors.map((err, idx) => (
                          <li key={idx}>• {err}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className={`pr-10 ${
                      confirmPassword && newPassword !== confirmPassword 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                        : ''
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={checking || passwordErrors.length > 0 || !currentPassword || !newPassword || !confirmPassword}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 gap-2"
              >
                {checking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Change Default Password & Unlock System
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Emergency Access</span>
              </div>
            </div>

            {/* Master Unlock Option */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleMasterUnlock}
                disabled={checking}
                className="w-full border-red-300 text-red-700 hover:bg-red-50 gap-2"
              >
                <Shield className="w-4 h-4" />
                Use Master Unlock Key
              </Button>
              
              <p className="text-xs text-center text-gray-500">
                Master unlock key is only available for system administrators.
                This will reset all security protocols and allow system setup.
              </p>
            </div>

            {/* System Info */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  <span>System Lock v1.0</span>
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
          ⚠️ Unauthorized access attempts are logged and monitored
        </p>
      </div>
    </div>
  )
}