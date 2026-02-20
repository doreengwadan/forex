'use client'

import { useState } from 'react'
import SubscriptionPlanList from './SubscriptionPlanList'
import { ArrowRight, Lock } from 'lucide-react'

interface SubscriptionSelectorProps {
  onPlanSelected?: (planId: string, isAnnual: boolean) => void
  onProceedToPayment?: (planId: string, isAnnual: boolean) => void
  initialPlan?: string
  disabledPlans?: string[]
}

export default function SubscriptionSelector({
  onPlanSelected,
  onProceedToPayment,
  initialPlan = '',
  disabledPlans = [],
}: SubscriptionSelectorProps) {
  const [selectedPlan, setSelectedPlan] = useState(initialPlan)
  const [isAnnual, setIsAnnual] = useState(false)

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
    onPlanSelected?.(planId, isAnnual)
  }

  const handleProceed = () => {
    if (selectedPlan && onProceedToPayment) {
      onProceedToPayment(selectedPlan, isAnnual)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Trading Plan
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Start your trading journey with the right level of mentorship. 
          All plans include risk-free 14-day trial.
        </p>
      </div>

      {/* Plans */}
      <SubscriptionPlanList
        onPlanSelect={handlePlanSelect}
        defaultSelected={selectedPlan}
        disabledPlans={disabledPlans}
        showAnnualToggle={true}
        isAnnual={isAnnual}
        onBillingToggle={setIsAnnual}
      />

      {/* Action Section */}
      {selectedPlan && (
        <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Ready to level up your trading?
              </h3>
              <p className="text-gray-600">
                Selected: <span className="font-semibold">{selectedPlan.toUpperCase()}</span> • 
                Billing: <span className="font-semibold">{isAnnual ? 'Annual (Save 20%)' : 'Monthly'}</span>
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleProceed}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center hover:opacity-90 transition-all"
              >
                Continue to Payment
                <ArrowRight className="ml-2" size={20} />
              </button>
              
              <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-all">
                Start 14-Day Free Trial
              </button>
            </div>
          </div>
          
          {/* Security Assurance */}
          <div className="mt-6 pt-6 border-t border-blue-100">
            <div className="flex items-center justify-center text-gray-600">
              <Lock size={16} className="mr-2" />
              <span className="text-sm">
                Secure payment • Cancel anytime • 14-day money-back guarantee
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="mt-16">
        <h3 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h3>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[
            {
              q: 'Can I switch plans later?',
              a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.'
            },
            {
              q: 'Is there a long-term commitment?',
              a: 'No, all plans are month-to-month. You can cancel anytime without penalties.'
            },
            {
              q: 'How do the trading signals work?',
              a: 'Signals are sent via SMS and in-app notifications in real-time, including entry, stop loss, and take profit levels.'
            },
            {
              q: 'What payment methods do you accept?',
              a: 'We accept bank transfers, Airtel Money, and Mpamba for local payments.'
            }
          ].map((faq, index) => (
            <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">{faq.q}</h4>
              <p className="text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}