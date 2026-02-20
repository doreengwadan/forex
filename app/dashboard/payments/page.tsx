'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { 
  Check, 
  X, 
  Clock, 
  Download, 
  Receipt,
  Zap,
  Crown,
  TrendingUp,
  Users,
  ArrowRight,
  History,
  AlertCircle,
  Loader2,
  Calendar as CalendarIcon,
  Upload,
  FileText
} from 'lucide-react'
import { useToast } from '../../hooks/use-toast'
import { useRouter } from 'next/navigation'

interface Plan {
  id: number
  name: string
  price: string
  period: string
  features: string[]
  is_current: boolean
  popular: boolean
  amount?: number
  currency?: string
}

interface Transaction {
  id: number
  transaction_id: string
  date: string
  description: string
  amount: string
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'disputed'
  type: 'subscription' | 'one_time' | 'refund' | 'credit'
  invoice_id?: string
  payment_method: string
  receipt_url: string
}

interface Subscription {
  plan: string
  price: number
  currency: string
  status: string
  current_period_start?: string
  current_period_end?: string
  billing_cycle: string
  features: string[]
  is_active: boolean
}

export default function PaymentsPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  // Manual upload states
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedPlanForUpload, setSelectedPlanForUpload] = useState<Plan | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { toast } = useToast()
  const router = useRouter()

  // Base URL for API
  const API_BASE_URL = 'http://localhost:8000/api'

  // Get token from localStorage
  const getToken = () => {
    return localStorage.getItem('auth_token')
  }

  // Check if user is authenticated
  const isAuthenticated = () => {
    const token = getToken()
    return !!token
  }

  // Get user data from localStorage
  const getUserData = () => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        return JSON.parse(userStr)
      }
    } catch (e) {
      console.error('Error parsing user data:', e)
    }
    return null
  }

  // Fetch all data
  const fetchData = async () => {
    try {
      if (!isAuthenticated()) {
        toast({
          title: 'Authentication Required',
          description: 'Please login to access billing information',
          variant: 'destructive',
        })
        router.push('/login')
        return
      }

      const token = getToken()

      // Fetch subscription
      try {
        const subscriptionRes = await fetch(`${API_BASE_URL}/subscription`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (subscriptionRes.ok) {
          const subscriptionData = await subscriptionRes.json()
          if (subscriptionData.success) {
            setSubscription(subscriptionData.subscription || subscriptionData.data)
          }
        } else if (subscriptionRes.status === 404) {
          setSubscription(null)
        }
      } catch (error) {
        console.error('Error fetching subscription:', error)
      }

      // Fetch plans
      try {
        const plansRes = await fetch(`${API_BASE_URL}/subscription/plans`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        console.log('Plans API response status:', plansRes.status)
        
        if (plansRes.ok) {
          const plansData = await plansRes.json()
          console.log('Raw plans data:', plansData)

          if (plansData.success) {
            const rawPlans = plansData.plans || plansData.data || []
            
            // Normalize plans: look for any possible ID field
            const normalizedPlans = rawPlans.map((plan: any, index: number) => {
              // Try to extract ID from various possible field names
              let id = plan.id ?? plan.plan_id ?? plan.ID ?? plan._id ?? null
              
              // If no ID found, log a warning and assign a temporary negative ID for rendering
              if (id === null) {
                console.warn('Plan missing ID, using index as fallback for rendering', plan)
                id = -(index + 1) // temporary negative ID
              } else {
                // Convert to number if it's a string
                id = Number(id)
              }

              return {
                id,
                name: plan.name,
                price: plan.price,
                period: plan.period,
                features: plan.features || [],
                is_current: plan.is_current || false,
                popular: plan.popular || false,
                amount: plan.amount,
                currency: plan.currency || 'USD'
              }
            })

            console.log('Normalized plans:', normalizedPlans)
            setPlans(normalizedPlans)
          }
        } else {
          console.error('Plans fetch not OK:', plansRes.status)
        }
      } catch (error) {
        console.error('Error fetching plans:', error)
      }

      // Fetch transactions
      try {
        const transactionsRes = await fetch(`${API_BASE_URL}/payments/transactions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (transactionsRes.ok) {
          const transactionsData = await transactionsRes.json()
          if (transactionsData.success) {
            setTransactions(transactionsData.transactions || transactionsData.data || [])
          }
        }
      } catch (error) {
        console.error('Error fetching transactions:', error)
      }

    } catch (error) {
      console.error('Error in fetchData:', error)
      toast({
        title: 'Error',
        description: 'Failed to load payment data. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return
    }

    setIsProcessing(true)
    try {
      const token = getToken()
      if (!token) {
        toast({
          title: 'Error',
          description: 'Authentication required',
          variant: 'destructive',
        })
        return
      }

      const response = await fetch(`${API_BASE_URL}/subscription/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast({
            title: 'Success',
            description: 'Subscription cancelled successfully',
          })
          await fetchData()
        } else {
          throw new Error(data.message || data.error || 'Failed to cancel subscription')
        }
      } else {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
    } catch (error) {
      console.error('Cancel subscription error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel subscription',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Manual upload functions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0])
      setUploadError(null)
    }
  }

  const handleUploadProof = async () => {
    // Guard: ensure a plan is selected
    if (!selectedPlanForUpload) {
      setUploadError('No plan selected. Please close and try again.')
      return
    }

    // Check if the plan has a valid positive ID (not temporary negative)
    if (!selectedPlanForUpload.id || selectedPlanForUpload.id < 0) {
      setUploadError('Invalid plan data: missing valid ID. Please contact support.')
      return
    }

    if (!uploadFile) {
      setUploadError('Please select a file to upload')
      return
    }

    setUploadProgress(true)
    setUploadError(null)

    try {
      const token = getToken()
      if (!token) {
        toast({
          title: 'Error',
          description: 'Authentication required',
          variant: 'destructive',
        })
        return
      }

      const formData = new FormData()
      formData.append('proof', uploadFile)
      formData.append('plan_id', selectedPlanForUpload.id.toString())
      formData.append('plan_name', selectedPlanForUpload.name)
      formData.append('amount', (selectedPlanForUpload.amount || parseFloat(selectedPlanForUpload.price.replace(/[^\d.-]/g, ''))).toString())
      formData.append('currency', selectedPlanForUpload.currency || 'USD')

      const response = await fetch(`${API_BASE_URL}/payments/upload-proof`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Proof of payment uploaded successfully. Awaiting verification.',
        })
        setShowUploadModal(false)
        setUploadFile(null)
        setSelectedPlanForUpload(null)
        await fetchData() // Refresh to show pending transaction
      } else {
        throw new Error(data.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload proof error:', error)
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload proof',
        variant: 'destructive',
      })
    } finally {
      setUploadProgress(false)
    }
  }

  const formatCurrency = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading payment data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Subscription</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your subscription and upload proof of payment</p>
      </div>

      {/* Current Plan */}
      {subscription && subscription.is_active ? (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center gap-4 mb-6 md:mb-0">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{subscription.plan} Plan</h2>
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-600">Active</Badge>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {subscription.current_period_end ? (
                      <>Next billing date: <span className="font-medium">{subscription.current_period_end}</span></>
                    ) : (
                      <>Active until cancelled</>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {formatCurrency(subscription.price, subscription.currency)}
                  <span className="text-lg text-gray-600 dark:text-gray-400">/{subscription.billing_cycle === 'yearly' ? 'year' : 'month'}</span>
                </div>
                <Button 
                  variant="outline" 
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleCancelSubscription}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      Cancel Subscription
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Active Subscription</h2>
                  <p className="text-gray-600 dark:text-gray-400">Subscribe to a plan by uploading proof of payment</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Choose Your Plan</h2>
          <Badge variant="outline" className="text-sm">
            💰 Save 20% with annual billing
          </Badge>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.length > 0 ? (
            plans.map((plan) => (
              <Card key={plan.id} className={`border-gray-300 dark:border-gray-700 ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                <CardContent className="p-6">
                  {plan.popular && (
                    <div className="mb-4">
                      <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 w-full justify-center">
                        <Zap className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                    <div className="flex items-center justify-center">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                      <span className="text-gray-600 dark:text-gray-400 ml-2">/{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features && plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.is_current ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button 
                      variant="default"
                      className="w-full gap-2"
                      onClick={() => {
                        setSelectedPlanForUpload(plan)
                        setShowUploadModal(true)
                      }}
                      disabled={isProcessing}
                    >
                      <Upload className="w-4 h-4" />
                      Select Plan & Upload Proof
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No plans available at the moment</p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transaction History</span>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => {
                if (transactions.length === 0) {
                  toast({
                    title: 'No Data',
                    description: 'No transactions to export',
                    variant: 'destructive',
                  })
                  return
                }
                try {
                  const headers = ['Date', 'Description', 'Amount', 'Status', 'Type', 'Transaction ID', 'Payment Method']
                  const csvRows = [
                    headers.join(','),
                    ...transactions.map(t => [
                      t.date,
                      `"${t.description}"`,
                      t.amount,
                      t.status,
                      t.type,
                      t.transaction_id,
                      t.payment_method
                    ].join(','))
                  ]
                  const csvString = csvRows.join('\n')
                  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  window.URL.revokeObjectURL(url)
                  toast({
                    title: 'Export Complete',
                    description: 'Transactions exported successfully',
                  })
                } catch (error) {
                  console.error('Export error:', error)
                  toast({
                    title: 'Export Failed',
                    description: 'Failed to export transactions',
                    variant: 'destructive',
                  })
                }
              }}
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 dark:text-gray-400">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">{transaction.date}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {transaction.type === 'subscription' && <History className="w-4 h-4 text-blue-500" />}
                          {transaction.type === 'one_time' && <Users className="w-4 h-4 text-purple-500" />}
                          {transaction.type === 'refund' && <TrendingUp className="w-4 h-4 text-green-500" />}
                          <span className="text-gray-700 dark:text-gray-300">{transaction.description}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {transaction.transaction_id} • {transaction.payment_method}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{transaction.amount}</td>
                      <td className="py-3 px-4">
                        <Badge className={
                          transaction.status === 'completed' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : transaction.status === 'refunded'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }>
                          {transaction.status === 'completed' ? (
                            <Check className="w-3 h-3 mr-1" />
                          ) : transaction.status === 'pending' ? (
                            <Clock className="w-3 h-3 mr-1" />
                          ) : (
                            <X className="w-3 h-3 mr-1" />
                          )}
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-1"
                          onClick={() => window.open(transaction.receipt_url, '_blank')}
                        >
                          <Receipt className="w-4 h-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Proof Modal */}
      {showUploadModal && selectedPlanForUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Upload Proof of Payment</h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              You are about to upload proof for the <span className="font-semibold">{selectedPlanForUpload.name}</span> plan 
              ({selectedPlanForUpload.price}/{selectedPlanForUpload.period}). Please upload a screenshot or document showing the payment details.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select File (image, PDF)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                />
                {uploadError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {uploadError}
                  </p>
                )}
              </div>

              {uploadFile && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{uploadFile.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(uploadFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowUploadModal(false)
                  setUploadFile(null)
                  setSelectedPlanForUpload(null)
                  setUploadError(null)
                }}
                disabled={uploadProgress}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUploadProof}
                disabled={uploadProgress || !uploadFile}
                className="gap-2"
              >
                {uploadProgress ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}