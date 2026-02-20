'use client'

import { Check, Star, Zap, Shield, Users, Video, MessageSquare, Bell } from 'lucide-react'

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  currency?: string
  billingPeriod?: 'month' | 'year'
  description?: string
  features: string[]
  popular?: boolean
  bestValue?: boolean
  buttonText?: string
  buttonVariant?: 'primary' | 'secondary' | 'outline'
}

interface SubscriptionPlanProps {
  plan: SubscriptionPlan
  selected: boolean
  onSelect: (planId: string) => void
  disabled?: boolean
  showAnnualToggle?: boolean
  annualDiscount?: number // e.g., 20 for 20% off
}

export default function SubscriptionPlanCard({
  plan,
  selected,
  onSelect,
  disabled = false,
  showAnnualToggle = false,
  annualDiscount = 20,
}: SubscriptionPlanProps) {
  const currency = plan.currency || '$'
  const billingPeriod = plan.billingPeriod || 'month'
  const isAnnual = billingPeriod === 'year'
  
  // Calculate annual savings
  const monthlyPrice = plan.price
  const annualPrice = isAnnual ? plan.price : plan.price * 12
  const annualSavings = isAnnual ? monthlyPrice * 12 - annualPrice : 0
  
  // Get plan icon based on name
  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'premium': return <Star className="text-yellow-500" />
      case 'pro': return <Zap className="text-blue-500" />
      case 'basic': return <Shield className="text-green-500" />
      default: return <Users className="text-gray-500" />
    }
  }

  // Get feature icon
  const getFeatureIcon = (feature: string) => {
    if (feature.includes('Live')) return <Video size={14} />
    if (feature.includes('Signal')) return <Bell size={14} />
    if (feature.includes('Chat')) return <MessageSquare size={14} />
    return <Check size={14} />
  }

  return (
    <div
      className={`
        relative flex flex-col p-6 border-2 rounded-xl transition-all duration-300
        ${selected ? 'border-blue-600 shadow-lg scale-[1.02]' : 'border-gray-200 hover:border-gray-300'}
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
        ${plan.popular ? 'bg-gradient-to-b from-white to-blue-50' : 'bg-white'}
      `}
      onClick={() => !disabled && onSelect(plan.id)}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold px-4 py-1 rounded-full shadow-md">
            Most Popular
          </div>
        </div>
      )}

      {/* Best Value Badge */}
      {plan.bestValue && (
        <div className="absolute -top-3 right-4">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Best Value
          </div>
        </div>
      )}

      {/* Selection Indicator */}
      <div className="absolute top-4 right-4">
        <div
          className={`
            w-6 h-6 rounded-full border-2 flex items-center justify-center
            ${selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}
          `}
        >
          {selected && <Check size={14} className="text-white" />}
        </div>
      </div>

      {/* Plan Header */}
      <div className="flex items-center mb-4">
        <div className="mr-3">
          {getPlanIcon(plan.name)}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
          {plan.description && (
            <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-4xl font-bold text-gray-900">
            {currency}{plan.price.toFixed(2)}
          </span>
          <span className="text-gray-500 ml-2">
            /{billingPeriod === 'year' ? 'year' : 'month'}
          </span>
        </div>
        
        {/* Annual Savings */}
        {isAnnual && annualSavings > 0 && (
          <div className="mt-2">
            <p className="text-sm text-green-600 font-medium">
              Save {currency}{annualSavings.toFixed(2)} vs monthly billing
            </p>
            {showAnnualToggle && (
              <p className="text-xs text-gray-500 mt-1">
                ≈ {currency}{(plan.price / 12).toFixed(2)}/month
              </p>
            )}
          </div>
        )}
        
        {/* Annual Toggle Display */}
        {showAnnualToggle && !isAnnual && (
          <p className="text-sm text-gray-600 mt-2">
            <span className="line-through">{currency}{(monthlyPrice * 12).toFixed(2)}</span>
            <span className="ml-2 font-semibold">
              {currency}{((monthlyPrice * 12) * (1 - annualDiscount / 100)).toFixed(2)}/year
            </span>
            <span className="ml-2 text-green-600 font-medium">
              Save {annualDiscount}%
            </span>
          </p>
        )}
      </div>

      {/* Features List */}
      <div className="mb-8 flex-grow">
        <h4 className="font-semibold text-gray-900 mb-3">What's included:</h4>
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <div className="mr-3 mt-0.5 text-green-500">
                {getFeatureIcon(feature)}
              </div>
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Button */}
      <button
        className={`
          w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200
          ${selected 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : plan.popular 
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={(e) => {
          e.stopPropagation()
          !disabled && onSelect(plan.id)
        }}
        disabled={disabled}
      >
        {selected ? (
          <div className="flex items-center justify-center">
            <Check size={18} className="mr-2" />
            {plan.buttonText || 'Selected'}
          </div>
        ) : (
          plan.buttonText || `Choose ${plan.name}`
        )}
      </button>

      {/* User Count / Popularity */}
      {plan.popular && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            🎯 Preferred by 65% of traders
          </p>
        </div>
      )}
    </div>
  )
}