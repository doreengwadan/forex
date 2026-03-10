// app/live-class/[classId]/page.tsx (updated)
'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { 
  Mic, MicOff, Video, VideoOff, Users, X, 
  LoaderCircle, ChevronLeft, PhoneOff, ScreenShare,
  MessageSquare, Maximize2, Minimize2, Play, Clock
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { toast } from 'react-hot-toast'

// Import Agora SDK only on client side
let AgoraRTC: any = null
if (typeof window !== 'undefined') {
  import('agora-rtc-sdk-ng').then((module) => {
    AgoraRTC = module.default
  })
}

const API_BASE_URL = 'http://localhost:8000/api'
const AGORA_APP_ID = '2d28e8e3332342d18764e1fab19a1a11'
const AGORA_TOKEN_URL = `${API_BASE_URL}/agora/getToken`

interface Class {
  id: number
  title: string
  instructor: string
  instructor_id?: number
  description?: string
  category?: string
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'published'
  date: string
  time: string
  duration: string
  maxAttendees: number
  attendees: number
}

interface RemoteUser {
  uid: string | number
  hasVideo: boolean
  hasAudio: boolean
  isInstructor?: boolean
}

export default function LiveClassPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const classId = params.classId as string

  // State
  const [classData, setClassData] = useState<Class | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInLiveClass, setIsInLiveClass] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([])
  const [channelName, setChannelName] = useState(`class-${classId}`)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState<Array<{user: string, message: string, timestamp: Date}>>([])
  const [newMessage, setNewMessage] = useState('')
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'unknown'>('unknown')
  const [participantCount, setParticipantCount] = useState(0)
  const [userRole, setUserRole] = useState<'instructor' | 'student' | null>(null)
  const [hasJoined, setHasJoined] = useState(false)

  // Refs
  const agoraClientRef = useRef<any>(null)
  const localVideoTrackRef = useRef<any>(null)
  const localAudioTrackRef = useRef<any>(null)
  const screenTrackRef = useRef<any>(null)
  const localVideoContainerRef = useRef<HTMLDivElement>(null)
  const remoteVideoContainerRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Current user state
  const [currentUser, setCurrentUser] = useState<{
    id: number
    name: string
    email: string
    role?: string
  } | null>(null)

  // Get current user – returns the user object
  const getCurrentUser = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        router.push('/login')
        return null
      }
      const response = await fetch(`${API_BASE_URL}/user`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      })
      if (response.ok) {
        const userData = await response.json()
        setCurrentUser(userData)
        return userData
      } else {
        if (response.status === 401) router.push('/login')
        return null
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
      return null
    }
  }

  // Update class status (admin/instructor only)
  const updateClassStatus = async (status: Class['status']) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return false

      const response = await fetch(`${API_BASE_URL}/admin/classes/${classId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || 'Class status updated')
        setClassData(prev => prev ? { ...prev, status } : prev)
        return true
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to update class status')
        return false
      }
    } catch (error) {
      console.error('Error updating class status:', error)
      toast.error('Failed to connect to server')
      return false
    }
  }

  // Fetch class details – receives user object
  const fetchClassDetails = async (user: any) => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('auth_token')

      const response = await fetch(`${API_BASE_URL}/classes/${classId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      })

      if (!response.ok) {
        toast.error('Failed to load class details')
        router.push('/dashboard/classes')
        return
      }

      const data = await response.json()
      const classDetails = data.data || data
      setClassData(classDetails)

      // Determine user role
      const roleParam = searchParams.get('role')
      let role: 'instructor' | 'student' = 'student'
      if (roleParam === 'instructor') {
        role = 'instructor'
      } else if (user && classDetails.instructor_id === user.id) {
        role = 'instructor'
      }
      setUserRole(role)

      // For students, check enrollment
      if (role === 'student') {
        const enrollmentResponse = await fetch(`${API_BASE_URL}/classes/${classId}/enrollment-status`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        })
        if (enrollmentResponse.ok) {
          const enrollmentData = await enrollmentResponse.json()
          if (!enrollmentData.is_enrolled) {
            toast.error('You need to enroll in this class first')
            router.push('/dashboard/classes')
            return
          }
        } else {
          toast.error('Unable to verify enrollment. Please try again.')
          router.push('/dashboard/classes')
          return
        }
      }

      // Auto-join if class is ongoing
      if (classDetails.status === 'ongoing') {
        joinLiveClass()
      }

    } catch (error) {
      console.error('Error fetching class details:', error)
      toast.error('Failed to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  // Initialize Agora RTC client
  const initAgoraClient = () => {
    if (!AgoraRTC) {
      console.error('Agora SDK not loaded yet')
      return false
    }
    
    if (!agoraClientRef.current) {
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      agoraClientRef.current = client
      
      client.on('user-published', async (user: any, mediaType: string) => {
        console.log(`User published: ${user.uid}, media: ${mediaType}`)
        await client.subscribe(user, mediaType)
        
        if (mediaType === 'video') {
          const remoteVideoTrack = user.videoTrack
          if (remoteVideoTrack) {
            const remoteContainer = document.createElement('div')
            remoteContainer.className = 'w-full h-full rounded-lg overflow-hidden bg-gray-900'
            remoteContainer.id = `remote-video-${user.uid}`
            
            if (remoteVideoContainerRef.current) {
              remoteVideoContainerRef.current.appendChild(remoteContainer)
            }
            
            remoteVideoTrack.play(remoteContainer)
          }
        }
        
        if (mediaType === 'audio') {
          const remoteAudioTrack = user.audioTrack
          if (remoteAudioTrack) {
            remoteAudioTrack.play()
          }
        }
        
        // Update remote users list with media status (but do NOT increment count)
        setRemoteUsers(prev => {
          const existing = prev.find(u => u.uid === user.uid)
          const updates = {
            uid: user.uid,
            hasVideo: mediaType === 'video' ? true : existing?.hasVideo || false,
            hasAudio: mediaType === 'audio' ? true : existing?.hasAudio || false,
            isInstructor: typeof user.uid === 'string' && user.uid.startsWith('instructor_')
          }
          if (existing) {
            return prev.map(u => u.uid === user.uid ? updates : u)
          } else {
            return [...prev, updates]
          }
        })
      })

      client.on('user-unpublished', (user: any, mediaType: string) => {
        console.log(`User unpublished: ${user.uid}, media: ${mediaType}`)
        setRemoteUsers(prev => {
          const updatedUsers = prev.map(u => {
            if (u.uid === user.uid) {
              if (mediaType === 'video') return { ...u, hasVideo: false }
              if (mediaType === 'audio') return { ...u, hasAudio: false }
            }
            return u
          }).filter(u => u.hasVideo || u.hasAudio)
        
          if (mediaType === 'video') {
            const container = document.getElementById(`remote-video-${user.uid}`)
            if (container && container.parentNode) {
              container.parentNode.removeChild(container)
            }
          }
          
          return updatedUsers
        })
      })

      client.on('user-joined', (user: any) => {
        console.log('User joined:', user.uid)
        setRemoteUsers(prev => {
          // If not already in list, add them with no media yet
          if (!prev.find(u => u.uid === user.uid)) {
            return [...prev, { 
              uid: user.uid, 
              hasVideo: false, 
              hasAudio: false,
              isInstructor: typeof user.uid === 'string' && user.uid.startsWith('instructor_')
            }]
          }
          return prev
        })
        // Increment participant count when a new user joins
        setParticipantCount(prev => prev + 1)
        toast.success('A new participant joined', { icon: '👋', duration: 2000 })
      })

      client.on('user-left', (user: any) => {
        console.log('User left:', user.uid)
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid))
        
        const container = document.getElementById(`remote-video-${user.uid}`)
        if (container && container.parentNode) {
          container.parentNode.removeChild(container)
        }
        
        // Decrement participant count when a user leaves
        setParticipantCount(prev => Math.max(0, prev - 1))
        toast.success('A participant left', { icon: '👋', duration: 2000 })
      })

      client.on('connection-state-change', (curState: string) => {
        console.log('Connection state:', curState)
        if (curState === 'CONNECTED') {
          setConnectionQuality('good')
        } else if (curState === 'DISCONNECTED') {
          setConnectionQuality('unknown')
        }
      })

      client.on('network-quality', (stats: any) => {
        const downlinkQuality = stats.downlinkNetworkQuality
        if (downlinkQuality <= 2) {
          setConnectionQuality('excellent')
        } else if (downlinkQuality <= 4) {
          setConnectionQuality('good')
        } else {
          setConnectionQuality('poor')
        }
      })

      return true
    }
    return true
  }

  // Get Agora token
  const getAgoraToken = async (channelName: string, uid: string): Promise<string> => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) throw new Error('Authentication required')

      const response = await fetch(`${AGORA_TOKEN_URL}?channel=${encodeURIComponent(channelName)}&uid=${encodeURIComponent(uid)}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
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

  // Join live class (Agora)
  const joinLiveClass = async () => {
    if (hasJoined) return
    setHasJoined(true)

    try {
      if (!AgoraRTC) {
        toast.error('Agora SDK not loaded')
        return
      }

      const initialized = initAgoraClient()
      if (!initialized || !agoraClientRef.current) {
        toast.error('Failed to initialize Agora client')
        return
      }

      // Use different UID prefixes for instructor and student
      const uid = userRole === 'instructor'
        ? `instructor_${currentUser?.id}`
        : `student_${currentUser?.id || Date.now()}`

      const token = await getAgoraToken(channelName, uid)
      await agoraClientRef.current.join(AGORA_APP_ID, channelName, token, uid)

      const tracks = []

      // Microphone
      try {
        localAudioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack()
        setIsAudioMuted(false)
        tracks.push(localAudioTrackRef.current)
      } catch (error) {
        console.log('Microphone not available')
        toast.error('Microphone access denied. You won\'t be able to speak.')
      }

      // Camera
      try {
        localVideoTrackRef.current = await AgoraRTC.createCameraVideoTrack()
        setIsVideoMuted(false)

        if (localVideoContainerRef.current && localVideoTrackRef.current) {
          localVideoTrackRef.current.play(localVideoContainerRef.current)
        }
        tracks.push(localVideoTrackRef.current)
      } catch (error) {
        console.log('Camera not available')
        toast.error('Camera access denied. Others won\'t see your video.')
      }

      // Publish tracks
      if (tracks.length > 0) {
        await agoraClientRef.current.publish(tracks)
      }

      setIsInLiveClass(true)
      setParticipantCount(1) // yourself

      toast.success('Successfully joined the live class!')

      // Welcome message in chat
      setMessages(prev => [...prev, {
        user: 'System',
        message: 'You joined the class',
        timestamp: new Date()
      }])

    } catch (error) {
      console.error('Error joining live class:', error)
      toast.error('Failed to join live class. Please try again.')
      setHasJoined(false)
    }
  }

  // Start class (instructor only)
  const startClass = async () => {
    const success = await updateClassStatus('ongoing')
    if (success) {
      joinLiveClass()
    }
  }

  // End class (instructor only)
  const endClass = async () => {
    if (confirm('Are you sure you want to end the class for everyone?')) {
      // Update status to completed (this will trigger polling on students to leave)
      await updateClassStatus('completed')
      // Instructor leaves the channel
      await leaveAgoraChannel()
      // Redirect to dashboard
      router.push('/dashboard/classes')
    }
  }

  // Leave Agora channel (used by both students and instructors when they click Leave)
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
      if (screenTrackRef.current) {
        screenTrackRef.current.stop()
        screenTrackRef.current.close()
      }
      
      if (agoraClientRef.current) {
        await agoraClientRef.current.leave()
      }
      
      localAudioTrackRef.current = null
      localVideoTrackRef.current = null
      screenTrackRef.current = null
      
      if (localVideoContainerRef.current) {
        localVideoContainerRef.current.innerHTML = ''
      }
      if (remoteVideoContainerRef.current) {
        remoteVideoContainerRef.current.innerHTML = ''
      }
      
      setIsInLiveClass(false)
      setRemoteUsers([])
      setParticipantCount(0)
      
      toast.success('Left the live class')
      
    } catch (error) {
      console.error('Error leaving Agora channel:', error)
      toast.error('Error leaving live class')
    }
  }

  // Toggle audio
  const toggleAudio = async () => {
    if (localAudioTrackRef.current) {
      try {
        await localAudioTrackRef.current.setEnabled(isAudioMuted)
        setIsAudioMuted(!isAudioMuted)
        toast.success(isAudioMuted ? 'Microphone unmuted' : 'Microphone muted', { duration: 1500 })
      } catch (error) {
        console.error('Error toggling audio:', error)
        toast.error('Failed to toggle microphone')
      }
    }
  }

  // Toggle video
  const toggleVideo = async () => {
    if (localVideoTrackRef.current) {
      try {
        await localVideoTrackRef.current.setEnabled(isVideoMuted)
        setIsVideoMuted(!isVideoMuted)
        toast.success(isVideoMuted ? 'Camera turned on' : 'Camera turned off', { duration: 1500 })
        // No participant count change here – only media status changes
      } catch (error) {
        console.error('Error toggling video:', error)
        toast.error('Failed to toggle camera')
      }
    } else {
      try {
        localVideoTrackRef.current = await AgoraRTC.createCameraVideoTrack()
        if (localVideoContainerRef.current) {
          localVideoTrackRef.current.play(localVideoContainerRef.current)
        }
        await agoraClientRef.current?.publish(localVideoTrackRef.current)
        setIsVideoMuted(false)
        toast.success('Camera turned on')
      } catch (error) {
        toast.error('Unable to access camera')
      }
    }
  }

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        screenTrackRef.current = await AgoraRTC.createScreenVideoTrack()
        
        if (localVideoTrackRef.current) {
          await agoraClientRef.current?.unpublish(localVideoTrackRef.current)
        }
        
        await agoraClientRef.current?.publish(screenTrackRef.current)
        
        if (localVideoContainerRef.current) {
          screenTrackRef.current.play(localVideoContainerRef.current)
        }
        
        setIsScreenSharing(true)
        toast.success('Screen sharing started')
      } catch (error) {
        console.error('Error starting screen share:', error)
        toast.error('Failed to start screen sharing')
      }
    } else {
      try {
        if (screenTrackRef.current) {
          screenTrackRef.current.stop()
          screenTrackRef.current.close()
          await agoraClientRef.current?.unpublish(screenTrackRef.current)
        }
        
        if (localVideoTrackRef.current && !isVideoMuted) {
          await agoraClientRef.current?.publish(localVideoTrackRef.current)
          if (localVideoContainerRef.current) {
            localVideoTrackRef.current.play(localVideoContainerRef.current)
          }
        }
        
        setIsScreenSharing(false)
        toast.success('Screen sharing stopped')
      } catch (error) {
        console.error('Error stopping screen share:', error)
        toast.error('Failed to stop screen sharing')
      }
    }
  }

  // Toggle full screen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullScreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullScreen(false)
      }
    }
  }

  // Send chat message
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setMessages(prev => [...prev, {
      user: currentUser?.name || 'You',
      message: newMessage,
      timestamp: new Date()
    }])
    setNewMessage('')
    // TODO: Broadcast message via Agora RTM or WebSocket
  }

  // Handle leave button (for students)
  const handleLeave = () => {
    if (confirm('Are you sure you want to leave the live class?')) {
      leaveAgoraChannel()
      router.push('/dashboard/classes')
    }
  }

  // Poll for class status changes when in live class (to detect instructor ending the class)
  useEffect(() => {
    if (!isInLiveClass || !classData || classData.status !== 'ongoing') return

    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) return
        const response = await fetch(`${API_BASE_URL}/classes/${classId}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        })
        if (response.ok) {
          const data = await response.json()
          const newStatus = data.data?.status || data.status
          if (newStatus === 'completed') {
            toast.info('The class has ended.')
            await leaveAgoraChannel()
            router.push('/dashboard/classes')
          }
        }
      } catch (error) {
        console.error('Error polling class status:', error)
      }
    }, 5000) // every 5 seconds

    return () => clearInterval(interval)
  }, [isInLiveClass, classData?.status, classId])

  // Initialize: get user then fetch details
  useEffect(() => {
    const initialize = async () => {
      const user = await getCurrentUser()
      if (user) {
        await fetchClassDetails(user)
      }
    }
    initialize()

    return () => {
      if (isInLiveClass) {
        leaveAgoraChannel()
      }
    }
  }, [classId])

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="w-16 h-16 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-white text-lg">Joining live class...</p>
        </div>
      </div>
    )
  }

  // If no class data (error)
  if (!classData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-white text-lg">Failed to load class</p>
          <Button onClick={() => router.push('/dashboard/classes')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // ----- Render based on status and role -----
  const showLiveUI = classData.status === 'ongoing' || isInLiveClass
  const showInstructorStart = userRole === 'instructor' && classData.status === 'scheduled' && !isInLiveClass
  const showStudentWaiting = userRole === 'student' && classData.status === 'scheduled' && !isInLiveClass

  // If waiting for start (instructor or student)
  if (showInstructorStart || showStudentWaiting) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {/* Top Bar (minimal) */}
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/classes')}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="bg-gray-800 border-gray-700 max-w-md w-full">
            <CardContent className="p-8 text-center">
              {showInstructorStart ? (
                <>
                  <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Ready to start?</h2>
                  <p className="text-gray-400 mb-6">
                    This class is scheduled for {classData.date} at {classData.time}.<br />
                    Click the button below to begin the live session.
                  </p>
                  <Button
                    onClick={startClass}
                    size="lg"
                    className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Class Now
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Class hasn't started yet</h2>
                  <p className="text-gray-400 mb-2">
                    This class is scheduled for {classData.date} at {classData.time}.
                  </p>
                  <p className="text-gray-500">
                    You'll be able to join when the instructor starts the session.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Live UI (class ongoing or we've joined)
  if (showLiveUI) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {/* Top Bar */}
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeave}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Leave
            </Button>
            
            <div>
              <h1 className="text-white font-semibold">{classData.title}</h1>
              <p className="text-sm text-gray-400">with {classData.instructor}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection Quality */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${
                connectionQuality === 'excellent' ? 'bg-green-500' :
                connectionQuality === 'good' ? 'bg-yellow-500' :
                connectionQuality === 'poor' ? 'bg-red-500' : 'bg-gray-500'
              }`} />
              <span className="text-sm text-gray-300">
                {connectionQuality === 'excellent' ? 'Excellent' :
                 connectionQuality === 'good' ? 'Good' :
                 connectionQuality === 'poor' ? 'Poor' : 'Connecting...'}
              </span>
            </div>

            {/* Participant Count */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 rounded-lg">
              <Users className="w-4 h-4 text-gray-300" />
              <span className="text-sm text-gray-300">{participantCount}</span>
            </div>

            {/* Class Status */}
            <Badge className="bg-green-600 animate-pulse">LIVE</Badge>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Video Section */}
          <div className={`flex-1 flex flex-col ${showChat ? 'w-3/4' : 'w-full'}`}>
            {/* Main Video Grid */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
                {/* Local Video (Self) */}
                <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden border-2 border-indigo-500">
                  <div ref={localVideoContainerRef} className="w-full h-full" />
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm flex items-center gap-2">
                    <span>You</span>
                    {!isVideoMuted && <Video className="w-4 h-4" />}
                    {!isAudioMuted && <Mic className="w-4 h-4" />}
                  </div>
                  {isScreenSharing && (
                    <Badge className="absolute top-2 right-2 bg-purple-600">
                      Sharing Screen
                    </Badge>
                  )}
                </div>

                {/* Remote Videos */}
                <div ref={remoteVideoContainerRef} className="contents" />
                
                {/* Placeholder for remote users without video */}
                {remoteUsers.filter(u => !u.hasVideo).map(user => (
                  <div key={user.uid} className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Users className="w-10 h-10 text-white" />
                      </div>
                      <p className="text-white font-medium">
                        {user.isInstructor ? 'Instructor' : `Student ${String(user.uid).slice(-4)}`}
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        {user.hasAudio && <Mic className="w-4 h-4 text-green-500" />}
                        {!user.hasAudio && <MicOff className="w-4 h-4 text-red-500" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Control Bar */}
            <div className="bg-gray-800 border-t border-gray-700 px-4 py-3">
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant={isAudioMuted ? "destructive" : "outline"}
                  size="lg"
                  onClick={toggleAudio}
                  className="rounded-full w-12 h-12 p-0"
                  disabled={!localAudioTrackRef.current && !isAudioMuted}
                >
                  {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>

                <Button
                  variant={isVideoMuted ? "destructive" : "outline"}
                  size="lg"
                  onClick={toggleVideo}
                  className="rounded-full w-12 h-12 p-0"
                >
                  {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={toggleScreenShare}
                  className="rounded-full w-12 h-12 p-0"
                  disabled={!isInLiveClass}
                >
                  <ScreenShare className="w-5 h-5" />
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowChat(!showChat)}
                  className="rounded-full w-12 h-12 p-0 relative"
                >
                  <MessageSquare className="w-5 h-5" />
                  {messages.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {messages.length}
                    </span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={toggleFullScreen}
                  className="rounded-full w-12 h-12 p-0"
                >
                  {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </Button>

                {userRole === 'instructor' ? (
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={endClass}
                    className="rounded-full w-12 h-12 p-0 bg-red-600 hover:bg-red-700"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={handleLeave}
                    className="rounded-full w-12 h-12 p-0 bg-red-600 hover:bg-red-700"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Chat Section */}
          {showChat && (
            <div className="w-1/4 bg-gray-800 border-l border-gray-700 flex flex-col">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-white font-semibold">Class Chat</h3>
              </div>

              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                  <div key={index} className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-indigo-400">{msg.user}</span>
                      <span className="text-xs text-gray-500">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mt-1">{msg.message}</p>
                  </div>
                ))}

                {messages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No messages yet</p>
                    <p className="text-sm">Be the first to say hello!</p>
                  </div>
                )}
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Button type="submit" size="sm">
                    Send
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}