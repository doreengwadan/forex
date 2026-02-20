'use client'

import { useState } from 'react'
import PaymentMethodCard from '../components/payments/PaymentMethodCard'
import SubscriptionPlan from '../components/payments/SubscriptionPlan'

const LOCAL_PAYMENT_METHODS = [
  { id: 'bank', name: 'Bank Transfer', icon: '🏦' },
  { id: 'airtel', name: 'Airtel Money', icon: '📱' },
  { id: 'mpamba', name: 'Mpamba', icon: '💸' },
]

const SUBSCRIPTION_PLANS = [
  { id: 'basic', name: 'Basic', price: 29.99, features: ['Live Classes', 'Forum Access'] },
  { id: 'pro', name: 'Pro', price: 99.99, features: ['All Basic +', 'Trading Signals', 'Private Chats'] },
  { id: 'premium', name: 'Premium', price: 199.99, features: ['All Pro +', '1-on-1 Mentoring'] },
]

export default function PaymentsPage() {
  const [selectedMethod, setSelectedMethod] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('')

  const initiatePayment = async () => {
    const response = await fetch('/api/payments/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: selectedPlan,
        method: selectedMethod,
        amount: SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.price
      })
    })
    
    const { paymentUrl } = await response.json()
    // Redirect to payment gateway
    window.location.href = paymentUrl
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Subscription & Payments</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Choose Your Plan</h2>
          <div className="space-y-4">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <SubscriptionPlan
                key={plan.id}
                plan={plan}
                selected={selectedPlan === plan.id}
                onSelect={() => setSelectedPlan(plan.id)}
              />
            ))}
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
          <div className="space-y-3">
            {LOCAL_PAYMENT_METHODS.map((method) => (
              <PaymentMethodCard
                key={method.id}
                method={method}
                selected={selectedMethod === method.id}
                onSelect={() => setSelectedMethod(method.id)}
              />
            ))}
          </div>
          
          <button
            onClick={initiatePayment}
            disabled={!selectedPlan || !selectedMethod}
            className="mt-8 w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  )
}