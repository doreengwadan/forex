'use client'

import { useState, useEffect } from 'react'
import LiveClassCard from '../components/live/LiveClassCard'
import { agoraService } from '../lib/api/agora'

interface LiveClass {
  id: string
  title: string
  mentorName: string
  scheduledTime: Date
  duration: number
  status: 'upcoming' | 'live' | 'completed'
}

export default function LiveClassesPage() {
  const [classes, setClasses] = useState<LiveClass[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLiveClasses()
  }, [])

  const fetchLiveClasses = async () => {
    try {
      const response = await fetch('/api/live-classes')
      const data = await response.json()
      setClasses(data)
    } catch (error) {
      console.error('Error fetching classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const joinLiveClass = async (classId: string) => {
    const token = await agoraService.generateToken(classId, 'student')
    // Initialize Agora RTC and join channel
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Live Trading Classes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classItem) => (
          <LiveClassCard
            key={classItem.id}
            classItem={classItem}
            onJoin={joinLiveClass}
          />
        ))}
      </div>
    </div>
  )
}