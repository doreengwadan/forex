'use client'

import { Check } from 'lucide-react'

interface PaymentMethod {
  id: string
  name: string
  icon: string
  description?: string
  processingTime?: string
  fees?: string
  isRecommended?: boolean
}

interface PaymentMethodCardProps {
  method: PaymentMethod
  selected: boolean
  onSelect: (methodId: string) => void
  disabled?: boolean
}

export default function PaymentMethodCard({
  method,
  selected,
  onSelect,
  disabled = false,
}: PaymentMethodCardProps) {
  return (
    <div
      className={`
        relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
        ${selected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
      `}
      onClick={() => !disabled && onSelect(method.id)}
    >
      {/* Recommended Badge */}
      {method.isRecommended && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
          Recommended
        </div>
      )}

      {/* Selection Checkbox */}
      <div className="absolute top-4 right-4">
        <div
          className={`
            w-5 h-5 rounded-full border-2 flex items-center justify-center
            ${selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}
          `}
        >
          {selected && <Check size={12} className="text-white" />}
        </div>
      </div>

      {/* Method Content */}
      <div className="flex items-start space-x-4">
        {/* Icon */}
        <div className="text-3xl">{method.icon}</div>

        {/* Details */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{method.name}</h3>
            {method.fees && (
              <span className="text-sm text-gray-500">{method.fees}</span>
            )}
          </div>

          {method.description && (
            <p className="text-gray-600 mt-1 text-sm">{method.description}</p>
          )}

          {/* Additional Info */}
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {method.processingTime && (
              <div className="flex items-center text-gray-500">
                <Clock size={14} className="mr-1" />
                <span>{method.processingTime}</span>
              </div>
            )}
          </div>

          {/* Instructions (shown when selected) */}
          {selected && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
              <h4 className="font-medium text-blue-800 mb-2">How to Pay:</h4>
              {renderPaymentInstructions(method.id)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper function for payment instructions
function renderPaymentInstructions(methodId: string) {
  const instructions: Record<string, string[]> = {
    bank: [
      '1. Use your mobile/online banking',
      '2. Send payment to: Bank: FNB | Acc: 6283990001 | Ref: Your Email',
      '3. Upload proof of payment',
      '4. Account activated within 1-2 hours'
    ],
    airtel: [
      '1. Dial *555# on your Airtel line',
      '2. Select "Send Money"',
      '3. Enter number: 0888000123',
      '4. Enter amount and your email as reference',
      '5. Instant activation upon confirmation'
    ],
    mpamba: [
      '1. Dial *444# on your TNM line',
      '2. Select "Pay Bill"',
      '3. Enter Business Number: 123456',
      '4. Enter amount and your email as reference',
      '5. Account activated immediately'
    ]
  }

  const defaultInstructions = [
    'Complete payment using your preferred method',
    'Use your email as payment reference',
    'Account will be activated upon confirmation'
  ]

  return (
    <ul className="text-sm text-blue-700 space-y-1">
      {(instructions[methodId] || defaultInstructions).map((step, index) => (
        <li key={index} className="flex items-start">
          <span className="mr-2">•</span>
          {step}
        </li>
      ))}
    </ul>
  )
}

// Add Clock icon component
function Clock({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}