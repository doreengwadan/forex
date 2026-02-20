'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Play, 
  Clock, 
  Users, 
  Calendar, 
  Video, 
  Star, 
  Lock, 
  ChevronRight,
  AlertCircle,
  Download,
  Share2
} from 'lucide-react'
import { format, isToday, isTomorrow, isPast } from 'date-fns'

interface Mentor {
  id: string
  name: string
  avatar?: string
  rating: number
  expertise: string[]
}

interface LiveClass {
  id: string
  title: string
  description: string
  mentor: Mentor
  scheduledFor: Date | string
  duration: number // in minutes
  category: string
  level: 'beginner' | 'intermediate' | 'advanced'
  status: 'scheduled' | 'live' | 'completed' | 'cancelled'
  maxParticipants?: number
  currentParticipants?: number
  recordingUrl?: string
  agoraChannel?: string
  tags?: string[]
  requirements?: string[]
}

interface LiveClassCardProps {
  classItem: LiveClass
  onJoin?: (classId: string) => void
  onBookmark?: (classId: string) => void
  onShare?: (classId: string) => void
  isBookmarked?: boolean
  userRole?: 'mentee' | 'mentor' | 'admin'
  showActions?: boolean
  compact?: boolean
}

export default function LiveClassCard({
  classItem,
  onJoin,
  onBookmark,
  onShare,
  isBookmarked = false,
  userRole = 'mentee',
  showActions = true,
  compact = false,
}: LiveClassCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // Parse date
  const scheduledDate = typeof classItem.scheduledFor === 'string' 
    ? new Date(classItem.scheduledFor) 
    : classItem.scheduledFor

  // Format time helpers
  const formatTime = (date: Date) => {
    return format(date, 'h:mm a')
  }

  const formatDate = (date: Date) => {
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'MMM d, yyyy')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-red-500 text-white'
      case 'scheduled': return 'bg-blue-500 text-white'
      case 'completed': return 'bg-green-500 text-white'
      case 'cancelled': return 'bg-gray-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isUpcoming = !isPast(scheduledDate) && classItem.status !== 'completed'
  const isLive = classItem.status === 'live'
  const hasRecording = classItem.recordingUrl && classItem.status === 'completed'
  const isFull = classItem.maxParticipants && classItem.currentParticipants 
    ? classItem.currentParticipants >= classItem.maxParticipants 
    : false

  const handleJoin = () => {
    if (isLive && onJoin) {
      onJoin(classItem.id)
    } else if (hasRecording) {
      window.open(classItem.recordingUrl, '_blank')
    }
  }

  if (compact) {
    return (
      <div 
        className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isLive ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
            }`}>
              <Video size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 line-clamp-1">{classItem.title}</h4>
              <p className="text-sm text-gray-500">{classItem.mentor.name}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {formatTime(scheduledDate)}
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(scheduledDate)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with status */}
      <div className="relative">
        {/* Class thumbnail/header */}
        <div className={`h-40 relative overflow-hidden ${
          isLive 
            ? 'bg-gradient-to-r from-red-500 to-pink-500' 
            : 'bg-gradient-to-r from-blue-500 to-cyan-500'
        }`}>
          {/* Live indicator */}
          {isLive && (
            <div className="absolute top-4 left-4 flex items-center">
              <div className="w-3 h-3 bg-white rounded-full animate-ping mr-2"></div>
              <span className="bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-3 py-1 rounded-full">
                LIVE NOW
              </span>
            </div>
          )}

          {/* Status badge */}
          <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(classItem.status)}`}>
            {classItem.status.toUpperCase()}
          </div>

          {/* Level badge */}
          <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-full text-xs font-semibold ${getLevelColor(classItem.level)}`}>
            {classItem.level.toUpperCase()}
          </div>

          {/* Category */}
          <div className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full">
            {classItem.category}
          </div>

          {/* Play button overlay */}
          {(isLive || hasRecording) && (
            <button
              onClick={handleJoin}
              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
            >
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                <Play size={24} className="text-gray-900 ml-1" />
              </div>
            </button>
          )}
        </div>

        {/* Mentor info */}
        <div className="absolute -bottom-6 left-6 flex items-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold border-4 border-white">
            {classItem.mentor.avatar || classItem.mentor.name.charAt(0)}
          </div>
          <div className="ml-14">
            <h4 className="font-bold text-gray-900">{classItem.mentor.name}</h4>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={`${
                    i < Math.floor(classItem.mentor.rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="text-xs text-gray-600 ml-1">
                ({classItem.mentor.rating})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-8 px-6 pb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {classItem.title}
        </h3>
        
        <p className="text-gray-600 mb-4 line-clamp-2">
          {classItem.description}
        </p>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center text-gray-600">
            <Calendar size={16} className="mr-2 text-gray-400" />
            <div>
              <div className="text-sm font-medium">{formatDate(scheduledDate)}</div>
              <div className="text-xs">{formatTime(scheduledDate)}</div>
            </div>
          </div>
          
          <div className="flex items-center text-gray-600">
            <Clock size={16} className="mr-2 text-gray-400" />
            <span>{classItem.duration} minutes</span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <Users size={16} className="mr-2 text-gray-400" />
            <div>
              <div className="text-sm">
                {classItem.currentParticipants || 0}/{classItem.maxParticipants || '∞'}
              </div>
              {isFull && (
                <div className="text-xs text-red-600">Full</div>
              )}
            </div>
          </div>
          
          <div className="flex items-center">
            <div className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(classItem.level)}`}>
              {classItem.level}
            </div>
          </div>
        </div>

        {/* Tags */}
        {classItem.tags && classItem.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {classItem.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {classItem.tags.length > 3 && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                +{classItem.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Requirements (collapsible) */}
        {classItem.requirements && classItem.requirements.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ChevronRight 
                size={16} 
                className={`mr-2 transition-transform ${showDetails ? 'rotate-90' : ''}`}
              />
              Prerequisites & Requirements
            </button>
            
            {showDetails && (
              <div className="mt-3 pl-6 space-y-2">
                {classItem.requirements.map((req, index) => (
                  <div key={index} className="flex items-start text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 mr-3"></div>
                    {req}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        {showActions && (
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <div className="flex space-x-2">
              <button
                onClick={() => onBookmark && onBookmark(classItem.id)}
                className={`p-2 rounded-lg ${
                  isBookmarked 
                    ? 'text-yellow-500 bg-yellow-50' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
                aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
              >
                <Star 
                  size={20} 
                  className={isBookmarked ? 'fill-current' : ''}
                />
              </button>
              
              <button
                onClick={() => onShare && onShare(classItem.id)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                aria-label="Share"
              >
                <Share2 size={20} />
              </button>
              
              {hasRecording && (
                <button
                  onClick={() => window.open(classItem.recordingUrl, '_blank')}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  aria-label="Download recording"
                >
                  <Download size={20} />
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              {userRole === 'mentor' || userRole === 'admin' ? (
                <Link
                  href={`/dashboard/mentor/classes/${classItem.id}`}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Manage Class
                </Link>
              ) : (
                <>
                  {isLive ? (
                    <button
                      onClick={handleJoin}
                      className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center"
                    >
                      <Play size={18} className="mr-2" />
                      Join Now
                    </button>
                  ) : isUpcoming ? (
                    <button
                      onClick={handleJoin}
                      disabled={isFull}
                      className={`px-6 py-2 font-semibold rounded-lg transition-all flex items-center ${
                        isFull
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg'
                      }`}
                    >
                      {isFull ? (
                        <>
                          <Lock size={18} className="mr-2" />
                          Class Full
                        </>
                      ) : (
                        'Join Class'
                      )}
                    </button>
                  ) : hasRecording ? (
                    <button
                      onClick={handleJoin}
                      className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center"
                    >
                      <Play size={18} className="mr-2" />
                      Watch Recording
                    </button>
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      Class ended
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Additional info bar */}
      {isLive && (
        <div className="bg-red-50 border-t border-red-100 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-ping mr-2"></div>
              <span className="text-red-700 font-medium">
                Live now • {classItem.currentParticipants || 0} participants
              </span>
            </div>
            <div className="text-sm text-red-600">
              Recording will be available after the session
            </div>
          </div>
        </div>
      )}

      {/* Upcoming reminder */}
      {isUpcoming && !isLive && (
        <div className="bg-blue-50 border-t border-blue-100 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock size={16} className="text-blue-600 mr-2" />
              <span className="text-blue-700">
                Starts in {formatDistanceToNow(scheduledDate, { addSuffix: true })}
              </span>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Set Reminder
            </button>
          </div>
        </div>
      )}
    </div>
  )
}