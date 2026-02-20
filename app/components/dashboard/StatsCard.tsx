import { Card, CardContent } from '../../components/ui/Card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  icon: ReactNode
  description?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}

export default function StatsCard({
  title,
  value,
  icon,
  description,
  trend = 'neutral',
  trendValue,
}: StatsCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            
            {(description || trendValue) && (
              <div className="flex items-center mt-2 space-x-1">
                {trendValue && (
                  <>
                    {getTrendIcon()}
                    <span className={cn('text-sm', getTrendColor())}>
                      {trendValue}
                    </span>
                  </>
                )}
                {description && (
                  <span className="text-sm text-gray-500">
                    {trendValue ? ` • ${description}` : description}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-gray-600">{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}