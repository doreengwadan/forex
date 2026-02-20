'use client'

import { useState } from 'react'
import SubscriptionPlanCard, { type SubscriptionPlan } from './SubscriptionPlan'
import { SubscriptionPlanSkeleton } from './SubscriptionPlanSkeleton'

const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Get started with basic features',
    features: [
      'Access to public forums',
      '1 live class per month',
      'Community chat access',
      'Basic learning materials'
    ],
    buttonText: 'Start Free',
    buttonVariant: 'outline'
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 29.99,
    description: 'For serious beginners',
    features: [
      'All Free features',
      'Unlimited live classes',
      'Mentor forum access',
      'Weekly trading signals',
      'Basic analytics'
    ],
    buttonText: 'Choose Basic'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99.99,
    description: 'Most popular for active traders',
    features: [
      'All Basic features',
      'Real-time trading signals',
      'Private mentor chats',
      'Priority support',
      'Advanced analytics',
      'Trading journal'
    ],
    popular: true,
    bestValue: true,
    buttonText: 'Choose Pro'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 199.99,
    description: 'Complete mentorship experience',
    features: [
      'All Pro features',
      '1-on-1 weekly mentoring',
      'Custom trading plan',
      'Signal automation',
      'Portfolio review',
      'VIP community access',
      'Dedicated account manager'
    ],
    buttonText: 'Choose Premium'
  }
]

interface SubscriptionPlanListProps {
  plans?: SubscriptionPlan[]
  onPlanSelect?: (planId: string) => void
  defaultSelected?: string
  disabledPlans?: string[]
  loading?: boolean
  showAnnualToggle?: boolean
  isAnnual?: boolean
  onBillingToggle?: (isAnnual: boolean) => void
}

export default function SubscriptionPlanList({
  plans = DEFAULT_PLANS,
  onPlanSelect,
  defaultSelected = '',
  disabledPlans = [],
  loading = false,
  showAnnualToggle = false,
  isAnnual = false,
  onBillingToggle,
}: SubscriptionPlanListProps) {
  const [selectedPlan, setSelectedPlan] = useState(defaultSelected)

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
    onPlanSelect?.(planId)
  }

  const handleBillingToggle = () => {
    onBillingToggle?.(!isAnnual)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <SubscriptionPlanSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Billing Toggle */}
      {showAnnualToggle && (
        <div className="flex items-center justify-center mb-2">
          <div className="bg-gray-100 rounded-full p-1 flex">
            <button
              className={`px-6 py-2 rounded-full transition-all ${!isAnnual ? 'bg-white shadow' : 'text-gray-600'}`}
              onClick={handleBillingToggle}
            >
              Monthly
            </button>
            <button
              className={`px-6 py-2 rounded-full transition-all ${isAnnual ? 'bg-white shadow' : 'text-gray-600'}`}
              onClick={handleBillingToggle}
            >
              Yearly
              <span className="ml-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const planWithBilling = {
            ...plan,
            price: isAnnual ? plan.price * 12 * 0.8 : plan.price, // Apply 20% discount for annual
            billingPeriod: isAnnual ? 'year' : 'month'
          }

          return (
            <SubscriptionPlanCard
              key={plan.id}
              plan={planWithBilling}
              selected={selectedPlan === plan.id}
              onSelect={handlePlanSelect}
              disabled={disabledPlans.includes(plan.id)}
              showAnnualToggle={showAnnualToggle}
              annualDiscount={20}
            />
          )
        })}
      </div>

      {/* Comparison Table (Optional) */}
      <div className="mt-12">
        <h3 className="text-2xl font-bold text-center mb-8">Plan Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-4">Features</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="text-center p-4">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                'Live Classes',
                'Trading Signals',
                'Private Mentorship',
                'Forum Access',
                'Analytics',
                'Priority Support'
              ].map((feature) => (
                <tr key={feature} className="border-b border-gray-100">
                  <td className="p-4 font-medium">{feature}</td>
                  {plans.map((plan) => (
                    <td key={`${plan.id}-${feature}`} className="text-center p-4">
                      {plan.features.some(f => f.includes(feature)) ? (
                        <Check className="text-green-500 mx-auto" size={20} />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}