'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { 
  Mic, 
  MicOff, 
  Monitor, 
  MonitorOff, 
  X, 
  Users, 
  User, 
  Copy, 
  Zap, 
  Loader2,
  AlertCircle,
  Video,
  UserPlus,
  ChevronLeft,
  Download,
  Calendar,
  Clock,
  MessageSquare,
  Shield,
  Volume2,
  VolumeX
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/Dialog'
import { Input } from '../../../components/ui/Input'
import { Textarea } from '../../../components/ui/Textarea'

// Import Agora SDK only on client side
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

interface Participant {
  uid: string | number;
  hasVideo: boolean;
  hasAudio: boolean;
}

interface ClassData {
  id: number;
  title: string;
  instructor: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  category: string;
  maxAttendees: number;
  attendees: number;
  type: string;
  status: string;
  tags: string[];
  recordingUrl: string;
}

export default function LiveClassPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const classId = params.id as string
  
  // Agora states
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [remoteUsers, setRemoteUsers] = useState<Participant[]>([])
  const [channelName, setChannelName] = useState<string>('')
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [classData, setClassData] = useState<ClassData | null>(null)
  const [participantName, setParticipantName] = useState<string>('')
  const [chatMessages, setChatMessages] = useState<Array<{user: string, message: string, time: string}>>([])
  const [newMessage, setNewMessage] = useState('')
  
  // Agora refs
  const agoraClientRef = useRef<any>(null)
  const localVideoTrackRef = useRef<any>(null)
  const localAudioTrackRef = useRef<any>(null)
  const screenTrackRef = useRef<any>(null)
  const localVideoContainerRef = useRef<HTMLDivElement>(null)
  const remoteVideoContainerRef = useRef<HTMLDivElement>(null)
  
  // Fetch class data
  const fetchClassData = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('Authentication required')
        router.push('/admin/login')
        return
      }

      const response = await fetch(`${API_BASE_URL}/admin/classes/${classId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setClassData(data)
        
        // Get channel from URL parameters
        const channel = searchParams.get('channel') || `class-${classId}-${Date.now()}`
        setChannelName(channel)
        
        // Set instructor name
        setParticipantName(data.instructor || 'Instructor')
        
        setIsLoading(false)
        
      } else {
        throw new Error('Failed to load class data')
      }
    } catch (error) {
      console.error('Error fetching class data:', error)
      toast.error('Failed to load class data')
      router.push('/admin/classes')
    }
  }

  // Initialize Agora RTC client
  const initAgoraClient = () => {
    if (!AgoraRTC) {
      console.error('Agora SDK not loaded yet')
      return null
    }
    
    if (!agoraClientRef.current) {
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      agoraClientRef.current = client
      
      // Store container references for cleanup
      const containers = new Map<string, HTMLDivElement>()
      
      // Listen for user events
      client.on('user-published', async (user: any, mediaType: string) => {
        console.log('User published:', user.uid, 'mediaType:', mediaType)
        
        try {
          await client.subscribe(user, mediaType)
          
          if (mediaType === 'video') {
            const remoteVideoTrack = user.videoTrack
            if (remoteVideoTrack) {
              // Create a container for the remote user
              const remoteContainer = document.createElement('div')
              remoteContainer.className = 'relative w-full h-full min-h-[200px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden'
              remoteContainer.id = `remote-video-${user.uid}`
              
              // Create video element
              const videoElement = document.createElement('div')
              videoElement.id = `video-element-${user.uid}`
              videoElement.className = 'w-full h-full'
              remoteContainer.appendChild(videoElement)
              
              // Add user info overlay
              const userInfo = document.createElement('div')
              userInfo.className = 'absolute bottom-2 left-2 bg-black/50 text-white px-3 py-1 rounded-full text-sm'
              userInfo.textContent = `Student ${String(user.uid).slice(-4)}`
              remoteContainer.appendChild(userInfo)
              
              // Store reference
              containers.set(`remote-video-${user.uid}`, remoteContainer)
              
              // Add to remote video container
              if (remoteVideoContainerRef.current) {
                try {
                  remoteVideoContainerRef.current.appendChild(remoteContainer)
                  console.log('Added video container for user:', user.uid)
                } catch (e) {
                  console.error('Error appending container:', e)
                }
              }
              
              try {
                remoteVideoTrack.play(videoElement)
                console.log('Playing video for user:', user.uid)
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
                console.log('Playing audio for user:', user.uid)
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
        } catch (error) {
          console.error('Error subscribing to user:', error)
        }
      })

      client.on('user-unpublished', (user: any, mediaType: string) => {
        console.log('User unpublished:', user.uid, 'mediaType:', mediaType)
        
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
                console.log('Removed video container for user:', user.uid)
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
        
        // Add chat message
        setChatMessages(prev => [...prev, {
          user: 'System',
          message: `Student ${String(user.uid).slice(-4)} joined the class`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }])
        
        // Add to remote users list if not already present
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
        
        // Add chat message
        setChatMessages(prev => [...prev, {
          user: 'System',
          message: `Student ${String(user.uid).slice(-4)} left the class`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }])
        
        // Remove from remote users list
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid))
        
        // Remove video container safely
        const containerId = `remote-video-${user.uid}`
        const remoteContainer = containers.get(containerId)
        
        if (remoteContainer) {
          try {
            if (remoteContainer.parentNode) {
              remoteContainer.parentNode.removeChild(remoteContainer)
              console.log('Removed video container on user-left for user:', user.uid)
            }
          } catch (e) {
            console.error('Error removing container on user-left:', e)
          }
          containers.delete(containerId)
        }
      })
    }
    
    return agoraClientRef.current
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
        console.log('Got Agora token')
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

  // Join Agora channel
  const joinAgoraChannel = async () => {
    try {
      setIsJoining(true)
      
      if (!AgoraRTC) {
        throw new Error('Agora SDK not loaded')
      }
      
      if (!channelName || channelName.trim() === '') {
        throw new Error('Channel name is required')
      }
      
      const client = initAgoraClient()
      if (!client) {
        throw new Error('Agora client not initialized')
      }

      // Get token from backend
      console.log('Getting token for channel:', channelName)
      const token = await getAgoraToken(channelName, 'instructor')
      
      // Join the channel
      console.log('Joining channel:', channelName, 'with token')
      await client.join(AGORA_APP_ID, channelName, token, 'instructor')
      console.log('Successfully joined channel:', channelName)
      
      // Create local tracks
      try {
        localAudioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack()
        localVideoTrackRef.current = await AgoraRTC.createCameraVideoTrack()
        console.log('Created local tracks')
      } catch (error) {
        console.error('Error creating local tracks:', error)
        throw error
      }
      
      // Play local video
      if (localVideoContainerRef.current && localVideoTrackRef.current) {
        try {
          localVideoTrackRef.current.play(localVideoContainerRef.current)
          console.log('Playing local video')
        } catch (error) {
          console.error('Error playing local video:', error)
        }
      }
      
      // Publish local tracks
      try {
        await client.publish([localAudioTrackRef.current, localVideoTrackRef.current])
        console.log('Published local tracks')
      } catch (error) {
        console.error('Error publishing tracks:', error)
        throw error
      }
      
      // Update class status to ongoing
      await updateClassStatus('ongoing')
      
      setIsJoining(false)
      toast.success('Live class started successfully')
      
      // Add welcome message to chat
      setChatMessages([{
        user: 'System',
        message: 'Live class has started. Welcome students!',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
      
    } catch (error) {
      console.error('Error joining Agora channel:', error)
      toast.error('Failed to start live class: ' + (error as Error).message)
      setIsJoining(false)
    }
  }

  // Leave Agora channel
  const leaveAgoraChannel = async () => {
    try {
      console.log('Leaving Agora channel...')
      
      // Stop and close local tracks
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
      
      // Leave the channel
      if (agoraClientRef.current) {
        await agoraClientRef.current.leave()
      }
      
      // Clear refs
      localAudioTrackRef.current = null
      localVideoTrackRef.current = null
      screenTrackRef.current = null
      
      // Clear video containers
      if (localVideoContainerRef.current) {
        localVideoContainerRef.current.innerHTML = ''
      }
      if (remoteVideoContainerRef.current) {
        remoteVideoContainerRef.current.innerHTML = ''
      }
      
      setIsAudioMuted(false)
      setIsVideoMuted(false)
      setIsScreenSharing(false)
      setRemoteUsers([])
      
      console.log('Successfully left channel')
      
    } catch (error) {
      console.error('Error leaving Agora channel:', error)
    }
  }

  // Toggle audio mute
  const toggleAudio = async () => {
    if (localAudioTrackRef.current) {
      try {
        if (isAudioMuted) {
          await localAudioTrackRef.current.setEnabled(true)
          toast.success('Microphone unmuted')
        } else {
          await localAudioTrackRef.current.setEnabled(false)
          toast.success('Microphone muted')
        }
        setIsAudioMuted(!isAudioMuted)
      } catch (error) {
        console.error('Error toggling audio:', error)
        toast.error('Failed to toggle microphone')
      }
    }
  }

  // Toggle video mute
  const toggleVideo = async () => {
    if (localVideoTrackRef.current) {
      try {
        if (isVideoMuted) {
          await localVideoTrackRef.current.setEnabled(true)
          toast.success('Camera turned on')
        } else {
          await localVideoTrackRef.current.setEnabled(false)
          toast.success('Camera turned off')
        }
        setIsVideoMuted(!isVideoMuted)
      } catch (error) {
        console.error('Error toggling video:', error)
        toast.error('Failed to toggle camera')
      }
    }
  }

  // Start/stop screen sharing
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        if (!AgoraRTC) {
          throw new Error('Agora SDK not loaded')
        }
        
        if (!agoraClientRef.current) {
          throw new Error('Not connected to channel')
        }
        
        // Create screen track
        screenTrackRef.current = await AgoraRTC.createScreenVideoTrack({
          encoderConfig: '1080p_1',
        })
        
        // Stop camera track
        if (localVideoTrackRef.current) {
          await agoraClientRef.current.unpublish(localVideoTrackRef.current)
          localVideoTrackRef.current.stop()
          localVideoTrackRef.current.close()
        }
        
        // Publish screen track
        await agoraClientRef.current.publish(screenTrackRef.current)
        
        // Play screen track in local container
        if (localVideoContainerRef.current) {
          localVideoContainerRef.current.innerHTML = ''
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
        if (!agoraClientRef.current) {
          throw new Error('Not connected to channel')
        }
        
        // Unpublish screen track
        if (screenTrackRef.current) {
          await agoraClientRef.current.unpublish(screenTrackRef.current)
          screenTrackRef.current.stop()
          screenTrackRef.current.close()
          screenTrackRef.current = null
        }
        
        // Create and publish camera track
        localVideoTrackRef.current = await AgoraRTC.createCameraVideoTrack()
        await agoraClientRef.current.publish(localVideoTrackRef.current)
        
        // Play camera track in local container
        if (localVideoContainerRef.current && localVideoTrackRef.current) {
          localVideoContainerRef.current.innerHTML = ''
          localVideoTrackRef.current.play(localVideoContainerRef.current)
        }
        
        setIsScreenSharing(false)
        toast.success('Screen sharing stopped')
        
      } catch (error) {
        console.error('Error stopping screen share:', error)
        toast.error('Failed to stop screen sharing')
      }
    }
  }

  // Update class status
  const updateClassStatus = async (status: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('Authentication required')
      }

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
        console.log('Class status updated:', data.message)
      } else {
        const errorData = await response.json()
        console.error('Failed to update class status:', errorData.message)
      }
    } catch (error) {
      console.error('Error updating class status:', error)
    }
  }

  // End class
  const endClass = async () => {
    try {
      // Leave Agora channel
      await leaveAgoraChannel()
      
      // Update class status to completed
      await updateClassStatus('completed')
      
      // Show success message
      toast.success('Class ended successfully')
      
      // Redirect to classes page
      router.push('/admin/classes')
      
    } catch (error) {
      console.error('Error ending class:', error)
      toast.error('Failed to end class')
    }
  }

  // Copy class link to clipboard
  const copyClassLink = () => {
    const classLink = `${window.location.origin}/student/class/${classId}?channel=${channelName}`
    navigator.clipboard.writeText(classLink)
      .then(() => toast.success('Class link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy link'))
  }

  // Copy channel name
  const copyChannelName = () => {
    navigator.clipboard.writeText(channelName)
      .then(() => toast.success('Channel name copied!'))
      .catch(() => toast.error('Failed to copy channel name'))
  }

  // Send chat message
  const sendChatMessage = () => {
    if (newMessage.trim()) {
      setChatMessages(prev => [...prev, {
        user: participantName,
        message: newMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
      setNewMessage('')
    }
  }

  // Download attendance
  const downloadAttendance = () => {
    const attendanceData = {
      class: classData?.title,
      instructor: classData?.instructor,
      date: classData?.date,
      time: new Date().toLocaleTimeString(),
      startTime: new Date().toLocaleTimeString(),
      endTime: new Date().toLocaleTimeString(),
      duration: classData?.duration,
      channel: channelName,
      participants: [
        { uid: 'instructor', name: classData?.instructor, role: 'Instructor', joined: new Date().toISOString() },
        ...remoteUsers.map(user => ({
          uid: user.uid,
          name: `Student ${String(user.uid).slice(-4)}`,
          role: 'Student',
          joined: new Date().toISOString(),
          video: user.hasVideo ? 'On' : 'Off',
          audio: user.hasAudio ? 'On' : 'Off'
        }))
      ],
      totalParticipants: remoteUsers.length + 1,
      statistics: {
        maxCapacity: classData?.maxAttendees || 0,
        attendanceRate: ((remoteUsers.length + 1) / (classData?.maxAttendees || 1) * 100).toFixed(2) + '%'
      }
    }
    
    const blob = new Blob([JSON.stringify(attendanceData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-${classId}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Attendance report downloaded')
  }

  // Load data and join channel on mount
  useEffect(() => {
    const init = async () => {
      await fetchClassData()
    }
    
    init()
    
    // Cleanup on unmount
    return () => {
      if (agoraClientRef.current) {
        leaveAgoraChannel()
      }
    }
  }, [])

  // Join channel when class data is loaded
  useEffect(() => {
    if (classData && channelName && !isJoining) {
      joinAgoraChannel()
    }
  }, [classData, channelName])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-indigo-600 animate-spin" />
          <p className="text-gray-600">Loading class data...</p>
          <p className="text-sm text-gray-400 mt-2">Preparing your live class environment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/classes')}
          className="mb-4 gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Classes
        </Button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {classData?.title || 'Live Class'}
            </h1>
            <p className="text-gray-600 mt-1">
              {classData?.instructor} • {classData?.duration} • {classData?.category}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white gap-1">
              <Zap className="w-3 h-3" />
              LIVE
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Users className="w-3 h-3" />
              {remoteUsers.length + 1} Participants
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={copyClassLink}
              className="gap-1"
            >
              <Copy className="w-4 h-4" />
              Copy Link
            </Button>
          </div>
        </div>
      </div>

      {isJoining ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-indigo-600 animate-spin" />
            <p className="text-gray-600">Connecting to live class...</p>
            <p className="text-sm text-gray-400 mt-2">Please wait while we establish the connection</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Video & Controls */}
          <div className="lg:col-span-3 space-y-6">
            {/* Local Video */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    You (Instructor)
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {isAudioMuted ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    )}
                    {isVideoMuted ? (
                      <span className="text-rose-400 text-sm">Camera Off</span>
                    ) : (
                      <span className="text-emerald-400 text-sm">Camera On</span>
                    )}
                    {isScreenSharing && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">
                        Screen Sharing
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div 
                  ref={localVideoContainerRef}
                  className="w-full h-64 md:h-96 bg-gradient-to-br from-gray-900 to-gray-800 relative"
                >
                  {isVideoMuted && !isScreenSharing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Video className="w-16 h-16 text-gray-400 mb-4" />
                      <p className="text-gray-300">Camera is off</p>
                    </div>
                  )}
                  {isScreenSharing && (
                    <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm">
                      Sharing Screen
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm">
                    {participantName}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Remote Videos Grid */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Students ({remoteUsers.length})
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyClassLink}
                      className="gap-1"
                    >
                      <UserPlus className="w-4 h-4" />
                      Invite
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyChannelName}
                      className="gap-1"
                    >
                      <Copy className="w-4 h-4" />
                      Channel
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  ref={remoteVideoContainerRef}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 min-h-[200px]"
                >
                  {remoteUsers.length === 0 && (
                    <div className="col-span-3 flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-200 rounded-lg">
                      <Users className="w-16 h-16 text-gray-300 mb-4" />
                      <p className="text-gray-500">Waiting for students to join...</p>
                      <p className="text-sm text-gray-400 mt-2">Share the class link with your students</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    size="lg"
                    variant={isAudioMuted ? "destructive" : "outline"}
                    className="gap-2 rounded-full px-6"
                    onClick={toggleAudio}
                  >
                    {isAudioMuted ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                    {isAudioMuted ? 'Unmute' : 'Mute'}
                  </Button>

                  <Button
                    size="lg"
                    variant={isVideoMuted ? "destructive" : "outline"}
                    className="gap-2 rounded-full px-6"
                    onClick={toggleVideo}
                  >
                    {isVideoMuted ? (
                      <MonitorOff className="w-5 h-5" />
                    ) : (
                      <Monitor className="w-5 h-5" />
                    )}
                    {isVideoMuted ? 'Show Video' : 'Hide Video'}
                  </Button>

                  <Button
                    size="lg"
                    variant={isScreenSharing ? "default" : "outline"}
                    className="gap-2 rounded-full px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                    onClick={toggleScreenShare}
                  >
                    <Monitor className="w-5 h-5" />
                    {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 rounded-full px-6 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => setShowEndDialog(true)}
                  >
                    <X className="w-5 h-5" />
                    End Class
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Info, Participants & Chat */}
          <div className="space-y-6">
            {/* Class Info */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Class Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Title</p>
                  <p className="font-semibold text-gray-900">{classData?.title}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Instructor</p>
                  <p className="font-semibold text-gray-900">{classData?.instructor}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Schedule</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-900">{classData?.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-900">{classData?.time} • {classData?.duration}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Attendance</p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">
                      {remoteUsers.length + 1}/{classData?.maxAttendees}
                    </span>
                    <span className="text-sm font-semibold text-emerald-600">
                      {Math.round(((remoteUsers.length + 1) / (classData?.maxAttendees || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-500"
                      style={{ 
                        width: `${Math.round(((remoteUsers.length + 1) / (classData?.maxAttendees || 1)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Channel</p>
                  <div className="flex gap-2">
                    <Input
                      value={channelName}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyChannelName}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={downloadAttendance}
                  >
                    <Download className="w-4 h-4" />
                    Download Attendance
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Chat */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Class Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 overflow-y-auto space-y-3 mb-4 p-2">
                  {chatMessages.map((msg, index) => (
                    <div key={index} className={`p-2 rounded-lg ${
                      msg.user === 'System' 
                        ? 'bg-blue-50 text-blue-800' 
                        : msg.user === participantName
                        ? 'bg-indigo-50 text-indigo-800 ml-4'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-sm">{msg.user}</span>
                        <span className="text-xs text-gray-500">{msg.time}</span>
                      </div>
                      <p className="text-sm mt-1">{msg.message}</p>
                    </div>
                  ))}
                  {chatMessages.length === 0 && (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No messages yet</p>
                      <p className="text-sm text-gray-400">Start the conversation!</p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    className="flex-1"
                  />
                  <Button onClick={sendChatMessage}>
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* End Class Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent className="border-0 shadow-2xl">
          <div className="p-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-rose-100 to-red-100">
              <AlertCircle className="h-6 w-6 text-rose-600" />
            </div>
          </div>
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl text-gray-900">End Live Class</DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to end the live class? This action cannot be undone and all participants will be disconnected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowEndDialog(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 gap-2"
              onClick={endClass}
            >
              <X className="w-4 h-4" />
              End Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}