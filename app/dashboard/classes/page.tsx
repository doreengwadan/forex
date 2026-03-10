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
  MoreVertical,
  User,
  Download,
  X,
  Check,
  Tag,
  TrendingUp,
  BookOpen,
  AlertCircle,
  LoaderCircle,
  Mic,
  MicOff,
  User as UserIcon,
  Copy,
  MessageSquare,
  LogIn,
  Star,
  Heart,
  CheckCircle,
  ChevronLeft,
  Grid,
  List,
  FileText,
  Link,
  Folder,
  DownloadCloud,
  Share,
  Plus,
  Paperclip,
  Send,
  ThumbsUp,
  MessageCircle,
  File,
  ExternalLink
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation' // IMPORT ADDED HERE
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/DropdownMenu'
import { Badge } from '../../components/ui/Badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/Dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/Select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/Avatar'
import { Separator } from '../../components/ui/Separator'
import { Textarea } from '../../components/ui/Textarea'
import { toast } from 'react-hot-toast'

// ========== Date/Time Formatting Helpers ==========
const formatDate = (dateStr: string): string => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date)
  } catch {
    return dateStr
  }
}

const formatTime = (timeStr: string): string => {
  if (!timeStr) return ''
  try {
    const [hours, minutes] = timeStr.split(':').map(Number)
    if (isNaN(hours) || isNaN(minutes)) return timeStr
    const date = new Date()
    date.setHours(hours, minutes, 0)
    return new Intl.DateTimeFormat('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }).format(date)
  } catch {
    return timeStr
  }
}

const formatDateTime = (dateStr: string, timeStr: string): string => {
  const formattedDate = formatDate(dateStr)
  const formattedTime = formatTime(timeStr)
  return `${formattedDate} at ${formattedTime}`
}

const formatResourceDate = (timestamp: string): string => {
  if (!timestamp) return ''
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return timestamp
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date)
  } catch {
    return timestamp
  }
}

const getRelativeTime = (dateStr: string): string => {
  if (!dateStr) return ''
  try {
    const classDate = new Date(dateStr)
    const today = new Date()
    today.setHours(0,0,0,0)
    const diffTime = classDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays > 1 && diffDays <= 7) return `in ${diffDays} days`
    if (diffDays < 0) return 'Past'
    return formatDate(dateStr)
  } catch {
    return dateStr
  }
}
// =================================================

// Define interfaces
interface Class {
  id: number;
  title: string;
  description: string;
  instructor: string;
  instructor_id?: number;
  category: string;
  type: 'live' | 'recorded';
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'published';
  date: string;
  time: string;
  duration: string;
  maxAttendees: number;
  attendees: number;
  tags: string[];
  recordingUrl?: string;
  isEnrolled?: boolean;
  banner?: string;
  code?: string;
  created_at?: string;
  updated_at?: string;
}

interface Resource {
  id: number
  class_id: number
  name: string
  type: 'file' | 'link'
  url: string
  size?: number
  uploaded_at: string
  description?: string
  downloads?: number
}

interface Stats {
  total: number;
  live: number;
  recorded: number;
  upcoming: number;
  participants: number;
}

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
const statuses = ['All', 'scheduled', 'ongoing', 'completed', 'published']
const classTypes = ['All', 'live', 'recorded']

