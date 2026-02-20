'use client'

import { useState } from 'react'
import { Check, X, HelpCircle } from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    name: 'Free',
    description: 'Start your trading journey',
    price: 0,
    period: 'month',
    features: [
      { text: 'Access to public forums', included: true },
      { text: '1 live class per month', included: true },
      { text: 'Basic learning materials', included: true },
      { text: 'Community chat access', included: true },
      { text: 'Trading signals', included: false },
      { text: 'Private mentor chats', included: false },
      { text: '1-on-1 mentorship', included: false },
      { text: 'Advanced analytics', included: false },
    ],
    buttonText: 'Get Started Free',
    buttonVariant: 'outline',
    popular: false
  },
  {
    name: 'Basic',
    description: 'For serious beginners',
    price: 29.99,
    period: 'month',
    features: [
      { text: 'All Free features', included: true },
      { text: 'Unlimited live classes', included: true },
      { text: 'Mentor forum access', included: true },
      { text: 'Weekly trading signals', included: true },
      { text: 'Basic progress analytics', included: true },
      { text: 'Email support', included: true },
      { text: 'Private mentor chats', included: false },
      { text: '1-on-1 mentorship', included: false },
    ],
    buttonText: 'Choose Basic',
    buttonVariant: 'primary',
    popular: false
  },
  {
    name: 'Pro',
    description: 'Most popular for active traders',
    price: 99.99,
    period: 'month',
    features: [
      { text: 'All Basic features', included: true },
      { text: 'Real-time trading signals', included: true },
      { text: 'Private mentor chats', included: true },
      { text: 'Priority email support', included: true },
      { text: 'Advanced analytics dashboard', included: true },
      { text: 'Trading journal', included: true },
      { text: 'Signal automation tools', included: true },
      { text: '1-on-1 mentorship', included: false },
    ],
    buttonText: 'Choose Pro',
    buttonVariant: 'primary',
    popular: true,
    bestValue: true
  },
  {
    name: 'Premium',
    description: 'Complete mentorship experience',
    price: 199.99,
    period: 'month',
    features: [
      { text: 'All Pro features', included: true },
      { text: 'Weekly 1-on-1 mentoring', included: true },
      { text: 'Custom trading plan', included: true },
      { text: 'Portfolio review sessions', included: true },
      { text: 'VIP community access', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'Advanced risk management', included: true },
      { text: 'Exclusive masterclasses', included: true },
    ],
    buttonText: 'Choose Premium',
    buttonVariant: 'primary',
    popular: false
  }
]

const paymentMethods = [
  { name: 'Bank Transfer', icon: '🏦' },
  { name: 'Airtel Money', icon: '📱' },
  { name: 'Mpamba', icon: '💸' },
]

const faqs = [
  {
    question: 'Can I switch plans later?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and are prorated.'
  },
  {
    question: 'Is there a long-term commitment?',
    answer: 'No, all plans are month-to-month. You can cancel anytime without penalties or hidden fees.'
  },
  {
    question: 'How do the trading signals work?',
    answer: 'Signals are sent via SMS, push notifications, and in-app alerts. Each signal includes entry price, stop loss, take profit, and reasoning.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept local bank transfers, Airtel Money, and Mpamba. All payments are encrypted and secure.'
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! All paid plans come with a 14-day free trial. No credit card required for local payment methods.'
  },
  {
    question: 'How are mentors vetted?',
    answer: 'All mentors undergo rigorous screening, verification of trading history, and training before joining our platform.'
  }
]

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('Pro')
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  const annualDiscount = 20 // 20% discount for annual billing

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index)
  }

  const calculatePrice = (price: number) => {
    if (isAnnual) {
      return (price * 12 * (1 - annualDiscount / 100)).toFixed(2)
    }
    return price.toFixed(2)
  }

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent
            <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Pricing for Every Trader
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Choose the perfect plan for your trading journey. All plans include a 14-day free trial.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${!isAnnual ? 'bg-white shadow-md' : 'text-gray-600'}`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-full font-medium transition-all relative ${isAnnual ? 'bg-white shadow-md' : 'text-gray-600'}`}
            >
              Annual Billing
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-2 py-1 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {plans.map((plan) => {
            const price = calculatePrice(plan.price)
            const monthlyEquivalent = isAnnual 
              ? `≈ $${(parseFloat(price) / 12).toFixed(2)}/month` 
              : null

            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${plan.popular ? 'border-blue-500 shadow-lg' : 'border-gray-200'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                      Most Popular
                    </div>
                  </div>
                )}

                {plan.bestValue && (
                  <div className="absolute -top-3 right-4">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Best Value
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {/* Plan Header */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-gray-600 mt-1">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900">${price}</span>
                      <span className="text-gray-500 ml-2">/{isAnnual ? 'year' : 'month'}</span>
                    </div>
                    {monthlyEquivalent && (
                      <p className="text-sm text-gray-500 mt-1">{monthlyEquivalent}</p>
                    )}
                    {isAnnual && plan.price > 0 && (
                      <p className="text-sm text-green-600 font-medium mt-2">
                        Save ${(plan.price * 12 * (annualDiscount / 100)).toFixed(2)} annually
                      </p>
                    )}
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mr-3 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Select Button */}
                  <button
                    onClick={() => setSelectedPlan(plan.name)}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${selectedPlan === plan.name 
                      ? 'bg-blue-600 text-white' 
                      : plan.popular 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {selectedPlan === plan.name ? 'Selected' : plan.buttonText}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Payment Methods */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Supported Payment Methods
          </h3>
          <div className="flex justify-center space-x-8">
            {paymentMethods.map((method) => (
              <div
                key={method.name}
                className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <span className="text-3xl mb-2">{method.icon}</span>
                <span className="font-medium text-gray-700">{method.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Calculator - Linked to Infrastructure Document */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 mb-16">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Cost Breakdown for 1,000+ Users
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="text-sm text-gray-500 mb-2">Low Activity</div>
                <div className="text-3xl font-bold text-gray-900 mb-2">$718/mo</div>
                <p className="text-gray-600 text-sm">2 sessions per user monthly</p>
              </div>
              <div className="bg-white rounded-xl p-6 border-2 border-blue-200 shadow-sm">
                <div className="text-sm text-gray-500 mb-2">Medium Activity</div>
                <div className="text-3xl font-bold text-gray-900 mb-2">$2,875/mo</div>
                <p className="text-gray-600 text-sm">8 sessions per user monthly</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="text-sm text-gray-500 mb-2">High Activity</div>
                <div className="text-3xl font-bold text-gray-900 mb-2">$10,836/mo</div>
                <p className="text-gray-600 text-sm">30 sessions per user monthly</p>
              </div>
            </div>
            <p className="text-center text-gray-600 mt-6 text-sm">
              *Based on infrastructure costs for 1,003 users (3 mentors + 1,000 students)
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h3>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  <HelpCircle className={`w-5 h-5 text-gray-400 transition-transform ${activeFaq === index ? 'rotate-180' : ''}`} />
                </button>
                
                {activeFaq === index && (
                  <div className="px-6 py-4 border-t border-gray-100">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white max-w-4xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Transform Your Trading?
            </h3>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of successful traders and start your 14-day free trial today.
              No credit card required for local payments.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-all transform hover:-translate-y-1"
              >
                Start Free Trial
              </Link>
              
              <button className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/30 hover:bg-white/20 transition-all">
                Schedule a Call
              </button>
            </div>
            
            <p className="text-sm text-blue-200 mt-6">
              Need help choosing a plan? <button className="underline">Contact our team</button>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}