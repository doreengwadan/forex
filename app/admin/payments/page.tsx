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
  Users,
  History,
  AlertCircle,
  Loader2,
  Calendar as CalendarIcon
} from 'lucide-react'
import { useToast } from '../../hooks/use-toast'
import { useRouter } from 'next/navigation'

interface Transaction {
  id: number
  user_id: number
  user_name: string
  user_email: string
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

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { toast } = useToast()
  const router = useRouter()

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  const getToken = () => localStorage.getItem('auth_token')
  const isAuthenticated = () => !!getToken()

  // Fetch transactions – structured like the user page's fetchData
  const fetchTransactions = async () => {
    if (!isAuthenticated()) {
      toast({
        title: 'Authentication Required',
        description: 'Please login as admin',
        variant: 'destructive',
      })
      router.push('/login')
      return
    }

    setIsLoading(true)
    setError(null)

    const token = getToken()
    try {
      const res = await fetch(`${API_BASE_URL}/payments/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions || [])
      } else if (res.status === 404) {
        // Endpoint not implemented – show empty state
        setTransactions([])
      } else {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Failed to fetch transactions')
      }
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions')
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to fetch transactions',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on mount (same pattern as user page)
  useEffect(() => {
    fetchTransactions()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Optional export function (kept from user page)
  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast({
        title: 'No Data',
        description: 'No transactions to export',
        variant: 'destructive',
      })
      return
    }

    try {
      const headers = ['Date', 'User', 'Email', 'Description', 'Amount', 'Status', 'Type', 'Transaction ID', 'Payment Method']
      const csvRows = [
        headers.join(','),
        ...transactions.map(t => [
          t.date,
          `"${t.user_name}"`,
          `"${t.user_email}"`,
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
      a.download = `admin-transactions-${new Date().toISOString().split('T')[0]}.csv`
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
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading transactions...</p>
        </div>
      </div>
    )
  }

  // Error state (only show full error if no transactions)
  if (error && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => fetchTransactions()} className="bg-gradient-to-r from-blue-600 to-purple-600">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payment Transactions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            View all payment transactions across the platform
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={exportToCSV}>
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Transactions Table */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
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
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">User</th>
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
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900 dark:text-white">{transaction.user_name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">{transaction.user_email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {transaction.type === 'subscription' && <History className="w-4 h-4 text-blue-500" />}
                          {transaction.type === 'one_time' && <Users className="w-4 h-4 text-purple-500" />}
                          {transaction.type === 'refund' && <History className="w-4 h-4 text-green-500" />}
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
                        {transaction.receipt_url ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-1"
                            onClick={() => window.open(transaction.receipt_url, '_blank')}
                          >
                            <Receipt className="w-4 h-4" />
                            View
                          </Button>
                        ) : (
                          <span className="text-gray-400 text-sm">N/A</span>
                        )}
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