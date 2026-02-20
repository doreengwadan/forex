import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Video, Clock, Users, Calendar } from 'lucide-react'
import { format } from 'date-fns'

const upcomingClasses = [
  {
    id: 1,
    title: 'Advanced Forex Trading Strategies',
    mentor: 'Sarah Johnson',
    date: new Date(Date.now() + 86400000), // Tomorrow
    time: '14:00',
    duration: '60 min',
    participants: 24,
    maxParticipants: 50,
    status: 'upcoming' as const,
  },
  {
    id: 2,
    title: 'Risk Management Basics',
    mentor: 'Mike Chen',
    date: new Date(Date.now() + 172800000), // Day after tomorrow
    time: '10:00',
    duration: '45 min',
    participants: 18,
    maxParticipants: 30,
    status: 'upcoming' as const,
  },
  {
    id: 3,
    title: 'Crypto Market Analysis',
    mentor: 'Alex Rodriguez',
    date: new Date(Date.now() + 259200000), // In 3 days
    time: '16:30',
    duration: '90 min',
    participants: 42,
    maxParticipants: 100,
    status: 'upcoming' as const,
  },
]

export default function UpcomingClasses() {
  return (
    <div className="space-y-4">
      {upcomingClasses.map((classItem) => (
        <Card key={classItem.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Video className="w-4 h-4 text-gray-500" />
                  <h3 className="font-semibold text-sm">{classItem.title}</h3>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {classItem.status}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(classItem.date, 'MMM d')} at {classItem.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {classItem.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {classItem.participants}/{classItem.maxParticipants}
                    </span>
                  </div>
                  
                  <p className="text-sm">
                    Mentor: <span className="font-medium">{classItem.mentor}</span>
                  </p>
                </div>
              </div>
              
              <Button size="sm" className="ml-4">
                Join
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {upcomingClasses.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Video className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No upcoming classes scheduled</p>
          <Button variant="outline" className="mt-3">
            Browse Classes
          </Button>
        </div>
      )}
    </div>
  )
}