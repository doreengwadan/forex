'use client'

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { BarChart3 } from 'lucide-react'

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600">Deep insights and platform analytics</p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600">
          <BarChart3 className="w-4 h-4" />
          Generate Report
        </Button>
      </div>
      
      {/* Content would go here */}
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
          <p className="text-gray-600">View detailed platform analytics here</p>
        </CardContent>
      </Card>
    </div>
  )
}