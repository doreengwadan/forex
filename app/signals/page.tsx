'use client'

import { useState, useEffect } from 'react'
import SignalCard from '@/components/signals/SignalCard'
import SignalFilter from '@/components/signals/SignalFilter'

interface TradingSignal {
  id: string
  symbol: string
  action: 'BUY' | 'SELL' | 'HOLD'
  price: number
  stopLoss: number
  takeProfit: number
  timestamp: Date
  mentorId: string
  confidence: number
}

export default function SignalsPage() {
  const [signals, setSignals] = useState<TradingSignal[]>([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    // Setup WebSocket for real-time signals
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || '')
    
    ws.onmessage = (event) => {
      const signal = JSON.parse(event.data)
      setSignals(prev => [signal, ...prev.slice(0, 49)])
      
      // Send SMS notification via Twilio API
      if (signal.priority === 'high') {
        sendSMSNotification(signal)
      }
    }

    return () => ws.close()
  }, [])

  const sendSMSNotification = async (signal: TradingSignal) => {
    await fetch('/api/notifications/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signal,
        users: ['subscribed_users']
      })
    })
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Trading Signals</h1>
        <SignalFilter currentFilter={filter} onFilterChange={setFilter} />
      </div>

      <div className="space-y-4">
        {signals.map((signal) => (
          <SignalCard key={signal.id} signal={signal} />
        ))}
      </div>
    </div>
  )
}