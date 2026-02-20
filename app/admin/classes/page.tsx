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
  Edit,
  Trash2,
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
  Upload,
  FileText,
  Image,
  File,
  FolderOpen,
  Link,
  Folder,
  FileVideo,
  FileAudio,
  FileImage,
  FileArchive,
  Plus,
  FileUp
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
import { Switch } from '../../components/ui/Switch'
import { toast } from 'react-hot-toast'
import { Class, ClassForm, Stats, ClassStatus, ClassType, LearningResource } from '../../types/class'

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

// Categories from backend
const categories = ['All', 'Programming', 'Design', 'Data Science', 'Computer Science', 'Business', 'Finance', 'Trading']
const statuses = ['All', 'scheduled', 'ongoing', 'completed', 'cancelled', 'published']
const classTypes = ['All', 'live', 'recorded']
const tagOptions = ['JavaScript', 'React', 'Python', 'Web Development', 'Data Science', 'AI', 'UI/UX', 'Beginner', 'Advanced', 'Trading', 'Forex', 'Stocks', 'Crypto']

// Resource types
const resourceTypes = ['document', 'video', 'audio', 'image', 'presentation', 'spreadsheet', 'archive', 'other']

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedType, setSelectedType] = useState('All')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [showLiveClassDialog, setShowLiveClassDialog] = useState(false)
  const [showResourcesDialog, setShowResourcesDialog] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingResources, setIsUploadingResources] = useState(false)
  const [liveClassData, setLiveClassData] = useState<any>(null)
  const [classResources, setClassResources] = useState<LearningResource[]>([])
  
  // Agora states
  const [isInLiveClass, setIsInLiveClass] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [remoteUsers, setRemoteUsers] = useState<{uid: string | number, hasVideo: boolean, hasAudio: boolean}[]>([])
  const [channelName, setChannelName] = useState<string>('')
  const [agoraToken, setAgoraToken] = useState<string>('')
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Agora refs
  const agoraClientRef = useRef<any>(null)
  const localVideoTrackRef = useRef<any>(null)
  const localAudioTrackRef = useRef<any>(null)
  const screenTrackRef = useRef<any>(null)
  const localVideoContainerRef = useRef<HTMLDivElement>(null)
  const remoteVideoContainerRef = useRef<HTMLDivElement>(null)

  const [stats, setStats] = useState<Stats>({
    total: 0,
    live: 0,
    recorded: 0,
    upcoming: 0,
    participants: 0
  })

  // Form state for new/edit class
  const [classForm, setClassForm] = useState<ClassForm>({
    title: '',
    instructor: '',
    date: '',
    time: '',
    duration: '',
    maxAttendees: '',
    type: 'live',
    category: 'Programming',
    description: '',
    tags: [],
    recordingUrl: '',
    recordSession: false,
    recordingQuality: 'high',
    resources: []
  })

  // Initialize Agora RTC client
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
      
      // Listen for user events
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
        // Remove from remote users list
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid))
        
        // Remove video container safely
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

  // Join Agora channel
  const joinAgoraChannel = async (channelName: string, uid: string) => {
    try {
      if (!AgoraRTC) {
        throw new Error('Agora SDK not loaded')
      }
      
      // Validate channel name
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
      
      // Create local tracks
      localAudioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack()
      localVideoTrackRef.current = await AgoraRTC.createCameraVideoTrack()
      
      // Play local video
      if (localVideoContainerRef.current && localVideoTrackRef.current) {
        localVideoTrackRef.current.play(localVideoContainerRef.current)
      }
      
      // Publish local tracks
      await agoraClientRef.current.publish([localAudioTrackRef.current, localVideoTrackRef.current])
      
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
      // Stop recording if active
      if (isRecording) {
        await stopRecording()
      }
      
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
      
      setIsInLiveClass(false)
      setRemoteUsers([])
      setIsAudioMuted(false)
      setIsVideoMuted(false)
      setIsScreenSharing(false)
      
      toast.success('Left the live class')
      
    } catch (error) {
      console.error('Error leaving Agora channel:', error)
      toast.error('Error leaving live class')
    }
  }

  // Toggle audio mute
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

  // Toggle video mute
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

  // Start/stop screen sharing
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        if (!AgoraRTC) {
          throw new Error('Agora SDK not loaded')
        }
        
        // Create screen track
        screenTrackRef.current = await AgoraRTC.createScreenVideoTrack({
          encoderConfig: '1080p_1',
        })
        
        // Stop camera track
        if (localVideoTrackRef.current) {
          await agoraClientRef.current?.unpublish(localVideoTrackRef.current)
          localVideoTrackRef.current.stop()
          localVideoTrackRef.current.close()
        }
        
        // Publish screen track
        await agoraClientRef.current?.publish(screenTrackRef.current)
        
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
        // Unpublish screen track
        if (screenTrackRef.current) {
          await agoraClientRef.current?.unpublish(screenTrackRef.current)
          screenTrackRef.current.stop()
          screenTrackRef.current.close()
          screenTrackRef.current = null
        }
        
        // Create and publish camera track
        localVideoTrackRef.current = await AgoraRTC.createCameraVideoTrack()
        await agoraClientRef.current?.publish(localVideoTrackRef.current)
        
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

  // Start recording
  const startRecording = async () => {
    try {
      if (!selectedClass) {
        toast.error('No class selected')
        return
      }
      
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch(`${API_BASE_URL}/admin/classes/${selectedClass.id}/start-recording`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel_name: channelName,
          quality: classForm.recordingQuality
        }),
      })

      if (response.ok) {
        setIsRecording(true)
        setRecordingTime(0)
        
        // Start timer
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
        
        toast.success('Recording started')
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to start recording')
      }
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Failed to start recording')
    }
  }

  // Stop recording
  const stopRecording = async () => {
    try {
      if (!selectedClass || !isRecording) return
      
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch(`${API_BASE_URL}/admin/classes/${selectedClass.id}/stop-recording`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel_name: channelName
        }),
      })

      if (response.ok) {
        setIsRecording(false)
        
        // Clear timer
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current)
          recordingTimerRef.current = null
        }
        
        toast.success('Recording stopped and saved')
        
        // Refresh classes to get updated recording URL
        fetchClasses()
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to stop recording')
      }
    } catch (error) {
      console.error('Error stopping recording:', error)
      toast.error('Failed to stop recording')
    }
  }

  // Format recording time
  const formatRecordingTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Start a live class
  const startLiveClass = async (classItem: Class) => {
    try {
      setSelectedClass(classItem)
      const newChannelName = `class-${classItem.id}-${Date.now()}`
      setChannelName(newChannelName)
      setLiveClassData({
        title: classItem.title,
        instructor: classItem.instructor,
        participants: classItem.attendees,
        startTime: new Date().toISOString(),
        channelName: newChannelName
      })
      setShowLiveClassDialog(true)
      
    } catch (error) {
      console.error('Error starting live class:', error)
      toast.error('Failed to start live class')
    }
  }

  // Join as instructor
  const joinAsInstructor = async () => {
    if (!selectedClass) {
      toast.error('No class selected')
      return
    }
    
    try {
      // Generate channel name if not set
      const channel = channelName || `class-${selectedClass.id}-${Date.now()}`
      
      // If channelName state is empty, set it
      if (!channelName) {
        setChannelName(channel)
      }
      
      console.log('Joining channel:', channel, 'as uid: instructor')
      await joinAgoraChannel(channel, 'instructor')
      
      // Update class status to ongoing
      await updateClassStatus(selectedClass.id, 'ongoing')
      
      // Start recording if enabled
      if (classForm.recordSession) {
        setTimeout(() => startRecording(), 2000) // Start recording after 2 seconds
      }
      
    } catch (error) {
      console.error('Error joining as instructor:', error)
    }
  }

  // Copy class link to clipboard
  const copyClassLink = () => {
    const classLink = `${window.location.origin}/class/${selectedClass?.id}?channel=${channelName}`
    navigator.clipboard.writeText(classLink)
      .then(() => toast.success('Class link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy link'))
  }

  // Fetch classes from Laravel API
  const fetchClasses = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch(`${API_BASE_URL}/admin/classes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setClasses(data.data || data)
        toast.success('Classes loaded successfully')
      } else if (response.status === 401) {
        toast.error('Session expired. Please login again.')
        window.location.href = '/admin/login'
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

  // Fetch class resources
  const fetchClassResources = async (classId: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch(`${API_BASE_URL}/admin/classes/${classId}/resources`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setClassResources(data.data || data)
      }
    } catch (error) {
      console.error('Error fetching resources:', error)
    }
  }

  // Upload learning resources
  const uploadResources = async (classId: number, resources: File[]) => {
    try {
      setIsUploadingResources(true)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('Authentication required')
        return false
      }

      const formData = new FormData()
      resources.forEach(file => {
        formData.append('resources[]', file)
      })

      const response = await fetch(`${API_BASE_URL}/admin/classes/${classId}/upload-resources`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || 'Resources uploaded successfully')
        
        // Refresh resources
        fetchClassResources(classId)
        
        // Update class form resources
        const newResources = resources.map(file => ({
          name: file.name,
          size: file.size,
          type: getFileType(file),
          url: URL.createObjectURL(file) // Temporary URL for preview
        }))
        
        setClassForm(prev => ({
          ...prev,
          resources: [...(prev.resources || []), ...newResources]
        }))
        
        return true
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to upload resources')
        return false
      }
    } catch (error) {
      console.error('Error uploading resources:', error)
      toast.error('Failed to upload resources')
      return false
    } finally {
      setIsUploadingResources(false)
    }
  }

  // Delete resource
  const deleteResource = async (classId: number, resourceId: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('Authentication required')
        return false
      }

      const response = await fetch(`${API_BASE_URL}/admin/classes/${classId}/resources/${resourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || 'Resource deleted successfully')
        
        // Refresh resources
        fetchClassResources(classId)
        
        return true
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to delete resource')
        return false
      }
    } catch (error) {
      console.error('Error deleting resource:', error)
      toast.error('Failed to delete resource')
      return false
    }
  }

  // Fetch class statistics
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      
      if (!token) return

      const response = await fetch(`${API_BASE_URL}/admin/classes/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  // Create or update class
  const saveClass = async (formData: ClassForm, classId?: number) => {
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('Authentication required')
        return false
      }

      const url = classId 
        ? `${API_BASE_URL}/admin/classes/${classId}`
        : `${API_BASE_URL}/admin/classes`
      
      const method = classId ? 'PUT' : 'POST'

      // Format data for Laravel
      const requestData = {
        title: formData.title,
        instructor: formData.instructor,
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        max_attendees: parseInt(formData.maxAttendees),
        type: formData.type,
        category: formData.category,
        description: formData.description,
        tags: formData.tags,
        recording_url: formData.recordingUrl || null,
        record_session: formData.recordSession || false,
        recording_quality: formData.recordingQuality || 'high',
        status: formData.type === 'recorded' ? 'published' : 'scheduled'
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || (classId ? 'Class updated successfully' : 'Class created successfully'))
        
        // Upload resources if any
        if (formData.resources && formData.resources.length > 0) {
          const classIdToUse = classId || data.data?.id || data.id
          if (classIdToUse) {
            // Handle resource uploads here if you have actual files
            // This would require additional implementation for file uploads
          }
        }
        
        fetchClasses()
        fetchStats()
        return true
      } else {
        const errorData = await response.json()
        if (response.status === 422) {
          const errorMessages = Object.values(errorData.errors || {}).flat()
          errorMessages.forEach(msg => toast.error(msg as string))
        } else {
          toast.error(errorData.message || 'Failed to save class')
        }
        return false
      }
    } catch (error) {
      console.error('Error saving class:', error)
      toast.error('Failed to connect to server')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete class
  const deleteClass = async (id: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('Authentication required')
        return false
      }

      const response = await fetch(`${API_BASE_URL}/admin/classes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || 'Class deleted successfully')
        fetchClasses()
        fetchStats()
        return true
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to delete class')
        return false
      }
    } catch (error) {
      console.error('Error deleting class:', error)
      toast.error('Failed to connect to server')
      return false
    }
  }

  // Update class status
  const updateClassStatus = async (id: number, status: ClassStatus) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('Authentication required')
        return false
      }

      const response = await fetch(`${API_BASE_URL}/admin/classes/${id}/status`, {
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
        toast.success(data.message || 'Class status updated successfully')
        fetchClasses()
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

  // Helper functions for file handling
  const getFileType = (file: File): string => {
    if (file.type.startsWith('video/')) return 'video'
    if (file.type.startsWith('audio/')) return 'audio'
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.includes('pdf')) return 'document'
    if (file.type.includes('presentation') || file.type.includes('powerpoint') || file.type.includes('ms-powerpoint')) return 'presentation'
    if (file.type.includes('spreadsheet') || file.type.includes('excel') || file.type.includes('ms-excel')) return 'spreadsheet'
    if (file.type.includes('zip') || file.type.includes('compressed')) return 'archive'
    return 'other'
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video': return <FileVideo className="w-5 h-5 text-blue-500" />
      case 'audio': return <FileAudio className="w-5 h-5 text-green-500" />
      case 'image': return <FileImage className="w-5 h-5 text-purple-500" />
      case 'document': return <FileText className="w-5 h-5 text-orange-500" />
      case 'presentation': return <File className="w-5 h-5 text-red-500" />
      case 'spreadsheet': return <File className="w-5 h-5 text-green-600" />
      case 'archive': return <FileArchive className="w-5 h-5 text-gray-500" />
      default: return <File className="w-5 h-5 text-gray-500" />
    }
  }

  const handleResourceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    
    const newResources = Array.from(files).map(file => ({
      name: file.name,
      size: file.size,
      type: getFileType(file),
      url: URL.createObjectURL(file)
    }))
    
    setClassForm(prev => ({
      ...prev,
      resources: [...(prev.resources || []), ...newResources]
    }))
    
    toast.success(`${files.length} file(s) added`)
  }

  const removeResource = (index: number) => {
    setClassForm(prev => ({
      ...prev,
      resources: prev.resources?.filter((_, i) => i !== index) || []
    }))
  }

  const handleViewResources = (cls: Class) => {
    setSelectedClass(cls)
    fetchClassResources(cls.id)
    setShowResourcesDialog(true)
  }

  // Load data on component mount
  useEffect(() => {
    fetchClasses()
    fetchStats()
  }, [])

  // Cleanup Agora on unmount
  useEffect(() => {
    return () => {
      if (isInLiveClass) {
        leaveAgoraChannel()
      }
    }
  }, [isInLiveClass])

  // Calculate statistics from local data (fallback)
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

  const handleDeleteClass = async (id: number) => {
    const success = await deleteClass(id)
    if (success) {
      setShowDeleteDialog(false)
    }
  }

  const handleEditClass = (cls: Class) => {
    setSelectedClass(cls)
    setClassForm({
      title: cls.title,
      instructor: cls.instructor,
      date: cls.date,
      time: cls.time,
      duration: cls.duration,
      maxAttendees: cls.maxAttendees.toString(),
      type: cls.type,
      category: cls.category,
      description: cls.description || '',
      tags: cls.tags || [],
      recordingUrl: cls.recordingUrl || '',
      recordSession: cls.recordSession || false,
      recordingQuality: cls.recordingQuality || 'high',
      resources: []
    })
    setShowEditDialog(true)
  }

  const handleSaveClass = async () => {
    if (!classForm.title.trim()) {
      toast.error('Please enter a class title')
      return
    }
    if (!classForm.instructor.trim()) {
      toast.error('Please enter an instructor name')
      return
    }
    if (!classForm.date) {
      toast.error('Please select a date')
      return
    }
    if (!classForm.time) {
      toast.error('Please select a time')
      return
    }
    if (!classForm.duration.trim()) {
      toast.error('Please enter duration')
      return
    }
    if (!classForm.maxAttendees || parseInt(classForm.maxAttendees) <= 0) {
      toast.error('Please enter a valid number of maximum attendees')
      return
    }

    const success = await saveClass(classForm, selectedClass?.id)
    if (success) {
      setShowEditDialog(false)
      setShowScheduleDialog(false)
      resetForm()
    }
  }

  const handleStartClass = async (cls: Class) => {
    await startLiveClass(cls)
  }

  const handleEndClass = async (id: number) => {
    if (isInLiveClass) {
      await leaveAgoraChannel()
    }
    await updateClassStatus(id, 'completed')
    setShowLiveClassDialog(false)
  }

  const handleCancelClass = async (id: number) => {
    await updateClassStatus(id, 'cancelled')
  }

  const resetForm = () => {
    setClassForm({
      title: '',
      instructor: '',
      date: '',
      time: '',
      duration: '',
      maxAttendees: '',
      type: 'live',
      category: 'Programming',
      description: '',
      tags: [],
      recordingUrl: '',
      recordSession: false,
      recordingQuality: 'high',
      resources: []
    })
    setSelectedClass(null)
    setTagInput('')
  }

  const addTag = (tag: string) => {
    if (tag && !classForm.tags.includes(tag)) {
      setClassForm({ ...classForm, tags: [...classForm.tags, tag] })
      setTagInput('')
      setShowTagSuggestions(false)
    }
  }

  const removeTag = (tagToRemove: string) => {
    setClassForm({
      ...classForm,
      tags: classForm.tags.filter(tag => tag !== tagToRemove)
    })
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

  const filteredTagOptions = tagOptions.filter(tag => 
    tag.toLowerCase().includes(tagInput.toLowerCase()) && 
    !classForm.tags.includes(tag)
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Class Management
          </h1>
          <p className="text-gray-600 mt-2">Manage all live and recorded classes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchClasses}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </Button>
          <Button 
            className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={() => {
              resetForm()
              setShowScheduleDialog(true)
            }}
          >
            <Video className="w-4 h-4" />
            Schedule New Class
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <Video className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Live Classes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.live}</p>
                <p className="text-xs text-gray-500 mt-1">Active now</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl">
                <Zap className="w-6 h-6 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recorded</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recorded}</p>
                <p className="text-xs text-gray-500 mt-1">Available</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl">
                <BookOpen className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcoming}</p>
                <p className="text-xs text-gray-500 mt-1">Next 7 days</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
                <Calendar className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Participants</p>
                <p className="text-2xl font-bold text-gray-900">{stats.participants}</p>
                <p className="text-xs text-gray-500 mt-1">Total joined</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-indigo-600 animate-spin" />
                <p className="text-gray-600">Loading classes...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {!isLoading && classes.length === 0 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No classes found</h3>
              <p className="text-gray-600 mb-6">Schedule your first class to get started</p>
              <Button 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                onClick={() => setShowScheduleDialog(true)}
              >
                <Video className="w-4 h-4 mr-2" />
                Schedule First Class
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Class Control Bar */}
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
                  <p className="text-sm text-gray-600">Participants: {remoteUsers.length + 1}</p>
                </div>
                {isRecording && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-red-500 text-white px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">REC {formatRecordingTime(recordingTime)}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={isAudioMuted ? "destructive" : "outline"}
                  size="sm"
                  onClick={toggleAudio}
                  className="gap-2"
                >
                  {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isAudioMuted ? 'Unmute' : 'Mute'}
                </Button>
                <Button
                  variant={isVideoMuted ? "destructive" : "outline"}
                  size="sm"
                  onClick={toggleVideo}
                  className="gap-2"
                >
                  {isVideoMuted ? 'Camera Off' : 'Camera On'}
                </Button>
                <Button
                  variant={isScreenSharing ? "default" : "outline"}
                  size="sm"
                  onClick={toggleScreenShare}
                  className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                  {isScreenSharing ? 'Stop Share' : 'Share Screen'}
                </Button>
                {classForm.recordSession && (
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    onClick={isRecording ? stopRecording : startRecording}
                    className="gap-2"
                  >
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => selectedClass && handleEndClass(selectedClass.id)}
                  className="gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700"
                >
                  <X className="w-4 h-4" />
                  End Class
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content - Only show when not loading and has data */}
      {!isLoading && classes.length > 0 && (
        <>
          {/* Filters and Search */}
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Search classes, instructors, or descriptions..."
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

          {/* Classes Table */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900">Classes ({filteredClasses.length})</CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-rose-500 to-pink-600"></div>
                    <span>Live</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600"></div>
                    <span>Recorded</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredClasses.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No classes found</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
                  <Button 
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedCategory('All')
                      setSelectedStatus('All')
                      setSelectedType('All')
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">Class Title</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">Instructor</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">Schedule</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">Type</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">Attendance</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClasses.map(cls => (
                        <tr key={cls.id} className="border-b hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-gray-100/50 transition-all duration-150">
                          <td className="py-5 px-6">
                            <div>
                              <p className="font-semibold text-gray-900">{cls.title}</p>
                              <div className="flex items-center gap-1 mt-2">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full bg-gradient-to-r ${getCategoryColor(cls.category)} text-white`}>
                                  {cls.category}
                                </span>
                                {(cls.tags || []).slice(0, 2).map(tag => (
                                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                    {tag}
                                  </span>
                                ))}
                                {(cls.tags || []).length > 2 && (
                                  <span className="text-xs text-gray-500">+{(cls.tags || []).length - 2}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center ring-2 ring-blue-50">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{cls.instructor}</p>
                                <p className="text-sm text-gray-500">Instructor</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div>
                              <p className="font-medium text-gray-900">{cls.date} at {cls.time}</p>
                              <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                <Clock className="w-4 h-4" />
                                {cls.duration}
                              </p>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <Badge className={`${getTypeBadge(cls.type)} font-medium shadow-sm`}>
                              {cls.type.charAt(0).toUpperCase() + cls.type.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-5 px-6">
                            <Badge className={`${getStatusBadge(cls.status)} font-medium shadow-sm`}>
                              {cls.status.charAt(0).toUpperCase() + cls.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-5 px-6">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">{cls.attendees}/{cls.maxAttendees}</span>
                                <span className="text-sm font-semibold text-emerald-600">
                                  {Math.round((cls.attendees / cls.maxAttendees) * 100)}%
                                </span>
                              </div>
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    (cls.attendees / cls.maxAttendees) >= 0.8 
                                      ? 'bg-gradient-to-r from-emerald-500 to-green-500' 
                                      : (cls.attendees / cls.maxAttendees) >= 0.5 
                                      ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                                      : 'bg-gradient-to-r from-rose-500 to-red-500'
                                  }`}
                                  style={{ width: `${(cls.attendees / cls.maxAttendees) * 100}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-2">
                              {cls.type === 'live' && cls.status === 'scheduled' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                  onClick={() => handleStartClass(cls)}
                                >
                                  <Play className="w-3 h-3" />
                                  Start
                                </Button>
                              )}
                              {cls.type === 'live' && cls.status === 'ongoing' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1 border-rose-500 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                  onClick={() => handleEndClass(cls.id)}
                                >
                                  <Pause className="w-3 h-3" />
                                  End
                                </Button>
                              )}
                              {cls.status === 'scheduled' && cls.type === 'live' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => handleCancelClass(cls.id)}
                                >
                                  <X className="w-3 h-3" />
                                  Cancel
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                onClick={() => handleViewResources(cls)}
                              >
                                <FolderOpen className="w-3 h-3" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-50">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => handleEditClass(cls)} className="cursor-pointer">
                                    <Edit className="w-4 h-4 mr-2 text-gray-500" />
                                    Edit Class
                                  </DropdownMenuItem>
                                  {cls.recordingUrl && (
                                    <DropdownMenuItem 
                                      onClick={() => window.open(cls.recordingUrl!, '_blank')}
                                      className="cursor-pointer"
                                    >
                                      <Play className="w-4 h-4 mr-2 text-blue-500" />
                                      View Recording
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem 
                                    onClick={() => handleViewResources(cls)}
                                    className="cursor-pointer"
                                  >
                                    <FolderOpen className="w-4 h-4 mr-2 text-emerald-500" />
                                    View Resources
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => toast.success('Attendance downloaded')}
                                    className="cursor-pointer"
                                  >
                                    <Download className="w-4 h-4 mr-2 text-emerald-500" />
                                    Download Attendance
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => toast.success('Email sent to participants')}
                                    className="cursor-pointer"
                                  >
                                    <Calendar className="w-4 h-4 mr-2 text-amber-500" />
                                    Send Reminder
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600 cursor-pointer"
                                    onClick={() => {
                                      setSelectedClass(cls)
                                      setShowDeleteDialog(true)
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Class
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Live Class Dialog */}
      <Dialog open={showLiveClassDialog} onOpenChange={setShowLiveClassDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Start Live Class
            </DialogTitle>
            <DialogDescription>
              Configure and start your live class. Students will join using the link below.
            </DialogDescription>
          </DialogHeader>
          
          {!isInLiveClass ? (
            <div className="space-y-6 py-4">
              {/* Class Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{selectedClass?.title}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Instructor</p>
                    <p className="font-medium text-gray-900">{selectedClass?.instructor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Max Participants</p>
                    <p className="font-medium text-gray-900">{selectedClass?.maxAttendees}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-medium text-gray-900">{selectedClass?.duration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-medium text-gray-900">{selectedClass?.category}</p>
                  </div>
                </div>
              </div>

              {/* Class Link */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Class Link for Students</label>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/class/${selectedClass?.id}?channel=${channelName}`}
                    readOnly
                    className="border-2 border-gray-200 bg-gray-50"
                  />
                  <Button
                    variant="outline"
                    onClick={copyClassLink}
                    className="gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Share this link with your students. They can join the class using this link.
                </p>
              </div>

              {/* Recording Settings */}
              <div className="space-y-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Record Live Session
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      Automatically record this live class for later viewing
                    </p>
                  </div>
                  <Switch
                    checked={classForm.recordSession}
                    onCheckedChange={(checked) => setClassForm({...classForm, recordSession: checked})}
                  />
                </div>
                
                {classForm.recordSession && (
                  <div className="space-y-3 pl-4 border-l-2 border-blue-300">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Recording Quality</label>
                      <Select 
                        value={classForm.recordingQuality} 
                        onValueChange={(value) => setClassForm({...classForm, recordingQuality: value})}
                      >
                        <SelectTrigger className="border-2 border-gray-200">
                          <SelectValue placeholder="Select quality" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low (360p)</SelectItem>
                          <SelectItem value="medium">Medium (720p)</SelectItem>
                          <SelectItem value="high">High (1080p)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        Higher quality recordings take more storage space
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera and Mic Preview */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Preview</label>
                <div className="border-2 border-gray-200 rounded-lg p-4">
                  <div 
                    ref={localVideoContainerRef}
                    className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center"
                  >
                    <div className="text-center">
                      <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Camera preview will appear here</p>
                    </div>
                  </div>
                  <div className="flex justify-center gap-4 mt-4">
                    <Button
                      variant={isAudioMuted ? "destructive" : "outline"}
                      size="sm"
                      onClick={toggleAudio}
                      className="gap-2"
                    >
                      {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      {isAudioMuted ? 'Unmute' : 'Mute'}
                    </Button>
                    <Button
                      variant={isVideoMuted ? "destructive" : "outline"}
                      size="sm"
                      onClick={toggleVideo}
                      className="gap-2"
                    >
                      {isVideoMuted ? 'Camera Off' : 'Camera On'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg">
                <h4 className="font-semibold text-amber-800 mb-2">Instructions</h4>
                <ul className="space-y-2 text-sm text-amber-700">
                  <li>• Make sure you have a stable internet connection</li>
                  <li>• Test your camera and microphone before starting</li>
                  <li>• Share the class link with your students</li>
                  <li>• You can share your screen during the class</li>
                  <li>• Mute participants if necessary</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Live Class Video */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Local Video */}
                <div className="lg:col-span-1">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">You (Instructor)</label>
                    <div 
                      ref={localVideoContainerRef}
                      className="w-full h-48 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden relative"
                    >
                      {!isVideoMuted && !isScreenSharing && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <p className="text-white text-sm">Your camera is on</p>
                        </div>
                      )}
                      {isVideoMuted && !isScreenSharing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                          <User className="w-12 h-12 text-gray-400 mb-2" />
                          <p className="text-gray-300 text-sm">Camera is off</p>
                        </div>
                      )}
                      {isScreenSharing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-amber-800 to-orange-900">
                          <Monitor className="w-12 h-12 text-white mb-2" />
                          <p className="text-white text-sm">Screen Sharing</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remote Videos */}
                <div className="lg:col-span-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Participants ({remoteUsers.length})
                    </label>
                    <div 
                      ref={remoteVideoContainerRef}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-h-[192px] p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl"
                    >
                      {remoteUsers.length === 0 && (
                        <div className="col-span-2 flex flex-col items-center justify-center h-48">
                          <Users className="w-16 h-16 text-gray-300 mb-4" />
                          <p className="text-gray-500">Waiting for students to join...</p>
                          <p className="text-sm text-gray-400 mt-2">Share the class link with your students</p>
                        </div>
                      )}
                      {/* Remote user videos will be rendered here by Agora */}
                    </div>
                  </div>
                </div>
              </div>

              {/* Participants List */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Participants List</label>
                <div className="border-2 border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {remoteUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No participants yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Instructor */}
                      <div className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">You (Instructor)</p>
                            <p className="text-xs text-gray-600">Host</p>
                          </div>
                        </div>
                        <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500">
                          Instructor
                        </Badge>
                      </div>
                      {/* Students */}
                      {remoteUsers.map(user => (
                        <div key={user.uid} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Student {String(user.uid).slice(-4)}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600 flex items-center gap-1">
                                  {user.hasVideo ? '📹' : '📷❌'} Video
                                </span>
                                <span className="text-xs text-gray-600 flex items-center gap-1">
                                  {user.hasAudio ? '🎤' : '🎤❌'} Audio
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline">Student</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="border-t pt-6">
            {!isInLiveClass ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setShowLiveClassDialog(false)}
                  className="border-2 border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={joinAsInstructor}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Live Class
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="w-full flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isAudioMuted ? "destructive" : "outline"}
                      size="sm"
                      onClick={toggleAudio}
                      className="gap-2"
                    >
                      {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      {isAudioMuted ? 'Unmute' : 'Mute'}
                    </Button>
                    <Button
                      variant={isVideoMuted ? "destructive" : "outline"}
                      size="sm"
                      onClick={toggleVideo}
                      className="gap-2"
                    >
                      {isVideoMuted ? 'Camera Off' : 'Camera On'}
                    </Button>
                    <Button
                      variant={isScreenSharing ? "default" : "outline"}
                      size="sm"
                      onClick={toggleScreenShare}
                      className="gap-2"
                    >
                      {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                      {isScreenSharing ? 'Stop Share' : 'Share Screen'}
                    </Button>
                    {classForm.recordSession && (
                      <Button
                        variant={isRecording ? "destructive" : "outline"}
                        size="sm"
                        onClick={isRecording ? stopRecording : startRecording}
                        className="gap-2"
                      >
                        {isRecording ? `Stop REC (${formatRecordingTime(recordingTime)})` : 'Start Recording'}
                      </Button>
                    )}
                  </div>
                </div>
                <Button 
                  variant="destructive"
                  onClick={() => selectedClass && handleEndClass(selectedClass.id)}
                  className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 gap-2"
                >
                  <X className="w-4 h-4 mr-2" />
                  End Class
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resources Dialog */}
      <Dialog open={showResourcesDialog} onOpenChange={setShowResourcesDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Learning Resources - {selectedClass?.title}
            </DialogTitle>
            <DialogDescription>
              Manage videos, audio recordings, and other learning materials for this class
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Upload Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
              <input
                type="file"
                id="resource-upload-dialog"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mp3,.mov,.avi,.mkv,.jpg,.jpeg,.png,.zip"
                onChange={handleResourceUpload}
                className="hidden"
                disabled={isUploadingResources}
              />
              <label htmlFor="resource-upload-dialog" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  {isUploadingResources ? (
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                  ) : (
                    <Upload className="w-12 h-12 text-gray-400" />
                  )}
                  <p className="font-medium text-gray-700">Upload Learning Resources</p>
                  <p className="text-sm text-gray-500">
                    Drag & drop files or click to browse (PDFs, Videos, Audio, Presentations, Images, etc.)
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2"
                    disabled={isUploadingResources}
                  >
                    {isUploadingResources ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Browse Files
                      </>
                    )}
                  </Button>
                </div>
              </label>
            </div>

            {/* Resources List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Resources ({classResources.length})</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedClass && fetchClassResources(selectedClass.id)}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
              
              {classResources.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No resources yet</h3>
                  <p className="text-gray-600">Upload learning materials for this class</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classResources.map((resource, index) => (
                    <div key={index} className="border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getFileIcon(resource.type)}
                          <div>
                            <p className="font-medium text-gray-900 truncate max-w-[200px]">{resource.name}</p>
                            <p className="text-xs text-gray-500">
                              {resource.size ? formatFileSize(resource.size) : 'Unknown size'} • {resource.type}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => selectedClass && deleteResource(selectedClass.id, resource.id)}
                          disabled={isUploadingResources}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => window.open(resource.url, '_blank')}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => window.open(resource.url, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                      {resource.uploadedAt && (
                        <p className="text-xs text-gray-500 mt-3">
                          Uploaded: {new Date(resource.uploadedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Class Recording Section */}
            {selectedClass?.recordingUrl && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Class Recording</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <FileVideo className="w-10 h-10 text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-900">Class Recording.mp4</p>
                      <p className="text-sm text-gray-600">Full class recording</p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedClass.recordingUrl, '_blank')}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Play
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedClass.recordingUrl, '_blank')}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowResourcesDialog(false)}
              className="border-2 border-gray-300 hover:bg-gray-50"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="border-0 shadow-2xl">
          <div className="p-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-rose-100 to-red-100">
              <AlertCircle className="h-6 w-6 text-rose-600" />
            </div>
          </div>
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl text-gray-900">Delete Class</DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{selectedClass?.title}"</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700"
              onClick={() => selectedClass && handleDeleteClass(selectedClass.id)}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Class'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule/Edit Class Dialog */}
      <Dialog open={showEditDialog || showScheduleDialog} onOpenChange={(open) => {
        if (!open) {
          setShowEditDialog(false)
          setShowScheduleDialog(false)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {showEditDialog ? 'Edit Class' : 'Schedule New Class'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Class Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Class Title *</label>
              <Input
                value={classForm.title}
                onChange={(e) => setClassForm({...classForm, title: e.target.value})}
                placeholder="Enter class title"
                className="border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                disabled={isSubmitting}
              />
            </div>

            {/* Instructor and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Instructor *</label>
                <Input
                  value={classForm.instructor}
                  onChange={(e) => setClassForm({...classForm, instructor: e.target.value})}
                  placeholder="Enter instructor name"
                  className="border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Category *</label>
                <Select 
                  value={classForm.category} 
                  onValueChange={(value) => setClassForm({...classForm, category: value})}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c !== 'All').map(category => (
                      <SelectItem key={category} value={category}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getCategoryColor(category)}`}></div>
                          {category}
                          </div>
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Schedule - Date, Time, Duration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Date *</label>
                <Input
                  type="date"
                  value={classForm.date}
                  onChange={(e) => setClassForm({...classForm, date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Time *</label>
                <Input
                  type="time"
                  value={classForm.time}
                  onChange={(e) => setClassForm({...classForm, time: e.target.value})}
                  className="border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Duration *</label>
                <Input
                  value={classForm.duration}
                  onChange={(e) => setClassForm({...classForm, duration: e.target.value})}
                  placeholder="e.g., 90 min"
                  className="border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Max Attendees and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Maximum Attendees *</label>
                <Input
                  type="number"
                  min="1"
                  value={classForm.maxAttendees}
                  onChange={(e) => setClassForm({...classForm, maxAttendees: e.target.value})}
                  placeholder="Enter maximum attendees"
                  className="border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Class Type *</label>
                <div className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`relative w-5 h-5 rounded-full border-2 ${classForm.type === 'live' ? 'border-rose-500' : 'border-gray-300'} group-hover:border-rose-400`}>
                      {classForm.type === 'live' && (
                        <div className="absolute inset-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-600"></div>
                      )}
                    </div>
                    <input
                      type="radio"
                      name="type"
                      value="live"
                      checked={classForm.type === 'live'}
                      onChange={(e) => setClassForm({...classForm, type: e.target.value as ClassType})}
                      className="sr-only"
                      disabled={isSubmitting}
                    />
                    <span className="flex items-center gap-2 text-gray-700 group-hover:text-rose-600">
                      <Video className="w-4 h-4" />
                      Live Class
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`relative w-5 h-5 rounded-full border-2 ${classForm.type === 'recorded' ? 'border-indigo-500' : 'border-gray-300'} group-hover:border-indigo-400`}>
                      {classForm.type === 'recorded' && (
                        <div className="absolute inset-1 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600"></div>
                      )}
                    </div>
                    <input
                      type="radio"
                      name="type"
                      value="recorded"
                      checked={classForm.type === 'recorded'}
                      onChange={(e) => setClassForm({...classForm, type: e.target.value as ClassType})}
                      className="sr-only"
                      disabled={isSubmitting}
                    />
                    <span className="flex items-center gap-2 text-gray-700 group-hover:text-indigo-600">
                      <Clock className="w-4 h-4" />
                      Recorded
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Recording Settings for Live Classes */}
            {classForm.type === 'live' && (
              <div className="space-y-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Record Live Session
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      Automatically record this live class for later viewing
                    </p>
                  </div>
                  <Switch
                    checked={classForm.recordSession}
                    onCheckedChange={(checked) => setClassForm({...classForm, recordSession: checked})}
                    disabled={isSubmitting}
                  />
                </div>
                
                {classForm.recordSession && (
                  <div className="space-y-3 pl-4 border-l-2 border-blue-300">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Recording Quality</label>
                      <Select 
                        value={classForm.recordingQuality} 
                        onValueChange={(value) => setClassForm({...classForm, recordingQuality: value})}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="border-2 border-gray-200">
                          <SelectValue placeholder="Select quality" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low (360p)</SelectItem>
                          <SelectItem value="medium">Medium (720p)</SelectItem>
                          <SelectItem value="high">High (1080p)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        Higher quality recordings take more storage space
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tags</label>
              <div className="relative">
                <div className="flex gap-2 mb-2 flex-wrap">
                  {classForm.tags.map(tag => (
                    <div key={tag} className="flex items-center gap-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-100">
                      <Tag className="w-3 h-3" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-blue-900"
                        disabled={isSubmitting}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => {
                      setTagInput(e.target.value)
                      setShowTagSuggestions(true)
                    }}
                    onFocus={() => setShowTagSuggestions(true)}
                    placeholder="Add tags..."
                    className="flex-1 border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-2 border-gray-200 hover:border-indigo-500 hover:text-indigo-600"
                    onClick={() => {
                      if (tagInput.trim()) {
                        addTag(tagInput.trim())
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    Add
                  </Button>
                </div>
                {showTagSuggestions && filteredTagOptions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg">
                    {filteredTagOptions.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                        onClick={() => addTag(tag)}
                        disabled={isSubmitting}
                      >
                        <Tag className="w-4 h-4 text-indigo-500" />
                        <span className="font-medium text-gray-700">{tag}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <Textarea
                value={classForm.description}
                onChange={(e) => setClassForm({...classForm, description: e.target.value})}
                placeholder="Enter class description"
                rows={4}
                className="border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                disabled={isSubmitting}
              />
            </div>

            {/* Recording URL for recorded classes */}
            {classForm.type === 'recorded' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Recording URL</label>
                <Input
                  value={classForm.recordingUrl || ''}
                  onChange={(e) => setClassForm({...classForm, recordingUrl: e.target.value})}
                  placeholder="https://example.com/recording"
                  className="border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  disabled={isSubmitting}
                />
              </div>
            )}

            {/* Learning Resources Section */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-700">Learning Resources</label>
              
              {/* Upload Resources */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
                <input
                  type="file"
                  id="resource-upload"
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mp3,.mov,.avi,.mkv,.jpg,.jpeg,.png,.zip"
                  onChange={handleResourceUpload}
                  className="hidden"
                  disabled={isSubmitting || isUploadingResources}
                />
                <label htmlFor="resource-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    {isUploadingResources ? (
                      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                    ) : (
                      <Upload className="w-12 h-12 text-gray-400" />
                    )}
                    <p className="font-medium text-gray-700">
                      {isUploadingResources ? 'Uploading...' : 'Upload Learning Resources'}
                    </p>
                    <p className="text-sm text-gray-500">
                      PDFs, Videos, Audio, Presentations, Images, etc.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2"
                      disabled={isSubmitting || isUploadingResources}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Browse Files
                    </Button>
                  </div>
                </label>
              </div>

              {/* Uploaded Resources List */}
              {classForm.resources && classForm.resources.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Uploaded Resources:</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {classForm.resources.map((resource, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getFileIcon(resource.type)}
                          <div>
                            <p className="font-medium text-sm text-gray-900">{resource.name}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(resource.size)} • {resource.type}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeResource(index)}
                          disabled={isSubmitting || isUploadingResources}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="border-t pt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditDialog(false)
                setShowScheduleDialog(false)
                resetForm()
              }}
              className="border-2 border-gray-300 hover:bg-gray-50"
              disabled={isSubmitting || isUploadingResources}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveClass}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              disabled={isSubmitting || isUploadingResources}
            >
              {isSubmitting || isUploadingResources ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isUploadingResources ? 'Uploading...' : showEditDialog ? 'Updating...' : 'Saving...'}
                </>
              ) : showEditDialog ? 'Update Class' : 'Schedule Class'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}