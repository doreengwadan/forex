'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

const data = [
  { month: 'Jan', users: 400, revenue: 2400 },
  { month: 'Feb', users: 300, revenue: 1398 },
  { month: 'Mar', users: 200, revenue: 9800 },
  { month: 'Apr', users: 278, revenue: 3908 },
  { month: 'May', users: 189, revenue: 4800 },
  { month: 'Jun', users: 239, revenue: 3800 },
  { month: 'Jul', users: 349, revenue: 4300 },
  { month: 'Aug', users: 400, revenue: 2400 },
  { month: 'Sep', users: 300, revenue: 1398 },
  { month: 'Oct', users: 200, revenue: 9800 },
  { month: 'Nov', users: 278, revenue: 3908 },
  { month: 'Dec', users: 189, revenue: 4800 },
]

export default function AnalyticsChart() {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="users"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.3}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}