export default function StudentClassesPage() {
  // Initialize router
  const router = useRouter()
  
  // View state: 'grid' for all classes, 'resources' for specific class resources view
  const [view, setView] = useState<'grid' | 'resources'>('grid')
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  
  const [classes, setClasses] = useState<Class[]>([])
  const [enrolledClasses, setEnrolledClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isResourcesLoading, setIsResourcesLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedType, setSelectedType] = useState('All')
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showParticipantsDialog, setShowParticipantsDialog] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState<Record<number, boolean>>({})
  const [userRatings, setUserRatings] = useState<Record<number, number>>({})
  const [liveClassData, setLiveClassData] = useState<any>(null)
  
  // Resources data
  const [classroomResources, setClassroomResources] = useState<Resource[]>([])
  const [downloadingResource, setDownloadingResource] = useState<number | null>(null)
  
  // Agora states
  const [isInLiveClass, setIsInLiveClass] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const [remoteUsers, setRemoteUsers] = useState<{uid: string | number, hasVideo: boolean, hasAudio: boolean}[]>([])
  const [channelName, setChannelName] = useState<string>('')
  const [agoraToken, setAgoraToken] = useState<string>('')
  
  // Agora refs
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

  // Current user info
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    name: string;
    email: string;
    avatar?: string;
  } | null>(null)

  // Check if user is authenticated
  const isAuthenticated = () => {
    const token = localStorage.getItem('auth_token')
    return !!token
  }

  // Get current user
  const getCurrentUser = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return null

      const response = await fetch(`${API_BASE_URL}/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setCurrentUser(userData)
        return userData
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
    return null
  }

  // Initialize Agora RTC client
  const initAgoraClient = () => {
    if (!AgoraRTC) {
      console.error('Agora SDK not loaded yet')
      return
    }
    
    if (!agoraClientRef.current) {
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      agoraClientRef.current = client
      
      const containers = new Map<string, HTMLDivElement>()
      
      client.on('user-published', async (user: any, mediaType: string) => {
        await client.subscribe(user, mediaType)
        
        if (mediaType === 'video') {
          const remoteVideoTrack = user.videoTrack
          if (remoteVideoTrack) {
            const remoteContainer = document.createElement('div')
            remoteContainer.className = 'w-full h-full'
            remoteContainer.id = `remote-video-${user.uid}`
            
            containers.set(`remote-video-${user.uid}`, remoteContainer)
            
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
        setRemoteUsers(prev => {
          const updatedUsers = prev.map(u => {
            if (u.uid === user.uid) {
              if (mediaType === 'video') return { ...u, hasVideo: false }
              if (mediaType === 'audio') return { ...u, hasAudio: false }
            }
            return u
          }).filter(u => u.hasVideo || u.hasAudio)
        
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
        toast.success('A new participant joined the class', {
          icon: '👋',
          duration: 3000
        });
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
        toast.success('A participant left the class', {
          icon: '👋',
          duration: 3000
        });
      })
    }
  }

  // Get Agora token
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
      
      if (!channelName || channelName.trim() === '') {
        throw new Error('Channel name is required')
      }
      
      initAgoraClient()
      
      if (!agoraClientRef.current) {
        throw new Error('Agora client not initialized')
      }

      const token = await getAgoraToken(channelName, uid)
      setAgoraToken(token)

      await agoraClientRef.current.join(AGORA_APP_ID, channelName, token, uid)
      
      // Create local tracks (don't disable them)
      const tracks = []
      
      try {
        localAudioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack()
        // Don't disable - keep enabled
        setIsAudioMuted(false)
        tracks.push(localAudioTrackRef.current)
      } catch (error) {
        console.log('Microphone not available or permission denied')
      }
      
      try {
        localVideoTrackRef.current = await AgoraRTC.createCameraVideoTrack()
        // Don't disable - keep enabled
        setIsVideoMuted(false)
        
        if (localVideoContainerRef.current && localVideoTrackRef.current) {
          localVideoTrackRef.current.play(localVideoContainerRef.current)
        }
        tracks.push(localVideoTrackRef.current)
      } catch (error) {
        console.log('Camera not available or permission denied')
      }
      
      // Publish all tracks at once (they are all enabled)
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

  // Fetch all available classes
  const fetchClasses = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch(`${API_BASE_URL}/classes`, {
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
        
        const classesWithEnrollment = classesData.map((cls: any) => ({
          ...cls,
          isEnrolled: false,
          banner: `https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80`,
          code: `${cls.category?.substring(0, 3).toUpperCase() || 'CLS'}-${cls.id}`
        }))
        
        setClasses(classesWithEnrollment)
        
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

  // Check enrollment status
  const checkEnrollmentStatus = async (classesList: Class[]) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      if (enrolledClasses.length > 0) {
        const enrolledClassIds = enrolledClasses.map(c => c.id)
        setClasses(prev => prev.map(cls => ({
          ...cls,
          isEnrolled: enrolledClassIds.includes(cls.id)
        })))
        return
      }

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

  // Fetch enrolled classes
  const fetchEnrolledClasses = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      
      if (!token) return
  
      const response = await fetch(`${API_BASE_URL}/student/enrolled-classes`, {
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

  // Fetch student statistics
  const fetchStudentStats = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      
      if (!token) return

      const response = await fetch(`${API_BASE_URL}/student/stats`, {
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

  // Fetch class resources
  const fetchClassResources = async (classId: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch(`${API_BASE_URL}/classes/${classId}/resources`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        const resources = data.data || data.resources || data
        setClassroomResources(Array.isArray(resources) ? resources : [])
      } else {
        setClassroomResources([])
      }
    } catch (error) {
      console.error('Error fetching resources:', error)
      setClassroomResources([])
    }
  }

  // Handle resource download
  const handleResourceDownload = async (resource: Resource) => {
    try {
      setDownloadingResource(resource.id)
      
      if (resource.type === 'link') {
        // Open link in new tab
        window.open(resource.url, '_blank', 'noopener,noreferrer')
        toast.success('Opening link...')
      } else {
        // For files, we need to handle CORS and download properly
        try {
          // Try to fetch the file with credentials
          const token = localStorage.getItem('auth_token')
          const headers: HeadersInit = {}
          
          if (token) {
            headers['Authorization'] = `Bearer ${token}`
          }

          const response = await fetch(resource.url, {
            headers,
            credentials: 'include'
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const blob = await response.blob()
          
          // Create a download link
          const downloadUrl = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = resource.name // Use the resource name for the downloaded file
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          // Clean up the object URL
          window.URL.revokeObjectURL(downloadUrl)
          
          toast.success('Download started')
        } catch (error) {
          console.error('Error downloading file:', error)
          
          // Fallback: Open in new tab if download fails
          window.open(resource.url, '_blank', 'noopener,noreferrer')
          toast.success('Opening file in new tab...')
        }
      }

      // Track download (optional)
      const token = localStorage.getItem('auth_token')
      if (token) {
        fetch(`${API_BASE_URL}/resources/${resource.id}/download`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }).catch(err => console.error('Error tracking download:', err))
      }
    } catch (error) {
      console.error('Error downloading resource:', error)
      toast.error('Failed to download resource')
    } finally {
      setDownloadingResource(null)
    }
  }

  // Enroll in a class
  const enrollInClass = async (classId: number) => {
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

      const response = await fetch(`${API_BASE_URL}/classes/${classId}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({})
      })

      const responseData = await response.json()
      console.log('Enrollment response:', responseData)

      if (response.ok) {
        toast.success(responseData.message || 'Successfully enrolled in the class!')
        
        setClasses(prev => prev.map(cls => 
          cls.id === classId 
            ? { 
                ...cls, 
                isEnrolled: true,
                attendees: (cls.attendees || 0) + 1
              }
            : cls
        ))
        
        await fetchEnrolledClasses()
        await fetchStudentStats()
        
        return true
      } else {
        if (response.status === 400 && responseData.message?.includes('already enrolled')) {
          toast.error('You are already enrolled in this class')
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

  // Unenroll from a class
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
        
        setClasses(prev => prev.map(cls => 
          cls.id === classId 
            ? { 
                ...cls, 
                isEnrolled: false,
                attendees: Math.max(0, (cls.attendees || 0) - 1)
              }
            : cls
        ))
        
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

  // Toggle bookmark
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

  // Join live class - FIXED VERSION
  const joinLiveClass = async (classItem: Class) => {
    try {
      setSelectedClass(classItem)
      
      if (!classItem.isEnrolled) {
        toast.error('You need to enroll in this class first')
        return
      }

      if (classItem.status === 'ongoing' && classItem.type === 'live') {
        // Navigate to dedicated live class page instead of using inline Agora
        router.push(`/live-class/${classItem.id}`)
      } else if (classItem.status === 'scheduled') {
        // Show dialog for scheduled class
        setLiveClassData({
          title: classItem.title,
          instructor: classItem.instructor,
          startTime: formatTime(classItem.time),
          date: formatDate(classItem.date)
        })
        setShowJoinDialog(true)
      } else if (classItem.type === 'recorded') {
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

  // Handle class click - switch to resources view or show enrollment dialog
  const handleClassClick = async (classItem: Class, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    
    // Check if enrolled
    if (!classItem.isEnrolled) {
      // If not enrolled, show enrollment dialog
      setSelectedClass(classItem)
      setShowDetailsDialog(true)
      return
    }
    
    // If class is live and ongoing, offer to join first
    if (classItem.type === 'live' && classItem.status === 'ongoing') {
      const shouldJoin = window.confirm('This class is live now. Would you like to join?')
      if (shouldJoin) {
        await joinLiveClass(classItem)
        return
      }
    }
    
    // Switch to resources view
    setSelectedClass(classItem)
    setSelectedClassId(classItem.id)
    setView('resources')
    
    // Reset resources before fetching
    setClassroomResources([])
    
    // Fetch resources from database
    setIsResourcesLoading(true)
    try {
      await fetchClassResources(classItem.id)
    } catch (error) {
      console.error('Error fetching resources:', error)
      toast.error('Failed to load resources')
    } finally {
      setIsResourcesLoading(false)
    }
  }

  // Handle back to grid view
  const handleBackToGrid = () => {
    setView('grid')
    setSelectedClassId(null)
    setSelectedClass(null)
    setClassroomResources([])
    
    // Leave live class if in one
    if (isInLiveClass) {
      leaveAgoraChannel()
    }
  }

  // Handle enroll button click
  const handleEnrollClick = async (classItem: Class, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }

    console.log('Enroll clicked for class:', classItem.id, classItem.title)

    if (!isAuthenticated()) {
      toast.error('Please login to enroll in classes')
      window.location.href = '/login'
      return
    }

    if (classItem.isEnrolled) {
      console.log('Already enrolled, opening resources...')
      handleClassClick(classItem)
      return
    }

    console.log('Showing details dialog for new enrollment...')
    setSelectedClass(classItem)
    setShowDetailsDialog(true)
  }

  // Handle confirm enrollment
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
      
      // If class is ongoing and live, offer to join immediately after enrollment
      if (selectedClass.status === 'ongoing' && selectedClass.type === 'live') {
        setTimeout(async () => {
          const shouldJoin = window.confirm('You are now enrolled! This class is live. Would you like to join now?')
          if (shouldJoin) {
            await joinLiveClass(selectedClass)
          } else {
            // Switch to resources view
            handleClassClick(selectedClass)
          }
        }, 1000)
      } else {
        // Switch to resources view
        handleClassClick(selectedClass)
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

  const getStatusBadge = (status: Class['status']): string => {
    const variants: Record<Class['status'], string> = {
      scheduled: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
      ongoing: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white',
      completed: 'bg-gradient-to-r from-gray-600 to-gray-700 text-white',
      cancelled: 'bg-gradient-to-r from-rose-500 to-red-500 text-white',
      published: 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
    }
    return variants[status] || 'bg-gray-100 text-gray-800'
  }

  const getTypeBadge = (type: Class['type']): string => {
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

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // Load data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      await getCurrentUser()
      await fetchClasses()
      await fetchEnrolledClasses()
      await fetchStudentStats()
    }
    loadInitialData()
  }, [])

  // Cleanup Agora on unmount
  useEffect(() => {
    return () => {
      if (isInLiveClass) {
        leaveAgoraChannel()
      }
    }
  }, [isInLiveClass])

  // Calculate statistics
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

  // Filter classes
  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (cls.description && cls.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'All' || cls.category === selectedCategory
    const matchesStatus = selectedStatus === 'All' || cls.status === selectedStatus
    const matchesType = selectedType === 'All' || cls.type === selectedType
    
    return matchesSearch && matchesCategory && matchesStatus && matchesType
  })

  // Render resources view
  if (view === 'resources' && selectedClass) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Classroom Header */}
        <div className="relative">
          {/* Banner Image */}
          <div 
            className="h-48 md:h-64 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${selectedClass.banner || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'})`,
              backgroundColor: '#1e3a8a'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
          
          {/* Class Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="container mx-auto">
              <button
                onClick={handleBackToGrid}
                className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Back to All Classes</span>
              </button>
              
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">{selectedClass.title}</h1>
                  <p className="text-lg text-white/90 mb-2">{selectedClass.instructor}</p>
                  <div className="flex items-center gap-4">
                    <Badge className="bg-white/20 text-white border-0">
                      Class Code: {selectedClass.code || `${selectedClass.category?.substring(0, 3).toUpperCase() || 'CLS'}-${selectedClass.id}`}
                    </Badge>
                    <Badge className={`${getTypeBadge(selectedClass.type)} border-0`}>
                      {selectedClass.type}
                    </Badge>
                    <Badge className={`${getStatusBadge(selectedClass.status)} border-0`}>
                      {selectedClass.status}
                    </Badge>
                  </div>
                </div>
                
                {/* Live Class Button and Participants */}
                <div className="flex items-center gap-2">
                {isInLiveClass && (
                      <Button
                        variant="outline"
                        onClick={() => setShowParticipantsDialog(true)}
                        className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
                      >
                        <Users className="w-4 h-4" />
                        Participants ({1 + (selectedClass ? 1 : 0) + remoteUsers.length})
                      </Button>
                    )}
                  {selectedClass?.status === 'ongoing' && selectedClass?.type === 'live' && (
                    <Button
                      onClick={() => joinLiveClass(selectedClass)}
                      className="gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 animate-pulse shadow-lg"
                      size="lg"
                    >
                      <Video className="w-5 h-5" />
                      Join Live Class Now
                    </Button>
                  )}
                  {/* Show "Class Starting Soon" for scheduled live classes */}
                  {selectedClass?.status === 'scheduled' && selectedClass?.type === 'live' && (
                    <Button
                      variant="outline"
                      className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
                      disabled
                    >
                      <Clock className="w-4 h-4" />
                      Starts {formatTime(selectedClass.time)}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Class Bar (when in live class) */}
        {isInLiveClass && (
          <Card className="border-2 border-emerald-500 shadow-lg mx-6 mt-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 animate-pulse"></div>
                    <span className="font-semibold text-emerald-700">YOU'RE IN LIVE CLASS</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{selectedClass?.title}</h3>
                    <p className="text-sm text-gray-600">
                      Instructor: {selectedClass?.instructor} • 
                      Participants: {1 + (selectedClass ? 1 : 0) + remoteUsers.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowParticipantsDialog(true)}
                    className="gap-2"
                  >
                    <Users className="w-4 h-4" />
                    {remoteUsers.length + 1}
                  </Button>
                  <Button
                    variant={isAudioMuted ? "destructive" : "outline"}
                    size="sm"
                    onClick={toggleAudio}
                    className="gap-2"
                    disabled={!localAudioTrackRef.current}
                  >
                    {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    {isAudioMuted ? 'Unmute' : 'Mute'}
                  </Button>
                  <Button
                    variant={isVideoMuted ? "destructive" : "outline"}
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
                    Leave
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resources Content */}
        <div className="container mx-auto py-8 px-4">
          {isResourcesLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoaderCircle className="w-12 h-12 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Class Resources</h2>
                <div className="text-sm text-gray-500">
                  {classroomResources?.length || 0} resource{(classroomResources?.length || 0) !== 1 ? 's' : ''}
                </div>
              </div>

              {!Array.isArray(classroomResources) || classroomResources.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No resources yet</h3>
                  <p className="text-gray-600">Your instructor will add resources here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Files Section */}
                  {classroomResources
                    .filter(r => r.type === 'file')
                    .map(resource => (
                      <Card 
                        key={resource.id} 
                        className="border-0 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group"
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-blue-100 group-hover:bg-blue-200 transition-colors">
                              <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                {resource.name}
                              </h3>
                              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                                {resource.size && (
                                  <span>{formatFileSize(resource.size)}</span>
                                )}
                                <span>•</span>
                                <span>Added {formatResourceDate(resource.uploaded_at)}</span>
                              </div>
                              {resource.description && (
                                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                  {resource.description}
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              disabled={downloadingResource === resource.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleResourceDownload(resource)
                              }}
                            >
                              {downloadingResource === resource.id ? (
                                <LoaderCircle className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                  {/* Links Section */}
                  {classroomResources
                    .filter(r => r.type === 'link')
                    .map(resource => (
                      <Card 
                        key={resource.id} 
                        className="border-0 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group"
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-purple-100 group-hover:bg-purple-200 transition-colors">
                              <Link className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                                {resource.name}
                              </h3>
                              <p className="text-sm text-gray-500 mt-2 truncate">
                                {resource.url}
                              </p>
                              {resource.description && (
                                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                  {resource.description}
                                </p>
                              )}
                              <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                                <span>Added {formatResourceDate(resource.uploaded_at)}</span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              disabled={downloadingResource === resource.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleResourceDownload(resource)
                              }}
                            >
                              {downloadingResource === resource.id ? (
                                <LoaderCircle className="w-4 h-4 animate-spin" />
                              ) : (
                                <ExternalLink className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Grid View (Dashboard)
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
              <LoaderCircle className="w-12 h-12 animate-spin text-indigo-600" />
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
                  <Card 
                    key={cls.id} 
                    className="border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
                    onClick={() => handleClassClick(cls)}
                  >
                    <CardContent className="p-6">
                      {/* Header with category and actions */}
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-xs font-medium px-3 py-1.5 rounded-full bg-gradient-to-r ${getCategoryColor(cls.category)} text-white`}>
                          {cls.category}
                        </span>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
                          <span>{formatDateTime(cls.date, cls.time)}</span>
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
                      <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                        {enrolled && (
                          <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 py-2 rounded-lg">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">You're enrolled in this class</span>
                          </div>
                        )}
                        
                        <Button 
                          className="w-full gap-2"
                          onClick={(e) => handleEnrollClick(cls, e)}
                          variant={enrolled ? "default" : "outline"}
                        >
                          {enrolled ? (
                            <>
                              <Eye className="w-4 h-4" />
                              View Resources
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl p-0">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 sticky top-0 z-10 rounded-t-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-white">
                {selectedClass?.isEnrolled ? 'Class Details' : 'Enroll in Class'}
              </DialogTitle>
              <p className="text-blue-100 text-sm mt-1">
                {selectedClass?.isEnrolled 
                  ? 'View detailed information about this class' 
                  : 'Review class details before enrolling'}
              </p>
            </DialogHeader>
          </div>
          
          {selectedClass && (
            <div className="p-6 space-y-6">
              {/* Class Header with Title and Actions */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedClass.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge className={`${getTypeBadge(selectedClass.type)} font-medium`}>
                      {selectedClass.type === 'live' ? 'Live Class' : 'Recorded Class'}
                    </Badge>
                    <Badge className={`${getStatusBadge(selectedClass.status)} font-medium`}>
                      {selectedClass.status.charAt(0).toUpperCase() + selectedClass.status.slice(1)}
                    </Badge>
                    <span className={`text-xs font-medium px-3 py-1.5 rounded-full bg-gradient-to-r ${getCategoryColor(selectedClass.category)} text-white`}>
                      {selectedClass.category}
                    </span>
                    
                    {/* Live indicator for ongoing classes */}
                    {selectedClass.status === 'ongoing' && selectedClass.type === 'live' && (
                      <Badge className="bg-red-500 text-white animate-pulse">
                        LIVE NOW
                      </Badge>
                    )}
                  </div>
                  
                  {/* Class Code */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FileText className="w-4 h-4" />
                    <span>Class Code: {selectedClass.code || `${selectedClass.category?.substring(0, 3).toUpperCase() || 'CLS'}-${selectedClass.id}`}</span>
                  </div>
                </div>
                
                {/* Bookmark Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleBookmark(selectedClass.id)}
                  className="p-2 hover:bg-rose-50 flex-shrink-0"
                  disabled={isJoining}
                >
                  <Heart className={`w-6 h-6 ${isBookmarked[selectedClass.id] ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`} />
                </Button>
              </div>

              {/* Instructor Info Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-7 h-7 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Instructor</p>
                    <p className="font-semibold text-gray-900 text-lg">{selectedClass.instructor}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                      <span className="text-sm font-medium ml-2 text-gray-700">4.8 (124 reviews)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  About This Class
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  {selectedClass.description || 'No description available.'}
                </p>
              </div>

              {/* Schedule Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Schedule
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Date & Time:</span>
                      <span className="font-medium text-gray-900">
                        {formatDateTime(selectedClass.date, selectedClass.time)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium text-gray-900">{selectedClass.duration}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Enrollment
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-medium text-gray-900">{selectedClass.maxAttendees} students</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Enrolled:</span>
                      <span className="font-medium text-gray-900">{selectedClass.attendees || 0} students</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Available:</span>
                      <span className="font-medium text-emerald-600">
                        {Math.max(0, (selectedClass.maxAttendees - (selectedClass.attendees || 0)))} spots
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          ((selectedClass.attendees || 0) / selectedClass.maxAttendees) >= 0.8 
                            ? 'bg-gradient-to-r from-emerald-500 to-green-500' 
                            : ((selectedClass.attendees || 0) / selectedClass.maxAttendees) >= 0.5 
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                            : 'bg-gradient-to-r from-rose-500 to-red-500'
                        }`}
                        style={{ width: `${((selectedClass.attendees || 0) / selectedClass.maxAttendees) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Topics Covered */}
              {selectedClass.tags && selectedClass.tags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-blue-600" />
                    Topics Covered
                  </h4>
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
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  Requirements
                </h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Basic computer skills</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Stable internet connection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Webcam and microphone (for live classes)</span>
                  </li>
                </ul>
              </div>

              {/* Status Messages */}
              {selectedClass.isEnrolled ? (
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg border border-emerald-200">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-emerald-800">You're enrolled in this class!</h4>
                      <p className="text-sm text-emerald-700 mt-1">
                        {selectedClass.status === 'ongoing' && selectedClass.type === 'live' 
                          ? 'The class is currently live. You can join now!'
                          : selectedClass.status === 'scheduled'
                          ? `The class starts ${formatDateTime(selectedClass.date, selectedClass.time)}. You'll be notified when it begins.`
                          : selectedClass.status === 'completed'
                          ? 'This class has ended. You can access the recording and materials.'
                          : 'You can access the class materials anytime.'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (selectedClass.attendees || 0) >= selectedClass.maxAttendees ? (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-amber-800">This class is full</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        All {selectedClass.maxAttendees} seats have been taken. You can join the waitlist or check back later for cancellations.
                      </p>
                    </div>
                  </div>
                </div>
              ) : selectedClass.status === 'cancelled' ? (
                <div className="bg-gradient-to-r from-rose-50 to-red-50 p-4 rounded-lg border border-rose-200">
                  <div className="flex items-start gap-3">
                    <X className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-rose-800">This class has been cancelled</h4>
                      <p className="text-sm text-rose-700 mt-1">
                        Unfortunately, this class is no longer available. Please check other classes.
                      </p>
                    </div>
                  </div>
                </div>
              ) : selectedClass.status === 'completed' ? (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-800">This class has ended</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        This class has already been completed. You can still enroll to access the recording and materials.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Rating Section (only for completed and enrolled) */}
              {selectedClass.isEnrolled && selectedClass.status === 'completed' && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Rate this class</h4>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => rateClass(selectedClass.id, star)}
                        className="hover:scale-110 transition-transform focus:outline-none"
                        disabled={isJoining}
                      >
                        <Star className={`w-8 h-8 ${star <= (userRatings[selectedClass.id] || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer with Actions */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 sticky bottom-0 rounded-b-lg">
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDetailsDialog(false)}
                disabled={isJoining}
                className="border-gray-300 hover:bg-gray-100"
              >
                Close
              </Button>
              
              {selectedClass?.isEnrolled ? (
                <>
                  {selectedClass.status === 'ongoing' && selectedClass.type === 'live' ? (
                    <Button 
                      onClick={() => {
                        setShowDetailsDialog(false);
                        joinLiveClass(selectedClass);
                      }}
                      className="gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 animate-pulse"
                    >
                      <Video className="w-4 h-4" />
                      Join Live Class Now
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
                      onClick={() => {
                        setShowDetailsDialog(false);
                        handleClassClick(selectedClass);
                      }}
                      className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                      <Eye className="w-4 h-4" />
                      View Resources
                    </Button>
                  )}
                  
                  <Button 
                    variant="destructive"
                    onClick={() => handleUnenroll(selectedClass.id)}
                    disabled={isJoining}
                    className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700"
                  >
                    Unenroll
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleConfirmEnrollment}
                  disabled={isJoining}
                  className="gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 min-w-[140px]"
                >
                  {isJoining ? (
                    <>
                      <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
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
            </div>

            {/* Additional info for disabled state */}
            {!selectedClass?.isEnrolled && selectedClass && (
              <div className="mt-3 text-xs text-gray-500 text-right">
                {selectedClass.attendees || 0} of {selectedClass.maxAttendees} spots filled
                {(selectedClass.attendees || 0) >= selectedClass.maxAttendees && (
                  <span className="text-amber-600 font-medium ml-2">- Class Full (enrollment may still be possible)</span>
                )}
                {selectedClass.status === 'cancelled' && (
                  <span className="text-amber-600 font-medium ml-2">- Class Cancelled (enrollment may still be possible)</span>
                )}
                {selectedClass.status === 'completed' && (
                  <span className="text-blue-600 font-medium ml-2">- Class Completed (enrollment still available)</span>
                )}
              </div>
            )}
          </div>
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
                  <p className="font-medium text-gray-900">
                    {formatDateTime(selectedClass?.date || '', selectedClass?.time || '')}
                  </p>
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
                      This class is scheduled for {formatDateTime(selectedClass.date, selectedClass.time)}. 
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

      {/* Participants Dialog */}
      <Dialog open={showParticipantsDialog} onOpenChange={setShowParticipantsDialog}>
        <DialogContent className="max-w-md border-0 shadow-2xl">
          <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Participants ({1 + (selectedClass ? 1 : 0) + remoteUsers.length})
          </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 max-h-96 overflow-y-auto py-4">
            {/* You (Student) */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">You (Student)</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs flex items-center gap-1">
                      {!isVideoMuted ? '📹' : '📷❌'} Video
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      {!isAudioMuted ? '🎤' : '🎤❌'} Audio
                    </span>
                  </div>
                </div>
              </div>
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500">You</Badge>
            </div>

            {/* Instructor */}
            {selectedClass && (
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedClass.instructor}</p>
                    <p className="text-xs text-gray-600">Instructor</p>
                  </div>
                </div>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">Host</Badge>
              </div>
            )}

            {/* Other Participants */}
            {remoteUsers.map(user => (
              <div key={user.uid} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Student {String(user.uid).slice(-4)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs flex items-center gap-1">
                        {user.hasVideo ? '📹' : '📷❌'} Video
                      </span>
                      <span className="text-xs flex items-center gap-1">
                        {user.hasAudio ? '🎤' : '🎤❌'} Audio
                      </span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline">Student</Badge>
              </div>
            ))}

            {remoteUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No other participants yet</p>
                <p className="text-sm text-gray-400 mt-2">Waiting for others to join...</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowParticipantsDialog(false)}
              className="w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}