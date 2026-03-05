'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import { 
  Mail, 
  Lock, 
  ArrowLeft, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Key,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

type Step = 'email' | 'otp' | 'reset'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [errors, setErrors] = useState<{
    email?: string;
    otp?: string;
    password?: string;
    confirmPassword?: string;
  }>({})

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  // Start resend timer
  const startResendTimer = () => {
    setResendTimer(60)
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Handle email submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!email) {
      setErrors({ email: 'Email is required' })
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Please enter a valid email address' })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Verification code sent to your email!')
        setCurrentStep('otp')
        startResendTimer()
      } else {
        toast.error(data.message || 'Failed to send verification code')
        setErrors({ email: data.message || 'Failed to send verification code' })
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle OTP verification
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const otpString = otp.join('')
    if (otpString.length !== 6) {
      setErrors({ otp: 'Please enter the complete 6-digit code' })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, otp: otpString }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('OTP verified successfully!')
        setCurrentStep('reset')
      } else {
        toast.error(data.message || 'Invalid verification code')
        setErrors({ otp: data.message || 'Invalid verification code' })
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle password reset
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validation
    const newErrors: typeof errors = {}
    
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          otp: otp.join(''), 
          password,
          password_confirmation: confirmPassword 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Password reset successfully! Please login with your new password.')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        toast.error(data.message || 'Failed to reset password')
        setErrors({ password: data.message || 'Failed to reset password' })
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedValue = value.slice(0, 6)
      const newOtp = [...otp]
      for (let i = 0; i < pastedValue.length; i++) {
        if (i < 6) {
          newOtp[i] = pastedValue[i]
        }
      }
      setOtp(newOtp)
      
      // Focus last filled input or next empty
      const lastFilledIndex = Math.min(pastedValue.length - 1, 5)
      const nextInput = document.getElementById(`otp-${lastFilledIndex + 1}`)
      if (nextInput) {
        nextInput.focus()
      }
    } else {
      // Handle single character
      if (/^\d*$/.test(value)) {
        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)
        
        // Auto-focus next input
        if (value && index < 5) {
          const nextInput = document.getElementById(`otp-${index + 2}`)
          if (nextInput) {
            nextInput.focus()
          }
        }
      }
    }
  }

  // Handle OTP key down for backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index}`)
      if (prevInput) {
        prevInput.focus()
      }
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return

    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('New verification code sent!')
        startResendTimer()
      } else {
        toast.error(data.message || 'Failed to resend code')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Render email step
  const renderEmailStep = () => (
    <form onSubmit={handleEmailSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email Address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`pl-10 border-2 ${
              errors.email 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500'
            } transition-all`}
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
            <AlertCircle className="w-4 h-4" />
            {errors.email}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 h-11"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          'Send Reset Code'
        )}
      </Button>
    </form>
  )

  // Render OTP step
  const renderOtpStep = () => (
    <form onSubmit={handleOtpSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-gray-600">
          We've sent a 6-digit verification code to
        </p>
        <p className="font-semibold text-gray-900 mt-1">{email}</p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700 block text-center">
          Enter Verification Code
        </Label>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <Input
              key={index}
              id={`otp-${index}`}
              type="text"
              maxLength={1}
              value={otp[index - 1]}
              onChange={(e) => handleOtpChange(index - 1, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index - 1, e)}
              className={`w-12 h-12 text-center text-xl font-bold border-2 ${
                errors.otp 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500'
              } transition-all`}
              disabled={isLoading}
            />
          ))}
        </div>
        {errors.otp && (
          <p className="text-sm text-red-600 flex items-center justify-center gap-1 mt-2">
            <AlertCircle className="w-4 h-4" />
            {errors.otp}
          </p>
        )}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Didn't receive the code?{' '}
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendTimer > 0 || isLoading}
            className={`font-medium ${
              resendTimer > 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-indigo-600 hover:text-indigo-800 hover:underline'
            } transition-colors`}
          >
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
          </button>
        </p>
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 h-11"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Verifying...
          </>
        ) : (
          'Verify Code'
        )}
      </Button>
    </form>
  )

  // Render reset password step
  const renderResetStep = () => (
    <form onSubmit={handleResetSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
          New Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`pl-10 pr-10 border-2 ${
              errors.password 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500'
            } transition-all`}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
            <AlertCircle className="w-4 h-4" />
            {errors.password}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
          Confirm Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`pl-10 pr-10 border-2 ${
              errors.confirmPassword 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500'
            } transition-all`}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
            <AlertCircle className="w-4 h-4" />
            {errors.confirmPassword}
          </p>
        )}
      </div>

      {/* Password Requirements */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
        <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
        <ul className="space-y-1 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <CheckCircle className={`w-4 h-4 ${password.length >= 8 ? 'text-green-500' : 'text-gray-300'}`} />
            At least 8 characters
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className={`w-4 h-4 ${/[A-Z]/.test(password) ? 'text-green-500' : 'text-gray-300'}`} />
            At least one uppercase letter
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className={`w-4 h-4 ${/[a-z]/.test(password) ? 'text-green-500' : 'text-gray-300'}`} />
            At least one lowercase letter
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className={`w-4 h-4 ${/[0-9]/.test(password) ? 'text-green-500' : 'text-gray-300'}`} />
            At least one number
          </li>
        </ul>
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 h-11"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Resetting Password...
          </>
        ) : (
          'Reset Password'
        )}
      </Button>
    </form>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg mb-4">
            <Key className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Reset Password
          </h2>
          <p className="text-gray-600 mt-2">
            {currentStep === 'email' && 'Enter your email to reset your password'}
            {currentStep === 'otp' && 'Enter the verification code sent to your email'}
            {currentStep === 'reset' && 'Create a new password for your account'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['email', 'otp', 'reset'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                      currentStep === step
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                        : index < ['email', 'otp', 'reset'].indexOf(currentStep)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index < ['email', 'otp', 'reset'].indexOf(currentStep) ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="text-xs mt-2 text-gray-600">
                    {step === 'email' && 'Email'}
                    {step === 'otp' && 'Verify'}
                    {step === 'reset' && 'Reset'}
                  </span>
                </div>
                {index < 2 && (
                  <div
                    className={`w-16 h-0.5 mx-2 ${
                      index < ['email', 'otp', 'reset'].indexOf(currentStep)
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center text-gray-800">
              {currentStep === 'email' && 'Forgot Password?'}
              {currentStep === 'otp' && 'Verify Email'}
              {currentStep === 'reset' && 'Create New Password'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentStep === 'email' && renderEmailStep()}
            {currentStep === 'otp' && renderOtpStep()}
            {currentStep === 'reset' && renderResetStep()}
          </CardContent>
          <CardFooter className="flex justify-center border-t border-gray-200 pt-6">
            <Link
              href="/login"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </CardFooter>
        </Card>

        {/* Security Note */}
        <p className="text-center text-xs text-gray-500 mt-8">
          <Shield className="w-4 h-4 inline mr-1" />
          Your information is secure and encrypted
        </p>
      </div>
    </div>
  )
}