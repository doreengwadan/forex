'use client'

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { 
  Search,
  Filter,
  Video,
  Calendar,
  Users,
  Clock,
  Eye,
  Play,
  Pause,
  MoreVertical,
  User,
  Download,
  X,
  RefreshCw,
  Check,
  Tag,
  TrendingUp,
  Zap,
  BookOpen,
  AlertCircle,
  Loader2,
  AlertTriangle,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  UserPlus,
  Copy,
  MessageSquare,
  LogIn,
  Star,
  Heart,
  Share2,
  Bookmark,
  BookmarkCheck,
  CheckCircle
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../../components/ui/DropdownMenu'
import { Badge } from '../../components/ui/Badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../components/ui/Dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { toast } from 'react-hot-toast'
import { Class, ClassForm, Stats, ClassStatus, ClassType } from '../../types/class'

// Import Agora SDK only on client side (for students to join live classes)
let AgoraRTC: any = null;
if (typeof window !== 'undefined') {
  import('agora-rtc-sdk-ng').then((module) => {
    AgoraRTC = module.default;
  });
}

// API Base URL
const API_BASE_URL = 'http://localhost:8000/api'
const AGORA_APP_ID = '2d28e8e3332342d18764e1fab19a1a11'
const AGORA_TOKEN_URL = `${API_BASE_URL}/agora/getToken`

// Categories from backend
const categories = ['All', 'Programming', 'Design', 'Data Science', 'Computer Science', 'Business', 'Finance', 'Trading']
const statuses = ['All', 'scheduled', 'ongoing', 'completed', 'published']
const classTypes = ['All', 'live', 'recorded']
const tagOptions = ['JavaScript', 'React', 'Python', 'Web Development', 'Data Science', 'AI', 'UI/UX', 'Beginner', 'Advanced', 'Trading', 'Forex', 'Stocks', 'Crypto']

export default function StudentClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [enrolledClasses, setEnrolledClasses] = useState<Class[]>([])
  const [recommendedClasses, setRecommendedClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedType, setSelectedType] = useState('All')
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState<Record<number, boolean>>({})
  const [userRatings, setUserRatings] = useState<Record<number, number>>({})
  const [liveClassData, setLiveClassData] = useState<any>(null)
  
  // Agora states for students joining live classes
  const [isInLiveClass, setIsInLiveClass] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const [remoteUsers, setRemoteUsers] = useState<{uid: string | number, hasVideo: boolean, hasAudio: boolean}[]>([])
  const [channelName, setChannelName] = useState<string>('')
  const [agoraToken, setAgoraToken] = useState<string>('')
  
  // Agora refs for students
  const agoraClientRef = useRef<any>(null)
  const localVideoTrackRef = useRef<any>(null)
  const localAudioTrackRef = useRef<any>(null)
  const localVideoContainerRef = useRef<HTMLDivElement>(null)
  const remoteVideoContainerRef = useRef<HTMLDivElement>(null)

  const [stats, setStats] = useState<Stats>({
    total: 0,
    live: 0,
    recorded: 0,
    upcoming: 0,
    participants: 0
  })

  // Student-specific stats
  const [studentStats, setStudentStats] = useState({
    enrolled: 0,
    completed: 0,
    hoursSpent: 0,
    upcoming: 0
  })

  // Check if user is authenticated
  const isAuthenticated = () => {
    const token = localStorage.getItem('auth_token')
    return !!token
  }

  // Initialize Agora RTC client for student
  const initAgoraClient = () => {
    if (!AgoraRTC) {
      console.error('Agora SDK not loaded yet')
      return
    }
    
    if (!agoraClientRef.current) {
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      agoraClientRef.current = client
      
      // Store container references for cleanup
      const containers = new Map<string, HTMLDivElement>()
      
      // Listen for user events (instructor and other students)
      client.on('user-published', async (user: any, mediaType: string) => {
        await client.subscribe(user, mediaType)
        
        if (mediaType === 'video') {
          const remoteVideoTrack = user.videoTrack
          if (remoteVideoTrack) {
            // Create a container for the remote user
            const remoteContainer = document.createElement('div')
            remoteContainer.className = 'w-full h-full'
            remoteContainer.id = `remote-video-${user.uid}`
            
            // Store reference
            containers.set(`remote-video-${user.uid}`, remoteContainer)
            
            // Add to remote video container
            if (remoteVideoContainerRef.current) {
              try {
                remoteVideoContainerRef.current.appendChild(remoteContainer)
              } catch (e) {
                console.error('Error appending container:', e)
              }
            }
            
            try {
              remoteVideoTrack.play(remoteContainer)
            } catch (e) {
              console.error('Error playing video track:', e)
            }
          }
        }
        
        if (mediaType === 'audio') {
          const remoteAudioTrack = user.audioTrack
          if (remoteAudioTrack) {
            try {
              remoteAudioTrack.play()
            } catch (e) {
              console.error('Error playing audio track:', e)
            }
          }
        }
        
        // Update remote users list
        setRemoteUsers(prev => {
          const existingUser = prev.find(u => u.uid === user.uid)
          if (existingUser) {
            return prev.map(u => 
              u.uid === user.uid 
                ? { ...u, hasVideo: mediaType === 'video', hasAudio: mediaType === 'audio' }
                : u
            )
          }
          return [...prev, { uid: user.uid, hasVideo: mediaType === 'video', hasAudio: mediaType === 'audio' }]
        })
      })

      client.on('user-unpublished', (user: any, mediaType: string) => {
        // Update remote users list
        setRemoteUsers(prev => {
          const updatedUsers = prev.map(u => {
            if (u.uid === user.uid) {
              if (mediaType === 'video') return { ...u, hasVideo: false }
              if (mediaType === 'audio') return { ...u, hasAudio: false }
            }
            return u
          }).filter(u => u.hasVideo || u.hasAudio)
        
          // Remove video container if user left
          if (mediaType === 'video') {
            const containerId = `remote-video-${user.uid}`
            const remoteContainer = containers.get(containerId)
            
            if (remoteContainer && remoteContainer.parentNode) {
              try {
                remoteContainer.parentNode.removeChild(remoteContainer)
              } catch (e) {
                console.error('Error removing container:', e)
              }
            }
            containers.delete(containerId)
          }
          
          return updatedUsers
        })
      })

      client.on('user-joined', (user: any) => {
        console.log('User joined:', user.uid)
        setRemoteUsers(prev => {
          const existingUser = prev.find(u => u.uid === user.uid)
          if (!existingUser) {
            return [...prev, { uid: user.uid, hasVideo: false, hasAudio: false }]
          }
          return prev
        })
      })

      client.on('user-left', (user: any) => {
        console.log('User left:', user.uid)
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid))
        
        const containerId = `remote-video-${user.uid}`
        const remoteContainer = containers.get(containerId)
        
        if (remoteContainer) {
          try {
            if (remoteContainer.parentNode) {
              remoteContainer.parentNode.removeChild(remoteContainer)
            }
          } catch (e) {
            console.error('Error removing container on user-left:', e)
          }
          containers.delete(containerId)
        }
      })
    }
  }

  // Get Agora token from backend
  const getAgoraToken = async (channelName: string, uid: string): Promise<string> => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`${AGORA_TOKEN_URL}?channel=${encodeURIComponent(channelName)}&uid=${encodeURIComponent(uid)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        return data.token
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to get Agora token')
      }
    } catch (error) {
      console.error('Error getting Agora token:', error)
      throw error
    }
  }

  // Join Agora channel as student
  const joinAgoraChannel = async (channelName: string, uid: string) => {
    try {
      if (!AgoraRTC) {
        throw new Error('Agora SDK not loaded')
      }
      
      if (!channelName || channelName.trim() === '') {
        throw new Error('Channel name is required')
      }
      
      initAgoraClient()
      
      if (!agoraClientRef.current) {
        throw new Error('Agora client not initialized')
      }

      // Get token from backend
      const token = await getAgoraToken(channelName, uid)
      setAgoraToken(token)

      // Join the channel
      await agoraClientRef.current.join(AGORA_APP_ID, channelName, token, uid)
      
      // For students, they can choose to enable camera/mic
      // Create local tracks if student wants to participate
      try {
        localAudioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack()
        await localAudioTrackRef.current.setEnabled(false) // Start muted
        setIsAudioMuted(true)
      } catch (error) {
        console.log('Microphone not available or permission denied')
      }
      
      try {
        localVideoTrackRef.current = await AgoraRTC.createCameraVideoTrack()
        await localVideoTrackRef.current.setEnabled(false) // Start with camera off
        setIsVideoMuted(true)
        
        if (localVideoContainerRef.current && localVideoTrackRef.current) {
          localVideoTrackRef.current.play(localVideoContainerRef.current)
        }
      } catch (error) {
        console.log('Camera not available or permission denied')
      }
      
      // Publish local tracks if available
      const tracks = []
      if (localAudioTrackRef.current) tracks.push(localAudioTrackRef.current)
      if (localVideoTrackRef.current) tracks.push(localVideoTrackRef.current)
      
      if (tracks.length > 0) {
        await agoraClientRef.current.publish(tracks)
      }
      
      setIsInLiveClass(true)
      toast.success('Successfully joined the live class')
      
    } catch (error) {
      console.error('Error joining Agora channel:', error)
      toast.error('Failed to join live class')
      throw error
    }
  }

  // Leave Agora channel
  const leaveAgoraChannel = async () => {
    try {
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop()
        localAudioTrackRef.current.close()
      }
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop()
        localVideoTrackRef.current.close()
      }
      
      if (agoraClientRef.current) {
        await agoraClientRef.current.leave()
      }
      
      localAudioTrackRef.current = null
      localVideoTrackRef.current = null
      
      if (localVideoContainerRef.current) {
        localVideoContainerRef.current.innerHTML = ''
      }
      if (remoteVideoContainerRef.current) {
        remoteVideoContainerRef.current.innerHTML = ''
      }
      
      setIsInLiveClass(false)
      setRemoteUsers([])
      setIsAudioMuted(false)
      setIsVideoMuted(false)
      
      toast.success('Left the live class')
      
    } catch (error) {
      console.error('Error leaving Agora channel:', error)
      toast.error('Error leaving live class')
    }
  }

  // Toggle audio mute for student
  const toggleAudio = async () => {
    if (localAudioTrackRef.current) {
      if (isAudioMuted) {
        await localAudioTrackRef.current.setEnabled(true)
        toast.success('Microphone unmuted')
      } else {
        await localAudioTrackRef.current.setEnabled(false)
        toast.success('Microphone muted')
      }
      setIsAudioMuted(!isAudioMuted)
    }
  }

  // Toggle video mute for student
  const toggleVideo = async () => {
    if (localVideoTrackRef.current) {
      if (isVideoMuted) {
        await localVideoTrackRef.current.setEnabled(true)
        toast.success('Camera turned on')
      } else {
        await localVideoTrackRef.current.setEnabled(false)
        toast.success('Camera turned off')
      }
      setIsVideoMuted(!isVideoMuted)
    }
  }

  // Fetch all available classes for students
  const fetchClasses = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch(`${API_BASE_URL}/classes`, { // Changed from /student/classes to /classes
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        const classesData = data.data || data
        
        // Add isEnrolled property to each class
        const classesWithEnrollment = classesData.map((cls: Class) => ({
          ...cls,
          isEnrolled: false // Will be updated by checkEnrollmentStatus
        }))
        
        setClasses(classesWithEnrollment)
        
        // Check enrollment status for each class
        await checkEnrollmentStatus(classesWithEnrollment)
        
        toast.success('Classes loaded successfully')
      } else if (response.status === 401) {
        toast.error('Session expired. Please login again.')
        window.location.href = '/login'
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to load classes')
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
      toast.error('Failed to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  // Check enrollment status for classes
  const checkEnrollmentStatus = async (classesList: Class[]) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      // If we have enrolled classes data, use it
      if (enrolledClasses.length > 0) {
        const enrolledClassIds = enrolledClasses.map(c => c.id)
        setClasses(prev => prev.map(cls => ({
          ...cls,
          isEnrolled: enrolledClassIds.includes(cls.id)
        })))
        return
      }

      // Otherwise, make API call for each class
      for (const cls of classesList) {
        try {
          const response = await fetch(`${API_BASE_URL}/classes/${cls.id}/enrollment-status`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          })

          if (response.ok) {
            const data = await response.json()
            setClasses(prev => prev.map(c => 
              c.id === cls.id 
                ? { ...c, isEnrolled: data.is_enrolled || false }
                : c
            ))
          }
        } catch (error) {
          console.error(`Error checking enrollment for class ${cls.id}:`, error)
        }
      }
    } catch (error) {
      console.error('Error checking enrollment status:', error)
    }
  }

  // Fetch enrolled classes for student
  const fetchEnrolledClasses = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      
      if (!token) return
  
      const response = await fetch(`${API_BASE_URL}/student/enrolled-classes`, { // UPDATED
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })
  
      if (response.ok) {
        const data = await response.json()
        setEnrolledClasses(data.data || data)
      }
    } catch (error) {
      console.error('Error fetching enrolled classes:', error)
    }
  }
  // Fetch recommended classes for student
  const fetchRecommendedClasses = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      
      if (!token) return

      const response = await fetch(`${API_BASE_URL}/admin/classes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRecommendedClasses(data.data || data)
      }
    } catch (error) {
      console.error('Error fetching recommended classes:', error)
    }
  }

  // Fetch student statistics
  const fetchStudentStats = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      
      if (!token) return

      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStudentStats(data)
      }
    } catch (error) {
      console.error('Error fetching student stats:', error)
    }
  }

  // FIXED ENROLLMENT FUNCTION: Join a class as student
  const enrollInClass = async (classId: number) => {
    // Check authentication
    if (!isAuthenticated()) {
      toast.error('Please login to enroll in classes')
      window.location.href = '/login'
      return false
    }

    setIsJoining(true)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('Authentication required')
        return false
      }

      console.log(`Enrolling in class ${classId}...`)

      // FIXED: Using correct endpoint
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({}) // Empty body since we just need to enroll
      })

      const responseData = await response.json()
      console.log('Enrollment response:', responseData)

      if (response.ok) {
        toast.success(responseData.message || 'Successfully enrolled in the class!')
        
        // Update local state immediately
        setClasses(prev => prev.map(cls => 
          cls.id === classId 
            ? { 
                ...cls, 
                isEnrolled: true,
                attendees: (cls.attendees || 0) + 1 // Increment attendees count
              }
            : cls
        ))
        
        // Update enrolled classes list
        await fetchEnrolledClasses()
        await fetchStudentStats()
        
        return true
      } else {
        // Handle specific error cases
        if (response.status === 400 && responseData.message?.includes('already enrolled')) {
          toast.error('You are already enrolled in this class')
          // Update local state to show as enrolled
          setClasses(prev => prev.map(cls => 
            cls.id === classId 
              ? { ...cls, isEnrolled: true }
              : cls
          ))
        } else if (response.status === 400 && responseData.message?.includes('full')) {
          toast.error('This class is already full')
        } else if (response.status === 404) {
          toast.error('Class not found')
        } else if (response.status === 401) {
          toast.error('Session expired. Please login again.')
          window.location.href = '/login'
        } else {
          toast.error(responseData.message || `Failed to enroll in class (Status: ${response.status})`)
        }
        return false
      }
    } catch (error) {
      console.error('Error enrolling in class:', error)
      toast.error('Failed to connect to server. Please try again.')
      return false
    } finally {
      setIsJoining(false)
    }
  }

  // UNENROLL from a class
  const unenrollFromClass = async (classId: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('Authentication required')
        return false
      }

      const response = await fetch(`${API_BASE_URL}/classes/${classId}/unenroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || 'Successfully unenrolled from the class')
        
        // Update local state
        setClasses(prev => prev.map(cls => 
          cls.id === classId 
            ? { 
                ...cls, 
                isEnrolled: false,
                attendees: Math.max(0, (cls.attendees || 0) - 1) // Decrement attendees count
              }
            : cls
        ))
        
        // Update enrolled classes list
        fetchEnrolledClasses()
        fetchStudentStats()
        
        return true
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to unenroll from class')
        return false
      }
    } catch (error) {
      console.error('Error unenrolling from class:', error)
      toast.error('Failed to connect to server')
      return false
    }
  }

  // Bookmark a class
  const toggleBookmark = async (classId: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('Authentication required')
        return false
      }

      const response = await fetch(`${API_BASE_URL}/classes/${classId}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        const isBookmarked = data.is_bookmarked
        setIsBookmarked(prev => ({ ...prev, [classId]: isBookmarked }))
        toast.success(isBookmarked ? 'Class bookmarked!' : 'Bookmark removed')
        return true
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to update bookmark')
        return false
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      toast.error('Failed to connect to server')
      return false
    }
  }

  // Rate a class
  const rateClass = async (classId: number, rating: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('Authentication required')
        return false
      }

      const response = await fetch(`${API_BASE_URL}/classes/${classId}/rate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ rating }),
      })

      if (response.ok) {
        const data = await response.json()
        setUserRatings(prev => ({ ...prev, [classId]: rating }))
        toast.success('Thank you for your rating!')
        return true
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to submit rating')
        return false
      }
    } catch (error) {
      console.error('Error rating class:', error)
      toast.error('Failed to connect to server')
      return false
    }
  }

  // Join live class (for ongoing classes)
  const joinLiveClass = async (classItem: Class) => {
    try {
      setSelectedClass(classItem)
      
      // Check if student is enrolled
      if (!classItem.isEnrolled) {
        toast.error('You need to enroll in this class first')
        return
      }

      // For ongoing live classes, join directly via Agora
      if (classItem.status === 'ongoing' && classItem.type === 'live') {
        const channel = `class-${classItem.id}`
        setChannelName(channel)
        await joinAgoraChannel(channel, `student_${Date.now()}`)
      } else if (classItem.status === 'scheduled') {
        // For scheduled classes, show join dialog
        setLiveClassData({
          title: classItem.title,
          instructor: classItem.instructor,
          startTime: classItem.time,
          date: classItem.date
        })
        setShowJoinDialog(true)
      } else if (classItem.type === 'recorded') {
        // For recorded classes, open recording URL
        if (classItem.recordingUrl) {
          window.open(classItem.recordingUrl, '_blank')
        } else {
          toast.error('Recording not available yet')
        }
      } else {
        toast.error('This class is not currently available')
      }
      
    } catch (error) {
      console.error('Error joining live class:', error)
      toast.error('Failed to join live class')
    }
  }

  // FIXED: Handle enroll button click
  const handleEnrollClick = async (classItem: Class, e?: React.MouseEvent) => {
    // Prevent event bubbling
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }

    console.log('Enroll clicked for class:', classItem.id, classItem.title)

    // Check authentication
    if (!isAuthenticated()) {
      toast.error('Please login to enroll in classes')
      window.location.href = '/login'
      return
    }

    if (classItem.attendees >= classItem.maxAttendees) {
      toast.error('This class is full')
      return
    }

    if (classItem.status === 'completed') {
      toast.error('This class has already ended')
      return
    }

    if (classItem.status === 'cancelled') {
      toast.error('This class has been cancelled')
      return
    }

    // Check if already enrolled
    if (classItem.isEnrolled) {
      console.log('Already enrolled, showing details...')
      // If already enrolled and class is ongoing, join directly
      if (classItem.status === 'ongoing' && classItem.type === 'live') {
        await joinLiveClass(classItem)
      } else {
        // Show class details
        setSelectedClass(classItem)
        setShowDetailsDialog(true)
      }
      return
    }

    // For new enrollment, show details dialog first
    console.log('Showing details dialog for new enrollment...')
    setSelectedClass(classItem)
    setShowDetailsDialog(true)
  }

  // FIXED: Handle confirm enrollment
  const handleConfirmEnrollment = async () => {
    if (!selectedClass) {
      toast.error('No class selected')
      return
    }
    
    console.log('Confirming enrollment for class:', selectedClass.id)
    
    const success = await enrollInClass(selectedClass.id)
    if (success) {
      setShowDetailsDialog(false)
      setShowJoinDialog(false)
      
      // If class is ongoing and live, join immediately after enrollment
      if (selectedClass.status === 'ongoing' && selectedClass.type === 'live') {
        setTimeout(() => joinLiveClass(selectedClass), 1000)
      }
    }
  }

  const handleUnenroll = async (classId: number) => {
    const confirm = window.confirm('Are you sure you want to unenroll from this class?')
    if (confirm) {
      await unenrollFromClass(classId)
    }
  }

  const handleShowDetails = (classItem: Class, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setSelectedClass(classItem)
    setShowDetailsDialog(true)
  }

  const getStatusBadge = (status: ClassStatus): string => {
    const variants: Record<ClassStatus, string> = {
      scheduled: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
      ongoing: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white',
      completed: 'bg-gradient-to-r from-gray-600 to-gray-700 text-white',
      cancelled: 'bg-gradient-to-r from-rose-500 to-red-500 text-white',
      published: 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
    }
    return variants[status] || 'bg-gray-100 text-gray-800'
  }

  const getTypeBadge = (type: ClassType): string => {
    return type === 'live' 
      ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white' 
      : 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white'
  }

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'Programming': 'from-sky-500 to-blue-600',
      'Design': 'from-fuchsia-500 to-pink-600',
      'Data Science': 'from-emerald-500 to-teal-600',
      'Computer Science': 'from-amber-500 to-orange-600',
      'Business': 'from-violet-500 to-purple-600',
      'Finance': 'from-green-500 to-emerald-600',
      'Trading': 'from-amber-500 to-yellow-600',
      'default': 'from-gray-500 to-gray-600'
    }
    return colors[category] || colors.default
  }

  const isEnrolled = (classId: number) => {
    const cls = classes.find(c => c.id === classId)
    return cls?.isEnrolled || false
  }

  // Load data on component mount
  useEffect(() => {
    fetchClasses()
    fetchEnrolledClasses()
    fetchRecommendedClasses()
    fetchStudentStats()
  }, [])

  // Cleanup Agora on unmount
  useEffect(() => {
    return () => {
      if (isInLiveClass) {
        leaveAgoraChannel()
      }
    }
  }, [isInLiveClass])

  // Calculate statistics from local data
  useEffect(() => {
    if (classes.length > 0) {
      const total = classes.length
      const live = classes.filter(c => c.type === 'live').length
      const recorded = classes.filter(c => c.type === 'recorded').length
      const upcoming = classes.filter(c => c.status === 'scheduled').length
      const participants = classes.reduce((sum, c) => sum + (c.attendees || 0), 0)
      
      if (stats.total === 0) {
        setStats({ total, live, recorded, upcoming, participants })
      }
    }
  }, [classes])

  // Filter classes based on search and filters
  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (cls.description && cls.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'All' || cls.category === selectedCategory
    const matchesStatus = selectedStatus === 'All' || cls.status === selectedStatus
    const matchesType = selectedType === 'All' || cls.type === selectedType
    
    return matchesSearch && matchesCategory && matchesStatus && matchesType
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            My Learning Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Browse and join exciting classes</p>
        </div>
       
      </div>

      {/* Student Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Enrolled Classes</p>
                <p className="text-2xl font-bold text-gray-900">{studentStats.enrolled}</p>
                <p className="text-xs text-gray-500 mt-1">Active learning</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{studentStats.completed}</p>
                <p className="text-xs text-gray-500 mt-1">Achievements</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
                <Check className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hours Spent</p>
                <p className="text-2xl font-bold text-gray-900">{studentStats.hoursSpent}</p>
                <p className="text-xs text-gray-500 mt-1">Total learning time</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{studentStats.upcoming}</p>
                <p className="text-xs text-gray-500 mt-1">Next sessions</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl">
                <Calendar className="w-6 h-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled Classes Section */}
      {enrolledClasses.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              My Enrolled Classes ({enrolledClasses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledClasses.map(cls => (
                <Card key={cls.id} className="border-2 border-emerald-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <Badge className={`${getTypeBadge(cls.type)} font-medium`}>
                        {cls.type.charAt(0).toUpperCase() + cls.type.slice(1)}
                      </Badge>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Enrolled
                      </Badge>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{cls.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{cls.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">{cls.instructor}</span>
                      </div>
                      <Badge className={`${getStatusBadge(cls.status)} font-medium`}>
                        {cls.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{cls.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{cls.time}</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full gap-2"
                      onClick={() => handleShowDetails(cls)}
                      variant="outline"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Classes Section */}
      {recommendedClasses.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              Recommended For You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedClasses.slice(0, 3).map(cls => (
                <Card key={cls.id} className="border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <Badge className={`${getTypeBadge(cls.type)} font-medium`}>
                        {cls.type.charAt(0).toUpperCase() + cls.type.slice(1)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleBookmark(cls.id)}
                        className="p-1 hover:bg-rose-50"
                      >
                        <Heart className={`w-5 h-5 ${isBookmarked[cls.id] ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`} />
                      </Button>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{cls.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{cls.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">{cls.instructor}</span>
                      </div>
                      <Badge className={`${getStatusBadge(cls.status)} font-medium`}>
                        {cls.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{cls.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium">4.8</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-4 gap-2"
                      onClick={(e) => handleEnrollClick(cls, e)}
                      disabled={cls.attendees >= cls.maxAttendees}
                      variant={isEnrolled(cls.id) ? "default" : "outline"}
                    >
                      {isEnrolled(cls.id) ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Enrolled
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          Enroll Now
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Class Control Bar (when student is in a live class) */}
      {isInLiveClass && (
        <Card className="border-2 border-emerald-500 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 animate-pulse"></div>
                  <span className="font-semibold text-emerald-700">LIVE NOW</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedClass?.title}</h3>
                  <p className="text-sm text-gray-600">Instructor: {selectedClass?.instructor}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={isAudioMuted ? "outline" : "default"}
                  size="sm"
                  onClick={toggleAudio}
                  className="gap-2"
                  disabled={!localAudioTrackRef.current}
                >
                  {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isAudioMuted ? 'Unmute' : 'Mute'}
                </Button>
                <Button
                  variant={isVideoMuted ? "outline" : "default"}
                  size="sm"
                  onClick={toggleVideo}
                  className="gap-2"
                  disabled={!localVideoTrackRef.current}
                >
                  {isVideoMuted ? 'Camera Off' : 'Camera On'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={leaveAgoraChannel}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Leave Class
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search classes, instructors, or topics..."
                  className="pl-10 border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px] border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500">
                  <Filter className="w-4 h-4 mr-2 text-gray-500" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getCategoryColor(category)}`}></div>
                        {category}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[180px] border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[180px] border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {classTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(selectedCategory !== 'All' || selectedStatus !== 'All' || selectedType !== 'All') && (
                <Button
                  variant="outline"
                  className="border-2 hover:bg-gray-50 hover:border-gray-300"
                  onClick={() => {
                    setSelectedCategory('All')
                    setSelectedStatus('All')
                    setSelectedType('All')
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classes Grid View */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Available Classes ({filteredClasses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No classes found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map(cls => {
                const enrolled = isEnrolled(cls.id)
                return (
                  <Card key={cls.id} className="border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                    <CardContent className="p-6">
                      {/* Header with category and actions */}
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-xs font-medium px-3 py-1.5 rounded-full bg-gradient-to-r ${getCategoryColor(cls.category)} text-white`}>
                          {cls.category}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleBookmark(cls.id)}
                            className="p-1 hover:bg-rose-50"
                          >
                            <Heart className={`w-5 h-5 ${isBookmarked[cls.id] ? 'fill-rose-500 text-rose-500' : 'text-gray-400'} group-hover:text-rose-500`} />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="p-1 hover:bg-gray-100">
                                <MoreVertical className="w-5 h-5 text-gray-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={(e) => handleShowDetails(cls, e)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {cls.recordingUrl && (
                                <DropdownMenuItem onClick={() => window.open(cls.recordingUrl!, '_blank')}>
                                  <Play className="w-4 h-4 mr-2" />
                                  Watch Recording
                                </DropdownMenuItem>
                              )}
                              {enrolled && (
                                <DropdownMenuItem 
                                  onClick={() => handleUnenroll(cls.id)}
                                  className="text-red-600"
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Unenroll
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Class Title */}
                      <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-indigo-600 transition-colors">
                        {cls.title}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {cls.description || 'No description available'}
                      </p>

                      {/* Instructor and Rating */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{cls.instructor}</p>
                            <p className="text-xs text-gray-500">Instructor</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-medium">4.8</span>
                        </div>
                      </div>

                      {/* Schedule and Duration */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{cls.date} at {cls.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{cls.duration}</span>
                        </div>
                      </div>

                      {/* Status and Attendance */}
                      <div className="flex items-center justify-between mb-4">
                        <Badge className={`${getStatusBadge(cls.status)} font-medium`}>
                          {cls.status.charAt(0).toUpperCase() + cls.status.slice(1)}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">{cls.attendees || 0}/{cls.maxAttendees}</span>
                          {cls.attendees >= cls.maxAttendees && (
                            <Badge variant="destructive" className="text-xs">Full</Badge>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                        <div 
                          className={`h-2 rounded-full ${
                            ((cls.attendees || 0) / cls.maxAttendees) >= 0.8 
                              ? 'bg-gradient-to-r from-emerald-500 to-green-500' 
                              : ((cls.attendees || 0) / cls.maxAttendees) >= 0.5 
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                              : 'bg-gradient-to-r from-rose-500 to-red-500'
                          }`}
                          style={{ width: `${((cls.attendees || 0) / cls.maxAttendees) * 100}%` }}
                        />
                      </div>

                      {/* Enrollment Status & Action Button */}
                      <div className="space-y-3">
                        {enrolled && (
                          <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 py-2 rounded-lg">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">You're enrolled in this class</span>
                          </div>
                        )}
                        
                        <Button 
                          className="w-full gap-2"
                          onClick={(e) => handleEnrollClick(cls, e)}
                          disabled={cls.attendees >= cls.maxAttendees || cls.status === 'cancelled'}
                          variant={enrolled ? "default" : "outline"}
                        >
                          {enrolled ? (
                            <>
                              {cls.status === 'ongoing' && cls.type === 'live' ? (
                                <>
                                  <Play className="w-4 h-4" />
                                  Join Live Class
                                </>
                              ) : cls.status === 'completed' && cls.type === 'recorded' ? (
                                <>
                                  <Play className="w-4 h-4" />
                                  Watch Recording
                                </>
                              ) : (
                                <>
                                  <Calendar className="w-4 h-4" />
                                  View Class Details
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              <LogIn className="w-4 h-4" />
                              Enroll Now
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Class Details & Enrollment Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {selectedClass?.isEnrolled ? 'Class Details' : 'Enroll in Class'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedClass && (
            <div className="space-y-6">
              {/* Class Header */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedClass.title}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge className={`${getTypeBadge(selectedClass.type)} font-medium`}>
                        {selectedClass.type}
                      </Badge>
                      <Badge className={`${getStatusBadge(selectedClass.status)} font-medium`}>
                        {selectedClass.status}
                      </Badge>
                      <span className={`text-sm font-medium px-3 py-1 rounded-full bg-gradient-to-r ${getCategoryColor(selectedClass.category)} text-white`}>
                        {selectedClass.category}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleBookmark(selectedClass.id)}
                    className="p-2 hover:bg-rose-50"
                  >
                    <Heart className={`w-6 h-6 ${isBookmarked[selectedClass.id] ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`} />
                  </Button>
                </div>
                
                {/* Instructor Info */}
                <div className="flex items-center gap-3 mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedClass.instructor}</p>
                    <p className="text-sm text-gray-600">Instructor</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                      <span className="text-sm font-medium ml-2">4.8 (124 reviews)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Description</h4>
                <p className="text-gray-600">{selectedClass.description || 'No description available.'}</p>
              </div>

              {/* Schedule Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Date & Time</h4>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{selectedClass.date} at {selectedClass.time}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Duration</h4>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{selectedClass.duration}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Max Participants</h4>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{selectedClass.maxAttendees} students</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Current Enrollment</h4>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-bold text-gray-900">{selectedClass.attendees || 0}</div>
                    <div className="text-sm text-gray-600">/{selectedClass.maxAttendees}</div>
                    <div className="ml-2 text-sm font-medium text-emerald-600">
                      {Math.round(((selectedClass.attendees || 0) / selectedClass.maxAttendees) * 100)}% full
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {selectedClass.tags && selectedClass.tags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Topics Covered</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedClass.tags.map(tag => (
                      <span key={tag} className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Requirements</h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    Basic computer skills
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    Stable internet connection
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    Webcam and microphone (for live classes)
                  </li>
                </ul>
              </div>

              {/* Enrollment Status Message */}
              {selectedClass.isEnrolled && (
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                    <div>
                      <h4 className="font-semibold text-emerald-800">You're enrolled in this class!</h4>
                      <p className="text-sm text-emerald-700 mt-1">
                        {selectedClass.status === 'ongoing' && selectedClass.type === 'live' 
                          ? 'You can join the live class now.'
                          : selectedClass.status === 'scheduled'
                          ? `The class starts on ${selectedClass.date} at ${selectedClass.time}.`
                          : 'You can access the class materials anytime.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Class Full Warning */}
              {(selectedClass.attendees || 0) >= selectedClass.maxAttendees && !selectedClass.isEnrolled && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                    <div>
                      <h4 className="font-semibold text-amber-800">This class is full</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        All {selectedClass.maxAttendees} seats have been taken. You can join the waitlist or check back later for cancellations.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rating (if completed and enrolled) */}
              {selectedClass.isEnrolled && selectedClass.status === 'completed' && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Your Rating</h4>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => rateClass(selectedClass.id, star)}
                        className="hover:scale-110 transition-transform"
                      >
                        <Star className={`w-8 h-8 ${star <= (userRatings[selectedClass.id] || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowDetailsDialog(false)}
              disabled={isJoining}
            >
              Cancel
            </Button>
            
            {selectedClass?.isEnrolled ? (
              <>
                {selectedClass.status === 'ongoing' && selectedClass.type === 'live' ? (
                  <Button 
                    onClick={() => joinLiveClass(selectedClass)}
                    className="gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                  >
                    <Play className="w-4 h-4" />
                    Join Live Class
                  </Button>
                ) : selectedClass.status === 'completed' && selectedClass.type === 'recorded' && selectedClass.recordingUrl ? (
                  <Button 
                    onClick={() => window.open(selectedClass.recordingUrl!, '_blank')}
                    className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    <Play className="w-4 h-4" />
                    Watch Recording
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setShowDetailsDialog(false)}
                    className="gap-2"
                    variant="outline"
                  >
                    <Calendar className="w-4 h-4" />
                    Got it
                  </Button>
                )}
                
                <Button 
                  variant="destructive"
                  onClick={() => handleUnenroll(selectedClass.id)}
                  disabled={isJoining}
                >
                  Unenroll
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleConfirmEnrollment}
                disabled={isJoining || (selectedClass?.attendees || 0) >= (selectedClass?.maxAttendees || 0)}
                className="gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Enroll Now
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Live Class Join Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="max-w-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Join Live Class
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Class Info */}
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-xl">
              <h3 className="font-bold text-lg text-gray-900 mb-2">{selectedClass?.title}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Instructor</p>
                  <p className="font-medium text-gray-900">{selectedClass?.instructor}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Participants</p>
                  <p className="font-medium text-gray-900">{selectedClass?.attendees || 0}/{selectedClass?.maxAttendees}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Schedule</p>
                  <p className="font-medium text-gray-900">{selectedClass?.date} at {selectedClass?.time}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={`${getStatusBadge(selectedClass?.status || 'scheduled')} font-medium`}>
                    {selectedClass?.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Before joining:</h4>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span>Test your microphone and camera</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span>Use headphones for better audio quality</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span>Ensure stable internet connection</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span>Join 5 minutes early to avoid delays</span>
                </li>
              </ul>
            </div>

            {/* Countdown for scheduled classes */}
            {selectedClass?.status === 'scheduled' && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-amber-600" />
                  <div>
                    <h4 className="font-semibold text-amber-800">Class starts soon</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      This class is scheduled for {selectedClass.date} at {selectedClass.time}. 
                      You'll be able to join when the instructor starts the session.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowJoinDialog(false)}
            >
              Close
            </Button>
            {selectedClass?.status === 'ongoing' && (
              <Button 
                onClick={() => joinLiveClass(selectedClass)}
                className="gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
              >
                <LogIn className="w-4 h-4" />
                Join Live Class Now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}