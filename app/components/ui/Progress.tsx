'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { CheckCircle, XCircle } from 'lucide-react' // Add these imports
import { cn } from '../../lib/utils'

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string
  value?: number
  max?: number
  showValue?: boolean
  valuePosition?: 'inside' | 'outside' | 'tooltip'
  size?: 'sm' | 'md' | 'lg'
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  animated?: boolean
  striped?: boolean
  label?: string
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({
  className,
  indicatorClassName,
  value = 0,
  max = 100,
  showValue = false,
  valuePosition = 'outside',
  size = 'md',
  color = 'default',
  animated = false,
  striped = false,
  label,
  ...props
}, ref) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const roundedPercentage = Math.round(percentage)

  // Size styles
  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-4'
  }

  // Color styles
  const colorStyles = {
    default: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500'
  }

  // Animation styles
  const animationStyles = animated ? 'transition-all duration-300 ease-in-out' : ''
  const stripedStyles = striped ? 'bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:1rem_1rem] animate-progress-stripes' : ''

  return (
    <div className="w-full">
      {/* Label and value */}
      {(label || (showValue && valuePosition === 'outside')) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showValue && valuePosition === 'outside' && (
            <span className="text-sm text-gray-600">{roundedPercentage}%</span>
          )}
        </div>
      )}

      {/* Progress bar container */}
      <div className="relative">
        <ProgressPrimitive.Root
          ref={ref}
          className={cn(
            'relative overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700',
            sizeStyles[size],
            className
          )}
          value={value}
          max={max}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={cn(
              'h-full w-full flex-1 transition-all',
              colorStyles[color],
              animationStyles,
              stripedStyles,
              indicatorClassName
            )}
            style={{ transform: `translateX(-${100 - percentage}%)` }}
          >
            {/* Value inside the bar */}
            {showValue && valuePosition === 'inside' && size === 'lg' && (
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                {roundedPercentage}%
              </span>
            )}
          </ProgressPrimitive.Indicator>
        </ProgressPrimitive.Root>

        {/* Value tooltip */}
        {showValue && valuePosition === 'tooltip' && (
          <div
            className="absolute -top-8 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap"
            style={{ left: `${percentage}%` }}
          >
            {roundedPercentage}%
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900" />
          </div>
        )}
      </div>
    </div>
  )
})

Progress.displayName = 'Progress'

// Circular Progress Component
interface CircularProgressProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: string
  backgroundColor?: string
  showValue?: boolean
  valueClassName?: string
  children?: React.ReactNode
}

const CircularProgress = React.forwardRef<HTMLDivElement, CircularProgressProps>(({
  value = 0,
  max = 100,
  size = 120,
  strokeWidth = 8,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  showValue = true,
  valueClassName,
  children
}, ref) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div ref={ref} className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showValue && (
          <span className={cn('text-2xl font-bold', valueClassName)}>
            {Math.round(percentage)}%
          </span>
        ))}
      </div>
    </div>
  )
})

CircularProgress.displayName = 'CircularProgress'

// Progress Bar Group
interface ProgressGroupProps {
  items: Array<{
    label: string
    value: number
    color?: string
    max?: number
  }>
  showValues?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const ProgressGroup: React.FC<ProgressGroupProps> = ({
  items,
  showValues = true,
  size = 'md'
}) => {
  const total = items.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const percentage = ((item.value / (item.max || total)) * 100).toFixed(1)
        
        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{item.label}</span>
              {showValues && (
                <span className="font-medium">{item.value} ({percentage}%)</span>
              )}
            </div>
            <Progress
              value={item.value}
              max={item.max || total}
              size={size}
              color={item.color as any || 'default'}
            />
          </div>
        )
      })}
    </div>
  )
}

// Step Progress
interface StepProgressProps {
  steps: Array<{
    label: string
    description?: string
    status: 'complete' | 'current' | 'pending' | 'error'
  }>
  currentStep?: number
  orientation?: 'horizontal' | 'vertical'
  size?: 'sm' | 'md' | 'lg'
  onStepClick?: (index: number) => void
}

const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  currentStep = 0,
  orientation = 'horizontal',
  size = 'md',
  onStepClick
}) => {
  const sizeStyles = {
    sm: {
      step: 'w-6 h-6 text-xs',
      line: 'h-0.5',
      icon: 'w-3 h-3'
    },
    md: {
      step: 'w-8 h-8 text-sm',
      line: 'h-0.5',
      icon: 'w-4 h-4'
    },
    lg: {
      step: 'w-10 h-10 text-base',
      line: 'h-1',
      icon: 'w-5 h-5'
    }
  }

  const statusColors = {
    complete: 'bg-green-500 text-white border-green-500',
    current: 'bg-blue-500 text-white border-blue-500',
    pending: 'bg-gray-200 text-gray-500 border-gray-300',
    error: 'bg-red-500 text-white border-red-500'
  }

  if (orientation === 'horizontal') {
    return (
      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex-1 last:flex-none">
              <div className="flex items-center">
                <button
                  onClick={() => onStepClick?.(index)}
                  disabled={step.status === 'pending' && !onStepClick}
                  className={cn(
                    'relative flex items-center justify-center rounded-full border-2 transition-all',
                    sizeStyles[size].step,
                    statusColors[step.status],
                    step.status === 'pending' && 'cursor-not-allowed opacity-50',
                    onStepClick && step.status !== 'pending' && 'cursor-pointer hover:scale-110'
                  )}
                >
                  {step.status === 'complete' ? (
                    <CheckCircle className={sizeStyles[size].icon} />
                  ) : step.status === 'error' ? (
                    <XCircle className={sizeStyles[size].icon} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
                
                {index < steps.length - 1 && (
                  <div className={cn(
                    'flex-1 mx-2',
                    sizeStyles[size].line,
                    steps[index].status === 'complete' ? 'bg-green-500' : 'bg-gray-300'
                  )} />
                )}
              </div>
              
              <div className="mt-2 text-center">
                <div className={cn(
                  'font-medium',
                  step.status === 'current' && 'text-blue-600',
                  step.status === 'error' && 'text-red-600'
                )}>
                  {step.label}
                </div>
                {step.description && (
                  <div className="text-xs text-gray-500">{step.description}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Vertical orientation
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-3">
          <div className="relative flex flex-col items-center">
            <button
              onClick={() => onStepClick?.(index)}
              className={cn(
                'relative flex items-center justify-center rounded-full border-2 z-10',
                sizeStyles[size].step,
                statusColors[step.status]
              )}
            >
              {step.status === 'complete' ? (
                <CheckCircle className={sizeStyles[size].icon} />
              ) : step.status === 'error' ? (
                <XCircle className={sizeStyles[size].icon} />
              ) : (
                <span>{index + 1}</span>
              )}
            </button>
            
            {index < steps.length - 1 && (
              <div className={cn(
                'absolute top-full w-0.5 h-8',
                steps[index].status === 'complete' ? 'bg-green-500' : 'bg-gray-300'
              )} />
            )}
          </div>
          
          <div className="pb-4">
            <div className={cn(
              'font-medium',
              step.status === 'current' && 'text-blue-600',
              step.status === 'error' && 'text-red-600'
            )}>
              {step.label}
            </div>
            {step.description && (
              <div className="text-sm text-gray-600">{step.description}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export { Progress, CircularProgress, ProgressGroup, StepProgress }