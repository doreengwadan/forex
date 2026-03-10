// app/dashboard/payments/page.tsx
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
  History,
  AlertCircle,
  Loader2,
  Calendar as CalendarIcon,
  CreditCard
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

  const { toast } = useToast()
  const router = useRouter()

  // Base URL for API
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  // Get token from localStorage
  const getToken = () => localStorage.getItem('auth_token')

  // Check if user is authenticated
  const isAuthenticated = () => !!getToken()

  // Get user data from localStorage
  const getUserData = () => {
    try {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    } catch (e) {
      console.error('Error parsing user data:', e)
      return null
    }
  }

  // Check for payment status in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const tx_ref = params.get('tx_ref')

    if (success === 'true' && tx_ref) {
      toast({
        title: 'Payment Successful',
        description: 'Your subscription has been activated.',
      })
      fetchData()
      window.history.replaceState({}, '', '/dashboard/payments')
    }
  }, [])

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
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (subscriptionRes.ok) {
          const data = await subscriptionRes.json()
          setSubscription(data.subscription || data.data)
        }
      } catch (error) {
        console.error('Error fetching subscription:', error)
      }

      // Fetch plans
      try {
        const plansRes = await fetch(`${API_BASE_URL}/subscription/plans`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (plansRes.ok) {
          const plansData = await plansRes.json()
          if (plansData.success) {
            const normalizedPlans = (plansData.plans || plansData.data || []).map((plan: any, index: number) => ({
              id: plan.id || plan.plan_id || -(index + 1),
              name: plan.name,
              price: plan.price,
              period: plan.period,
              features: plan.features || [],
              is_current: plan.is_current || false,
              popular: plan.popular || false,
              amount: plan.amount,
              currency: plan.currency || 'MWK'
            }))
            setPlans(normalizedPlans)
          }
        }
      } catch (error) {
        console.error('Error fetching plans:', error)
      }

      // Fetch transactions
      try {
        const transactionsRes = await fetch(`${API_BASE_URL}/payments/transactions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (transactionsRes.ok) {
          const data = await transactionsRes.json()
          setTransactions(data.transactions || data.data || [])
        }
      } catch (error) {
        console.error('Error fetching transactions:', error)
      }

    } catch (error) {
      console.error('Error in fetchData:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return

    setIsProcessing(true)
    try {
      const token = getToken()
      const response = await fetch(`${API_BASE_URL}/subscription/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Subscription cancelled successfully',
        })
        await fetchData()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const makePayment = async (plan: Plan) => {
    setIsProcessing(true)

    try {
      const user = getUserData()
      if (!user?.email) {
        toast({
          title: 'Missing Information',
          description: 'Please ensure your email is set in your profile.',
          variant: 'destructive',
        })
        return
      }

      // Parse amount (in MWK)
      let amountInMWK = plan.amount
      if (!amountInMWK) {
        const priceString = plan.price.replace(/[^0-9.-]+/g, '')
        amountInMWK = parseFloat(priceString)
      }

      // PayChangu expects amount in tambala (smallest unit)
      const amountInTambala = Math.round(amountInMWK * 100)

      // Generate transaction reference
      const tx_ref = `TX_${Date.now()}_${Math.random().toString(36).substring(7)}`

      // Call our API route to initiate payment
      const response = await fetch('/api/paychangu/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref: tx_ref,
          amount: amountInTambala,
          currency: 'MWK',
          return_url: `${window.location.origin}/dashboard/payments?success=true&tx_ref=${tx_ref}`,
          customer: {
            email: user.email,
            first_name: user.first_name || 'Customer',
            last_name: user.last_name || '',
          },
          customization: {
            title: `${plan.name} Subscription`,
            description: `Payment for ${plan.name} plan - ${plan.price}/${plan.period}`,
          },
          meta: {
            plan_id: plan.id.toString(),
            user_id: user.id?.toString() || '',
          }
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate payment')
      }

      // Check if the response contains a checkout URL
      const checkoutUrl = data?.data?.checkout_url || data?.checkout_url
      
      if (checkoutUrl) {
        // Redirect to PayChangu checkout page
        window.location.href = checkoutUrl
      } else {
        toast({
          title: 'Payment Initiated',
          description: 'Please complete the payment in the popup window.',
        })
      }

    } catch (error: any) {
      console.error('Payment error:', error)
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to initiate payment',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCurrency = (price: number, currency: string = 'MWK') => {
    return new Intl.NumberFormat('en-MW', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Subscription</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your subscription and make payments</p>
      </div>

      {/* Current Plan */}
      {subscription?.is_active ? (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <Crown className="w-16 h-16 text-blue-600" />
                <div>
                  <h2 className="text-2xl font-bold">{subscription.plan} Plan</h2>
                  <Badge className="bg-green-500">Active</Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {formatCurrency(subscription.price)}
                  <span className="text-lg text-gray-600">/{subscription.billing_cycle}</span>
                </div>
                <Button 
                  variant="outline" 
                  className="mt-2 text-red-600"
                  onClick={handleCancelSubscription}
                  disabled={isProcessing}
                >
                  Cancel Subscription
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-8">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-16 h-16 text-amber-600" />
              <div>
                <h2 className="text-2xl font-bold">No Active Subscription</h2>
                <p className="text-gray-600">Choose a plan below to subscribe</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      <div>
        <h2 className="text-xl font-bold mb-6">Choose Your Plan</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={plan.popular ? 'ring-2 ring-blue-500' : ''}>
              <CardContent className="p-6">
                {plan.popular && (
                  <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 w-full">
                    <Zap className="w-3 h-3 mr-1" /> Most Popular
                  </Badge>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold">
                    {plan.price}
                    <span className="text-lg text-gray-600 ml-2">/{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {plan.is_current ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    className="w-full gap-2 bg-blue-600"
                    onClick={() => makePayment(plan)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Pay Now
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Description</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{t.date}</td>
                      <td className="py-3 px-4">{t.description}</td>
                      <td className="py-3 px-4 font-medium">{t.amount}</td>
                      <td className="py-3 px-4">
                        <Badge className={
                          t.status === 'completed' ? 'bg-green-100 text-green-800' :
                          t.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {t.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}