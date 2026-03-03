'use client'

import * as React from 'react'
import * as SeparatorPrimitive from '@radix-ui/react-separator'
import { cn } from '../../lib/utils'

interface SeparatorProps extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> {
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
  thickness?: 'thin' | 'default' | 'thick'
  variant?: 'solid' | 'dashed' | 'dotted'
  color?: 'default' | 'muted' | 'primary' | 'secondary'
  label?: string
  labelPosition?: 'left' | 'center' | 'right'
}

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(({
  className,
  orientation = 'horizontal',
  decorative = true,
  thickness = 'default',
  variant = 'solid',
  color = 'default',
  label,
  labelPosition = 'center',
  ...props
}, ref) => {
  // Thickness styles
  const thicknessStyles = {
    horizontal: {
      thin: 'h-px',
      default: 'h-0.5',
      thick: 'h-1'
    },
    vertical: {
      thin: 'w-px',
      default: 'w-0.5',
      thick: 'w-1'
    }
  }

  // Variant styles
  const variantStyles = {
    solid: 'border-none',
    dashed: 'border-dashed border-0 bg-none',
    dotted: 'border-dotted border-0 bg-none'
  }

  // Color styles
  const colorStyles = {
    default: 'bg-gray-200 dark:bg-gray-700',
    muted: 'bg-gray-100 dark:bg-gray-800',
    primary: 'bg-blue-200 dark:bg-blue-800',
    secondary: 'bg-purple-200 dark:bg-purple-800'
  }

  // Border styles for dashed/dotted
  const borderStyles = {
    dashed: {
      horizontal: 'border-t-2',
      vertical: 'border-l-2'
    },
    dotted: {
      horizontal: 'border-t-2',
      vertical: 'border-l-2'
    }
  }

  const borderColorStyles = {
    default: 'border-gray-200 dark:border-gray-700',
    muted: 'border-gray-100 dark:border-gray-800',
    primary: 'border-blue-200 dark:border-blue-800',
    secondary: 'border-purple-200 dark:border-purple-800'
  }

  // If label is provided, render a labeled separator
  if (label) {
    return (
      <div className={cn(
        'relative flex items-center',
        orientation === 'vertical' ? 'flex-col h-full' : 'w-full'
      )}>
        <SeparatorPrimitive.Root
          ref={ref}
          decorative={decorative}
          orientation={orientation}
          className={cn(
            'shrink-0',
            variant === 'solid' ? colorStyles[color] : borderColorStyles[color],
            variant !== 'solid' && borderStyles[variant][orientation],
            thicknessStyles[orientation][thickness],
            orientation === 'vertical' ? 'h-full' : 'w-full',
            className
          )}
          {...props}
        />
        
        <span className={cn(
          'absolute px-2 text-xs font-medium text-gray-500 bg-white dark:bg-gray-900',
          orientation === 'horizontal' ? (
            labelPosition === 'left' ? 'left-0' :
            labelPosition === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2'
          ) : (
            labelPosition === 'left' ? 'top-0' :
            labelPosition === 'right' ? 'bottom-0' : 'top-1/2 -translate-y-1/2'
          )
        )}>
          {label}
        </span>
      </div>
    )
  }

  // Simple separator without label
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0',
        variant === 'solid' ? colorStyles[color] : borderColorStyles[color],
        variant !== 'solid' && borderStyles[variant][orientation],
        thicknessStyles[orientation][thickness],
        orientation === 'vertical' ? 'h-full' : 'w-full',
        className
      )}
      {...props}
    />
  )
})

Separator.displayName = 'Separator'

// Section Separator with Title
interface SectionSeparatorProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

const SectionSeparator: React.FC<SectionSeparatorProps> = ({
  title,
  description,
  icon,
  action,
  className
}) => {
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <div className="text-gray-500">{icon}</div>}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {action && <div>{action}</div>}
      </div>
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
      <Separator className="mt-2" />
    </div>
  )
}

// Dot Separator
interface DotSeparatorProps {
  className?: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
}

const DotSeparator: React.FC<DotSeparatorProps> = ({
  className,
  color = 'bg-gray-300',
  size = 'md'
}) => {
  const sizeStyles = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2'
  }

  return (
    <span
      className={cn(
        'inline-block rounded-full',
        sizeStyles[size],
        color,
        className
      )}
      aria-hidden="true"
    />
  )
}

// Vertical Divider
interface VerticalDividerProps {
  className?: string
  height?: number | string
  thickness?: 'thin' | 'default' | 'thick'
  color?: string
}

const VerticalDivider: React.FC<VerticalDividerProps> = ({
  className,
  height = '1em',
  thickness = 'default',
  color = 'bg-gray-300'
}) => {
  const thicknessStyles = {
    thin: 'w-px',
    default: 'w-0.5',
    thick: 'w-1'
  }

  return (
    <div
      className={cn(
        'inline-block',
        thicknessStyles[thickness],
        color,
        className
      )}
      style={{ height }}
      aria-hidden="true"
    />
  )
}

// Spacer
interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

const Spacer: React.FC<SpacerProps> = ({
  size = 'md',
  orientation = 'horizontal',
  className
}) => {
  const sizeMap = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  }

  const spacing = typeof size === 'number' ? size : sizeMap[size]

  return (
    <div
      className={className}
      style={{
        [orientation === 'horizontal' ? 'width' : 'height']: spacing,
        [orientation === 'horizontal' ? 'height' : 'width']: 'auto',
        flexShrink: 0
      }}
      aria-hidden="true"
    />
  )
}

export { Separator, SectionSeparator, DotSeparator, VerticalDivider, Spacer }