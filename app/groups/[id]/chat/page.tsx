'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/Avatar'
import { 
  Send, 
  Users, 
  Loader2, 
  AlertCircle, 
  ArrowLeft, 
  MoreVertical, 
  Phone, 
  Video, 
  Search, 
  Check, 
  CheckCheck,
  Paperclip,
  Smile,
  X,
  Eye,
  Download,
  File,
  Image as ImageIcon,
  FileText,
  Music,
  Wifi,
  WifiOff
} from 'lucide-react'
import { useToast } from '../../../hooks/use-toast'
import EmojiPicker from 'emoji-picker-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

interface Message {
  id: number
  user_id: number
  user_name: string
  user_avatar?: string
  content: string
  created_at: string
  status?: 'sent' | 'delivered' | 'read'
}

interface Group {
  id: number
  name: string
  description: string
  member_count: number
  avatar?: string
  is_member?: boolean
  role?: string
  online_count?: number
}

export default function GroupChatPage() {
  const params = useParams()
  const groupId = params.id as string
  const router = useRouter()
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const attachmentMenuRef = useRef<HTMLDivElement>(null)

  const [group, setGroup] = useState<Group | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([])

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setShowAttachmentMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Polling interval (in ms)
  const POLL_INTERVAL = 3000

  // Get token
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || ''
    }
    return ''
  }

  // Fetch current user
  const fetchCurrentUser = async () => {
    try {
      const token = getToken()
      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch(`${API_URL}/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })

      if (res.ok) {
        const data = await res.json()
        setCurrentUserId(data.id)
      } else {
        router.push('/login')
      }
    } catch (err) {
      console.error('Error fetching current user:', err)
      router.push('/login')
    }
  }

  // Fetch group details
  const fetchGroup = useCallback(async () => {
    try {
      const token = getToken()
      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch(`${API_URL}/groups/${groupId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })

      if (res.status === 401) {
        localStorage.removeItem('auth_token')
        router.push('/login')
        return
      }

      if (res.status === 404) {
        setError('Group not found')
        return
      }

      if (!res.ok) throw new Error('Failed to load group')

      const data = await res.json()
      
      const groupData = data.group || data.data || data
      setGroup({
        ...groupData,
        online_count: Math.floor(Math.random() * 10) + 1 // Mock online count
      })
    } catch (err: any) {
      setError(err.message)
    }
  }, [groupId, router])

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const token = getToken()
      if (!token) return

      const res = await fetch(`${API_URL}/groups/${groupId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })

      if (res.status === 403) {
        console.log('User is not a member of this group')
        setMessages([])
        return
      }

      if (res.status === 404) {
        console.error('Group not found')
        setMessages([])
        return
      }

      if (res.status === 401) {
        console.error('Unauthorized - redirecting to login')
        localStorage.removeItem('auth_token')
        router.push('/login')
        return
      }

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || `Failed to load messages: ${res.status}`)
      }

      const responseText = await res.text()
      if (!responseText) {
        setMessages([])
        return
      }

      const data = JSON.parse(responseText)
      
      const messagesArray = Array.isArray(data) ? data : data.messages || data.data || []
      
      // Ensure each message has a user_name
      const messagesWithNames = messagesArray.map((msg: any) => ({
        ...msg,
        user_name: msg.user_name || msg.user?.name || msg.user?.username || `User ${msg.user_id}`,
        content: msg.content || msg.message || '',
      }))
      
      // Add mock status for demo purposes
      const messagesWithStatus = messagesWithNames.map((msg: Message, index: number) => ({
        ...msg,
        status: index === messagesWithNames.length - 1 ? 'read' : 
                index > messagesWithNames.length - 3 ? 'delivered' : 'sent'
      }))
      
      setMessages(messagesWithStatus)
    } catch (err: any) {
      console.error('Error fetching messages:', err)
      if (!err.message?.includes('403')) {
        toast({
          title: 'Error',
          description: 'Failed to load messages',
          variant: 'destructive',
        })
      }
      setMessages([])
    }
  }, [groupId, router, toast])

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      await fetchCurrentUser()
      await fetchGroup()
      await fetchMessages()
    } catch (err: any) {
      console.error('Error loading data:', err)
      setError(err.message || 'Failed to load chat')
    } finally {
      setLoading(false)
    }
  }, [fetchGroup, fetchMessages])

  // Initial load
  useEffect(() => {
    loadData()
  }, [loadData])

  // Polling for new messages
  useEffect(() => {
    if (!group?.is_member) {
      return
    }

    const interval = setInterval(fetchMessages, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [groupId, fetchMessages, group?.is_member])

  // Auto-scroll to bottom with animation
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: messages.length > 0 ? 'smooth' : 'auto'
      })
    }
  }, [messages])

  // Handle emoji selection
  const onEmojiClick = (emojiObject: any) => {
    setNewMessage((prev) => prev + emojiObject.emoji)
    setShowEmojiPicker(false)
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadingFiles((prev) => [...prev, ...files])
    setShowAttachmentMenu(false)
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get file icon
  const getFileIcon = (fileType: string) => {
    if (fileType?.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-blue-500" />
    if (fileType?.startsWith('video/')) return <Video className="w-8 h-8 text-purple-500" />
    if (fileType?.startsWith('audio/')) return <Music className="w-8 h-8 text-green-500" />
    if (fileType?.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />
    return <File className="w-8 h-8 text-gray-500" />
  }

  // Get avatar fallback character
  const getAvatarFallback = (userName: string) => {
    if (!userName || userName === 'You') return '👤'
    return userName.charAt(0).toUpperCase()
  }

  // Send a new message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !group?.is_member) return

    const messageContent = newMessage.trim()
    setNewMessage('')

    // Optimistic update
    const tempId = Date.now()
    const tempMessage: Message = {
      id: tempId,
      user_id: currentUserId || 1,
      user_name: 'You',
      content: messageContent,
      created_at: new Date().toISOString(),
      status: 'sent'
    }
    
    setMessages(prev => [...prev, tempMessage])

    setSending(true)
    try {
      const token = getToken()
      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch(`${API_URL}/groups/${groupId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ content: messageContent }),
      })

      if (res.status === 403) {
        throw new Error('You are not a member of this group')
      }

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || 'Failed to send message')
      }

      const responseText = await res.text()
      if (!responseText) {
        throw new Error('Empty response from server')
      }

      const sentMessage = JSON.parse(responseText)
      
      // Replace temp message with real one
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? { ...sentMessage, status: 'delivered' } : msg
        )
      )
      
    } catch (err: any) {
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      setNewMessage(messageContent)
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  // Format message time
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diff / 60000)
    const diffHours = Math.floor(diff / 3600000)
    const diffDays = Math.floor(diff / 86400000)

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' })
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  // Group messages by date
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {}
    
    messages.forEach(msg => {
      const date = new Date(msg.created_at).toLocaleDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(msg)
    })
    
    return groups
  }

  // Format date header
  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    if (date.toDateString() === now.toDateString()) return 'Today'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Join group
  const handleJoinGroup = async () => {
    try {
      const token = getToken()
      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch(`${API_URL}/groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || 'Failed to join group')
      }

      toast({
        title: 'Success',
        description: 'You joined the group',
      })

      // Refresh group info
      await fetchGroup()
      await fetchMessages()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  // Leave group
  const handleLeaveGroup = async () => {
    try {
      const token = getToken()
      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch(`${API_URL}/groups/${groupId}/leave`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || 'Failed to leave group')
      }

      toast({
        title: 'Success',
        description: 'You left the group',
      })

      router.push('/groups')
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#00a884] mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading group chat...</p>
        </div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center text-red-600">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg font-medium">{error || 'Group not found'}</p>
          <Button 
            variant="outline" 
            className="mt-4 border-[#00a884] text-[#00a884] hover:bg-[#00a884] hover:text-white"
            onClick={() => router.push('/groups')}
          >
            Back to Groups
          </Button>
        </div>
      </div>
    )
  }

  const isMember = group.is_member === true
  const groupedMessages = groupMessagesByDate(messages)

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-4 h-screen flex flex-col">
        {/* Header - WhatsApp style */}
        <div className="bg-white dark:bg-gray-800 rounded-t-lg px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 flex-1">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/groups')}
                className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            
            <Avatar className="w-10 h-10">
              {group.avatar ? (
                <AvatarImage src={group.avatar} alt={group.name} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-[#00a884] to-[#008f6b] text-white">
                  {group.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-gray-800 dark:text-white truncate">{group.name}</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {group.online_count} online • {group.member_count} members
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <Video className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Messages area - Solid color background */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-6 bg-[#e5ddd5] dark:bg-gray-800"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath fill='%23ffffff' d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '40px 40px',
          }}
        >
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date separator - WhatsApp style */}
              <div className="flex justify-center my-4">
                <span className="px-3 py-1 bg-[#e1f3fb] dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 rounded-full shadow-sm">
                  {formatDateDisplay(date)}
                </span>
              </div>
              
              {/* Messages for this date */}
              {dateMessages.map((msg, index) => {
                const isCurrentUser = msg.user_id === currentUserId
                const showName = !isCurrentUser && (
                  index === 0 || 
                  dateMessages[index - 1]?.user_id !== msg.user_id
                )
                
                // Skip empty messages
                if (!msg.content || msg.content.trim() === '') return null
                
                return (
                  <div
                    key={msg.id}
                    className={`flex mb-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isCurrentUser && (
                      <div className="w-8 mr-2 flex-shrink-0">
                        {showName ? (
                          <Avatar className="w-8 h-8 ring-2 ring-white dark:ring-gray-700">
                            {msg.user_avatar ? (
                              <AvatarImage src={msg.user_avatar} alt={msg.user_name} />
                            ) : (
                              <AvatarFallback className="bg-gradient-to-br from-[#00a884] to-[#008f6b] text-white text-xs font-medium">
                                {getAvatarFallback(msg.user_name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                        ) : (
                          <div className="w-8 h-8" /> // Spacer for alignment
                        )}
                      </div>
                    )}
                    
                    <div className={`max-w-[65%] ${isCurrentUser ? 'mr-2' : ''}`}>
                      {/* WhatsApp-style name label */}
                      {!isCurrentUser && showName && (
                        <div className="mb-1 ml-1">
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold text-[#00a884] dark:text-emerald-400 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
                            {msg.user_name || 'Group Member'}
                          </span>
                        </div>
                      )}
                      
                      {/* Message bubble */}
                      <div
                        className={`relative px-3 py-2 rounded-lg shadow-sm ${
                          isCurrentUser
                            ? 'bg-[#dcf8c6] dark:bg-[#005c4b] text-gray-800 dark:text-white rounded-tr-none'
                            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-tl-none'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words pr-12">
                          {msg.content}
                        </p>
                        
                        {/* Message time and status */}
                        <div className={`absolute bottom-1 right-2 flex items-center gap-1 text-[0.65rem] ${
                          isCurrentUser ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          <span>{formatMessageTime(msg.created_at)}</span>
                          {isCurrentUser && (
                            <span className="ml-0.5">
                              {msg.status === 'read' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              ) : msg.status === 'delivered' ? (
                                <CheckCheck className="w-3.5 h-3.5" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-[#00a884] to-[#008f6b] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                Welcome to {group.name}!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                {isMember 
                  ? 'No messages yet. Start the conversation with the group!' 
                  : 'Join the group to see messages and participate in discussions.'}
              </p>
              {!isMember && (
                <Button 
                  onClick={handleJoinGroup}
                  className="mt-4 bg-[#00a884] hover:bg-[#008f6b] text-white shadow-md"
                >
                  Join Group
                </Button>
              )}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message input - WhatsApp style */}
        {isMember ? (
          <div className="bg-white dark:bg-gray-800 rounded-b-lg px-4 py-3 shadow-sm">
            {/* Attachment Previews */}
            {uploadingFiles.length > 0 && (
              <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
                {uploadingFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="relative group flex-shrink-0">
                    {file.type?.startsWith('image/') ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden shadow-md">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center p-2 shadow-md">
                        {getFileIcon(file.type)}
                        <span className="text-[0.5rem] truncate w-full text-center mt-1 text-gray-600 dark:text-gray-400">
                          {file.name.split('.').pop()?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md"
                      onClick={() => {
                        setUploadingFiles(prev => prev.filter((_, i) => i !== index))
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSend} className="flex items-center gap-2">
              {/* Attachment Button */}
              <div className="relative" ref={attachmentMenuRef}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                
                {showAttachmentMenu && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 w-48 z-10">
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      variant="ghost"
                      className="w-full justify-start mb-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        document.getElementById('file-upload')?.click()
                        setShowAttachmentMenu(false)
                      }}
                    >
                      <ImageIcon className="w-4 h-4 mr-2 text-blue-500" />
                      Photos & Videos
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.multiple = true
                        input.accept = '.pdf,.doc,.docx,.txt'
                        input.onchange = (e: any) => {
                          const files = Array.from(e.target.files || [])
                          setUploadingFiles((prev) => [...prev, ...files])
                        }
                        input.click()
                        setShowAttachmentMenu(false)
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2 text-red-500" />
                      Documents
                    </Button>
                  </div>
                )}
              </div>

              {/* Emoji Button */}
              <div className="relative" ref={emojiPickerRef}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="w-5 h-5" />
                </Button>
                
                {showEmojiPicker && (
                  <div className="absolute bottom-full left-0 mb-2 z-10">
                    <EmojiPicker onEmojiClick={onEmojiClick} />
                  </div>
                )}
              </div>
              
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type a message"
                disabled={sending}
                className="flex-1 bg-gray-100 dark:bg-gray-700 border-0 text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-full focus:ring-2 focus:ring-[#00a884] focus:outline-none"
              />
              
              <Button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="bg-[#00a884] hover:bg-[#008f6b] text-white rounded-full w-10 h-10 p-0 flex-shrink-0 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </form>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-b-lg p-6 text-center shadow-sm">
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              You need to join this group to send messages.
            </p>
            <Button 
              onClick={handleJoinGroup} 
              className="bg-[#00a884] hover:bg-[#008f6b] text-white px-6 shadow-md"
            >
              Join Group
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}